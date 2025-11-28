import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface StatusUpdateEmailRequest {
  orderId: string;
  customerEmail: string;
  customerName: string;
  orderNumber: string;
  trackingCode: string;
  newStatus: string;
  shippingTrackingCode?: string | null;
}

const statusLabels: Record<string, string> = {
  pending: "Pendente",
  paid: "Pago",
  processing: "Em Preparação",
  shipped: "Enviado",
  delivered: "Entregue",
  cancelled: "Cancelado",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      orderId,
      customerEmail,
      customerName,
      orderNumber,
      trackingCode,
      newStatus,
      shippingTrackingCode,
    }: StatusUpdateEmailRequest = await req.json();

    console.log("Sending status update email", { orderId, customerEmail, newStatus });

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY não configurada");
    }

    const trackingUrl = `https://preview--mabel-modas.lovable.app/order-tracking?code=${trackingCode}`;
    const statusLabel = statusLabels[newStatus] || newStatus;

    let statusMessage = "";
    let additionalInfo = "";

    switch (newStatus) {
      case "processing":
        statusMessage = "Seu pedido está sendo preparado com carinho! 🎁";
        additionalInfo = "Em breve você receberá atualizações sobre o envio.";
        break;
      case "shipped":
        statusMessage = "Seu pedido foi enviado! 📦🚚";
        if (shippingTrackingCode) {
          additionalInfo = `
            <p style="margin: 15px 0;">
              <strong>Código de rastreamento dos Correios:</strong><br>
              <span style="font-family: monospace; font-size: 18px; background-color: #f3f4f6; padding: 8px 16px; border-radius: 8px; display: inline-block; margin-top: 8px;">
                ${shippingTrackingCode}
              </span>
            </p>
            <p style="margin: 15px 0;">
              Acompanhe seu pedido no site dos Correios:<br>
              <a href="https://rastreamento.correios.com.br/app/index.php" style="color: #4a5d4a;">
                https://rastreamento.correios.com.br
              </a>
            </p>
          `;
        }
        break;
      case "delivered":
        statusMessage = "Seu pedido foi entregue! 🎉";
        additionalInfo = "Esperamos que você ame suas peças! Obrigada por comprar conosco.";
        break;
      default:
        statusMessage = `Status do pedido: ${statusLabel}`;
    }

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Atualização do Pedido - Mabel Boutique</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8f9fa;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
            <!-- Header -->
            <div style="background-color: #4a5d4a; padding: 30px 20px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 300; letter-spacing: 2px;">
                MABEL BOUTIQUE
              </h1>
              <p style="color: #c5d5c5; margin: 10px 0 0 0; font-size: 12px; letter-spacing: 1px;">
                MODA FEMININA EXCLUSIVA
              </p>
            </div>

            <!-- Content -->
            <div style="padding: 40px 30px;">
              <h2 style="color: #4a5d4a; font-size: 24px; margin: 0 0 20px 0; text-align: center;">
                Atualização do Pedido
              </h2>

              <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Olá <strong>${customerName}</strong>,
              </p>

              <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                ${statusMessage}
              </p>

              <!-- Order Info Box -->
              <div style="background-color: #f8f9f8; border-radius: 12px; padding: 25px; margin: 25px 0; border: 1px solid #e8ede8;">
                <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;">
                  <strong>Número do Pedido:</strong> ${orderNumber}
                </p>
                <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;">
                  <strong>Novo Status:</strong> 
                  <span style="background-color: #4a5d4a; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px;">
                    ${statusLabel}
                  </span>
                </p>
                ${additionalInfo}
              </div>

              <!-- Tracking Button -->
              <div style="text-align: center; margin: 30px 0;">
                <a href="${trackingUrl}" style="display: inline-block; background-color: #4a5d4a; color: #ffffff; text-decoration: none; padding: 14px 35px; border-radius: 8px; font-size: 16px; font-weight: 500;">
                  Acompanhar Pedido
                </a>
              </div>

              <p style="color: #666; font-size: 14px; line-height: 1.6; margin: 30px 0 0 0;">
                Qualquer dúvida, entre em contato conosco pelo WhatsApp: 
                <a href="https://wa.me/5598970242062" style="color: #4a5d4a; text-decoration: none;">
                  +55 98 7024-2062
                </a>
              </p>
            </div>

            <!-- Footer -->
            <div style="background-color: #4a5d4a; padding: 25px 20px; text-align: center;">
              <p style="color: #ffffff; margin: 0 0 10px 0; font-size: 14px;">
                Mabel Boutique - Moda Feminina
              </p>
              <p style="color: #c5d5c5; margin: 0; font-size: 12px;">
                Instagram: @_mabelboutique_
              </p>
              <p style="color: #c5d5c5; margin: 5px 0 0 0; font-size: 12px;">
                © 2025 Mabel Boutique. Todos os direitos reservados.
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Mabel Boutique <onboarding@resend.dev>",
        to: [customerEmail],
        subject: `Atualização do Pedido ${orderNumber} - ${statusLabel}`,
        html: emailHtml,
      }),
    });

    const emailData = await emailResponse.json();
    console.log("Status update email sent:", emailData);

    return new Response(
      JSON.stringify({ success: true, emailData }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error sending status update email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
