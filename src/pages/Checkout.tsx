import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ChevronLeft, CreditCard, Truck, Tag, Loader2, Landmark } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useCart } from "@/contexts/CartContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface ShippingOption {
  type: string;
  name: string;
  price: number;
  days: number;
  service: string;
}

interface Coupon {
  id: string;
  code: string;
  discount_type: "percentage" | "fixed";
  discount_value: number;
}

const Checkout = () => {
  const [deliveryMethod, setDeliveryMethod] = useState<"pickup" | "delivery">("delivery");
  const [paymentMethod, setPaymentMethod] = useState("pix");
  const [deliveryType, setDeliveryType] = useState("");
  const [cep, setCep] = useState("");
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [shippingCost, setShippingCost] = useState(0);
  const [deliveryDays, setDeliveryDays] = useState(0);
  const [loadingShipping, setLoadingShipping] = useState(false);
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [number, setNumber] = useState("");
  const [complement, setComplement] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [cpf, setCpf] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardHolderName, setCardHolderName] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [loadingCoupon, setLoadingCoupon] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [storeAddress, setStoreAddress] = useState<any>(null);

  const { items, totalPrice, clearCart, updateQuantity } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    loadStoreAddress();
  }, []);

  useEffect(() => {
    if (deliveryMethod === "delivery" && cep.length === 9) {
      fetchAddressFromCep();
      calculateShipping();
    } else if (deliveryMethod === "pickup") {
      setShippingOptions([]);
      setDeliveryType("");
      setShippingCost(0);
      setDeliveryDays(0);
    } else {
      setShippingOptions([]);
      setDeliveryType("");
      setShippingCost(0);
      setDeliveryDays(0);
    }
  }, [cep, deliveryMethod]);

  useEffect(() => {
    if (deliveryType && shippingOptions.length > 0) {
      const selectedOption = shippingOptions.find(opt => opt.type === deliveryType);
      if (selectedOption) {
        setShippingCost(selectedOption.price);
        setDeliveryDays(selectedOption.days);
      }
    }
  }, [deliveryType, shippingOptions]);

  const loadStoreAddress = async () => {
    try {
      const { data, error } = await supabase
        .from("store_settings")
        .select("*")
        .eq("id", "00000000-0000-0000-0000-000000000001")
        .maybeSingle();

      if (error) throw error;
      setStoreAddress(data);
    } catch (error) {
      console.error("Erro ao carregar endereço da loja:", error);
    }
  };

  const fetchAddressFromCep = async () => {
    try {
      const cleanCep = cep.replace(/\D/g, "");
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await response.json();

      if (!data.erro) {
        setAddress(data.logradouro || "");
        setNeighborhood(data.bairro || "");
        setCity(data.localidade || "");
        setState(data.uf || "");
      }
    } catch (error) {
      console.error("Erro ao buscar CEP:", error);
    }
  };

  const calculateShipping = async () => {
    setLoadingShipping(true);
    try {
      const cleanCep = cep.replace(/\D/g, "");
      const cepNumber = parseInt(cleanCep);
      const isSaoLuis = cepNumber >= 65000000 && cepNumber <= 65099999;

      if (isSaoLuis) {
        // São Luís: taxa fixa de R$ 5
        const saoLuisOptions: ShippingOption[] = [
          {
            type: "standard",
            name: "Entrega em São Luís",
            price: 5,
            days: 2,
            service: "Local",
          },
        ];
        setShippingOptions(saoLuisOptions);
        setDeliveryType("standard");
      } else {
        // Outras cidades: usar edge function
        const response = await fetch(
          "https://eheiujcuirpciqffcltr.supabase.co/functions/v1/calculate-shipping",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ cepDestino: cep }),
          }
        );

        const data = await response.json();

        if (data.success && data.options) {
          setShippingOptions(data.options);
          if (data.options.length > 0) {
            setDeliveryType(data.options[0].type);
          }
        } else {
          toast({
            title: "Erro ao calcular frete",
            description: "Não foi possível calcular o frete para este CEP.",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error("Erro ao calcular frete:", error);
      toast({
        title: "Erro",
        description: "Não foi possível calcular o frete.",
        variant: "destructive",
      });
    } finally {
      setLoadingShipping(false);
    }
  };

  const validateCoupon = async () => {
    if (!couponCode.trim()) {
      toast({
        title: "Código vazio",
        description: "Digite um código de cupom.",
        variant: "destructive",
      });
      return;
    }

    setLoadingCoupon(true);
    try {
      const { data, error } = await supabase
        .from("coupons")
        .select("*")
        .eq("code", couponCode.toUpperCase())
        .eq("is_active", true)
        .gt("expires_at", new Date().toISOString())
        .single();

      if (error || !data) {
        toast({
          title: "Cupom inválido",
          description: "Este cupom não existe, está expirado ou foi desativado.",
          variant: "destructive",
        });
        setAppliedCoupon(null);
        return;
      }

      setAppliedCoupon(data as Coupon);
      toast({
        title: "Cupom aplicado!",
        description: `Desconto de ${data.discount_type === "percentage" ? `${data.discount_value}%` : `R$ ${data.discount_value.toFixed(2)}`} aplicado.`,
      });
    } catch (error) {
      console.error("Erro ao validar cupom:", error);
      toast({
        title: "Erro",
        description: "Não foi possível validar o cupom.",
        variant: "destructive",
      });
    } finally {
      setLoadingCoupon(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
    toast({
      title: "Cupom removido",
      description: "O desconto foi removido do pedido.",
    });
  };

  const calculateDiscount = () => {
    if (!appliedCoupon) return 0;

    if (appliedCoupon.discount_type === "percentage") {
      return (totalPrice * appliedCoupon.discount_value) / 100;
    } else {
      return appliedCoupon.discount_value;
    }
  };

  const discount = calculateDiscount();
  const subtotal = totalPrice;
  const finalTotal = Math.max(0, subtotal - discount + shippingCost);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !whatsapp || !name || !cpf) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    // Validar CPF (11 dígitos)
    const cleanCpf = cpf.replace(/\D/g, "");
    if (cleanCpf.length !== 11) {
      toast({
        title: "CPF inválido",
        description: "Por favor, digite um CPF válido com 11 dígitos.",
        variant: "destructive",
      });
      return;
    }

    if (["credit_card", "debit_card"].includes(paymentMethod)) {
      if (!cardNumber || !cardHolderName || !cardExpiry || !cardCvv) {
        toast({
          title: "Dados do cartão incompletos",
          description: "Por favor, preencha todos os dados do cartão.",
          variant: "destructive",
        });
        return;
      }
      // Futuramente, aqui você adicionaria a lógica para gerar o card_hash
      // com a biblioteca do Pagar.me antes de enviar para o backend.
      // Por agora, vamos simular o fluxo.
    }

    if (deliveryMethod === "delivery") {
      if (!address || !number || !city || !state || !cep) {
        toast({
          title: "Campos obrigatórios",
          description: "Por favor, preencha o endereço de entrega.",
          variant: "destructive",
        });
        return;
      }

      if (!deliveryType || shippingOptions.length === 0) {
        toast({
          title: "Frete não calculado",
          description: "Por favor, calcule o frete antes de finalizar o pedido.",
          variant: "destructive",
        });
        return;
      }
    }

    setSubmitting(true);

    try {
      // Verificar estoque antes de processar pagamento
      for (const item of items) {
        const { data: product, error: productError } = await supabase
          .from("products")
          .select("variants")
          .eq("id", item.id)
          .single();

        if (productError || !product) {
          toast({
            title: "Erro ao verificar estoque",
            description: `Não foi possível verificar o estoque do produto "${item.name}".`,
            variant: "destructive",
          });
          setSubmitting(false);
          return;
        }

        const variants = (product.variants as any[]) || [];
        const matchingVariant = variants.find(
          (v: any) => v.color === item.selectedColor && v.size === item.selectedSize
        );

        if (!matchingVariant) {
          toast({
            title: "Variante não encontrada",
            description: `A combinação de cor "${item.selectedColor}" e tamanho "${item.selectedSize}" não está mais disponível para o produto "${item.name}".`,
            variant: "destructive",
          });
          setSubmitting(false);
          return;
        }

        if (matchingVariant.stock < item.quantity) {
          toast({
            title: "Estoque insuficiente",
            description: `O produto "${item.name}" (${item.selectedColor} - ${item.selectedSize}) só tem ${matchingVariant.stock} unidade(s) disponível(is). Você tentou adicionar ${item.quantity}.`,
            variant: "destructive",
          });
          setSubmitting(false);
          return;
        }
      }

      // Preparar dados do pedido para enviar ao AbacatePay
      const orderData = {
        customer_phone: whatsapp,
        customer_whatsapp: whatsapp,
        shipping_cep: deliveryMethod === "pickup" ? "" : cep,
        shipping_street: deliveryMethod === "pickup" ? "RETIRADA NA LOJA" : address,
        shipping_number: deliveryMethod === "pickup" ? "" : number,
        shipping_complement: deliveryMethod === "pickup" ? null : (complement || null),
        shipping_neighborhood: deliveryMethod === "pickup" ? "" : neighborhood,
        shipping_city: deliveryMethod === "pickup" ? "" : city,
        shipping_state: deliveryMethod === "pickup" ? "" : state,
        delivery_type: deliveryMethod === "pickup" ? "RETIRADA NA LOJA" : deliveryType,
        delivery_days: deliveryMethod === "pickup" ? 0 : deliveryDays,
        subtotal: subtotal,
        shipping_cost: deliveryMethod === "pickup" ? 0 : shippingCost,
        coupon_code: appliedCoupon?.code || null,
        items: items.map(item => ({
          productId: item.id,
          name: item.name,
          image: item.image,
          price: item.price_value,
          quantity: item.quantity,
          selectedColor: item.selectedColor,
          selectedSize: item.selectedSize,
        })),
      };

      if (paymentMethod === "pix") {
        // Lógica existente para PIX com AbacatePay
        const { data, error } = await supabase.functions.invoke(
          "create-abacatepay-checkout",
          {
            body: {
              items: items.map(item => ({
                productId: item.id,
                name: item.name,
                image: item.image,
                price: item.price_value,
                quantity: item.quantity,
                selectedColor: item.selectedColor,
                selectedSize: item.selectedSize,
              })),
              customerEmail: email,
              customerName: name,
              customerPhone: whatsapp,
              customerCpf: cpf.replace(/\D/g, ""),
              shippingCost: deliveryMethod === "pickup" ? 0 : shippingCost,
              discountAmount: discount,
              orderData,
            },
          }
        );

        if (error) throw error;
        if (!data?.url) throw new Error("URL de pagamento não retornada");

        window.location.href = data.url;

      } else if (["credit_card", "debit_card"].includes(paymentMethod)) {
        // Nova lógica para Pagar.me (Cartão de Crédito/Débito)
        // Esta parte será implementada com o passo a passo abaixo
        toast({
          title: "Integração Pagar.me Pendente",
          description: "A lógica de backend para pagamento com cartão ainda precisa ser criada.",
        });
        // Exemplo de como seria a chamada para a futura função:
        /*
        const { data, error } = await supabase.functions.invoke("create-pagarme-charge", {
          body: {
            paymentMethod,
            cardHash: "card_hash_gerado_pelo_pagarme.js", // Importante!
            // ...outros dados do pedido (items, customer, shipping, etc.)
          }
        });
        if (error) throw error;
        // Redirecionar para página de sucesso/erro
        navigate(`/order-tracking?code=${data.orderId}`);
        */
      }
    } catch (error) {
      console.error("Erro ao processar pagamento:", error);
      toast({
        title: "Erro ao processar pagamento",
        description: "Não foi possível iniciar o processo de pagamento. Tente novamente.",
        variant: "destructive",
      });
      setSubmitting(false);
    }
  };

  const formatCep = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 5) return numbers;
    return `${numbers.slice(0, 5)}-${numbers.slice(5, 8)}`;
  };

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCep(formatCep(e.target.value));
  };

  const formatWhatsApp = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 2) return `(${numbers}`;
    if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
  };

  const handleWhatsAppChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setWhatsapp(formatWhatsApp(e.target.value));
  };

  const formatCardExpiry = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 2) return numbers;
    return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}`;
  };

  const handleCardExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCardExpiry(formatCardExpiry(e.target.value));
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
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="name">Nome Completo *</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
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
                <div className="space-y-2">
                  <Label htmlFor="phone">WhatsApp *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="(00) 00000-0000"
                    value={whatsapp}
                    onChange={handleWhatsAppChange}
                    maxLength={15}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cpf">CPF *</Label>
                  <Input
                    id="cpf"
                    type="text"
                    placeholder="000.000.000-00"
                    value={cpf}
                    onChange={(e) => {
                      const numbers = e.target.value.replace(/\D/g, "");
                      if (numbers.length <= 3) {
                        setCpf(numbers);
                      } else if (numbers.length <= 6) {
                        setCpf(`${numbers.slice(0, 3)}.${numbers.slice(3)}`);
                      } else if (numbers.length <= 9) {
                        setCpf(`${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`);
                      } else {
                        setCpf(`${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9, 11)}`);
                      }
                    }}
                    maxLength={14}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Método de Entrega */}
            <div className="bg-card rounded-xl p-6 shadow-soft space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Truck className="h-5 w-5 text-primary" />
                <h2 className="font-playfair text-2xl font-bold text-foreground">
                  Método de Entrega
                </h2>
              </div>
              <RadioGroup value={deliveryMethod} onValueChange={(value: "pickup" | "delivery") => setDeliveryMethod(value)}>
                <div className="flex items-center space-x-3 p-4 border-2 border-border rounded-lg cursor-pointer hover:border-primary transition-colors">
                  <RadioGroupItem value="delivery" id="delivery" />
                  <Label htmlFor="delivery" className="flex-1 cursor-pointer">
                    <p className="font-semibold">Entrega no endereço</p>
                    <p className="text-sm text-muted-foreground">
                      Receba em casa
                    </p>
                  </Label>
                </div>
                <div className="flex items-center space-x-3 p-4 border-2 border-border rounded-lg cursor-pointer hover:border-primary transition-colors">
                  <RadioGroupItem value="pickup" id="pickup" />
                  <Label htmlFor="pickup" className="flex-1 cursor-pointer">
                    <p className="font-semibold">Retirar na loja</p>
                    <p className="text-sm text-muted-foreground">
                      {storeAddress ?
                        `${storeAddress.store_address}, ${storeAddress.store_number} - ${storeAddress.store_neighborhood}, ${storeAddress.store_city}/${storeAddress.store_state}`
                        : "Endereço será configurado pelo admin"}
                    </p>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Endereço de Entrega */}
            {deliveryMethod === "delivery" && (
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
                    <div className="flex gap-2">
                      <Input
                        id="cep"
                        placeholder="00000-000"
                        value={cep}
                        onChange={handleCepChange}
                        maxLength={9}
                        required
                        className="flex-1"
                      />
                    </div>
                    {cep.length === 9 && !loadingShipping && shippingOptions.length > 0 && (
                      <p className="text-xs text-green-600">
                        ✓ CEP válido. Frete calculado abaixo.
                      </p>
                    )}
                    {loadingShipping && (
                      <p className="text-xs text-muted-foreground flex items-center gap-2">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Calculando frete...
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Endereço *</Label>
                    <Input
                      id="address"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      disabled
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="number">Número *</Label>
                      <Input
                        id="number"
                        value={number}
                        onChange={(e) => setNumber(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="complement">Complemento</Label>
                      <Input
                        id="complement"
                        value={complement}
                        onChange={(e) => setComplement(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="neighborhood">Bairro *</Label>
                    <Input
                      id="neighborhood"
                      value={neighborhood}
                      onChange={(e) => setNeighborhood(e.target.value)}
                      disabled
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">Cidade *</Label>
                      <Input
                        id="city"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        disabled
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">Estado *</Label>
                      <Input
                        id="state"
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        disabled
                        maxLength={2}
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tipo de Entrega */}
            {deliveryMethod === "delivery" && shippingOptions.length > 0 && (
              <div className="bg-card rounded-xl p-6 shadow-soft space-y-4">
                <h2 className="font-playfair text-2xl font-bold text-foreground mb-4">
                  Tipo de Entrega
                </h2>
                <RadioGroup value={deliveryType} onValueChange={setDeliveryType}>
                  {shippingOptions.map((option) => (
                    <div
                      key={option.type}
                      className="flex items-center space-x-3 p-4 border-2 border-border rounded-lg cursor-pointer hover:border-primary transition-colors"
                    >
                      <RadioGroupItem value={option.type} id={option.type} />
                      <Label htmlFor={option.type} className="flex-1 cursor-pointer">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-semibold">{option.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {option.days} {option.days === 1 ? "dia útil" : "dias úteis"}
                            </p>
                          </div>
                          <p className="font-semibold text-primary">
                            {option.price === 0 ? "Grátis" : `R$ ${option.price.toFixed(2)}`}
                          </p>
                        </div>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            )}

            {/* Cupom de Desconto */}
            <div className="bg-card rounded-xl p-6 shadow-soft space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Tag className="h-5 w-5 text-primary" />
                <h2 className="font-playfair text-2xl font-bold text-foreground">
                  Cupom de Desconto
                </h2>
              </div>
              {!appliedCoupon ? (
                <div className="flex gap-2">
                  <Input
                    placeholder="Digite o código do cupom"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    disabled={loadingCoupon}
                  />
                  <Button
                    type="button"
                    onClick={validateCoupon}
                    disabled={loadingCoupon || !couponCode.trim()}
                  >
                    {loadingCoupon ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Aplicar"
                    )}
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 border-2 border-green-500 rounded-lg">
                  <div>
                    <p className="font-semibold text-green-700 dark:text-green-400">
                      Cupom {appliedCoupon.code} aplicado!
                    </p>
                    <p className="text-sm text-green-600 dark:text-green-500">
                      Desconto de {appliedCoupon.discount_type === "percentage"
                        ? `${appliedCoupon.discount_value}%`
                        : `R$ ${appliedCoupon.discount_value.toFixed(2)}`}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={removeCoupon}
                  >
                    Remover
                  </Button>
                </div>
              )}
            </div>

            {/* Pagamento */}
            <div className="bg-card rounded-xl p-6 shadow-soft space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <CreditCard className="h-5 w-5 text-primary" />
                <h2 className="font-playfair text-2xl font-bold text-foreground">
                  Pagamento
                </h2>
              </div>

              <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="space-y-3">
                <Label htmlFor="pix" className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-colors ${paymentMethod === 'pix' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}>
                  <RadioGroupItem value="pix" id="pix" />
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-lg">💠</span>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">PIX</p>
                    <p className="text-sm text-muted-foreground">Pagamento instantâneo</p>
                  </div>
                </Label>
                <Label htmlFor="credit_card" className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-colors ${paymentMethod === 'credit_card' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}>
                  <RadioGroupItem value="credit_card" id="credit_card" />
                  <CreditCard className="h-6 w-6 text-primary" />
                  <div>
                    <p className="font-semibold text-foreground">Cartão de Crédito</p>
                    <p className="text-sm text-muted-foreground">Pague em até 12x</p>
                  </div>
                </Label>
                <Label htmlFor="debit_card" className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-colors ${paymentMethod === 'debit_card' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}>
                  <RadioGroupItem value="debit_card" id="debit_card" />
                  <Landmark className="h-6 w-6 text-primary" />
                  <div>
                    <p className="font-semibold text-foreground">Cartão de Débito</p>
                    <p className="text-sm text-muted-foreground">Pagamento à vista</p>
                  </div>
                </Label>
              </RadioGroup>

              {/* Formulário do Cartão */}
              {(paymentMethod === "credit_card" || paymentMethod === "debit_card") && (
                <div className="space-y-4 pt-4 border-t border-border mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="card-number">Número do Cartão</Label>
                    <Input id="card-number" placeholder="0000 0000 0000 0000" value={cardNumber} onChange={e => setCardNumber(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="card-holder">Nome no Cartão</Label>
                    <Input id="card-holder" placeholder="Nome completo" value={cardHolderName} onChange={e => setCardHolderName(e.target.value)} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="card-expiry">Validade (MM/AA)</Label>
                      <Input
                        id="card-expiry"
                        placeholder="MM/AA"
                        value={cardExpiry}
                        onChange={handleCardExpiryChange}
                        maxLength={5}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="card-cvv">CVV</Label>
                      <Input
                        id="card-cvv"
                        placeholder="123"
                        value={cardCvv}
                        onChange={e => setCardCvv(e.target.value)}
                        maxLength={4}
                      />
                    </div>
                  </div>
                </div>
              )}

              {paymentMethod === 'pix' && (
                <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground">
                    Ao finalizar o pedido, você será redirecionada para o ambiente seguro da
                    <span className="font-semibold"> AbacatePay</span> para pagar via <span className="font-semibold">PIX</span>
                    , com QR Code gerado automaticamente.
                  </p>
                </div>
              )}
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full h-14 text-lg font-semibold"
              disabled={submitting || (deliveryMethod === "delivery" && shippingOptions.length === 0)}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Processando...
                </>
              ) : (
                "Finalizar Pedido"
              )}
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
                  <div key={`${item.id}-${item.selectedColor}-${item.selectedSize}`} className="flex gap-4">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <p className="font-playfair font-semibold">{item.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Cor: {item.selectedColor} | Tamanho: {item.selectedSize}
                      </p>
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
                    R$ {subtotal.toFixed(2)}
                  </p>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <p className="font-inter">Desconto</p>
                    <p className="font-inter font-semibold">
                      - R$ {discount.toFixed(2)}
                    </p>
                  </div>
                )}
                <div className="flex justify-between">
                  <p className="font-inter text-foreground">Frete</p>
                  <p className="font-inter font-semibold">
                    {cep.length === 9 && shippingOptions.length > 0
                      ? shippingCost === 0
                        ? "Grátis"
                        : `R$ ${shippingCost.toFixed(2)}`
                      : "Calcule o CEP"}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-border mt-4">
                <div className="flex justify-between items-center">
                  <p className="font-playfair text-xl font-bold text-foreground">
                    Total
                  </p>
                  <p className="font-playfair text-2xl font-bold text-primary">
                    R$ {finalTotal.toFixed(2)}
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