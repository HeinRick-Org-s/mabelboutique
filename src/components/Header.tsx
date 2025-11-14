import { Menu, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Link } from "react-router-dom";
import { SearchDialog } from "./SearchDialog";
import { CartSheet } from "./CartSheet";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b border-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 sm:h-20 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <h1 className="font-playfair text-2xl sm:text-3xl font-bold text-primary tracking-wide">
              Mabel
            </h1>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link to="/products" className="font-inter text-sm font-medium text-foreground hover:text-primary transition-colors">
              Produtos
            </Link>
            <a href="/#featured" className="font-inter text-sm font-medium text-foreground hover:text-primary transition-colors">
              Destaques
            </a>
            <Link to="/" className="font-inter text-sm font-medium text-foreground hover:text-primary transition-colors">
              Sobre
            </Link>
          </nav>

          {/* Actions */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            <SearchDialog />
            <Button variant="ghost" size="icon" className="hover:bg-accent hidden sm:flex">
              <User className="h-5 w-5" />
            </Button>
            <CartSheet />
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
              <Link 
                to="/products" 
                className="font-inter text-sm font-medium text-foreground hover:text-primary transition-colors py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Produtos
              </Link>
              <a 
                href="/#featured" 
                className="font-inter text-sm font-medium text-foreground hover:text-primary transition-colors py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Destaques
              </a>
              <Link 
                to="/" 
                className="font-inter text-sm font-medium text-foreground hover:text-primary transition-colors py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Sobre
              </Link>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header;
