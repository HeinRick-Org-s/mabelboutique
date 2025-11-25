import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      items, 
      customerEmail, 
      customerName,
      shippingCost,
      discountAmount,
      orderData 
    } = await req.json();

    console.log("Creating Stripe checkout session", { items, customerEmail, shippingCost });

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Criar line items para cada produto no carrinho
    const lineItems = items.map((item: any) => ({
      price_data: {
        currency: 'brl',
        product_data: {
          name: item.name,
          description: `Cor: ${item.selectedColor} | Tamanho: ${item.selectedSize}`,
          images: [item.image],
        },
        unit_amount: Math.round(item.price * 100), // Converter para centavos
      },
      quantity: item.quantity,
    }));

    // Adicionar frete como line item se houver
    if (shippingCost > 0) {
      lineItems.push({
        price_data: {
          currency: 'brl',
          product_data: {
            name: 'Frete',
            description: 'Custo de envio',
          },
          unit_amount: Math.round(shippingCost * 100),
        },
        quantity: 1,
      });
    }

    // Criar sessão de checkout
    const session = await stripe.checkout.sessions.create({
      customer_email: customerEmail,
      line_items: lineItems,
      mode: "payment",
      payment_method_types: ["card"],
      success_url: `${req.headers.get("origin")}/order-tracking?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/checkout`,
      metadata: {
        customerName,
        orderData: JSON.stringify(orderData),
        discountAmount: discountAmount.toString(),
      },
      // Aplicar desconto se houver
      ...(discountAmount > 0 && {
        discounts: [{
          coupon: await createDiscountCoupon(stripe, discountAmount),
        }],
      }),
    });

    console.log("Stripe session created:", session.id);

    return new Response(
      JSON.stringify({ 
        sessionId: session.id,
        url: session.url 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Error creating checkout session:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

async function createDiscountCoupon(stripe: Stripe, discountAmount: number) {
  const coupon = await stripe.coupons.create({
    amount_off: Math.round(discountAmount * 100),
    currency: 'brl',
    duration: 'once',
    name: 'Desconto aplicado',
  });
  return coupon.id;
}
