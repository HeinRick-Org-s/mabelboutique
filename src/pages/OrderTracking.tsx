import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, Package, Truck, CheckCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

// Mock order tracking - preparado para Firebase
const mockOrderStatus = {
  "ORD-001": {
    id: "ORD-001",
    status: "em_transito",
    customer: "Maria Silva",
    total: "R$ 639,80",
    date: "15/01/2024",
    estimatedDelivery: "22/01/2024",
    steps: [
      {
        status: "pedido_confirmado",
        label: "Pedido Confirmado",
        description: "Seu pedido foi confirmado e está sendo preparado",
        date: "15/01/2024 10:30",
        completed: true,
      },
      {
        status: "em_separacao",
        label: "Em Separação",
        description: "Seu pedido está sendo separado para envio",
        date: "15/01/2024 14:20",
        completed: true,
      },
      {
        status: "em_transito",
        label: "Em Trânsito",
        description: "Seu pedido saiu para entrega",
        date: "16/01/2024 08:15",
        completed: true,
      },
      {
        status: "entregue",
        label: "Entregue",
        description: "Pedido entregue com sucesso",
        date: "",
        completed: false,
      },
    ],
  },
};

const OrderTracking = () => {
  const [searchParams] = useSearchParams();
  const orderIdFromUrl = searchParams.get("orderId");
  const [orderId, setOrderId] = useState(orderIdFromUrl || "");
  const [order, setOrder] = useState(
    orderIdFromUrl ? mockOrderStatus[orderIdFromUrl as keyof typeof mockOrderStatus] : null
  );

  const handleSearch = () => {
    // TODO: Integrar com Firebase Firestore
    // const orderDoc = await getDoc(doc(db, "orders", orderId))
    const foundOrder = mockOrderStatus[orderId as keyof typeof mockOrderStatus];
    setOrder(foundOrder || null);
  };

  const getStatusIcon = (status: string, completed: boolean) => {
    if (!completed) return <Clock className="h-8 w-8 text-muted-foreground" />;
    
    switch (status) {
      case "pedido_confirmado":
        return <CheckCircle className="h-8 w-8 text-primary" />;
      case "em_separacao":
        return <Package className="h-8 w-8 text-primary" />;
      case "em_transito":
        return <Truck className="h-8 w-8 text-primary" />;
      case "entregue":
        return <CheckCircle className="h-8 w-8 text-primary" />;
      default:
        return <Clock className="h-8 w-8 text-muted-foreground" />;
    }
  };

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
                Digite o número do seu pedido para acompanhar o status
              </p>
            </div>

            {/* Search */}
            <div className="bg-card rounded-xl shadow-soft border border-border p-6 mb-8">
              <div className="flex gap-4">
                <Input
                  type="text"
                  placeholder="Ex: ORD-001"
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  className="flex-1 h-12"
                />
                <Button onClick={handleSearch} className="h-12 px-8">
                  Rastrear
                </Button>
              </div>
            </div>

            {/* Order Status */}
            {order ? (
              <div className="space-y-6">
                {/* Order Info */}
                <div className="bg-card rounded-xl shadow-soft border border-border p-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Pedido</p>
                      <p className="font-semibold text-foreground">{order.id}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Data</p>
                      <p className="font-semibold text-foreground">{order.date}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Total</p>
                      <p className="font-semibold text-primary">{order.total}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Previsão</p>
                      <p className="font-semibold text-foreground">{order.estimatedDelivery}</p>
                    </div>
                  </div>
                </div>

                {/* Tracking Steps */}
                <div className="bg-card rounded-xl shadow-soft border border-border p-6">
                  <h2 className="font-playfair text-2xl font-bold text-foreground mb-6">
                    Status do Pedido
                  </h2>
                  
                  <div className="space-y-8">
                    {order.steps.map((step, index) => (
                      <div key={step.status} className="flex gap-4">
                        {/* Icon */}
                        <div className="flex flex-col items-center">
                          <div className={`rounded-full p-2 ${step.completed ? 'bg-primary/10' : 'bg-muted'}`}>
                            {getStatusIcon(step.status, step.completed)}
                          </div>
                          {index < order.steps.length - 1 && (
                            <div className={`w-0.5 h-16 mt-2 ${step.completed ? 'bg-primary' : 'bg-border'}`} />
                          )}
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 pb-8">
                          <h3 className={`text-lg font-semibold mb-1 ${step.completed ? 'text-foreground' : 'text-muted-foreground'}`}>
                            {step.label}
                          </h3>
                          <p className="text-sm text-muted-foreground mb-2">
                            {step.description}
                          </p>
                          {step.date && (
                            <p className="text-xs text-muted-foreground">
                              {step.date}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Note */}
                <div className="bg-muted/50 rounded-lg border border-border p-4">
                  <p className="text-sm text-muted-foreground">
                    <strong>Nota:</strong> Você receberá atualizações por email e WhatsApp a cada mudança de status.
                    Estrutura preparada para integração com Firebase Firestore e notificações via Resend e WhatsApp API.
                  </p>
                </div>
              </div>
            ) : orderId && !order ? (
              <div className="bg-card rounded-xl shadow-soft border border-border p-12 text-center">
                <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-playfair text-xl font-bold text-foreground mb-2">
                  Pedido não encontrado
                </h3>
                <p className="text-muted-foreground">
                  Verifique o número do pedido e tente novamente
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default OrderTracking;
