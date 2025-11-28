import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
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
      customerPhone,
      shippingCost,
      discountAmount,
      orderData,
    } = await req.json();

    console.log("Creating AbacatePay checkout", { items, customerEmail, shippingCost });

    // Criar cliente Supabase
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Gerar número único do pedido
    const { data: orderNumberData } = await supabase.rpc("generate_order_number");
    const orderNumber = orderNumberData || `PED-${Date.now()}`;

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
        payment_method: "pix",
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

    // Preparar produtos para AbacatePay
    // Valores em centavos
    const products = items.map((item: any) => ({
      externalId: item.productId,
      name: `${item.name} - ${item.selectedColor}/${item.selectedSize}`,
      description: `Cor: ${item.selectedColor} | Tamanho: ${item.selectedSize}`,
      quantity: item.quantity,
      price: Math.round(item.price * 100), // Converter para centavos
    }));

    // Adicionar frete como produto se houver
    if (shippingCost > 0) {
      products.push({
        externalId: "shipping",
        name: "Frete",
        description: "Custo de envio",
        quantity: 1,
        price: Math.round(shippingCost * 100),
      });
    }

    // Calcular total com desconto
    const totalInCents = Math.round((orderData.subtotal - discountAmount + shippingCost) * 100);

    // Se houver desconto, aplicar como produto negativo ou ajustar preços
    if (discountAmount > 0) {
      products.push({
        externalId: "discount",
        name: "Desconto aplicado",
        description: orderData.coupon_code ? `Cupom: ${orderData.coupon_code}` : "Desconto",
        quantity: 1,
        price: -Math.round(discountAmount * 100), // Valor negativo
      });
    }

    const origin = req.headers.get("origin") || "https://eheiujcuirpciqffcltr.lovable.app";

    // Criar cobrança na AbacatePay
    const abacatePayApiKey = Deno.env.get("ABACATEPAY_API_KEY");
    if (!abacatePayApiKey) {
      throw new Error("ABACATEPAY_API_KEY não configurada");
    }

    const abacatePayResponse = await fetch("https://api.abacatepay.com/v1/billing/create", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${abacatePayApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        frequency: "ONE_TIME",
        methods: ["PIX"],
        products: products,
        returnUrl: `${origin}/order-tracking?code=${order.id}`,
        completionUrl: `${origin}/order-tracking?code=${order.id}`,
        customer: {
          name: customerName,
          email: customerEmail,
          cellphone: customerPhone || orderData.customer_phone,
        },
        metadata: {
          order_id: order.id,
          order_number: orderNumber,
        },
      }),
    });

    const abacatePayData = await abacatePayResponse.json();

    console.log("AbacatePay response:", JSON.stringify(abacatePayData));

    if (abacatePayData.error || !abacatePayData.data) {
      console.error("Erro AbacatePay:", abacatePayData);
      throw new Error(abacatePayData.error || "Falha ao criar cobrança na AbacatePay");
    }

    const billingId = abacatePayData.data.id;
    const billingUrl = abacatePayData.data.url;

    console.log("AbacatePay billing created:", billingId, billingUrl);

    // Atualizar pedido com billing_id da AbacatePay
    await supabase
      .from("orders")
      .update({ payment_intent_id: billingId })
      .eq("id", order.id);

    return new Response(
      JSON.stringify({
        billingId: billingId,
        url: billingUrl,
        orderId: order.id,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Error creating checkout:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
