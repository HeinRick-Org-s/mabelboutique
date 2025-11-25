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
import { Checkbox } from "@/components/ui/checkbox";
import { Upload, Loader2, X } from "lucide-react";
import { productSchema } from "@/lib/validations/product";
import { toast } from "@/hooks/use-toast";
import { Product } from "@/types/product";
import { TablesInsert } from "@/integrations/supabase/types";
import { supabase } from "@/integrations/supabase/client";

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
  onSubmit: (data: TablesInsert<'products'>) => Promise<void>;
  onCancel: () => void;
}

const ProductForm = ({ product, onSubmit, onCancel }: ProductFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Gerenciamento de imagens
  const [existingImages, setExistingImages] = useState<string[]>(product?.images || []);
  const [pendingImages, setPendingImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>(product?.images || []);
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([]);
  
  // Gerenciamento de vídeo
  const [existingVideo, setExistingVideo] = useState<string>(product?.video || "");
  const [pendingVideo, setPendingVideo] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string>(product?.video || "");
  const [videoToDelete, setVideoToDelete] = useState<string>("");
  
  const [formData, setFormData] = useState({
    name: product?.name || "",
    price: product?.price || "",
    category: product?.category || "Vestidos",
    description: product?.description || "",
    sizes: product?.sizes?.join(", ") || "",
    colors: product?.colors?.join(", ") || "",
    stock: product?.stock?.toString() || "0",
    is_visible: product?.is_visible ?? true,
  });

  const parsePrice = (priceStr: string): number => {
    const cleanPrice = priceStr.replace(/[R$\s.]/g, "").replace(",", ".");
    return parseFloat(cleanPrice) || 0;
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const currentTotal = existingImages.length + pendingImages.length;
    if (currentTotal + files.length > 4) {
      toast({
        title: "Limite excedido",
        description: "Você pode adicionar no máximo 4 imagens.",
        variant: "destructive",
      });
      return;
    }

    const newFiles: File[] = [];
    const newPreviews: string[] = [];

    for (const file of Array.from(files)) {
      if (currentTotal + newFiles.length >= 4) break;
      newFiles.push(file);
      newPreviews.push(URL.createObjectURL(file));
    }

    setPendingImages([...pendingImages, ...newFiles]);
    setImagePreviews([...imagePreviews, ...newPreviews]);
    
    toast({
      title: "Imagens selecionadas",
      description: `${newFiles.length} imagem(ns) selecionada(s). Clique em salvar para enviar.`,
    });
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPendingVideo(file);
    setVideoPreview(URL.createObjectURL(file));
    
    toast({
      title: "Vídeo selecionado",
      description: "Vídeo selecionado. Clique em salvar para enviar.",
    });
  };

  const removeImage = (index: number) => {
    const existingCount = existingImages.length;
    
    if (index < existingCount) {
      // É uma imagem existente no storage
      const imageUrl = existingImages[index];
      setImagesToDelete([...imagesToDelete, imageUrl]);
      setExistingImages(existingImages.filter((_, i) => i !== index));
    } else {
      // É uma imagem pendente
      const pendingIndex = index - existingCount;
      setPendingImages(pendingImages.filter((_, i) => i !== pendingIndex));
    }
    
    setImagePreviews(imagePreviews.filter((_, i) => i !== index));
  };

  const removeVideo = () => {
    if (existingVideo) {
      setVideoToDelete(existingVideo);
      setExistingVideo("");
    }
    setPendingVideo(null);
    setVideoPreview("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setIsSubmitting(true);

    try {
      const sizesArray = formData.sizes.split(",").map(s => s.trim()).filter(Boolean);
      const colorsArray = formData.colors.split(",").map(c => c.trim()).filter(Boolean);

      const totalImages = existingImages.length + pendingImages.length;
      if (totalImages === 0) {
        toast({
          title: "Imagens obrigatórias",
          description: "Por favor, adicione pelo menos uma imagem do produto.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      // 1. Deletar arquivos marcados para exclusão
      for (const imageUrl of imagesToDelete) {
        try {
          const path = imageUrl.split('/product-media/')[1];
          if (path) {
            await supabase.storage.from('product-media').remove([path]);
          }
        } catch (error) {
          console.error('Erro ao deletar imagem:', error);
        }
      }

      if (videoToDelete) {
        try {
          const path = videoToDelete.split('/product-media/')[1];
          if (path) {
            await supabase.storage.from('product-media').remove([path]);
          }
        } catch (error) {
          console.error('Erro ao deletar vídeo:', error);
        }
      }

      // 2. Upload de novas imagens
      const uploadedImageUrls: string[] = [...existingImages];
      for (const file of pendingImages) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
        const filePath = `products/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('product-media')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('product-media')
          .getPublicUrl(filePath);

        uploadedImageUrls.push(publicUrl);
      }

      // 3. Upload de novo vídeo
      let finalVideoUrl = existingVideo;
      if (pendingVideo) {
        const fileExt = pendingVideo.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
        const filePath = `products/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('product-media')
          .upload(filePath, pendingVideo);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('product-media')
          .getPublicUrl(filePath);

        finalVideoUrl = publicUrl;
      }

      const productData = {
        name: formData.name,
        price: formData.price,
        price_value: parsePrice(formData.price),
        category: formData.category,
        description: formData.description,
        sizes: sizesArray,
        colors: colorsArray,
        image: uploadedImageUrls[0],
        images: uploadedImageUrls,
        video: finalVideoUrl || "",
        stock: parseInt(formData.stock) || 0,
        is_visible: formData.is_visible,
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

      {/* Stock */}
      <div>
        <Label htmlFor="stock">Estoque *</Label>
        <Input
          id="stock"
          type="number"
          min="0"
          value={formData.stock}
          onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
          placeholder="0"
          className={`mt-2 ${errors.stock ? 'border-destructive' : ''}`}
          disabled={isSubmitting}
        />
        {errors.stock && <p className="text-sm text-destructive mt-1">{errors.stock}</p>}
        <p className="text-xs text-muted-foreground mt-1">Quantidade disponível em estoque</p>
      </div>

      {/* Visibility */}
      <div className="flex items-center space-x-2">
        <Checkbox
          id="is_visible"
          checked={formData.is_visible}
          onCheckedChange={(checked) => setFormData({ ...formData, is_visible: checked as boolean })}
          disabled={isSubmitting}
        />
        <Label htmlFor="is_visible" className="cursor-pointer">
          Produto visível no site
        </Label>
      </div>

      {/* Images Upload */}
      <div>
        <Label htmlFor="images">Imagens do Produto * (máximo 4)</Label>
        <div className="mt-2">
          <Input
            id="images"
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            multiple
            onChange={handleImageUpload}
            disabled={isSubmitting || (existingImages.length + pendingImages.length) >= 4}
            className="hidden"
          />
          <Label
            htmlFor="images"
            className={`flex items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
              (existingImages.length + pendingImages.length) >= 4 
                ? 'border-muted bg-muted cursor-not-allowed' 
                : 'border-border hover:border-primary hover:bg-muted/50'
            }`}
          >
            <div className="text-center">
              <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {(existingImages.length + pendingImages.length) >= 4 
                  ? "Limite de 4 imagens atingido" 
                  : "Clique para adicionar imagens"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {existingImages.length + pendingImages.length}/4 imagens
              </p>
            </div>
          </Label>
        </div>
        
        {/* Image Previews */}
        {imagePreviews.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
            {imagePreviews.map((preview, index) => (
              <div key={index} className="relative group">
                <img
                  src={preview}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-32 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  disabled={isSubmitting}
                >
                  <X className="h-4 w-4" />
                </button>
                {index === 0 && (
                  <div className="absolute bottom-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
                    Principal
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        {errors.images && <p className="text-sm text-destructive mt-1">{errors.images}</p>}
      </div>

      {/* Video Upload */}
      <div>
        <Label htmlFor="video">Vídeo do Produto (Opcional)</Label>
        <div className="mt-2">
          <Input
            id="video"
            type="file"
            accept="video/mp4,video/webm"
            onChange={handleVideoUpload}
            disabled={isSubmitting || !!(existingVideo || pendingVideo)}
            className="hidden"
          />
          <Label
            htmlFor="video"
            className={`flex items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
              (existingVideo || pendingVideo)
                ? 'border-muted bg-muted cursor-not-allowed' 
                : 'border-border hover:border-primary hover:bg-muted/50'
            }`}
          >
            <div className="text-center">
              <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {(existingVideo || pendingVideo) ? "Vídeo adicionado" : "Clique para adicionar vídeo"}
              </p>
            </div>
          </Label>
        </div>
        
        {/* Video Preview */}
        {videoPreview && (
          <div className="relative group mt-4">
            <video
              src={videoPreview}
              controls
              className="w-full h-48 object-cover rounded-lg"
            />
            <button
              type="button"
              onClick={removeVideo}
              className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              disabled={isSubmitting}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
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
