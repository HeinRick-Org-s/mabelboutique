import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Plus } from "lucide-react";
import { ProductVariant } from "@/types/product";

interface VariantManagerProps {
  variants: ProductVariant[];
  onChange: (variants: ProductVariant[]) => void;
  disabled?: boolean;
}

export const VariantManager = ({ variants, onChange, disabled }: VariantManagerProps) => {
  const [newColor, setNewColor] = useState("");
  const [newSize, setNewSize] = useState("");
  const [newStock, setNewStock] = useState("");

  // Obter cores únicas
  const uniqueColors = Array.from(new Set(variants.map(v => v.color)));

  const addVariant = () => {
    if (!newColor.trim() || !newSize.trim() || !newStock) return;
    
    const stock = parseInt(newStock);
    if (isNaN(stock) || stock < 0) return;

    // Verificar se variante já existe
    const exists = variants.some(
      v => v.color.toLowerCase() === newColor.toLowerCase().trim() && 
           v.size.toLowerCase() === newSize.toLowerCase().trim()
    );

    if (exists) {
      alert("Esta combinação de cor e tamanho já existe!");
      return;
    }

    onChange([...variants, { 
      color: newColor.trim(), 
      size: newSize.trim().toUpperCase(), 
      stock 
    }]);
    
    setNewSize("");
    setNewStock("");
  };

  const removeVariant = (index: number) => {
    onChange(variants.filter((_, i) => i !== index));
  };

  const updateVariantStock = (index: number, stock: number) => {
    const updated = [...variants];
    updated[index] = { ...updated[index], stock };
    onChange(updated);
  };

  // Agrupar variantes por cor
  const variantsByColor = uniqueColors.map(color => ({
    color,
    variants: variants.filter(v => v.color === color)
  }));

  const totalStock = variants.reduce((sum, v) => sum + v.stock, 0);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Label>Variantes (Cor + Tamanho + Estoque)</Label>
        <span className="text-sm text-muted-foreground">
          Estoque Total: <span className="font-semibold">{totalStock}</span>
        </span>
      </div>

      {/* Lista de variantes agrupadas por cor */}
      {variantsByColor.length > 0 && (
        <div className="space-y-4 border rounded-lg p-4">
          {variantsByColor.map(({ color, variants: colorVariants }) => (
            <div key={color} className="space-y-2">
              <h4 className="font-semibold text-sm">{color}</h4>
              <div className="grid grid-cols-1 gap-2 ml-4">
                {colorVariants.map((variant, index) => {
                  const globalIndex = variants.findIndex(
                    v => v.color === variant.color && v.size === variant.size
                  );
                  return (
                    <div key={index} className="flex items-center gap-2">
                      <span className="text-sm w-12">{variant.size}</span>
                      <Input
                        type="number"
                        min="0"
                        value={variant.stock}
                        onChange={(e) => updateVariantStock(globalIndex, parseInt(e.target.value) || 0)}
                        className="w-24"
                        disabled={disabled}
                      />
                      <span className="text-xs text-muted-foreground">unidades</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => removeVariant(globalIndex)}
                        disabled={disabled}
                      >
                        <X className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Adicionar nova variante */}
      <div className="border rounded-lg p-4 space-y-3">
        <Label className="text-sm">Adicionar Variante</Label>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div>
            <Label htmlFor="variant-color" className="text-xs">Cor</Label>
            <Input
              id="variant-color"
              value={newColor}
              onChange={(e) => setNewColor(e.target.value)}
              placeholder="Ex: Azul"
              disabled={disabled}
            />
          </div>
          <div>
            <Label htmlFor="variant-size" className="text-xs">Tamanho</Label>
            <Input
              id="variant-size"
              value={newSize}
              onChange={(e) => setNewSize(e.target.value)}
              placeholder="Ex: M"
              disabled={disabled}
            />
          </div>
          <div>
            <Label htmlFor="variant-stock" className="text-xs">Estoque</Label>
            <Input
              id="variant-stock"
              type="number"
              min="0"
              value={newStock}
              onChange={(e) => setNewStock(e.target.value)}
              placeholder="0"
              disabled={disabled}
            />
          </div>
          <div className="flex items-end">
            <Button
              type="button"
              onClick={addVariant}
              disabled={disabled || !newColor.trim() || !newSize.trim() || !newStock}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar
            </Button>
          </div>
        </div>
      </div>

      {variants.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          Nenhuma variante adicionada. Adicione cores, tamanhos e suas quantidades.
        </p>
      )}
    </div>
  );
};
