import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface OrderItem {
  id: string;
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
  customer_whatsapp: string | null;
  shipping_street: string;
  shipping_number: string;
  shipping_complement: string | null;
  shipping_neighborhood: string;
  shipping_city: string;
  shipping_state: string;
  shipping_cep: string;
  delivery_type: string;
  delivery_days: number | null;
  payment_method: string;
  payment_status: string | null;
  subtotal: number;
  shipping_cost: number;
  discount_amount: number;
  total: number;
  status: string;
  tracking_code: string | null;
  created_at: string;
  order_items?: OrderItem[];
}

interface OrderDetailsDialogProps {
  order: Order | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusUpdated: () => void;
}

const statusOptions = [
  { value: "pending", label: "Pendente" },
  { value: "paid", label: "Pago" },
  { value: "processing", label: "Processando" },
  { value: "shipped", label: "Enviado" },
  { value: "delivered", label: "Entregue" },
  { value: "cancelled", label: "Cancelado" },
];

const paymentStatusLabels: Record<string, string> = {
  pending: "Pendente",
  paid: "Pago",
  failed: "Falhou",
  refunded: "Reembolsado",
  cancelled: "Cancelado",
};

const OrderDetailsDialog = ({ order, open, onOpenChange, onStatusUpdated }: OrderDetailsDialogProps) => {
  const [status, setStatus] = useState(order?.status || "pending");
  const [shippingTrackingCode, setShippingTrackingCode] = useState("");
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (order) {
      setStatus(order.status);
      setShippingTrackingCode("");
    }
  }, [order]);

  const handleUpdateStatus = async () => {
    if (!order) return;

    if (status === "shipped" && !shippingTrackingCode.trim()) {
      toast({
        title: "Código de rastreamento obrigatório",
        description: "Por favor, informe o código de rastreamento dos Correios para marcar como enviado.",
        variant: "destructive",
      });
      return;
    }

    setUpdating(true);
    try {
      const { error } = await supabase
        .from("orders")
        .update({ status })
        .eq("id", order.id);

      if (error) throw error;

      if (status === "processing" || status === "shipped") {
        try {
          await supabase.functions.invoke("send-whatsapp-notification", {
            body: {
              customerPhone: order.customer_whatsapp || order.customer_phone,
              customerName: order.customer_name,
              orderNumber: order.order_number,
              trackingCode: order.tracking_code || order.id,
              messageType: "status_update",
              newStatus: status,
              shippingTrackingCode: status === "shipped" ? shippingTrackingCode : null,
            },
          });
          console.log("WhatsApp notification sent for status update");
        } catch (whatsappError) {
          console.error("Error sending WhatsApp notification:", whatsappError);
        }

        try {
          await supabase.functions.invoke("send-status-update-email", {
            body: {
              orderId: order.id,
              customerEmail: order.customer_email,
              customerName: order.customer_name,
              orderNumber: order.order_number,
              trackingCode: order.tracking_code || order.id,
              newStatus: status,
              shippingTrackingCode: status === "shipped" ? shippingTrackingCode : null,
            },
          });
          console.log("Email notification sent for status update");
        } catch (emailError) {
          console.error("Error sending email notification:", emailError);
        }
      }

      toast({
        title: "Status atualizado",
        description: "O status do pedido foi atualizado com sucesso.",
      });

      onStatusUpdated();
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível atualizar o status do pedido.",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  if (!order) return null;

  const getPaymentStatusLabel = (paymentStatus: string | null) => {
    if (!paymentStatus) return "Não informado";
    return paymentStatusLabels[paymentStatus] || paymentStatus;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-playfair text-2xl">
            Pedido {order.order_number}
          </DialogTitle>
          <DialogDescription>
            Detalhes completos do pedido e informações do cliente
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          <div className="bg-muted/30 p-4 rounded-lg">
            <Label htmlFor="status" className="text-base font-semibold mb-2 block">
              Atualizar Status
            </Label>
            <div className="space-y-3">
              <div className="flex gap-2">
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={handleUpdateStatus} disabled={updating}>
                  {updating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Salvar
                </Button>
              </div>
              
              {status === "shipped" && (
                <div className="space-y-2">
                  <Label htmlFor="shippingTrackingCode" className="text-sm">
                    Código de Rastreamento dos Correios *
                  </Label>
                  <Input
                    id="shippingTrackingCode"
                    value={shippingTrackingCode}
                    onChange={(e) => setShippingTrackingCode(e.target.value.toUpperCase())}
                    placeholder="Ex: AA123456789BR"
                    className="font-mono"
                  />
                  <p className="text-xs text-muted-foreground">
                    O código será enviado para o cliente via email e WhatsApp.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div>
            <h3 className="font-playfair text-xl font-semibold mb-3">
              Informações do Cliente
            </h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground">Nome</p>
                <p className="font-semibold">{order.customer_name}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Email</p>
                <p className="font-semibold">{order.customer_email}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Telefone</p>
                <p className="font-semibold">{order.customer_phone}</p>
              </div>
              {order.customer_whatsapp && (
                <div>
                  <p className="text-muted-foreground">WhatsApp</p>
                  <p className="font-semibold">{order.customer_whatsapp}</p>
                </div>
              )}
            </div>
          </div>

          <div>
            <h3 className="font-playfair text-xl font-semibold mb-3">
              Informações de Entrega
            </h3>
            <div className="text-sm space-y-1">
              <p>
                <span className="text-muted-foreground">Endereço:</span>{" "}
                <span className="font-semibold">
                  {order.shipping_street}, {order.shipping_number}
                  {order.shipping_complement && ` - ${order.shipping_complement}`}
                </span>
              </p>
              <p>
                <span className="text-muted-foreground">Bairro:</span>{" "}
                <span className="font-semibold">{order.shipping_neighborhood}</span>
              </p>
              <p>
                <span className="text-muted-foreground">Cidade/Estado:</span>{" "}
                <span className="font-semibold">
                  {order.shipping_city} - {order.shipping_state}
                </span>
              </p>
              <p>
                <span className="text-muted-foreground">CEP:</span>{" "}
                <span className="font-semibold">{order.shipping_cep}</span>
              </p>
              <p>
                <span className="text-muted-foreground">Tipo de Entrega:</span>{" "}
                <span className="font-semibold">{order.delivery_type}</span>
              </p>
              {order.delivery_days && (
                <p>
                  <span className="text-muted-foreground">Prazo:</span>{" "}
                  <span className="font-semibold">{order.delivery_days} dias</span>
                </p>
              )}
            </div>
          </div>

          <div>
            <h3 className="font-playfair text-xl font-semibold mb-3">
              Itens do Pedido
            </h3>
            <div className="space-y-3">
              {order.order_items?.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-4 p-3 bg-muted/30 rounded-lg"
                >
                  <img
                    src={item.product_image}
                    alt={item.product_name}
                    className="w-16 h-16 object-cover rounded"
                  />
                  <div className="flex-1">
                    <p className="font-semibold">{item.product_name}</p>
                    <p className="text-sm text-muted-foreground">
                      Cor: {item.selected_color} | Tamanho: {item.selected_size}
                    </p>
                    <p className="text-sm">
                      Quantidade: {item.quantity} x R${" "}
                      {item.product_price.toFixed(2)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-primary">
                      R$ {item.subtotal.toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-muted/30 p-4 rounded-lg">
            <h3 className="font-playfair text-xl font-semibold mb-3">
              Resumo do Pagamento
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-semibold">
                  R$ {order.subtotal.toFixed(2)}
                </span>
              </div>
              {order.discount_amount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Desconto</span>
                  <span className="font-semibold">
                    -R$ {order.discount_amount.toFixed(2)}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Frete</span>
                <span className="font-semibold">
                  R$ {order.shipping_cost.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-border text-base">
                <span className="font-semibold">Total</span>
                <span className="font-bold text-primary text-lg">
                  R$ {order.total.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between pt-2">
                <span className="text-muted-foreground">Método de Pagamento</span>
                <span className="font-semibold capitalize">
                  {order.payment_method === "pix" ? "PIX" : order.payment_method.replace("-", " ")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status do Pagamento</span>
                <span className="font-semibold">
                  {getPaymentStatusLabel(order.payment_status)}
                </span>
              </div>
              {order.tracking_code && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Código de Rastreamento</span>
                  <span className="font-mono font-semibold">
                    {order.tracking_code}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OrderDetailsDialog;
