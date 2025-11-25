import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Plus, Search, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { products } from "@/data/products";
import { toast } from "@/hooks/use-toast";

const ProductsManagement = () => {
  const [searchQuery, setSearchQuery] = useState("");

  // Mock products list - preparado para Firebase Firestore
  const [productsList] = useState(products);

  const filteredProducts = productsList.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = (id: number) => {
    // TODO: Integrar com Firebase Firestore
    // deleteDoc(doc(db, "products", id))
    toast({
      title: "Produto removido",
      description: "O produto foi removido com sucesso.",
    });
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
                Gerenciar Produtos
              </h1>
            </div>
            <Button>
              <Plus className="h-5 w-5 mr-2" />
              Novo Produto
            </Button>
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
              placeholder="Buscar produtos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12"
            />
          </div>
        </div>

        {/* Products List */}
        <div className="bg-card rounded-xl shadow-soft border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="text-left py-4 px-6 font-inter font-semibold text-foreground">
                    Imagem
                  </th>
                  <th className="text-left py-4 px-6 font-inter font-semibold text-foreground">
                    Nome
                  </th>
                  <th className="text-left py-4 px-6 font-inter font-semibold text-foreground">
                    Categoria
                  </th>
                  <th className="text-left py-4 px-6 font-inter font-semibold text-foreground">
                    Preço
                  </th>
                  <th className="text-right py-4 px-6 font-inter font-semibold text-foreground">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="border-b border-border hover:bg-muted/30">
                    <td className="py-4 px-6">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                    </td>
                    <td className="py-4 px-6 font-inter text-foreground">
                      {product.name}
                    </td>
                    <td className="py-4 px-6 font-inter text-muted-foreground">
                      {product.category}
                    </td>
                    <td className="py-4 px-6 font-inter font-semibold text-primary">
                      {product.price}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(product.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
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
            <strong>Nota:</strong> Estrutura preparada para integração com Firebase Firestore e Storage.
            Upload de imagens e vídeos será feito via Firebase Storage.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProductsManagement;
