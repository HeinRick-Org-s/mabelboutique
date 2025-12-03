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
      customerCpf,
      shippingCost,
      discountAmount,
      orderData,
    } = await req.json();

    console.log("Creating Mercado Pago checkout", { items, customerEmail, shippingCost });

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
        payment_method: "mercadopago",
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

    // Preparar itens para Mercado Pago
    const mpItems = items.map((item: any) => ({
      id: item.productId,
      title: `${item.name} - ${item.selectedColor} - ${item.selectedSize}`,
      description: `Cor: ${item.selectedColor} | Tamanho: ${item.selectedSize}`,
      quantity: item.quantity,
      unit_price: Number(item.price),
      currency_id: "BRL",
    }));

    // Adicionar frete como item se houver
    if (shippingCost > 0) {
      mpItems.push({
        id: "shipping",
        title: "Frete",
        description: "Custo de envio",
        quantity: 1,
        unit_price: Number(shippingCost),
        currency_id: "BRL",
      });
    }

    // Se houver desconto, adicionar como item negativo não é suportado pelo MP
    // Então vamos aplicar no valor total através de "shipments" ou ajustar preços

    const origin = req.headers.get("origin") || "https://eheiujcuirpciqffcltr.lovable.app";

    // Criar preferência no Mercado Pago
    const mpAccessToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
    if (!mpAccessToken) {
      throw new Error("MERCADOPAGO_ACCESS_TOKEN não configurado");
    }

    const preferenceBody: any = {
      items: mpItems,
      payer: {
        name: customerName.split(" ")[0],
        surname: customerName.split(" ").slice(1).join(" ") || customerName,
        email: customerEmail,
        phone: {
          area_code: customerPhone?.replace(/\D/g, "").substring(0, 2) || "",
          number: customerPhone?.replace(/\D/g, "").substring(2) || "",
        },
        identification: {
          type: "CPF",
          number: customerCpf?.replace(/\D/g, "") || "",
        },
      },
      back_urls: {
        success: `${origin}/order-tracking?code=${order.id}`,
        failure: `${origin}/checkout`,
        pending: `${origin}/order-tracking?code=${order.id}`,
      },
      auto_return: "approved",
      external_reference: order.id,
      notification_url: `https://eheiujcuirpciqffcltr.supabase.co/functions/v1/mercadopago-webhook`,
      payment_methods: {
        excluded_payment_types: [],
        installments: 12,
      },
      statement_descriptor: "MABEL BOUTIQUE",
    };

    // Aplicar desconto se houver
    if (discountAmount > 0) {
      preferenceBody.shipments = {
        cost: 0,
        mode: "not_specified",
      };
      // Ajustar o primeiro item para aplicar o desconto
      const totalItems = mpItems.reduce((acc: number, item: any) => acc + (item.unit_price * item.quantity), 0);
      const discountPercentage = discountAmount / totalItems;
      mpItems.forEach((item: any) => {
        item.unit_price = Number((item.unit_price * (1 - discountPercentage)).toFixed(2));
      });
    }

    console.log("Creating Mercado Pago preference:", JSON.stringify(preferenceBody));

    const mpResponse = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${mpAccessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(preferenceBody),
    });

    const mpData = await mpResponse.json();

    console.log("Mercado Pago response:", JSON.stringify(mpData));

    if (mpData.error || !mpData.id) {
      console.error("Erro Mercado Pago:", mpData);
      throw new Error(mpData.message || "Falha ao criar preferência no Mercado Pago");
    }

    const preferenceId = mpData.id;
    const initPoint = mpData.init_point;

    console.log("Mercado Pago preference created:", preferenceId, initPoint);

    // Atualizar pedido com preference_id do Mercado Pago
    await supabase
      .from("orders")
      .update({ payment_intent_id: preferenceId })
      .eq("id", order.id);

    return new Response(
      JSON.stringify({
        preferenceId: preferenceId,
        url: initPoint,
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
