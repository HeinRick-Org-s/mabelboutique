import { useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { ShoppingBag, ChevronLeft, Loader2, Package, Minus, Plus, MessageCircle } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { useProduct } from "@/hooks/useProducts";
import { useCart } from "@/contexts/CartContext";
import { toast } from "@/hooks/use-toast";

const WHATSAPP_NUMBER = "55989702420262";

const ProductDetail = () => {
  const { id } = useParams();
  const { addToCart } = useCart();
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);
  const { data: product, isLoading } = useProduct(id || "");

  // Obter cores e tamanhos únicos das variantes
  const availableColors = useMemo(() => {
    if (!product) return [];
    return Array.from(new Set(product.variants.map((v) => v.color)));
  }, [product]);

  const availableSizes = useMemo(() => {
    if (!product || !selectedColor) return [];
    return product.variants.filter((v) => v.color === selectedColor).map((v) => v.size);
  }, [product, selectedColor]);

  // Obter estoque da variante selecionada
  const selectedVariantStock = useMemo(() => {
    if (!product || !selectedColor || !selectedSize) return 0;
    const variant = product.variants.find((v) => v.color === selectedColor && v.size === selectedSize);
    return variant?.stock || 0;
  }, [product, selectedColor, selectedSize]);

  // Calcular estoque total
  const totalStock = useMemo(() => {
    if (!product) return 0;
    return product.variants.reduce((sum, v) => sum + v.stock, 0);
  }, [product]);

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
          <h1 className="font-playfair text-3xl font-bold text-foreground mb-4">Produto não encontrado</h1>
          <Link to="/products">
            <Button>Voltar para Produtos</Button>
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const handleAddToCart = async () => {
    if (!selectedColor) {
      toast({
        title: "Selecione uma cor",
        description: "Por favor, escolha uma cor antes de adicionar ao carrinho.",
        variant: "destructive",
      });
      return;
    }
    if (!selectedSize) {
      toast({
        title: "Selecione um tamanho",
        description: "Por favor, escolha um tamanho antes de adicionar ao carrinho.",
        variant: "destructive",
      });
      return;
    }
    const success = await addToCart(product, selectedColor, selectedSize, quantity);
    if (success) {
      setQuantity(1);
    }
  };

  const handleWhatsAppContact = () => {
    const productUrl = window.location.href;
    const message = `Olá! Gostaria de saber mais sobre este produto:\n\n*${product.name}*\n${product.price}\n\nLink: ${productUrl}`;
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  };

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity < 1) return;
    if (newQuantity > selectedVariantStock) {
      toast({
        title: "Quantidade indisponível",
        description: `Apenas ${selectedVariantStock} unidade(s) disponível(is) para esta variante.`,
        variant: "destructive",
      });
      return;
    }
    setQuantity(newQuantity);
  };

  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
    setSelectedSize(""); // Reset tamanho ao trocar cor
    setQuantity(1); // Reset quantidade
  };

  // Organizar media: vídeo primeiro (se existir), depois imagens
  const productMedia = [
    ...(product.video ? [{ type: "video" as const, url: product.video }] : []),
    ...(product.images || [product.image]).map((img) => ({ type: "image" as const, url: img })),
  ];

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
            {/* Media Carousel (vídeo + imagens) */}
            <div className="relative">
              {totalStock === 0 && (
                <div className="absolute top-4 left-4 z-10 bg-destructive text-destructive-foreground px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Sem Estoque
                </div>
              )}
              <Carousel className="w-full">
                <CarouselContent>
                  {productMedia.map((media, index) => (
                    <CarouselItem key={index}>
                      <div className="aspect-square overflow-hidden rounded-2xl bg-muted shadow-soft">
                        {media.type === "video" ? (
                          <video src={media.url} controls className="w-full h-full object-cover">
                            Seu navegador não suporta vídeos.
                          </video>
                        ) : (
                          <img
                            src={media.url}
                            alt={`${product.name} - Imagem ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="left-4" />
                <CarouselNext className="right-4" />
              </Carousel>
            </div>
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
              <div className="inline-block bg-gradient-to-r from-primary/10 to-primary/5 px-6 py-4 rounded-xl border-2 border-primary/20">
                <p className="font-playfair text-3xl sm:text-4xl font-bold text-primary">{product.price}</p>
              </div>
            </div>

            <div className="mb-8">
              <h2 className="font-playfair text-2xl font-semibold text-foreground mb-4">Descrição</h2>
              <p className="font-inter text-base text-muted-foreground leading-relaxed">{product.description}</p>
            </div>

            {/* Colors */}
            {availableColors.length > 0 && (
              <div className="mb-8">
                <h3 className="font-playfair text-xl font-semibold text-foreground mb-4">Cores Disponíveis</h3>
                <div className="flex flex-wrap gap-3">
                  {availableColors.map((color) => (
                    <button
                      key={color}
                      onClick={() => handleColorSelect(color)}
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
            {selectedColor && availableSizes.length > 0 && (
              <div className="mb-8">
                <h3 className="font-playfair text-xl font-semibold text-foreground mb-4">Tamanhos</h3>
                <div className="flex flex-wrap gap-3">
                  {availableSizes.map((size) => (
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

            {/* Stock Info para variante selecionada */}
            {selectedColor && selectedSize && (
              <div className="mb-6 p-4 bg-secondary/50 rounded-lg">
                <div className="flex items-center gap-2 text-sm">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    Estoque para {selectedColor} - {selectedSize}:{" "}
                    <span className="font-semibold text-foreground">{selectedVariantStock} unidade(s)</span>
                  </span>
                </div>
              </div>
            )}

            {/* Quantity Selector */}
            {selectedColor && selectedSize && selectedVariantStock > 0 && (
              <div className="mb-6">
                <h3 className="font-playfair text-xl font-semibold text-foreground mb-4">Quantidade</h3>
                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-12 w-12"
                    onClick={() => handleQuantityChange(quantity - 1)}
                    disabled={quantity <= 1}
                  >
                    <Minus className="h-5 w-5" />
                  </Button>
                  <span className="font-inter text-2xl font-semibold w-16 text-center">{quantity}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-12 w-12"
                    onClick={() => handleQuantityChange(quantity + 1)}
                    disabled={quantity >= selectedVariantStock}
                  >
                    <Plus className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            )}

            {/* Add to Cart Button */}
            <Button
              size="lg"
              className="w-full mb-4 h-14 text-lg font-semibold shadow-medium hover:shadow-hover transition-all"
              onClick={handleAddToCart}
              disabled={totalStock === 0 || !selectedColor || !selectedSize}
            >
              <ShoppingBag className="h-6 w-6 mr-3" />
              {totalStock === 0 ? "Produto Indisponível" : "Adicionar ao Carrinho"}
            </Button>

            {/* WhatsApp Contact Button */}
            <Button
              size="lg"
              variant="outline"
              className="w-full mb-6 h-14 text-lg font-semibold border-2 border-[#25D366] text-[#25D366] hover:bg-[#25D366] hover:text-white transition-all"
              onClick={handleWhatsAppContact}
            >
              <MessageCircle className="h-6 w-6 mr-3" />
              Tirar Dúvidas no WhatsApp
            </Button>

            {/* Additional Info */}
            <div className="mt-8 pt-8 border-t border-border space-y-6">
              <div className="bg-secondary/50 p-6 rounded-xl">
                <h4 className="font-playfair text-lg font-semibold text-foreground mb-2 flex items-center gap-2">
                  <span className="text-primary">✓</span> Entrega
                </h4>
                <p className="font-inter text-sm text-muted-foreground">Frete grátis para compras acima de R$ 500,00</p>
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
