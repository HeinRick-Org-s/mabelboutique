import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Search, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Mock orders - preparado para Firebase
const mockOrders = [
  {
    id: "ORD-001",
    customerName: "Maria Silva",
    email: "maria@email.com",
    phone: "(98) 98765-4321",
    total: "R$ 639,80",
    status: "Pendente",
    date: "2024-01-15",
  },
  {
    id: "ORD-002",
    customerName: "Ana Santos",
    email: "ana@email.com",
    phone: "(98) 99876-5432",
    total: "R$ 429,90",
    status: "Enviado",
    date: "2024-01-14",
  },
];

const OrdersManagement = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [orders] = useState(mockOrders);

  const filteredOrders = orders.filter((order) =>
    order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.customerName.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
              placeholder="Buscar pedidos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12"
            />
          </div>
        </div>

        {/* Orders List */}
        <div className="bg-card rounded-xl shadow-soft border border-border overflow-hidden">
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
                  <tr key={order.id} className="border-b border-border hover:bg-muted/30">
                    <td className="py-4 px-6 font-inter font-semibold text-foreground">
                      {order.id}
                    </td>
                    <td className="py-4 px-6">
                      <div>
                        <p className="font-inter text-foreground">{order.customerName}</p>
                        <p className="text-sm text-muted-foreground">{order.date}</p>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div>
                        <p className="text-sm font-inter text-muted-foreground">{order.email}</p>
                        <p className="text-sm text-muted-foreground">{order.phone}</p>
                      </div>
                    </td>
                    <td className="py-4 px-6 font-inter font-semibold text-primary">
                      {order.total}
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-sm font-inter ${
                          order.status === "Pendente"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-end">
                        <Button variant="ghost" size="icon">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-6 p-4 bg-muted/50 rounded-lg border border-border">
          <p className="text-sm font-inter text-muted-foreground">
            <strong>Nota:</strong> Estrutura preparada para integração com Firebase Firestore.
            Notificações via email (Resend) e WhatsApp serão implementadas via Cloud Functions.
          </p>
        </div>
      </div>
    </div>
  );
};

export default OrdersManagement;
