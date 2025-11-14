import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import heroImage from "@/assets/hero-image.jpg";

const Hero = () => {
  return (
    <section className="relative w-full h-[70vh] sm:h-[80vh] lg:h-[90vh] overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img 
          src={heroImage} 
          alt="Mabel Luxury Fashion Collection" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background/60 via-background/40 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative h-full container mx-auto px-4 sm:px-6 lg:px-8 flex items-center">
        <div className="max-w-xl space-y-6 animate-fade-in-up">
          <h2 className="font-playfair text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
            Elegância
            <br />
            Atemporal
          </h2>
          <p className="font-inter text-base sm:text-lg text-muted-foreground max-w-md">
            Descubra a nova coleção de roupas exclusivas para mulheres que valorizam sofisticação e qualidade excepcional.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Link to="/products">
              <Button 
                size="lg" 
                className="bg-primary hover:bg-primary-dark text-primary-foreground shadow-medium hover:shadow-hover transition-all font-inter font-medium w-full sm:w-auto"
              >
                Explorar Coleção
              </Button>
            </Link>
            <a href="#featured">
              <Button 
                variant="outline" 
                size="lg"
                className="border-2 border-primary text-primary hover:bg-accent font-inter font-medium w-full sm:w-auto"
              >
                Ver Novidades
              </Button>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
