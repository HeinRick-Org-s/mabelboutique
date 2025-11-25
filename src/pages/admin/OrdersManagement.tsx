import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Search, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import OrderDetailsDialog from "@/components/admin/OrderDetailsDialog";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

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

const OrdersManagement = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: orders = [], isLoading, refetch } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (ordersError) throw ordersError;

      // Buscar itens de cada pedido
      const ordersWithItems = await Promise.all(
        ordersData.map(async (order) => {
          const { data: items, error: itemsError } = await supabase
            .from("order_items")
            .select("*")
            .eq("order_id", order.id);

          if (itemsError) throw itemsError;

          return {
            ...order,
            order_items: items,
          };
        })
      );

      return ordersWithItems as Order[];
    },
  });

  const filteredOrders = orders.filter((order) =>
    order.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.customer_email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setDialogOpen(true);
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
      case "processing":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
      case "shipped":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300";
      case "delivered":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: "Pendente",
      processing: "Processando",
      shipped: "Enviado",
      delivered: "Entregue",
      cancelled: "Cancelado",
    };
    return labels[status] || status;
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <header className="bg-card shadow-soft border-b border-border">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link to="/admin/dashboard">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <h1 className="font-playfair text-2xl font-bold text-foreground">
                Gerenciar Pedidos
              </h1>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar por pedido, cliente ou email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12"
            />
          </div>
        </div>

        {/* Orders List */}
        <div className="bg-card rounded-xl shadow-soft border border-border overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">
              Carregando pedidos...
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              {searchQuery
                ? "Nenhum pedido encontrado com esse termo de busca."
                : "Nenhum pedido realizado ainda."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    <th className="text-left py-4 px-6 font-inter font-semibold text-foreground">
                      Pedido
                    </th>
                    <th className="text-left py-4 px-6 font-inter font-semibold text-foreground">
                      Cliente
                    </th>
                    <th className="text-left py-4 px-6 font-inter font-semibold text-foreground">
                      Contato
                    </th>
                    <th className="text-left py-4 px-6 font-inter font-semibold text-foreground">
                      Total
                    </th>
                    <th className="text-left py-4 px-6 font-inter font-semibold text-foreground">
                      Status
                    </th>
                    <th className="text-right py-4 px-6 font-inter font-semibold text-foreground">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => (
                    <tr
                      key={order.id}
                      className="border-b border-border hover:bg-muted/30"
                    >
                      <td className="py-4 px-6 font-inter font-semibold text-foreground">
                        {order.order_number}
                      </td>
                      <td className="py-4 px-6">
                        <div>
                          <p className="font-inter text-foreground">
                            {order.customer_name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(order.created_at), "dd 'de' MMMM 'de' yyyy", {
                              locale: ptBR,
                            })}
                          </p>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div>
                          <p className="text-sm font-inter text-muted-foreground">
                            {order.customer_email}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {order.customer_phone}
                          </p>
                        </div>
                      </td>
                      <td className="py-4 px-6 font-inter font-semibold text-primary">
                        R$ {order.total.toFixed(2)}
                      </td>
                      <td className="py-4 px-6">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-sm font-inter ${getStatusBadgeClass(
                            order.status
                          )}`}
                        >
                          {getStatusLabel(order.status)}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center justify-end">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleViewOrder(order)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <OrderDetailsDialog
        order={selectedOrder}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onStatusUpdated={refetch}
      />
    </div>
  );
};

export default OrdersManagement;
