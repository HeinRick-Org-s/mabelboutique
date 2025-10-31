import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import product1 from "@/assets/product-1.jpg";
import product2 from "@/assets/product-2.jpg";
import product3 from "@/assets/product-3.jpg";
import product4 from "@/assets/product-4.jpg";
import product5 from "@/assets/product-5.jpg";
import product6 from "@/assets/product-6.jpg";

const products = [
  {
    id: 1,
    name: "Blazer Verde Musgo",
    price: "R$ 1.299,00",
    image: product1,
  },
  {
    id: 2,
    name: "Blusa Seda Branca",
    price: "R$ 899,00",
    image: product2,
  },
  {
    id: 3,
    name: "Calça Pantalona Verde",
    price: "R$ 1.099,00",
    image: product3,
  },
  {
    id: 4,
    name: "Vestido Elegante Creme",
    price: "R$ 1.499,00",
    image: product4,
  },
  {
    id: 5,
    name: "Suéter Verde Musgo",
    price: "R$ 799,00",
    image: product5,
  },
  {
    id: 6,
    name: "Casaco Alfaiataria Branco",
    price: "R$ 1.899,00",
    image: product6,
  },
];

const ProductGrid = () => {
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
          {products.map((product, index) => (
            <div
              key={product.id}
              className="group bg-card rounded-lg overflow-hidden shadow-soft hover:shadow-hover transition-all duration-500 animate-scale-in"
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
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProductGrid;
