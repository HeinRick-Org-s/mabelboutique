import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, Package, Truck, CheckCircle, Clock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface OrderItem {
  product_name: string;
  product_image: string;
  product_price: number;
  quantity: number;
  selected_color: string;
  selected_size: string;
  subtotal: number;
}

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  status: string;
  total: number;
  subtotal: number;
  shipping_cost: number;
  discount_amount: number;
  delivery_type: string;
  delivery_days: number | null;
  shipping_street: string;
  shipping_number: string;
  shipping_complement: string | null;
  shipping_neighborhood: string;
  shipping_city: string;
  shipping_state: string;
  shipping_cep: string;
  created_at: string;
  payment_status: string;
  tracking_code: string;
  items?: OrderItem[];
}

const OrderTracking = () => {
  const [searchParams] = useSearchParams();
  const codeFromUrl = searchParams.get("code");
  
  const [trackingCode, setTrackingCode] = useState(codeFromUrl || "");
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const codeParam = searchParams.get("code");

    if (codeParam) {
      // Tentar buscar pelo código (pode ser tracking_code ou order_id)
      fetchOrderByCode(codeParam);
    }
  }, [searchParams]);

  const fetchOrderByCode = async (code: string) => {
    setLoading(true);
    try {
      // Aguardar processamento do webhook (pode levar alguns segundos)
      await new Promise(resolve => setTimeout(resolve, 2000));

      let orderData = null;

      // Primeiro tenta por tracking_code
      const { data: trackingData } = await supabase
        .from("orders")
        .select("*")
        .eq("tracking_code", code.toUpperCase())
        .maybeSingle();

      if (trackingData) {
        orderData = trackingData;
      } else {
        // Se não encontrou, tenta por ID
        const { data: idData } = await supabase
          .from("orders")
          .select("*")
          .eq("id", code)
          .maybeSingle();

        orderData = idData;
      }

      if (!orderData) {
        toast({
          title: "Pedido não encontrado",
          description: "Aguarde alguns instantes e tente novamente.",
          variant: "destructive",
        });
        return;
      }

      // Buscar itens do pedido
      const { data: itemsData, error: itemsError } = await supabase
        .from("order_items")
        .select("*")
        .eq("order_id", orderData.id);

      if (itemsError) throw itemsError;

      setOrder({ ...orderData, items: itemsData || [] });
      
      // Atualizar o campo de tracking com o código correto
      if (orderData.tracking_code) {
        setTrackingCode(orderData.tracking_code);
      }

      toast({
        title: "Pedido encontrado!",
        description: `Pedido #${orderData.order_number}`,
      });
    } catch (error) {
      console.error("Erro ao buscar pedido:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar o pedido. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!trackingCode.trim()) {
      toast({
        title: "Código obrigatório",
        description: "Por favor, digite o código de rastreamento.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Tentar buscar por tracking_code ou por ID
      let orderData = null;

      // Primeiro tenta por tracking_code
      const { data: trackingData } = await supabase
        .from("orders")
        .select("*")
        .eq("tracking_code", trackingCode.toUpperCase())
        .maybeSingle();

      if (trackingData) {
        orderData = trackingData;
      } else {
        // Se não encontrou, tenta por ID
        const { data: idData } = await supabase
          .from("orders")
          .select("*")
          .eq("id", trackingCode)
          .maybeSingle();

        orderData = idData;
      }

      if (!orderData) {
        toast({
          title: "Pedido não encontrado",
          description: "Verifique o código de rastreamento e tente novamente.",
          variant: "destructive",
        });
        setOrder(null);
        return;
      }

      // Buscar itens do pedido
      const { data: items, error: itemsError } = await supabase
        .from("order_items")
        .select("*")
        .eq("order_id", orderData.id);

      if (itemsError) throw itemsError;

      setOrder({ ...orderData, items: items || [] });
      
      // Atualizar o campo de tracking com o código correto
      if (orderData.tracking_code) {
        setTrackingCode(orderData.tracking_code);
      }

      toast({
        title: "Pedido encontrado!",
        description: `Pedido #${orderData.order_number}`,
      });
    } catch (error) {
      console.error("Erro ao buscar pedido:", error);
      toast({
        title: "Erro ao buscar pedido",
        description: "Não foi possível buscar as informações do pedido. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusSteps = (currentStatus: string) => {
    const steps = [
      {
        status: "pending",
        label: "Pedido Recebido",
        description: "Seu pedido foi recebido e está aguardando confirmação",
        completed: true,
      },
      {
        status: "processing",
        label: "Em Preparação",
        description: "Seu pedido está sendo preparado para envio",
        completed: ["processing", "shipped", "delivered"].includes(currentStatus),
      },
      {
        status: "shipped",
        label: "Em Trânsito",
        description: "Seu pedido saiu para entrega",
        completed: ["shipped", "delivered"].includes(currentStatus),
      },
      {
        status: "delivered",
        label: "Entregue",
        description: "Pedido entregue com sucesso",
        completed: currentStatus === "delivered",
      },
    ];

    return steps;
  };

  const getStatusIcon = (status: string, completed: boolean) => {
    if (!completed) return <Clock className="h-8 w-8 text-muted-foreground" />;
    
    switch (status) {
      case "pending":
      case "delivered":
        return <CheckCircle className="h-8 w-8 text-primary" />;
      case "processing":
        return <Package className="h-8 w-8 text-primary" />;
      case "shipped":
        return <Truck className="h-8 w-8 text-primary" />;
      default:
        return <Clock className="h-8 w-8 text-muted-foreground" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 bg-gradient-subtle flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-lg text-foreground">Carregando pedido...</p>
            <p className="text-sm text-muted-foreground mt-2">Aguarde alguns instantes</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 bg-gradient-subtle">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-3xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <Link to="/">
                <Button variant="ghost" className="mb-4 -ml-2">
                  <ArrowLeft className="h-5 w-5 mr-2" />
                  Voltar para início
                </Button>
              </Link>
              <h1 className="font-playfair text-4xl font-bold text-foreground mb-2">
                Rastreamento de Pedido
              </h1>
              <p className="text-muted-foreground">
                Digite o código de rastreamento recebido por email
              </p>
            </div>

            {/* Search */}
            <div className="bg-card rounded-xl shadow-soft border border-border p-6 mb-8">
              <div className="flex gap-4">
                <Input
                  type="text"
                  placeholder="Ex: A1B2C3D4"
                  value={trackingCode}
                  onChange={(e) => setTrackingCode(e.target.value.toUpperCase())}
                  className="flex-1 h-12"
                  maxLength={8}
                />
                <Button 
                  onClick={handleSearch} 
                  className="h-12 px-8"
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    "Rastrear"
                  )}
                </Button>
              </div>
            </div>

            {/* Order Status */}
            {order && (
              <div className="space-y-6">
                {/* Tracking Code Display */}
                {order.tracking_code && (
                  <div className="bg-primary/10 border-2 border-primary/20 rounded-xl p-6 text-center">
                    <p className="text-sm text-muted-foreground mb-2">Código de Rastreamento</p>
                    <p className="text-3xl font-bold text-primary tracking-widest">
                      {order.tracking_code}
                    </p>
                  </div>
                )}

                {/* Order Info */}
                <div className="bg-card rounded-xl shadow-soft border border-border p-6">
                  <h2 className="font-playfair text-2xl font-bold text-foreground mb-4">
                    Informações do Pedido
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Número</p>
                      <p className="font-semibold text-foreground">{order.order_number}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Data</p>
                      <p className="font-semibold text-foreground">
                        {formatDate(order.created_at)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Total</p>
                      <p className="font-semibold text-primary">
                        R$ {order.total.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  {/* Items */}
                  <div className="border-t border-border pt-4 mt-4">
                    <h3 className="font-semibold text-foreground mb-3">Itens do Pedido</h3>
                    <div className="space-y-3">
                      {order.items?.map((item, index) => (
                        <div key={index} className="flex gap-4 items-center">
                          <img
                            src={item.product_image}
                            alt={item.product_name}
                            className="w-16 h-16 object-cover rounded-lg"
                          />
                          <div className="flex-1">
                            <p className="font-semibold text-foreground">{item.product_name}</p>
                            <p className="text-sm text-muted-foreground">
                              Cor: {item.selected_color} | Tamanho: {item.selected_size}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Quantidade: {item.quantity}
                            </p>
                          </div>
                          <p className="font-semibold text-foreground">
                            R$ {item.subtotal.toFixed(2)}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* Totals */}
                    <div className="border-t border-border mt-4 pt-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal:</span>
                        <span className="font-semibold">R$ {order.subtotal.toFixed(2)}</span>
                      </div>
                      {order.discount_amount > 0 && (
                        <div className="flex justify-between text-sm text-green-600">
                          <span>Desconto:</span>
                          <span className="font-semibold">-R$ {order.discount_amount.toFixed(2)}</span>
                        </div>
                      )}
                      {order.shipping_cost > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Frete:</span>
                          <span className="font-semibold">R$ {order.shipping_cost.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between pt-2 border-t border-border">
                        <span className="font-bold text-foreground">Total:</span>
                        <span className="font-bold text-primary text-lg">
                          R$ {order.total.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Delivery Address */}
                  {order.delivery_type !== "RETIRADA NA LOJA" && (
                    <div className="border-t border-border pt-4 mt-4">
                      <h3 className="font-semibold text-foreground mb-2">Endereço de Entrega</h3>
                      <p className="text-sm text-muted-foreground">
                        {order.shipping_street}, {order.shipping_number}
                        {order.shipping_complement && ` - ${order.shipping_complement}`}
                        <br />
                        {order.shipping_neighborhood}
                        <br />
                        {order.shipping_city} - {order.shipping_state}
                        <br />
                        CEP: {order.shipping_cep}
                      </p>
                      {order.delivery_days && (
                        <p className="text-sm text-muted-foreground mt-2">
                          <strong>Prazo:</strong> {order.delivery_days} dias úteis
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Tracking Steps */}
                <div className="bg-card rounded-xl shadow-soft border border-border p-6">
                  <h2 className="font-playfair text-2xl font-bold text-foreground mb-6">
                    Status do Pedido
                  </h2>
                  
                  <div className="space-y-8">
                    {getStatusSteps(order.status).map((step, index, array) => (
                      <div key={step.status} className="flex gap-4">
                        {/* Icon */}
                        <div className="flex flex-col items-center">
                          <div className={`rounded-full p-2 ${step.completed ? 'bg-primary/10' : 'bg-muted'}`}>
                            {getStatusIcon(step.status, step.completed)}
                          </div>
                          {index < array.length - 1 && (
                            <div className={`w-0.5 h-16 mt-2 ${step.completed ? 'bg-primary' : 'bg-border'}`} />
                          )}
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 pb-8">
                          <h3 className={`text-lg font-semibold mb-1 ${step.completed ? 'text-foreground' : 'text-muted-foreground'}`}>
                            {step.label}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {step.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Note */}
                <div className="bg-muted/50 rounded-lg border border-border p-4">
                  <p className="text-sm text-muted-foreground">
                    <strong>Nota:</strong> Você receberá atualizações por email e WhatsApp a cada mudança de status do pedido.
                  </p>
                </div>
              </div>
            )}

            {!order && trackingCode && !loading && (
              <div className="bg-card rounded-xl shadow-soft border border-border p-12 text-center">
                <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-playfair text-xl font-bold text-foreground mb-2">
                  Pedido não encontrado
                </h3>
                <p className="text-muted-foreground">
                  Verifique o código de rastreamento e tente novamente
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default OrderTracking;
