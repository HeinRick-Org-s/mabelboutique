import { useState } from "react";
import { Link } from "react-router-dom";
import { ShoppingBag } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { products } from "@/data/products";
import { useCart } from "@/contexts/CartContext";

const Products = () => {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const { addToCart } = useCart();

  const categories = ["all", ...Array.from(new Set(products.map((p) => p.category)))];

  const filteredProducts =
    selectedCategory === "all"
      ? products
      : products.filter((p) => p.category === selectedCategory);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="mb-8 sm:mb-12">
          <h1 className="font-playfair text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Nossa Coleção
          </h1>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <p className="font-inter text-muted-foreground">
              {filteredProducts.length} produto{filteredProducts.length !== 1 ? "s" : ""}
            </p>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Todas as Categorias" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Categorias</SelectItem>
                {categories.slice(1).map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
          {filteredProducts.map((product, index) => (
            <Link
              key={product.id}
              to={`/product/${product.id}`}
              className="group bg-card rounded-lg overflow-hidden shadow-soft hover:shadow-hover transition-all duration-500 animate-scale-in block"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="relative aspect-square overflow-hidden bg-muted">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/10 transition-colors duration-500" />
                
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <Button 
                    size="sm" 
                    className="bg-background text-foreground hover:bg-primary hover:text-primary-foreground shadow-medium"
                    onClick={(e) => {
                      e.preventDefault();
                      addToCart(product);
                    }}
                  >
                    <ShoppingBag className="h-4 w-4 mr-2" />
                    Adicionar
                  </Button>
                </div>
              </div>

              <div className="p-4 sm:p-6">
                <p className="text-xs font-inter text-muted-foreground mb-1">
                  {product.category}
                </p>
                <h3 className="font-playfair text-lg sm:text-xl font-semibold text-foreground mb-2">
                  {product.name}
                </h3>
                <p className="font-inter text-base sm:text-lg font-medium text-primary">
                  {product.price}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Products;
