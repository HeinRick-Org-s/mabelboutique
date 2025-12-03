import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req) => {
  try {
    const url = new URL(req.url);
    const topic = url.searchParams.get("topic") || url.searchParams.get("type");
    const paymentId = url.searchParams.get("data.id") || url.searchParams.get("id");

    console.log("Webhook received - Topic:", topic, "Payment ID:", paymentId);

    // Se for notificação de pagamento
    if (topic === "payment" && paymentId) {
      const mpAccessToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
      if (!mpAccessToken) {
        throw new Error("MERCADOPAGO_ACCESS_TOKEN não configurado");
      }

      // Buscar detalhes do pagamento
      const paymentResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: {
          "Authorization": `Bearer ${mpAccessToken}`,
        },
      });

      const paymentData = await paymentResponse.json();
      console.log("Payment data:", JSON.stringify(paymentData));

      const status = paymentData.status;
      const externalReference = paymentData.external_reference;

      if (!externalReference) {
        console.error("No external_reference in payment");
        return new Response(JSON.stringify({ received: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Criar cliente Supabase
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      // Buscar pedido
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .select("*")
        .eq("id", externalReference)
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

      // Se pagamento aprovado
      if (status === "approved") {
        console.log("Payment approved for order:", externalReference);

        // Gerar código de rastreamento
        const { data: trackingCodeData } = await supabase.rpc("generate_tracking_code");
        const trackingCode = trackingCodeData || `TRK-${Date.now()}`;

        console.log("Generated tracking code:", trackingCode);

        // Atualizar pedido para "paid"
        const { error: updateError } = await supabase
          .from("orders")
          .update({
            payment_status: "paid",
            status: "paid",
            tracking_code: trackingCode,
            payment_intent_id: paymentId,
          })
          .eq("id", externalReference);

        if (updateError) {
          console.error("Error updating order:", updateError);
          throw updateError;
        }

        console.log("Order updated to paid");

        // Buscar itens do pedido
        const { data: orderItems, error: itemsError } = await supabase
          .from("order_items")
          .select("*")
          .eq("order_id", externalReference);

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

        // Enviar email de confirmação
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
      } else if (status === "pending" || status === "in_process") {
        // Atualizar status para pendente
        await supabase
          .from("orders")
          .update({
            payment_status: "pending",
            payment_intent_id: paymentId,
          })
          .eq("id", externalReference);
        console.log("Order updated to pending");
      } else if (status === "rejected" || status === "cancelled") {
        // Atualizar status para rejeitado
        await supabase
          .from("orders")
          .update({
            payment_status: "failed",
            payment_intent_id: paymentId,
          })
          .eq("id", externalReference);
        console.log("Order updated to failed");
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
