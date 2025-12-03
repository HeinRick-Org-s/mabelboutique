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
      discountAmount,
      orderData,
    } = await req.json();

    console.log("Creating pickup order", { items, customerEmail });

    // Criar cliente Supabase
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Gerar número único do pedido
    const { data: orderNumberData } = await supabase.rpc("generate_order_number");
    const orderNumber = orderNumberData || `PED-${Date.now()}`;

    // Gerar código de rastreamento
    const { data: trackingCodeData } = await supabase.rpc("generate_tracking_code");
    const trackingCode = trackingCodeData || `TRK-${Date.now()}`;

    // Criar pedido no Supabase com status "processing" (já que é retirada)
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        order_number: orderNumber,
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: orderData.customer_phone,
        customer_whatsapp: orderData.customer_whatsapp,
        shipping_cep: "",
        shipping_street: "RETIRADA NA LOJA",
        shipping_number: "",
        shipping_complement: null,
        shipping_neighborhood: "",
        shipping_city: "",
        shipping_state: "",
        delivery_type: "RETIRADA NA LOJA",
        delivery_days: 0,
        payment_method: "na_retirada",
        payment_status: "pending",
        status: "processing",
        subtotal: orderData.subtotal,
        shipping_cost: 0,
        discount_amount: discountAmount,
        total: orderData.subtotal - discountAmount,
        coupon_code: orderData.coupon_code,
        tracking_code: trackingCode,
      })
      .select()
      .single();

    if (orderError || !order) {
      console.error("Erro ao criar pedido:", orderError);
      throw new Error("Falha ao criar pedido no banco de dados");
    }

    console.log("Pedido de retirada criado no Supabase:", order.id);

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

    // Decrementar estoque dos produtos
    for (const item of orderData.items) {
      const { data: product } = await supabase
        .from("products")
        .select("variants")
        .eq("id", item.productId)
        .single();

      if (product?.variants) {
        const variants = (product.variants as any[]) || [];
        const updatedVariants = variants.map((variant: any) => {
          if (
            variant.color === item.selectedColor &&
            variant.size === item.selectedSize
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
          .eq("id", item.productId);
      }
    }

    console.log("Estoque decrementado");

    // Enviar email de confirmação
    try {
      const emailResponse = await supabase.functions.invoke("send-order-email", {
        body: {
          orderId: order.id,
          orderNumber: order.order_number,
          trackingCode: trackingCode,
          customerEmail: customerEmail,
          customerName: customerName,
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

    return new Response(
      JSON.stringify({
        orderId: order.id,
        trackingCode: trackingCode,
        orderNumber: orderNumber,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Error creating pickup order:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
