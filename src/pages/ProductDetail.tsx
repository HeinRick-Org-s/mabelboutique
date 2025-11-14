import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ShoppingBag, ChevronLeft } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { products } from "@/data/products";
import { useCart } from "@/contexts/CartContext";
import { toast } from "@/hooks/use-toast";

const ProductDetail = () => {
  const { id } = useParams();
  const { addToCart } = useCart();
  const [selectedSize, setSelectedSize] = useState<string>("");

  const product = products.find((p) => p.id === Number(id));

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-20 text-center">
          <h1 className="font-playfair text-3xl font-bold text-foreground mb-4">
            Produto não encontrado
          </h1>
          <Link to="/products">
            <Button>Voltar para Produtos</Button>
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const handleAddToCart = () => {
    if (product.sizes && product.sizes.length > 0 && !selectedSize) {
      toast({
        title: "Selecione um tamanho",
        description: "Por favor, escolha um tamanho antes de adicionar ao carrinho.",
        variant: "destructive",
      });
      return;
    }
    addToCart(product);
  };

  const productImages = product.images || [product.image];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <Link
          to="/products"
          className="inline-flex items-center text-muted-foreground hover:text-primary transition-colors mb-6 sm:mb-8"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Voltar para produtos
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Image Carousel */}
          <div className="relative">
            <Carousel className="w-full">
              <CarouselContent>
                {productImages.map((img, index) => (
                  <CarouselItem key={index}>
                    <div className="aspect-square overflow-hidden rounded-lg bg-muted">
                      <img
                        src={img}
                        alt={`${product.name} - Imagem ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              {productImages.length > 1 && (
                <>
                  <CarouselPrevious className="left-4" />
                  <CarouselNext className="right-4" />
                </>
              )}
            </Carousel>
          </div>

          {/* Product Info */}
          <div className="flex flex-col">
            <div className="mb-6">
              <p className="text-sm font-inter text-muted-foreground mb-2">
                {product.category}
              </p>
              <h1 className="font-playfair text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
                {product.name}
              </h1>
              <p className="font-inter text-2xl sm:text-3xl font-medium text-primary">
                {product.price}
              </p>
            </div>

            <div className="mb-6 sm:mb-8">
              <h2 className="font-playfair text-xl font-semibold text-foreground mb-3">
                Descrição
              </h2>
              <p className="font-inter text-base text-muted-foreground leading-relaxed">
                {product.description}
              </p>
            </div>

            {/* Sizes */}
            {product.sizes && product.sizes.length > 0 && (
              <div className="mb-6 sm:mb-8">
                <h3 className="font-playfair text-lg font-semibold text-foreground mb-3">
                  Tamanhos
                </h3>
                <div className="flex flex-wrap gap-3">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`px-6 py-3 border-2 rounded-md font-inter font-medium transition-all ${
                        selectedSize === size
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border hover:border-primary"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Add to Cart Button */}
            <Button
              size="lg"
              className="w-full sm:w-auto mb-4"
              onClick={handleAddToCart}
            >
              <ShoppingBag className="h-5 w-5 mr-2" />
              Adicionar ao Carrinho
            </Button>

            {/* Additional Info */}
            <div className="mt-8 pt-8 border-t border-border space-y-4">
              <div>
                <h4 className="font-playfair font-semibold text-foreground mb-2">
                  Entrega
                </h4>
                <p className="font-inter text-sm text-muted-foreground">
                  Frete grátis para compras acima de R$ 500,00
                </p>
              </div>
              <div>
                <h4 className="font-playfair font-semibold text-foreground mb-2">
                  Trocas e Devoluções
                </h4>
                <p className="font-inter text-sm text-muted-foreground">
                  Aceitamos trocas em até 30 dias após a compra
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ProductDetail;
