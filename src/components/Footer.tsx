import { Instagram, Mail, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  const handleWhatsAppClick = () => {
    window.open("https://wa.me/5598702420262", "_blank");
  };

  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-12">
          {/* Brand */}
          <div className="space-y-4">
            <h3 className="font-playfair text-2xl sm:text-3xl font-bold">Mabel Boutique</h3>
            <p className="font-inter text-sm text-primary-foreground/80">
              Moda feminina de luxo para mulheres sofisticadas e modernas.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-inter font-semibold mb-4">Navegação</h4>
            <ul className="space-y-2 font-inter text-sm">
              <li>
                <Link to="/products" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                  Produtos
                </Link>
              </li>
              <li>
                <a href="/#featured" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                  Destaques
                </a>
              </li>
              <li>
                <Link to="/order-tracking" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                  Rastrear Pedido
                </Link>
              </li>
              <li>
                <Link to="/" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                  Sobre Nós
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h4 className="font-inter font-semibold mb-4">Atendimento</h4>
            <ul className="space-y-2 font-inter text-sm">
              <li>
                <button 
                  onClick={handleWhatsAppClick}
                  className="text-primary-foreground/80 hover:text-primary-foreground transition-colors"
                >
                  WhatsApp: (98) 7024-2062
                </button>
              </li>
              <li>
                <a 
                  href="mailto:mabelboutique2025@gmail.com" 
                  className="text-primary-foreground/80 hover:text-primary-foreground transition-colors"
                >
                  mabelboutique2025@gmail.com
                </a>
              </li>
              <li>
                <a href="#" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                  Envios e Devoluções
                </a>
              </li>
              <li>
                <a href="#" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                  Política de Privacidade
                </a>
              </li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h4 className="font-inter font-semibold mb-4">Redes Sociais</h4>
            <div className="flex space-x-4">
              <a
                href="https://instagram.com/_mabelboutique_"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-foreground/80 hover:text-primary-foreground transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <button
                onClick={handleWhatsAppClick}
                className="text-primary-foreground/80 hover:text-primary-foreground transition-colors"
                aria-label="WhatsApp"
              >
                <MessageCircle className="h-5 w-5" />
              </button>
              <a
                href="mailto:mabelboutique2025@gmail.com"
                className="text-primary-foreground/80 hover:text-primary-foreground transition-colors"
                aria-label="Email"
              >
                <Mail className="h-5 w-5" />
              </a>
            </div>
            <p className="mt-4 text-sm text-primary-foreground/80">
              @_mabelboutique_
            </p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-primary-foreground/20">
          <p className="font-inter text-sm text-center text-primary-foreground/60">
            © 2025 Mabel Boutique. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
