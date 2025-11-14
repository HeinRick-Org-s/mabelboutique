import { ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { products } from "@/data/products";
import { useCart } from "@/contexts/CartContext";

const displayProducts = products.slice(0, 6);

const ProductGrid = () => {
  const { addToCart } = useCart();

  return (
    <section className="py-16 sm:py-20 lg:py-24 bg-gradient-subtle">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12 sm:mb-16 animate-fade-in">
          <h2 className="font-playfair text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Nova Coleção
          </h2>
          <p className="font-inter text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            Peças cuidadosamente selecionadas para mulheres que buscam exclusividade e sofisticação
          </p>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {displayProducts.map((product, index) => (
            <Link
              key={product.id}
              to={`/product/${product.id}`}
              className="group bg-card rounded-lg overflow-hidden shadow-soft hover:shadow-hover transition-all duration-500 animate-scale-in block"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Product Image */}
              <div className="relative aspect-square overflow-hidden bg-muted">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/10 transition-colors duration-500" />
                
                {/* Quick Add Button */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <Button 
                    size="sm" 
                    className="bg-background text-foreground hover:bg-primary hover:text-primary-foreground shadow-medium font-inter"
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

              {/* Product Info */}
              <div className="p-4 sm:p-6">
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

        {/* Ver Todos Button */}
        <div className="text-center mt-12">
          <Link to="/products">
            <Button size="lg" variant="outline" className="border-2 border-primary text-primary hover:bg-accent">
              Ver Todos os Produtos
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default ProductGrid;
