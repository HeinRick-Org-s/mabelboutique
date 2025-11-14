import Header from "@/components/Header";
import Hero from "@/components/Hero";
import ProductGrid from "@/components/ProductGrid";
import { FeaturedCarousel } from "@/components/FeaturedCarousel";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background font-inter">
      <Header />
      <main>
        <Hero />
        <ProductGrid />
        <div id="featured">
          <FeaturedCarousel />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Index;
