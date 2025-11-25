import { Link, useNavigate } from "react-router-dom";
import { LogOut, Package, ShoppingCart, DollarSign, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAdmin } from "@/contexts/AdminContext";
import { useProducts } from "@/hooks/useProducts";

const AdminDashboard = () => {
  const { logout } = useAdmin();
  const navigate = useNavigate();
  const { data: products = [] } = useProducts();

  const handleLogout = async () => {
    await logout();
    navigate("/admin/login");
  };

  // Mock data for orders and sales - will be integrated later
  const stats = {
    totalProducts: products.length,
    pendingOrders: 12,
    monthlySales: "R$ 45.890,00",
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <header className="bg-card shadow-soft border-b border-border">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 className="font-playfair text-2xl font-bold text-foreground">
              Mabel Admin
            </h1>
            <Button variant="ghost" onClick={handleLogout}>
              <LogOut className="h-5 w-5 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-card rounded-xl p-6 shadow-soft border border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-inter text-muted-foreground mb-1">
                  Total de Produtos
                </p>
                <p className="text-3xl font-playfair font-bold text-foreground">
                  {stats.totalProducts}
                </p>
              </div>
              <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Package className="h-6 w-6 text-primary" />
              </div>
            </div>
          </div>

          <div className="bg-card rounded-xl p-6 shadow-soft border border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-inter text-muted-foreground mb-1">
                  Pedidos Pendentes
                </p>
                <p className="text-3xl font-playfair font-bold text-foreground">
                  {stats.pendingOrders}
                </p>
              </div>
              <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <ShoppingCart className="h-6 w-6 text-primary" />
              </div>
            </div>
          </div>

          <div className="bg-card rounded-xl p-6 shadow-soft border border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-inter text-muted-foreground mb-1">
                  Vendas do Mês
                </p>
                <p className="text-3xl font-playfair font-bold text-foreground">
                  {stats.monthlySales}
                </p>
              </div>
              <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-primary" />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-card rounded-xl p-6 shadow-soft border border-border">
          <h2 className="font-playfair text-2xl font-bold text-foreground mb-6">
            Ações Rápidas
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link to="/admin/products">
              <Button className="w-full h-20 text-lg" variant="outline">
                <Package className="h-6 w-6 mr-3" />
                Gerenciar Produtos
              </Button>
            </Link>
            <Link to="/admin/orders">
              <Button className="w-full h-20 text-lg" variant="outline">
                <ShoppingCart className="h-6 w-6 mr-3" />
                Ver Pedidos
              </Button>
            </Link>
            <Link to="/admin/coupons">
              <Button className="w-full h-20 text-lg" variant="outline">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 mr-3"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 8h-6a4 4 0 1 0-6 0H3" />
                  <path d="M5 12a4 4 0 1 0 4 4" />
                  <path d="M15 12a4 4 0 1 1 4 4" />
                </svg>
                Cupons
              </Button>
            </Link>
            <Link to="/admin/settings">
              <Button className="w-full h-20 text-lg" variant="outline">
                <Settings className="h-6 w-6 mr-3" />
                Configurações
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
