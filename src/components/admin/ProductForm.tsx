import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, Loader2 } from "lucide-react";
import { productSchema } from "@/lib/validations/product";
import { toast } from "@/hooks/use-toast";
import { Product } from "@/hooks/useProducts";

const categories = [
  "Vestidos",
  "Blusas",
  "Calças",
  "Saias",
  "Conjuntos",
  "Blazers",
  "Casacos",
  "Jaquetas",
  "Macacões",
  "Tricot",
  "Camisas",
];

interface ProductFormProps {
  product?: Product;
  onSubmit: (data: Omit<Product, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  onCancel: () => void;
}

const ProductForm = ({ product, onSubmit, onCancel }: ProductFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [formData, setFormData] = useState({
    name: product?.name || "",
    price: product?.price || "",
    category: product?.category || "Vestidos",
    description: product?.description || "",
    sizes: product?.sizes?.join(", ") || "",
    colors: product?.colors?.join(", ") || "",
    imageUrl: product?.image || "",
    imageUrls: product?.images?.join(", ") || "",
    videoUrl: product?.video || "",
  });

  const parsePrice = (priceStr: string): number => {
    const cleanPrice = priceStr.replace(/[R$\s.]/g, "").replace(",", ".");
    return parseFloat(cleanPrice) || 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setIsSubmitting(true);

    try {
      const sizesArray = formData.sizes.split(",").map(s => s.trim()).filter(Boolean);
      const colorsArray = formData.colors.split(",").map(c => c.trim()).filter(Boolean);
      const imagesArray = formData.imageUrls.split(",").map(u => u.trim()).filter(Boolean);

      const productData = {
        name: formData.name,
        price: formData.price,
        price_value: parsePrice(formData.price),
        category: formData.category,
        description: formData.description,
        sizes: sizesArray,
        colors: colorsArray,
        image: formData.imageUrl || imagesArray[0] || "",
        images: imagesArray.length > 0 ? imagesArray : [formData.imageUrl],
        video: formData.videoUrl || "",
      };

      const validation = productSchema.safeParse(productData);

      if (!validation.success) {
        const fieldErrors: Record<string, string> = {};
        validation.error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0].toString()] = err.message;
          }
        });
        setErrors(fieldErrors);
        toast({
          title: "Erro de validação",
          description: "Por favor, corrija os erros no formulário.",
          variant: "destructive",
        });
        return;
      }

      await onSubmit(validation.data as Omit<Product, 'id' | 'created_at' | 'updated_at'>);
    } catch (error: any) {
      toast({
        title: "Erro ao salvar produto",
        description: error.message || "Ocorreu um erro ao salvar o produto.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Name */}
      <div>
        <Label htmlFor="name">Nome do Produto *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className={`mt-2 ${errors.name ? 'border-destructive' : ''}`}
          disabled={isSubmitting}
        />
        {errors.name && <p className="text-sm text-destructive mt-1">{errors.name}</p>}
      </div>

      {/* Price */}
      <div>
        <Label htmlFor="price">Preço *</Label>
        <Input
          id="price"
          value={formData.price}
          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
          placeholder="R$ 1.299,00"
          className={`mt-2 ${errors.price ? 'border-destructive' : ''}`}
          disabled={isSubmitting}
        />
        {errors.price && <p className="text-sm text-destructive mt-1">{errors.price}</p>}
        <p className="text-xs text-muted-foreground mt-1">Formato: R$ 1.299,00</p>
      </div>

      {/* Category */}
      <div>
        <Label htmlFor="category">Categoria *</Label>
        <Select
          value={formData.category}
          onValueChange={(value) => setFormData({ ...formData, category: value })}
          disabled={isSubmitting}
        >
          <SelectTrigger className={`mt-2 ${errors.category ? 'border-destructive' : ''}`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.category && <p className="text-sm text-destructive mt-1">{errors.category}</p>}
      </div>

      {/* Description */}
      <div>
        <Label htmlFor="description">Descrição *</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={4}
          className={`mt-2 ${errors.description ? 'border-destructive' : ''}`}
          disabled={isSubmitting}
        />
        {errors.description && <p className="text-sm text-destructive mt-1">{errors.description}</p>}
      </div>

      {/* Sizes */}
      <div>
        <Label htmlFor="sizes">Tamanhos * (separados por vírgula)</Label>
        <Input
          id="sizes"
          value={formData.sizes}
          onChange={(e) => setFormData({ ...formData, sizes: e.target.value })}
          placeholder="PP, P, M, G, GG"
          className={`mt-2 ${errors.sizes ? 'border-destructive' : ''}`}
          disabled={isSubmitting}
        />
        {errors.sizes && <p className="text-sm text-destructive mt-1">{errors.sizes}</p>}
      </div>

      {/* Colors */}
      <div>
        <Label htmlFor="colors">Cores * (separadas por vírgula)</Label>
        <Input
          id="colors"
          value={formData.colors}
          onChange={(e) => setFormData({ ...formData, colors: e.target.value })}
          placeholder="Verde Musgo, Preto, Bege"
          className={`mt-2 ${errors.colors ? 'border-destructive' : ''}`}
          disabled={isSubmitting}
        />
        {errors.colors && <p className="text-sm text-destructive mt-1">{errors.colors}</p>}
      </div>

      {/* Image URL */}
      <div>
        <Label htmlFor="imageUrl">URL da Imagem Principal *</Label>
        <Input
          id="imageUrl"
          value={formData.imageUrl}
          onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
          placeholder="https://exemplo.com/imagem.jpg"
          className={`mt-2 ${errors.image ? 'border-destructive' : ''}`}
          disabled={isSubmitting}
        />
        {errors.image && <p className="text-sm text-destructive mt-1">{errors.image}</p>}
      </div>

      {/* Images URLs */}
      <div>
        <Label htmlFor="imageUrls">URLs das Imagens * (separadas por vírgula)</Label>
        <Textarea
          id="imageUrls"
          value={formData.imageUrls}
          onChange={(e) => setFormData({ ...formData, imageUrls: e.target.value })}
          placeholder="https://exemplo.com/img1.jpg, https://exemplo.com/img2.jpg"
          rows={3}
          className={`mt-2 ${errors.images ? 'border-destructive' : ''}`}
          disabled={isSubmitting}
        />
        {errors.images && <p className="text-sm text-destructive mt-1">{errors.images}</p>}
        <p className="text-xs text-muted-foreground mt-1">
          Adicione pelo menos uma URL de imagem
        </p>
      </div>

      {/* Video URL */}
      <div>
        <Label htmlFor="videoUrl">URL do Vídeo (Opcional)</Label>
        <Input
          id="videoUrl"
          value={formData.videoUrl}
          onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
          placeholder="https://exemplo.com/video.mp4"
          className={`mt-2 ${errors.video ? 'border-destructive' : ''}`}
          disabled={isSubmitting}
        />
        {errors.video && <p className="text-sm text-destructive mt-1">{errors.video}</p>}
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-border">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {product ? "Salvar Alterações" : "Adicionar Produto"}
        </Button>
      </div>
    </form>
  );
};

export default ProductForm;
