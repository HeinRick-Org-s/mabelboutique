import { ShoppingBag, Menu, Search, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b border-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 sm:h-20 items-center justify-between">
          {/* Logo */}
          <a href="/" className="flex items-center">
            <h1 className="font-playfair text-2xl sm:text-3xl font-bold text-primary tracking-wide">
              Mabel
            </h1>
          </a>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#" className="font-inter text-sm font-medium text-foreground hover:text-primary transition-colors">
              Nova Coleção
            </a>
            <a href="#" className="font-inter text-sm font-medium text-foreground hover:text-primary transition-colors">
              Roupas
            </a>
            <a href="#" className="font-inter text-sm font-medium text-foreground hover:text-primary transition-colors">
              Acessórios
            </a>
            <a href="#" className="font-inter text-sm font-medium text-foreground hover:text-primary transition-colors">
              Sobre
            </a>
          </nav>

          {/* Actions */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            <Button variant="ghost" size="icon" className="hover:bg-accent">
              <Search className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="hover:bg-accent hidden sm:flex">
              <User className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="hover:bg-accent">
              <ShoppingBag className="h-5 w-5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden hover:bg-accent"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <nav className="md:hidden py-4 border-t border-border animate-fade-in">
            <div className="flex flex-col space-y-3">
              <a href="#" className="font-inter text-sm font-medium text-foreground hover:text-primary transition-colors py-2">
                Nova Coleção
              </a>
              <a href="#" className="font-inter text-sm font-medium text-foreground hover:text-primary transition-colors py-2">
                Roupas
              </a>
              <a href="#" className="font-inter text-sm font-medium text-foreground hover:text-primary transition-colors py-2">
                Acessórios
              </a>
              <a href="#" className="font-inter text-sm font-medium text-foreground hover:text-primary transition-colors py-2">
                Sobre
              </a>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header;
