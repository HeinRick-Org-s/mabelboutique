import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Search, Loader2 } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { useProducts } from "@/hooks/useProducts";

// Products page - no cart functionality needed here
const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const { data: products = [], isLoading } = useProducts();

  useEffect(() => {
    const query = searchParams.get("q");
    if (query) {
      setSearchQuery(query);
    }
  }, [searchParams]);

  const categories = ["all", ...Array.from(new Set(products.map((p) => p.category)))];

  const filteredProducts = products.filter((product) => {
    const matchesCategory = selectedCategory === "all" || product.category === selectedCategory;
    const matchesSearch = searchQuery === "" || 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    if (value) {
      setSearchParams({ q: value });
    } else {
      setSearchParams({});
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <h1 className="font-playfair text-4xl sm:text-5xl font-bold text-foreground mb-8 text-center">
          Nossa Coleção
        </h1>

        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar produtos..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 h-12 text-base"
            />
          </div>
        </div>

        {/* Filter and Results Count */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
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

        {/* Loading State */}
        {isLoading ? (
          <div className="flex justify-center items-center min-h-[400px]">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="col-span-full text-center py-16">
            <p className="font-playfair text-2xl text-muted-foreground mb-4">
              Nenhum produto encontrado
            </p>
            <p className="font-inter text-muted-foreground">
              {searchQuery || selectedCategory !== "all" 
                ? "Tente ajustar seus filtros de busca"
                : "Não há produtos disponíveis no momento"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {filteredProducts.map((product) => (
            <div key={product.id} className="group">
              <Link to={`/product/${product.id}`}>
                <div className="relative overflow-hidden rounded-lg bg-muted mb-4 aspect-square">
                  <Carousel className="w-full h-full">
                    <CarouselContent>
                      {(product.images || [product.image]).map((img, index) => (
                        <CarouselItem key={index}>
                          <img
                            src={img}
                            alt={`${product.name} - ${index + 1}`}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                    {(product.images?.length || 0) > 1 && (
                      <>
                        <CarouselPrevious className="left-2" onClick={(e) => e.preventDefault()} />
                        <CarouselNext className="right-2" onClick={(e) => e.preventDefault()} />
                      </>
                    )}
                  </Carousel>
                </div>
                <h3 className="font-playfair text-xl font-semibold text-foreground mb-2">
                  {product.name}
                </h3>
                <p className="font-inter text-xl font-bold text-primary">
                  {product.price}
                </p>
              </Link>
            </div>
          ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Products;
