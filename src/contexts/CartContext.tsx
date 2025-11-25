import { createContext, useContext, useState, ReactNode } from "react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export interface Product {
  id: string;
  name: string;
  price: string;
  price_value: number;
  image: string;
  images: string[];
  video?: string;
  category: string;
  description?: string;
  sizes?: string[];
  colors?: string[];
  stock: number;
  is_visible: boolean;
}

export interface CartItem extends Product {
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, quantity?: number) => Promise<boolean>;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);

  const addToCart = async (product: Product, quantity: number = 1): Promise<boolean> => {
    try {
      // Verificar estoque atual no banco
      const { data: currentProduct, error } = await supabase
        .from("products")
        .select("stock")
        .eq("id", product.id)
        .single();

      if (error) throw error;

      if (!currentProduct) {
        toast({
          title: "Produto não encontrado",
          description: "Este produto não está mais disponível.",
          variant: "destructive",
        });
        return false;
      }

      const existingItem = items.find((item) => item.id === product.id);
      const currentCartQuantity = existingItem ? existingItem.quantity : 0;
      const totalQuantity = currentCartQuantity + quantity;

      // Verificar se há estoque suficiente
      if (currentProduct.stock < totalQuantity) {
        toast({
          title: "Estoque insuficiente",
          description: `Apenas ${currentProduct.stock} unidade(s) disponível(is). Você já tem ${currentCartQuantity} no carrinho.`,
          variant: "destructive",
        });
        return false;
      }

      // Verificar se o estoque acabou
      if (currentProduct.stock === 0) {
        toast({
          title: "Produto sem estoque",
          description: "Este produto está temporariamente indisponível.",
          variant: "destructive",
        });
        return false;
      }

      setItems((currentItems) => {
        if (existingItem) {
          toast({
            title: "Quantidade atualizada",
            description: `${product.name} atualizado no carrinho.`,
          });
          return currentItems.map((item) =>
            item.id === product.id
              ? { ...item, quantity: totalQuantity }
              : item
          );
        }
        
        toast({
          title: "Adicionado ao carrinho",
          description: `${product.name} foi adicionado ao carrinho.`,
        });
        return [...currentItems, { ...product, quantity }];
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

  const removeFromCart = (productId: string) => {
    setItems((currentItems) => currentItems.filter((item) => item.id !== productId));
    toast({
      title: "Removido do carrinho",
      description: "Produto removido com sucesso.",
    });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setItems((currentItems) =>
      currentItems.map((item) =>
        item.id === productId ? { ...item, quantity } : item
      )
    );
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
