import { createContext, useContext, useState, ReactNode } from "react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Product, CartItem, ProductVariant } from "@/types/product";

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, selectedColor: string, selectedSize: string, quantity?: number) => Promise<boolean>;
  removeFromCart: (productId: string, selectedColor: string, selectedSize: string) => void;
  updateQuantity: (productId: string, selectedColor: string, selectedSize: string, quantity: number) => Promise<void>;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);

  const addToCart = async (product: Product, selectedColor: string, selectedSize: string, quantity: number = 1): Promise<boolean> => {
    try {
      // Buscar a variante específica
      const variant = product.variants.find(
        v => v.color === selectedColor && v.size === selectedSize
      );

      if (!variant) {
        toast({
          title: "Variante não encontrada",
          description: "Esta combinação de cor e tamanho não está disponível.",
          variant: "destructive",
        });
        return false;
      }

      // Verificar estoque da variante
      const existingItem = items.find(
        (item) => item.id === product.id && 
                  item.selectedColor === selectedColor && 
                  item.selectedSize === selectedSize
      );
      const currentCartQuantity = existingItem ? existingItem.quantity : 0;
      const totalQuantity = currentCartQuantity + quantity;

      if (variant.stock < totalQuantity) {
        toast({
          title: "Estoque insuficiente",
          description: `Apenas ${variant.stock} unidade(s) disponível(is) para ${selectedColor} - ${selectedSize}. Você já tem ${currentCartQuantity} no carrinho.`,
          variant: "destructive",
        });
        return false;
      }

      if (variant.stock === 0) {
        toast({
          title: "Produto sem estoque",
          description: `Esta variante (${selectedColor} - ${selectedSize}) está temporariamente indisponível.`,
          variant: "destructive",
        });
        return false;
      }

      setItems((currentItems) => {
        if (existingItem) {
          toast({
            title: "Quantidade atualizada",
            description: `${product.name} (${selectedColor} - ${selectedSize}) atualizado no carrinho.`,
          });
          return currentItems.map((item) =>
            item.id === product.id && 
            item.selectedColor === selectedColor && 
            item.selectedSize === selectedSize
              ? { ...item, quantity: totalQuantity }
              : item
          );
        }
        
        toast({
          title: "Adicionado ao carrinho",
          description: `${product.name} (${selectedColor} - ${selectedSize}) foi adicionado ao carrinho.`,
        });
        return [...currentItems, { ...product, quantity, selectedColor, selectedSize }];
      });

      return true;
    } catch (error) {
      console.error("Erro ao adicionar ao carrinho:", error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o produto ao carrinho.",
        variant: "destructive",
      });
      return false;
    }
  };

  const removeFromCart = (productId: string, selectedColor: string, selectedSize: string) => {
    setItems((currentItems) => currentItems.filter(
      (item) => !(item.id === productId && 
                  item.selectedColor === selectedColor && 
                  item.selectedSize === selectedSize)
    ));
    toast({
      title: "Removido do carrinho",
      description: "Produto removido com sucesso.",
    });
  };

  const updateQuantity = async (productId: string, selectedColor: string, selectedSize: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId, selectedColor, selectedSize);
      return;
    }

    try {
      // Verificar estoque atual no banco
      const { data: currentProduct, error } = await supabase
        .from("products")
        .select("variants")
        .eq("id", productId)
        .single();

      if (error) throw error;

      if (!currentProduct) {
        toast({
          title: "Produto não encontrado",
          description: "Este produto não está mais disponível.",
          variant: "destructive",
        });
        return;
      }

      const variants = (currentProduct.variants as any as ProductVariant[]) || [];
      const variant = variants.find(
        v => v.color === selectedColor && v.size === selectedSize
      );

      if (!variant) {
        toast({
          title: "Variante não encontrada",
          description: "Esta combinação de cor e tamanho não está mais disponível.",
          variant: "destructive",
        });
        return;
      }

      // Verificar se há estoque suficiente
      if (variant.stock < quantity) {
        toast({
          title: "Estoque insuficiente",
          description: `Apenas ${variant.stock} unidade(s) disponível(is) para ${selectedColor} - ${selectedSize}.`,
          variant: "destructive",
        });
        return;
      }

      setItems((currentItems) =>
        currentItems.map((item) =>
          item.id === productId && 
          item.selectedColor === selectedColor && 
          item.selectedSize === selectedSize
            ? { ...item, quantity }
            : item
        )
      );
    } catch (error) {
      console.error("Erro ao atualizar quantidade:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a quantidade.",
        variant: "destructive",
      });
    }
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + item.price_value * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
};
