import { Package } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  onAddProduct: () => void;
}

const EmptyState = ({ onAddProduct }: EmptyStateProps) => {
  return (
    <div className="bg-card rounded-xl shadow-soft border border-border p-12 text-center">
      <div className="flex flex-col items-center justify-center space-y-4">
        <div className="bg-muted rounded-full p-6">
          <Package className="h-12 w-12 text-muted-foreground" />
        </div>
        <h3 className="font-playfair text-2xl font-semibold text-foreground">
          Nenhum produto cadastrado
        </h3>
        <p className="text-muted-foreground max-w-md">
          Comece adicionando o primeiro produto à sua loja. Você pode adicionar imagens, descrição e todas as informações necessárias.
        </p>
        <Button onClick={onAddProduct} className="mt-4">
          Adicionar Primeiro Produto
        </Button>
      </div>
    </div>
  );
};

export default EmptyState;
