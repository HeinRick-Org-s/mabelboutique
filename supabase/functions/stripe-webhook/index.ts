import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2025-08-27.basil",
});

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req) => {
  const signature = req.headers.get("stripe-signature");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

  if (!signature || !webhookSecret) {
    return new Response("Missing signature or webhook secret", { status: 400 });
  }

  try {
    const body = await req.text();
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

    console.log("Webhook event received:", event.type);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      
      console.log("Processing completed checkout session:", session.id);

      const metadata = session.metadata;
      const orderId = metadata?.order_id;
      const orderNumber = metadata?.order_number;

      if (!orderId) {
        console.error("No order_id in metadata");
        throw new Error("Missing order_id in session metadata");
      }

      console.log("Processing payment for order:", orderId);

      // Criar cliente Supabase
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      // Buscar pedido existente
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .single();

      if (orderError || !order) {
        console.error("Order not found:", orderError);
        throw new Error("Order not found in database");
      }

      // Gerar código de rastreamento
      const { data: trackingCodeData } = await supabase.rpc("generate_tracking_code");
      const trackingCode = trackingCodeData || `TRK-${Date.now()}`;

      console.log("Generated tracking code:", trackingCode);

      // Atualizar pedido para "paid" e "processing"
      const { error: updateError } = await supabase
        .from("orders")
        .update({
          payment_intent_id: session.payment_intent as string,
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
        throw itemsError;
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
      const emailResponse = await supabase.functions.invoke("send-order-email", {
        body: {
          orderId: order.id,
          orderNumber: orderNumber,
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
