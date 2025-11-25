import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ChevronLeft, CreditCard, Truck } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useCart } from "@/contexts/CartContext";
import { toast } from "@/hooks/use-toast";

// Mock function para calcular frete baseado em CEP
const calculateShipping = (cep: string, deliveryType: string): number => {
  const cepNumber = parseInt(cep.replace(/\D/g, ""));
  const saoLuisCep = 65000000;
  const distance = Math.abs(cepNumber - saoLuisCep) / 100000;
  const basePrice = deliveryType === "express" ? 25 : 15;
  const distanceMultiplier = distance * (deliveryType === "express" ? 3 : 2);
  return Math.max(basePrice, basePrice + distanceMultiplier);
};

const Checkout = () => {
  const [paymentMethod, setPaymentMethod] = useState("credit-card");
  const [deliveryType, setDeliveryType] = useState("standard");
  const [cep, setCep] = useState("");
  const [shippingCost, setShippingCost] = useState(0);
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const { items, totalPrice, clearCart } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    if (cep.length === 9) {
      const cost = calculateShipping(cep, deliveryType);
      setShippingCost(cost);
    }
  }, [cep, deliveryType]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !whatsapp) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha email e WhatsApp para receber atualizações.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Pedido realizado com sucesso!",
      description: "Você receberá atualizações no email e WhatsApp cadastrados.",
    });
    
    clearCart();
    navigate("/");
  };

  const formatCep = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 5) return numbers;
    return `${numbers.slice(0, 5)}-${numbers.slice(5, 8)}`;
  };

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCep(formatCep(e.target.value));
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-20 text-center">
          <h1 className="font-playfair text-3xl font-bold text-foreground mb-4">
            Seu carrinho está vazio
          </h1>
          <Link to="/products">
            <Button>Ver Produtos</Button>
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <Link
          to="/products"
          className="inline-flex items-center text-muted-foreground hover:text-primary transition-colors mb-6"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Voltar para produtos
        </Link>

        <h1 className="font-playfair text-3xl sm:text-4xl font-bold text-foreground mb-8">
          Finalizar Compra
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Informações Pessoais */}
            <div className="bg-card rounded-xl p-6 shadow-soft space-y-4">
              <h2 className="font-playfair text-2xl font-bold text-foreground mb-4">
                Informações Pessoais
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome Completo *</Label>
                  <Input id="name" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required 
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="phone">WhatsApp *</Label>
                  <Input 
                    id="phone" 
                    type="tel" 
                    placeholder="(00) 00000-0000"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    required 
                  />
                  <p className="text-xs text-muted-foreground">
                    Você receberá atualizações do pedido via WhatsApp
                  </p>
                </div>
              </div>
            </div>

            {/* Endereço de Entrega */}
            <div className="bg-card rounded-xl p-6 shadow-soft space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Truck className="h-5 w-5 text-primary" />
                <h2 className="font-playfair text-2xl font-bold text-foreground">
                  Endereço de Entrega
                </h2>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="cep">CEP *</Label>
                  <Input 
                    id="cep" 
                    placeholder="00000-000"
                    value={cep}
                    onChange={handleCepChange}
                    maxLength={9}
                    required 
                  />
                  {cep.length === 9 && (
                    <p className="text-xs text-green-600">
                      ✓ CEP válido. Frete calculado abaixo.
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Endereço *</Label>
                  <Input id="address" required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="number">Número *</Label>
                    <Input id="number" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="complement">Complemento</Label>
                    <Input id="complement" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">Cidade *</Label>
                    <Input id="city" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">Estado *</Label>
                    <Input id="state" required />
                  </div>
                </div>
              </div>
            </div>

            {/* Tipo de Entrega */}
            <div className="bg-card rounded-xl p-6 shadow-soft space-y-4">
              <h2 className="font-playfair text-2xl font-bold text-foreground mb-4">
                Tipo de Entrega
              </h2>
              <RadioGroup value={deliveryType} onValueChange={setDeliveryType}>
                <div className="flex items-center space-x-3 p-4 border-2 border-border rounded-lg cursor-pointer hover:border-primary transition-colors">
                  <RadioGroupItem value="standard" id="standard" />
                  <Label htmlFor="standard" className="flex-1 cursor-pointer">
                    <div>
                      <p className="font-semibold">Entrega Padrão</p>
                      <p className="text-sm text-muted-foreground">
                        10-15 dias úteis - Mais econômico
                      </p>
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-3 p-4 border-2 border-border rounded-lg cursor-pointer hover:border-primary transition-colors">
                  <RadioGroupItem value="express" id="express" />
                  <Label htmlFor="express" className="flex-1 cursor-pointer">
                    <div>
                      <p className="font-semibold">Entrega Expressa</p>
                      <p className="text-sm text-muted-foreground">
                        5-7 dias úteis - Mais rápido
                      </p>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Pagamento */}
            <div className="bg-card rounded-xl p-6 shadow-soft space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <CreditCard className="h-5 w-5 text-primary" />
                <h2 className="font-playfair text-2xl font-bold text-foreground">
                  Pagamento
                </h2>
              </div>
              <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                <div className="flex items-center space-x-3 p-4 border-2 border-border rounded-lg">
                  <RadioGroupItem value="credit-card" id="credit-card" />
                  <Label htmlFor="credit-card">Cartão de Crédito</Label>
                </div>
                <div className="flex items-center space-x-3 p-4 border-2 border-border rounded-lg">
                  <RadioGroupItem value="pix" id="pix" />
                  <Label htmlFor="pix">PIX</Label>
                </div>
              </RadioGroup>

              {paymentMethod === "credit-card" && (
                <div className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="cardNumber">Número do Cartão</Label>
                    <Input id="cardNumber" placeholder="0000 0000 0000 0000" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="expiry">Validade</Label>
                      <Input id="expiry" placeholder="MM/AA" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cvv">CVV</Label>
                      <Input id="cvv" placeholder="000" />
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground">
                  <strong>Nota:</strong> Sistema mockado. Integração com Stripe será implementada.
                </p>
              </div>
            </div>

            <Button type="submit" size="lg" className="w-full h-14 text-lg font-semibold">
              Finalizar Pedido
            </Button>
          </form>

          {/* Resumo do Pedido */}
          <div>
            <div className="bg-card rounded-xl p-6 shadow-soft sticky top-24">
              <h2 className="font-playfair text-2xl font-bold text-foreground mb-6">
                Resumo do Pedido
              </h2>

              <div className="space-y-4 mb-6">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-4">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <p className="font-playfair font-semibold">{item.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Quantidade: {item.quantity}
                      </p>
                      <p className="text-sm font-semibold text-primary">
                        {item.price}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-3 pt-4 border-t border-border">
                <div className="flex justify-between">
                  <p className="font-inter text-foreground">Subtotal</p>
                  <p className="font-inter font-semibold">
                    R$ {totalPrice.toFixed(2)}
                  </p>
                </div>
                <div className="flex justify-between">
                  <p className="font-inter text-foreground">Frete</p>
                  <p className="font-inter font-semibold">
                    {cep.length === 9 ? `R$ ${shippingCost.toFixed(2)}` : "Calcule o CEP"}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-border mt-4">
                <div className="flex justify-between items-center">
                  <p className="font-playfair text-xl font-bold text-foreground">
                    Total
                  </p>
                  <p className="font-playfair text-2xl font-bold text-primary">
                    R$ {(totalPrice + shippingCost).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Checkout;
