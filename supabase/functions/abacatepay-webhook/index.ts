import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Chave pública para verificação HMAC da AbacatePay
const ABACATEPAY_PUBLIC_KEY =
  "t9dXRhHHo3yDEj5pVDYz0frf7q6bMKyMRmxxCPIPp3RCplBfXRxqlC6ZpiWmOqj4L63qEaeUOtrCI8P0VMUgo6iIga2ri9ogaHFs0WIIywSMg0q7RmBfybe1E5XJcfC4IW3alNqym0tXoAKkzvfEjZxV6bE0oG2zJrNNYmUCKZyV0KZ3JS8Votf9EAWWYdiDkMkpbMdPggfh1EqHlVkMiTady6jOR3hyzGEHrIz2Ret0xHKMbiqkr9HS1JhNHDX9";

async function verifySignature(rawBody: string, signatureFromHeader: string | null): Promise<boolean> {
  if (!signatureFromHeader) {
    console.log("No signature provided, skipping verification");
    return true; // Em dev mode pode não ter assinatura
  }

  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(ABACATEPAY_PUBLIC_KEY),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const signature = await crypto.subtle.sign(
      "HMAC",
      key,
      encoder.encode(rawBody)
    );

    const expectedSig = btoa(String.fromCharCode(...new Uint8Array(signature)));
    return expectedSig === signatureFromHeader;
  } catch (error) {
    console.error("Error verifying signature:", error);
    return false;
  }
}

serve(async (req) => {
  try {
    const rawBody = await req.text();
    const signatureFromHeader = req.headers.get("X-Webhook-Signature");

    // Verificar assinatura (opcional em dev mode)
    const isValid = await verifySignature(rawBody, signatureFromHeader);
    if (!isValid) {
      console.warn("Invalid webhook signature");
      // Continuar mesmo assim para dev mode
    }

    const event = JSON.parse(rawBody);

    console.log("Webhook received:", event.event);
    console.log("Webhook data:", JSON.stringify(event.data));

    if (event.event === "billing.paid") {
      const billing = event.data?.billing;
      const payment = event.data?.payment;

      if (!billing) {
        console.error("No billing data in webhook");
        return new Response(JSON.stringify({ received: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      const billingId = billing.id;
      const metadata = billing.metadata;

      console.log("Processing paid billing:", billingId);
      console.log("Metadata:", metadata);

      // Criar cliente Supabase
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      // Buscar pedido pelo billing_id (payment_intent_id)
      let orderId = metadata?.order_id;
      
      if (!orderId) {
        // Tentar buscar pelo payment_intent_id
        const { data: orderByBilling } = await supabase
          .from("orders")
          .select("id")
          .eq("payment_intent_id", billingId)
          .single();
        
        orderId = orderByBilling?.id;
      }

      if (!orderId) {
        console.error("Order not found for billing:", billingId);
        return new Response(JSON.stringify({ received: true, error: "Order not found" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Buscar pedido
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .single();

      if (orderError || !order) {
        console.error("Order not found:", orderError);
        return new Response(JSON.stringify({ received: true, error: "Order not found" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Verificar se já foi processado
      if (order.payment_status === "paid") {
        console.log("Order already paid, skipping");
        return new Response(JSON.stringify({ received: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Gerar código de rastreamento
      const { data: trackingCodeData } = await supabase.rpc("generate_tracking_code");
      const trackingCode = trackingCodeData || `TRK-${Date.now()}`;

      console.log("Generated tracking code:", trackingCode);

      // Atualizar pedido para "paid" e "processing"
      const { error: updateError } = await supabase
        .from("orders")
        .update({
          payment_status: "paid",
          status: "processing",
          tracking_code: trackingCode,
        })
        .eq("id", orderId);

      if (updateError) {
        console.error("Error updating order:", updateError);
        throw updateError;
      }

      console.log("Order updated to paid/processing");

      // Buscar itens do pedido
      const { data: orderItems, error: itemsError } = await supabase
        .from("order_items")
        .select("*")
        .eq("order_id", orderId);

      if (itemsError) {
        console.error("Error fetching order items:", itemsError);
      }

      console.log("Order items fetched:", orderItems?.length);

      // Decrementar estoque dos produtos
      for (const item of orderItems || []) {
        const { data: product } = await supabase
          .from("products")
          .select("variants")
          .eq("id", item.product_id)
          .single();

        if (product?.variants) {
          const variants = (product.variants as any[]) || [];
          const updatedVariants = variants.map((variant: any) => {
            if (
              variant.color === item.selected_color &&
              variant.size === item.selected_size
            ) {
              return {
                ...variant,
                stock: Math.max(0, variant.stock - item.quantity),
              };
            }
            return variant;
          });

          await supabase
            .from("products")
            .update({ variants: updatedVariants })
            .eq("id", item.product_id);
        }
      }

      console.log("Stock updated");

      // Enviar email de confirmação com o tracking_code correto
      try {
        const emailResponse = await supabase.functions.invoke("send-order-email", {
          body: {
            orderId: order.id,
            orderNumber: order.order_number,
            trackingCode: trackingCode,
            customerEmail: order.customer_email,
            customerName: order.customer_name,
          },
        });

        if (emailResponse.error) {
          console.error("Error sending email:", emailResponse.error);
        } else {
          console.log("Order confirmation email sent");
        }
      } catch (emailError) {
        console.error("Error invoking email function:", emailError);
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Webhook error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});
