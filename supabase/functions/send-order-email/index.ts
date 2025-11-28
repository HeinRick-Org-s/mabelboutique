import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Cores da marca Mabel Boutique
const brandColors = {
  primary: "#4a7c59", // Verde musgo
  primaryDark: "#2d5f3f",
  secondary: "#f5f5f5",
  accent: "#e0f2e9",
  text: "#333333",
  textLight: "#666666",
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

    const trackingUrl = `https://preview--mabel-modas.lovable.app/order-tracking?code=${trackingCode}`;

    const itemsHtml = items?.map(item => `
      <tr>
        <td style="padding: 15px; border-bottom: 1px solid #eee;">
          <div style="display: flex; align-items: center;">
            <img src="${item.product_image}" alt="${item.product_name}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px; margin-right: 15px;" />
            <div>
              <p style="margin: 0; font-weight: 600; color: ${brandColors.text};">${item.product_name}</p>
              <p style="margin: 5px 0 0 0; font-size: 13px; color: ${brandColors.textLight};">Cor: ${item.selected_color} | Tamanho: ${item.selected_size}</p>
            </div>
          </div>
        </td>
        <td style="padding: 15px; border-bottom: 1px solid #eee; text-align: center; color: ${brandColors.text};">${item.quantity}</td>
        <td style="padding: 15px; border-bottom: 1px solid #eee; text-align: right; font-weight: 600; color: ${brandColors.primary};">R$ ${item.product_price.toFixed(2)}</td>
      </tr>
    `).join('');

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Confirmação do Pedido - Mabel Boutique</title>
        </head>
        <body style="font-family: 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: ${brandColors.text}; max-width: 600px; margin: 0 auto; padding: 0; background-color: #f9f9f9;">
          <!-- Header com Logo -->
          <div style="background: linear-gradient(135deg, ${brandColors.primary} 0%, ${brandColors.primaryDark} 100%); padding: 40px 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 36px; font-weight: 300; letter-spacing: 3px;">Mabel Boutique</h1>
            <p style="color: ${brandColors.accent}; margin: 15px 0 0 0; font-size: 16px; letter-spacing: 1px;">Moda Feminina de Alto Padrão</p>
          </div>
          
          <!-- Conteúdo Principal -->
          <div style="background: white; padding: 40px 30px;">
            <!-- Mensagem de Boas-vindas -->
            <div style="text-align: center; margin-bottom: 30px;">
              <div style="font-size: 48px; margin-bottom: 15px;">✨</div>
              <h2 style="color: ${brandColors.primary}; margin: 0 0 10px 0; font-size: 24px; font-weight: 600;">Pedido Confirmado!</h2>
              <p style="color: ${brandColors.textLight}; margin: 0; font-size: 16px;">
                Obrigada por escolher a Mabel Boutique, ${order.customer_name}!
              </p>
            </div>
            
            <p style="font-size: 16px; margin-bottom: 25px; color: ${brandColors.text};">
              Seu pedido <strong style="color: ${brandColors.primary};">#${order.order_number}</strong> foi recebido e está sendo preparado com todo carinho!
            </p>

            <!-- Código de Rastreamento -->
            <div style="background: linear-gradient(135deg, ${brandColors.accent} 0%, #fff 100%); padding: 25px; border-radius: 12px; margin: 30px 0; border: 2px solid ${brandColors.primary}20; text-align: center;">
              <p style="margin: 0 0 10px 0; font-size: 14px; color: ${brandColors.textLight}; text-transform: uppercase; letter-spacing: 1px;">Código de Rastreamento</p>
              <p style="font-size: 32px; font-weight: bold; color: ${brandColors.primary}; letter-spacing: 4px; margin: 10px 0;">
                ${trackingCode}
              </p>
              <p style="font-size: 14px; color: ${brandColors.textLight}; margin: 15px 0;">
                Use este código para acompanhar seu pedido
              </p>
              <a href="${trackingUrl}" 
                 style="display: inline-block; background: ${brandColors.primary}; color: white; padding: 14px 35px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; margin-top: 10px; letter-spacing: 0.5px;">
                🔍 Acompanhar Pedido
              </a>
            </div>

            <!-- Resumo do Pedido -->
            <h3 style="color: ${brandColors.primary}; border-bottom: 2px solid ${brandColors.primary}; padding-bottom: 12px; margin-top: 35px; font-size: 18px;">
              📦 Resumo do Pedido
            </h3>
            
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
              <thead>
                <tr style="background: ${brandColors.secondary};">
                  <th style="padding: 12px 15px; text-align: left; font-size: 13px; color: ${brandColors.textLight}; text-transform: uppercase; letter-spacing: 0.5px;">Produto</th>
                  <th style="padding: 12px 15px; text-align: center; font-size: 13px; color: ${brandColors.textLight}; text-transform: uppercase; letter-spacing: 0.5px;">Qtd</th>
                  <th style="padding: 12px 15px; text-align: right; font-size: 13px; color: ${brandColors.textLight}; text-transform: uppercase; letter-spacing: 0.5px;">Preço</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>

            <!-- Totais -->
            <div style="background: ${brandColors.secondary}; padding: 20px; border-radius: 8px; margin-top: 20px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <span style="color: ${brandColors.textLight};">Subtotal</span>
                <span style="font-weight: 600;">R$ ${order.subtotal.toFixed(2)}</span>
              </div>
              ${order.discount_amount > 0 ? `
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px; color: ${brandColors.primary};">
                  <span>Desconto</span>
                  <span style="font-weight: 600;">-R$ ${order.discount_amount.toFixed(2)}</span>
                </div>
              ` : ''}
              <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <span style="color: ${brandColors.textLight};">Frete</span>
                <span style="font-weight: 600;">${order.shipping_cost > 0 ? `R$ ${order.shipping_cost.toFixed(2)}` : 'Grátis'}</span>
              </div>
              <div style="display: flex; justify-content: space-between; padding-top: 15px; border-top: 2px solid ${brandColors.primary}20; margin-top: 10px;">
                <span style="font-size: 18px; font-weight: bold; color: ${brandColors.text};">Total</span>
                <span style="font-size: 22px; font-weight: bold; color: ${brandColors.primary};">R$ ${order.total.toFixed(2)}</span>
              </div>
            </div>

            <!-- Endereço de Entrega -->
            ${order.delivery_type !== "RETIRADA NA LOJA" ? `
              <div style="margin-top: 30px; padding: 20px; background: ${brandColors.secondary}; border-radius: 8px; border-left: 4px solid ${brandColors.primary};">
                <h4 style="color: ${brandColors.primary}; margin: 0 0 15px 0; font-size: 16px;">
                  🚚 Endereço de Entrega
                </h4>
                <p style="margin: 0; color: ${brandColors.text}; line-height: 1.8;">
                  ${order.shipping_street}, ${order.shipping_number}
                  ${order.shipping_complement ? ` - ${order.shipping_complement}` : ''}<br/>
                  ${order.shipping_neighborhood}<br/>
                  ${order.shipping_city} - ${order.shipping_state}<br/>
                  CEP: ${order.shipping_cep}
                </p>
                ${order.delivery_days ? `<p style="margin: 15px 0 0 0; color: ${brandColors.primary}; font-weight: 600;">⏱️ Prazo de entrega: ${order.delivery_days} dias úteis</p>` : ''}
              </div>
            ` : `
              <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin-top: 30px; border-left: 4px solid #ffc107;">
                <h4 style="color: #856404; margin: 0 0 10px 0; font-size: 16px;">
                  🏪 Retirada na Loja
                </h4>
                <p style="margin: 0; color: #856404;">
                  Você optou por retirar o pedido na loja. Assim que estiver pronto, você será notificada!
                </p>
              </div>
            `}

            <!-- Contato -->
            <div style="text-align: center; margin-top: 35px; padding-top: 25px; border-top: 1px solid #eee;">
              <p style="color: ${brandColors.textLight}; font-size: 14px; margin-bottom: 15px;">
                Dúvidas? Entre em contato conosco!
              </p>
              <p style="margin: 5px 0;">
                <a href="https://wa.me/5598702420262" style="color: ${brandColors.primary}; text-decoration: none; font-weight: 600;">
                  📱 WhatsApp: (98) 7024-2062
                </a>
              </p>
              <p style="margin: 5px 0;">
                <a href="mailto:mabelboutique2025@gmail.com" style="color: ${brandColors.primary}; text-decoration: none; font-weight: 600;">
                  ✉️ mabelboutique2025@gmail.com
                </a>
              </p>
              <p style="margin: 15px 0 0 0;">
                <a href="https://instagram.com/_mabelboutique_" style="color: ${brandColors.primary}; text-decoration: none; font-weight: 600;">
                  📸 @_mabelboutique_
                </a>
              </p>
            </div>
          </div>

          <!-- Footer -->
          <div style="background: ${brandColors.primary}; padding: 25px; text-align: center;">
            <p style="margin: 0; font-size: 14px; color: white; letter-spacing: 1px;">
              © ${new Date().getFullYear()} Mabel Boutique
            </p>
            <p style="margin: 10px 0 0 0; font-size: 12px; color: ${brandColors.accent};">
              Moda Feminina de Alto Padrão
            </p>
          </div>
        </body>
      </html>
    `;

    const emailResponse = await resend.emails.send({
      from: "Mabel Boutique <onboarding@resend.dev>",
      to: [customerEmail],
      subject: `✨ Pedido Confirmado #${order.order_number} - Mabel Boutique`,
      html: emailHtml,
    });

    console.log("Email sent successfully:", emailResponse);

    // Enviar notificação WhatsApp
    try {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      await supabase.functions.invoke("send-whatsapp-notification", {
        body: {
          customerPhone: order.customer_whatsapp || order.customer_phone,
          customerName: order.customer_name,
          orderNumber: order.order_number,
          trackingCode: trackingCode,
          messageType: "order_confirmation",
        },
      });
      console.log("WhatsApp notification sent");
    } catch (whatsappError) {
      console.error("Error sending WhatsApp notification:", whatsappError);
    }

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
