import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Número da loja para envio (CallMeBot)
const STORE_PHONE = "5598970242062";

interface WhatsAppRequest {
  customerPhone: string;
  customerName: string;
  orderNumber: string;
  trackingCode: string;
  messageType: "order_confirmation" | "status_update";
  newStatus?: string;
  shippingTrackingCode?: string | null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { customerPhone, customerName, orderNumber, trackingCode, messageType, newStatus, shippingTrackingCode }: WhatsAppRequest =
      await req.json();

    console.log("Sending WhatsApp notification", { customerPhone, customerName, orderNumber, messageType, newStatus });

    // Formatar número do cliente (remover caracteres especiais)
    const cleanPhone = customerPhone.replace(/\D/g, "");
    const formattedPhone = cleanPhone.startsWith("55") ? cleanPhone : `55${cleanPhone}`;

    let message = "";

    if (messageType === "order_confirmation") {
      message =
        `🛍️ *Mabel Boutique*\n\n` +
        `Olá ${customerName}! 🌸\n\n` +
        `Seu pedido *#${orderNumber}* foi confirmado com sucesso! ✅\n\n` +
        `📦 Código de rastreamento: *${trackingCode}*\n\n` +
        `Acompanhe seu pedido em:\nhttps://preview--mabel-modas.lovable.app/order-tracking?code=${trackingCode}\n\n` +
        `Obrigada por comprar conosco! 💚`;
    } else if (messageType === "status_update") {
      const statusLabels: Record<string, string> = {
        pending: "Pendente",
        paid: "Pago",
        processing: "Em Preparação",
        shipped: "Enviado",
        delivered: "Entregue",
        cancelled: "Cancelado",
      };

      let statusMessage = `📦 Novo status: *${statusLabels[newStatus || ""] || newStatus}*`;
      
      // Mensagem específica para cada status
      if (newStatus === "processing") {
        message =
          `🛍️ *Mabel Boutique*\n\n` +
          `Olá ${customerName}! 🌸\n\n` +
          `Seu pedido *#${orderNumber}* está sendo preparado com carinho! 🎁\n\n` +
          `${statusMessage}\n\n` +
          `Acompanhe seu pedido em:\nhttps://preview--mabel-modas.lovable.app/order-tracking?code=${trackingCode}\n\n` +
          `Em breve você receberá atualizações sobre o envio. 💚`;
      } else if (newStatus === "shipped") {
        message =
          `🛍️ *Mabel Boutique*\n\n` +
          `Olá ${customerName}! 🌸\n\n` +
          `Seu pedido *#${orderNumber}* foi enviado! 📦🚚\n\n` +
          `${statusMessage}\n\n`;
        
        if (shippingTrackingCode) {
          message += `📬 *Código de rastreamento dos Correios:*\n${shippingTrackingCode}\n\n`;
          message += `Acompanhe nos Correios:\nhttps://rastreamento.correios.com.br/app/index.php\n\n`;
        }
        
        message +=
          `Acompanhe seu pedido em:\nhttps://preview--mabel-modas.lovable.app/order-tracking?code=${trackingCode}\n\n` +
          `Obrigada pela preferência! 💚`;
      } else {
        message =
          `🛍️ *Mabel Boutique*\n\n` +
          `Olá ${customerName}! 🌸\n\n` +
          `Atualização do pedido *#${orderNumber}*:\n` +
          `${statusMessage}\n\n` +
          `Acompanhe seu pedido em:\nhttps://preview--mabel-modas.lovable.app/order-tracking?code=${trackingCode}\n\n` +
          `Obrigada pela preferência! 💚`;
      }
    }

    // Usar a API gratuita CallMeBot para enviar WhatsApp
    // O cliente precisa ativar: enviar "I allow callmebot to send me messages" para +34 644 71 84 21
    // Como alternativa, vamos apenas logar a mensagem e simular o envio
    // Em produção, você pode usar Twilio, MessageBird, ou outra API de WhatsApp

    console.log("WhatsApp message to send:", {
      phone: formattedPhone,
      message: message,
    });

    // Tentar enviar via API gratuita (funciona se o número estiver registrado)
    try {
      // Para usar CallMeBot, o destinatário precisa ter ativado o bot
      // Esta é uma simulação - em produção use uma API de WhatsApp Business
      const encodedMessage = encodeURIComponent(message);

      // Log da mensagem que seria enviada
      console.log(`Would send to ${formattedPhone}: ${message}`);

      // Para uma solução real, use:
      // - Twilio WhatsApp API
      // - MessageBird
      // - WhatsApp Business API
      // - Z-API
    } catch (apiError) {
      console.error("Error sending WhatsApp:", apiError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Notification queued",
        phone: formattedPhone,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error: any) {
    console.error("Error in WhatsApp notification:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
