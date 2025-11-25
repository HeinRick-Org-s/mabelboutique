import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ShippingRequest {
  cepDestino: string;
  peso?: number; // em gramas
  formato?: number; // 1 = caixa/pacote, 2 = rolo/prisma, 3 = envelope
  comprimento?: number; // em cm
  altura?: number; // em cm
  largura?: number; // em cm
  diametro?: number; // em cm
}

interface ShippingOption {
  type: string;
  name: string;
  price: number;
  days: number;
  service: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { cepDestino, peso = 500, formato = 1, comprimento = 20, altura = 10, largura = 15, diametro = 0 }: ShippingRequest = await req.json();

    console.log('Calculando frete para CEP:', cepDestino);

    // Remove formatação do CEP
    const cepClean = cepDestino.replace(/\D/g, '');

    // São Luís - MA: 65000-000 a 65099-999
    // Paço do Lumiar - MA: 65130-000 a 65139-999
    const cepNumber = parseInt(cepClean);
    const isSaoLuis = cepNumber >= 65000000 && cepNumber <= 65099999;
    const isPacoDoLumiar = cepNumber >= 65130000 && cepNumber <= 65139999;

    // Frete grátis para São Luís e Paço do Lumiar
    if (isSaoLuis || isPacoDoLumiar) {
      const freeShipping: ShippingOption[] = [
        {
          type: 'standard',
          name: 'Entrega Padrão (Grátis)',
          price: 0,
          days: 3,
          service: 'Local'
        },
        {
          type: 'express',
          name: 'Entrega Expressa (Grátis)',
          price: 0,
          days: 1,
          service: 'Local Express'
        }
      ];

      return new Response(
        JSON.stringify({ success: true, options: freeShipping }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Para outras localidades, simular cálculo baseado em distância
    // Em produção real, você integraria com a API dos Correios
    // API dos Correios requer contrato e autenticação
    
    const cepOrigin = 65000000; // São Luís
    const distance = Math.abs(cepNumber - cepOrigin) / 100000;
    
    // Cálculo simplificado baseado em distância
    const basePriceSedex = 25 + (distance * 3);
    const basePricePac = 15 + (distance * 2);
    
    const daysSedex = Math.max(5, Math.min(15, Math.floor(distance / 2)));
    const daysPac = Math.max(10, Math.min(30, Math.floor(distance)));

    const shippingOptions: ShippingOption[] = [
      {
        type: 'standard',
        name: 'PAC - Entrega Padrão',
        price: Math.round(basePricePac * 100) / 100,
        days: daysPac,
        service: 'PAC'
      },
      {
        type: 'express',
        name: 'SEDEX - Entrega Expressa',
        price: Math.round(basePriceSedex * 100) / 100,
        days: daysSedex,
        service: 'SEDEX'
      }
    ];

    console.log('Opções de frete calculadas:', shippingOptions);

    return new Response(
      JSON.stringify({ success: true, options: shippingOptions }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro ao calcular frete:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro ao calcular frete' 
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});