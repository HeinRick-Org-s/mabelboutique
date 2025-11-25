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

      // Recuperar dados do pedido dos metadados
      const orderData = JSON.parse(session.metadata?.orderData || "{}");
      const paymentIntentId = session.payment_intent as string;

      // Criar cliente Supabase
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      // Criar pedido no banco de dados
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          customer_name: session.metadata?.customerName || "",
          customer_email: session.customer_email || session.customer_details?.email || "",
          customer_phone: orderData.customer_phone || "",
          customer_whatsapp: orderData.customer_whatsapp || "",
          shipping_cep: orderData.shipping_cep || "",
          shipping_street: orderData.shipping_street || "",
          shipping_number: orderData.shipping_number || "",
          shipping_complement: orderData.shipping_complement || "",
          shipping_neighborhood: orderData.shipping_neighborhood || "",
          shipping_city: orderData.shipping_city || "",
          shipping_state: orderData.shipping_state || "",
          delivery_type: orderData.delivery_type || "",
          delivery_days: orderData.delivery_days || null,
          payment_method: "credit-card",
          payment_intent_id: paymentIntentId,
          payment_status: "paid",
          subtotal: orderData.subtotal || 0,
          shipping_cost: orderData.shipping_cost || 0,
          discount_amount: parseFloat(session.metadata?.discountAmount || "0"),
          total: (session.amount_total || 0) / 100,
          order_number: "",
          coupon_code: orderData.coupon_code || null,
          status: "pending",
        })
        .select()
        .single();

      if (orderError) {
        console.error("Error creating order:", orderError);
        throw orderError;
      }

      console.log("Order created:", order.id);

      // Criar itens do pedido
      const orderItems = orderData.items?.map((item: any) => ({
        order_id: order.id,
        product_id: item.productId,
        product_name: item.name,
        product_image: item.image,
        product_price: item.price,
        quantity: item.quantity,
        selected_color: item.selectedColor,
        selected_size: item.selectedSize,
        subtotal: item.price * item.quantity,
      })) || [];

      if (orderItems.length > 0) {
        const { error: itemsError } = await supabase
          .from("order_items")
          .insert(orderItems);

        if (itemsError) {
          console.error("Error creating order items:", itemsError);
          throw itemsError;
        }
      }

      // Decrementar estoque dos produtos
      for (const item of orderData.items || []) {
        const { data: product } = await supabase
          .from("products")
          .select("variants")
          .eq("id", item.productId)
          .single();

        if (product?.variants) {
          const variants = product.variants as any[];
          const updatedVariants = variants.map((colorVariant: any) => {
            if (colorVariant.color === item.selectedColor) {
              return {
                ...colorVariant,
                sizes: colorVariant.sizes.map((sizeVariant: any) => {
                  if (sizeVariant.size === item.selectedSize) {
                    return {
                      ...sizeVariant,
                      stock: Math.max(0, sizeVariant.stock - item.quantity),
                    };
                  }
                  return sizeVariant;
                }),
              };
            }
            return colorVariant;
          });

          await supabase
            .from("products")
            .update({ variants: updatedVariants })
            .eq("id", item.productId);
        }
      }

      // Enviar email com código de rastreamento
      try {
        await fetch(`${supabaseUrl}/functions/v1/send-order-email`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({
            orderId: order.id,
            customerEmail: order.customer_email,
            trackingCode: order.tracking_code,
          }),
        });
        console.log("Order email sent successfully");
      } catch (emailError) {
        console.error("Error sending order email:", emailError);
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
