import { useEffect } from "react";
import Autoplay from "embla-carousel-autoplay";
import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { featuredProducts } from "@/data/products";
import { useCart } from "@/contexts/CartContext";

export const FeaturedCarousel = () => {
  const { addToCart } = useCart();

  return (
    <section className="py-16 sm:py-20 lg:py-24 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="font-playfair text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Peças em Destaque
          </h2>
          <p className="font-inter text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            As peças mais desejadas da nossa coleção exclusiva
          </p>
        </div>

        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          plugins={[
            Autoplay({
              delay: 4000,
            }),
          ]}
          className="w-full"
        >
          <CarouselContent className="-ml-4">
            {featuredProducts.map((product) => (
              <CarouselItem key={product.id} className="pl-4 md:basis-1/2 lg:basis-1/3">
                <div className="group bg-card rounded-lg overflow-hidden shadow-soft hover:shadow-hover transition-all duration-500">
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
                        onClick={() => addToCart(product)}
                      >
                        <ShoppingBag className="h-4 w-4 mr-2" />
                        Adicionar
                      </Button>
                    </div>
                  </div>

                  <div className="p-4 sm:p-6">
                    <h3 className="font-playfair text-lg sm:text-xl font-semibold text-foreground mb-2">
                      {product.name}
                    </h3>
                    <p className="font-inter text-base sm:text-lg font-medium text-primary">
                      {product.price}
                    </p>
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="left-0" />
          <CarouselNext className="right-0" />
        </Carousel>
      </div>
    </section>
  );
};
