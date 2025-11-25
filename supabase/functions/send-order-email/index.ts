import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { orderId, customerEmail, trackingCode } = await req.json();

    console.log("Sending order email", { orderId, customerEmail, trackingCode });

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Buscar detalhes do pedido
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (orderError) throw orderError;

    // Buscar itens do pedido
    const { data: items, error: itemsError } = await supabase
      .from("order_items")
      .select("*")
      .eq("order_id", orderId);

    if (itemsError) throw itemsError;

    const trackingUrl = `${req.headers.get("origin")}/order-tracking?code=${trackingCode}`;

    const itemsHtml = items?.map(item => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">
          ${item.product_name}<br/>
          <small style="color: #666;">Cor: ${item.selected_color} | Tamanho: ${item.selected_size}</small>
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">R$ ${item.product_price.toFixed(2)}</td>
      </tr>
    `).join('');

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Confirmação do Pedido - Mabel</title>
        </head>
        <body style="font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #4a7c59 0%, #2d5f3f 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Mabel</h1>
            <p style="color: #e0f2e9; margin: 10px 0 0 0;">Seu pedido foi confirmado!</p>
          </div>
          
          <div style="background: white; padding: 30px; border: 1px solid #eee; border-top: none;">
            <p style="font-size: 16px; margin-bottom: 20px;">
              Olá <strong>${order.customer_name}</strong>,
            </p>
            
            <p style="margin-bottom: 20px;">
              Seu pedido <strong>#${order.order_number}</strong> foi recebido e está sendo processado!
            </p>

            <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h2 style="color: #4a7c59; font-size: 18px; margin-top: 0;">Código de Rastreamento</h2>
              <p style="font-size: 24px; font-weight: bold; color: #2d5f3f; letter-spacing: 2px; margin: 10px 0;">
                ${trackingCode}
              </p>
              <p style="font-size: 14px; color: #666; margin-bottom: 15px;">
                Use este código para acompanhar seu pedido
              </p>
              <a href="${trackingUrl}" 
                 style="display: inline-block; background: #4a7c59; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                Acompanhar Pedido
              </a>
            </div>

            <h3 style="color: #4a7c59; border-bottom: 2px solid #4a7c59; padding-bottom: 10px; margin-top: 30px;">
              Resumo do Pedido
            </h3>
            
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
              <thead>
                <tr style="background: #f5f5f5;">
                  <th style="padding: 10px; text-align: left; border-bottom: 2px solid #4a7c59;">Produto</th>
                  <th style="padding: 10px; text-align: center; border-bottom: 2px solid #4a7c59;">Qtd</th>
                  <th style="padding: 10px; text-align: right; border-bottom: 2px solid #4a7c59;">Preço</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>

            <div style="text-align: right; margin-top: 20px; padding-top: 20px; border-top: 2px solid #eee;">
              <p style="margin: 5px 0;"><strong>Subtotal:</strong> R$ ${order.subtotal.toFixed(2)}</p>
              ${order.discount_amount > 0 ? `<p style="margin: 5px 0; color: #4a7c59;"><strong>Desconto:</strong> -R$ ${order.discount_amount.toFixed(2)}</p>` : ''}
              <p style="margin: 5px 0;"><strong>Frete:</strong> R$ ${order.shipping_cost.toFixed(2)}</p>
              <p style="margin: 15px 0 0 0; font-size: 20px; color: #2d5f3f;">
                <strong>Total:</strong> R$ ${order.total.toFixed(2)}
              </p>
            </div>

            ${order.delivery_type !== "RETIRADA NA LOJA" ? `
              <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin-top: 30px;">
                <h4 style="color: #4a7c59; margin-top: 0;">Endereço de Entrega</h4>
                <p style="margin: 5px 0;">
                  ${order.shipping_street}, ${order.shipping_number}
                  ${order.shipping_complement ? ` - ${order.shipping_complement}` : ''}<br/>
                  ${order.shipping_neighborhood}<br/>
                  ${order.shipping_city} - ${order.shipping_state}<br/>
                  CEP: ${order.shipping_cep}
                </p>
                ${order.delivery_days ? `<p style="margin: 10px 0 0 0; color: #666;"><strong>Prazo de entrega:</strong> ${order.delivery_days} dias úteis</p>` : ''}
              </div>
            ` : `
              <div style="background: #fff3cd; padding: 15px; border-radius: 5px; margin-top: 30px; border-left: 4px solid #ffc107;">
                <h4 style="color: #856404; margin-top: 0;">Retirada na Loja</h4>
                <p style="margin: 5px 0; color: #856404;">
                  Você optou por retirar o pedido na loja. Assim que estiver pronto para retirada, você será notificado.
                </p>
              </div>
            `}

            <p style="margin-top: 30px; font-size: 14px; color: #666;">
              Se você tiver alguma dúvida, não hesite em nos contatar.
            </p>
          </div>

          <div style="background: #f5f5f5; padding: 20px; text-align: center; border-radius: 0 0 10px 10px;">
            <p style="margin: 0; font-size: 14px; color: #666;">
              © ${new Date().getFullYear()} Mabel - Todos os direitos reservados
            </p>
          </div>
        </body>
      </html>
    `;

    const emailResponse = await resend.emails.send({
      from: "Mabel <onboarding@resend.dev>",
      to: [customerEmail],
      subject: `Pedido Confirmado #${order.order_number} - Mabel`,
      html: emailHtml,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error sending order email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
