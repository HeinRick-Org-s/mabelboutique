import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

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
      orderData,
      paymentMethod,
    } = await req.json();

    const selectedPaymentMethod = paymentMethod === "pix" ? "pix" : "card";

    console.log("Creating Stripe checkout session", { items, customerEmail, shippingCost, selectedPaymentMethod });

    // Criar cliente Supabase
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Gerar número único do pedido
    const { data: orderNumberData } = await supabase.rpc("generate_order_number");
    const orderNumber = orderNumberData || `ORD-${Date.now()}`;

    // Criar pedido no Supabase com status "pending"
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        order_number: orderNumber,
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: orderData.customer_phone,
        customer_whatsapp: orderData.customer_whatsapp,
        shipping_cep: orderData.shipping_cep || "",
        shipping_street: orderData.shipping_street,
        shipping_number: orderData.shipping_number || "",
        shipping_complement: orderData.shipping_complement,
        shipping_neighborhood: orderData.shipping_neighborhood || "",
        shipping_city: orderData.shipping_city || "",
        shipping_state: orderData.shipping_state || "",
        delivery_type: orderData.delivery_type,
        delivery_days: orderData.delivery_days,
        payment_method: selectedPaymentMethod,
        payment_status: "pending",
        status: "pending",
        subtotal: orderData.subtotal,
        shipping_cost: shippingCost,
        discount_amount: discountAmount,
        total: orderData.subtotal - discountAmount + shippingCost,
        coupon_code: orderData.coupon_code,
      })
      .select()
      .single();

    if (orderError || !order) {
      console.error("Erro ao criar pedido:", orderError);
      throw new Error("Falha ao criar pedido no banco de dados");
    }

    console.log("Pedido criado no Supabase:", order.id);

    // Criar itens do pedido
    const orderItems = orderData.items.map((item: any) => ({
      order_id: order.id,
      product_id: item.productId,
      product_name: item.name,
      product_image: item.image,
      product_price: item.price,
      quantity: item.quantity,
      selected_color: item.selectedColor,
      selected_size: item.selectedSize,
      subtotal: item.price * item.quantity,
    }));

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(orderItems);

    if (itemsError) {
      console.error("Erro ao criar itens do pedido:", itemsError);
      throw new Error("Falha ao criar itens do pedido");
    }

    console.log("Itens do pedido criados com sucesso");

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

    // Criar sessão de checkout do Stripe
    // Nota: PIX precisa estar habilitado no dashboard do Stripe
    // Se PIX não estiver disponível, usa cartão como fallback
    try {
      const paymentMethodTypes = selectedPaymentMethod === "pix" ? ["pix"] : ["card"];
      
      const session = await stripe.checkout.sessions.create({
        customer_email: customerEmail,
        line_items: lineItems,
        mode: "payment",
        payment_method_types: paymentMethodTypes,
        success_url: `${req.headers.get("origin")}/order-tracking?code=${order.id}`,
        cancel_url: `${req.headers.get("origin")}/checkout`,
        metadata: {
          order_id: order.id,
          order_number: orderNumber,
        },
        // Aplicar desconto se houver
        ...(discountAmount > 0 && {
          discounts: [{
            coupon: await createDiscountCoupon(stripe, discountAmount),
          }],
        }),
      });

      console.log("Stripe session created:", session.id);

      // Atualizar pedido com payment_intent_id
      await supabase
        .from("orders")
        .update({ payment_intent_id: session.id })
        .eq("id", order.id);

      return new Response(
        JSON.stringify({ 
          sessionId: session.id,
          url: session.url,
          orderId: order.id,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    } catch (stripeError: any) {
      // Se erro for relacionado ao PIX, tentar novamente com cartão
      if (stripeError.message?.includes("pix") && selectedPaymentMethod === "pix") {
        console.log("PIX not available, falling back to card");
        
        const session = await stripe.checkout.sessions.create({
          customer_email: customerEmail,
          line_items: lineItems,
          mode: "payment",
          payment_method_types: ["card"],
          success_url: `${req.headers.get("origin")}/order-tracking?code=${order.id}`,
          cancel_url: `${req.headers.get("origin")}/checkout`,
          metadata: {
            order_id: order.id,
            order_number: orderNumber,
          },
          // Aplicar desconto se houver
          ...(discountAmount > 0 && {
            discounts: [{
              coupon: await createDiscountCoupon(stripe, discountAmount),
            }],
          }),
        });

        console.log("Stripe session created with card fallback:", session.id);

        // Atualizar pedido com payment_intent_id e método de pagamento
        await supabase
          .from("orders")
          .update({ 
            payment_intent_id: session.id,
            payment_method: "card" // Atualizar método para card
          })
          .eq("id", order.id);

        return new Response(
          JSON.stringify({ 
            sessionId: session.id,
            url: session.url,
            orderId: order.id,
            warning: "PIX não disponível no momento. Redirecionando para pagamento com cartão.",
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          }
        );
      }
      
      // Se não for erro de PIX, propagar o erro
      throw stripeError;
    }
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
