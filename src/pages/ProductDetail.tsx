import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ShoppingBag, ChevronLeft, Loader2, Package } from "lucide-react";
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
import { useProduct } from "@/hooks/useProducts";
import { useCart } from "@/contexts/CartContext";
import { toast } from "@/hooks/use-toast";

const ProductDetail = () => {
  const { id } = useParams();
  const { addToCart } = useCart();
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("");
  const { data: product, isLoading } = useProduct(id || "");

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-20 flex justify-center items-center min-h-[400px]">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

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

  const handleAddToCart = async () => {
    if (product.sizes && product.sizes.length > 0 && !selectedSize) {
      toast({
        title: "Selecione um tamanho",
        description: "Por favor, escolha um tamanho antes de adicionar ao carrinho.",
        variant: "destructive",
      });
      return;
    }
    if (product.colors && product.colors.length > 0 && !selectedColor) {
      toast({
        title: "Selecione uma cor",
        description: "Por favor, escolha uma cor antes de adicionar ao carrinho.",
        variant: "destructive",
      });
      return;
    }
    await addToCart(product);
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
          {/* Media Gallery */}
          <div className="space-y-6">
            {/* Image Carousel */}
            <div className="relative">
              {product.stock === 0 && (
                <div className="absolute top-4 left-4 z-10 bg-destructive text-destructive-foreground px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Sem Estoque
                </div>
              )}
              <Carousel className="w-full">
                <CarouselContent>
                  {productImages.map((img, index) => (
                    <CarouselItem key={index}>
                      <div className="aspect-square overflow-hidden rounded-2xl bg-muted shadow-soft">
                        <img
                          src={img}
                          alt={`${product.name} - Imagem ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
              </Carousel>
            </div>

            {/* Video Section */}
            {product.video && (
              <div className="relative aspect-video overflow-hidden rounded-2xl bg-muted shadow-soft">
                <video
                  src={product.video}
                  controls
                  className="w-full h-full object-cover"
                >
                  Seu navegador não suporta vídeos.
                </video>
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="flex flex-col">
            <div className="mb-8">
              <p className="text-sm font-inter uppercase tracking-wider text-muted-foreground mb-3">
                {product.category}
              </p>
              <h1 className="font-playfair text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6">
                {product.name}
              </h1>
              <div className="flex items-center gap-4 flex-wrap">
                <div className="inline-block bg-gradient-to-r from-primary/10 to-primary/5 px-6 py-4 rounded-xl border-2 border-primary/20">
                  <p className="font-playfair text-3xl sm:text-4xl font-bold text-primary">
                    {product.price}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Package className="h-4 w-4" />
                  <span>
                    {product.stock > 0 
                      ? `${product.stock} unidade(s) disponível(is)` 
                      : "Produto indisponível"}
                  </span>
                </div>
              </div>
            </div>

            <div className="mb-8">
              <h2 className="font-playfair text-2xl font-semibold text-foreground mb-4">
                Descrição
              </h2>
              <p className="font-inter text-base text-muted-foreground leading-relaxed">
                {product.description}
              </p>
            </div>

            {/* Colors */}
            {product.colors && product.colors.length > 0 && (
              <div className="mb-8">
                <h3 className="font-playfair text-xl font-semibold text-foreground mb-4">
                  Cores Disponíveis
                </h3>
                <div className="flex flex-wrap gap-3">
                  {product.colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`px-6 py-3 border-2 rounded-lg font-inter font-medium transition-all capitalize ${
                        selectedColor === color
                          ? "border-primary bg-primary text-primary-foreground shadow-medium"
                          : "border-border hover:border-primary hover:shadow-soft"
                      }`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Sizes */}
            {product.sizes && product.sizes.length > 0 && (
              <div className="mb-8">
                <h3 className="font-playfair text-xl font-semibold text-foreground mb-4">
                  Tamanhos
                </h3>
                <div className="flex flex-wrap gap-3">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`px-6 py-3 border-2 rounded-lg font-inter font-medium transition-all ${
                        selectedSize === size
                          ? "border-primary bg-primary text-primary-foreground shadow-medium"
                          : "border-border hover:border-primary hover:shadow-soft"
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
              className="w-full mb-6 h-14 text-lg font-semibold shadow-medium hover:shadow-hover transition-all"
              onClick={handleAddToCart}
              disabled={product.stock === 0}
            >
              <ShoppingBag className="h-6 w-6 mr-3" />
              {product.stock === 0 ? "Produto Indisponível" : "Adicionar ao Carrinho"}
            </Button>

            {/* Additional Info */}
            <div className="mt-8 pt-8 border-t border-border space-y-6">
              <div className="bg-secondary/50 p-6 rounded-xl">
                <h4 className="font-playfair text-lg font-semibold text-foreground mb-2 flex items-center gap-2">
                  <span className="text-primary">✓</span> Entrega
                </h4>
                <p className="font-inter text-sm text-muted-foreground">
                  Frete grátis para compras acima de R$ 500,00
                </p>
              </div>
              <div className="bg-secondary/50 p-6 rounded-xl">
                <h4 className="font-playfair text-lg font-semibold text-foreground mb-2 flex items-center gap-2">
                  <span className="text-primary">↻</span> Trocas e Devoluções
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
