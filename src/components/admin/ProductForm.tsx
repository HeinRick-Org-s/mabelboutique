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
import { Upload, Loader2, X } from "lucide-react";
import { productSchema } from "@/lib/validations/product";
import { toast } from "@/hooks/use-toast";
import { Product } from "@/hooks/useProducts";
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
  onSubmit: (data: Omit<Product, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  onCancel: () => void;
}

const ProductForm = ({ product, onSubmit, onCancel }: ProductFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploadedImages, setUploadedImages] = useState<string[]>(product?.images || []);
  const [uploadedVideo, setUploadedVideo] = useState<string>(product?.video || "");
  const [imagePreviews, setImagePreviews] = useState<string[]>(product?.images || []);
  const [videoPreviews, setVideoPreviews] = useState<string>(product?.video || "");
  
  const [formData, setFormData] = useState({
    name: product?.name || "",
    price: product?.price || "",
    category: product?.category || "Vestidos",
    description: product?.description || "",
    sizes: product?.sizes?.join(", ") || "",
    colors: product?.colors?.join(", ") || "",
  });

  const parsePrice = (priceStr: string): number => {
    const cleanPrice = priceStr.replace(/[R$\s.]/g, "").replace(",", ".");
    return parseFloat(cleanPrice) || 0;
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (uploadedImages.length + files.length > 4) {
      toast({
        title: "Limite excedido",
        description: "Você pode adicionar no máximo 4 imagens.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    const newImageUrls: string[] = [];
    const newPreviews: string[] = [];

    try {
      for (const file of Array.from(files)) {
        if (uploadedImages.length + newImageUrls.length >= 4) break;

        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
        const filePath = `products/${fileName}`;

        const { error: uploadError, data } = await supabase.storage
          .from('product-media')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('product-media')
          .getPublicUrl(filePath);

        newImageUrls.push(publicUrl);
        newPreviews.push(URL.createObjectURL(file));
      }

      setUploadedImages([...uploadedImages, ...newImageUrls]);
      setImagePreviews([...imagePreviews, ...newPreviews]);
      
      toast({
        title: "Imagens enviadas",
        description: `${newImageUrls.length} imagem(ns) enviada(s) com sucesso.`,
      });
    } catch (error: any) {
      toast({
        title: "Erro ao enviar imagens",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    try {
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

      setUploadedVideo(publicUrl);
      setVideoPreviews(URL.createObjectURL(file));
      
      toast({
        title: "Vídeo enviado",
        description: "Vídeo enviado com sucesso.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao enviar vídeo",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = (index: number) => {
    const newImages = uploadedImages.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    setUploadedImages(newImages);
    setImagePreviews(newPreviews);
  };

  const removeVideo = () => {
    setUploadedVideo("");
    setVideoPreviews("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setIsSubmitting(true);

    try {
      const sizesArray = formData.sizes.split(",").map(s => s.trim()).filter(Boolean);
      const colorsArray = formData.colors.split(",").map(c => c.trim()).filter(Boolean);

      if (uploadedImages.length === 0) {
        toast({
          title: "Imagens obrigatórias",
          description: "Por favor, adicione pelo menos uma imagem do produto.",
          variant: "destructive",
        });
        return;
      }

      const productData = {
        name: formData.name,
        price: formData.price,
        price_value: parsePrice(formData.price),
        category: formData.category,
        description: formData.description,
        sizes: sizesArray,
        colors: colorsArray,
        image: uploadedImages[0],
        images: uploadedImages,
        video: uploadedVideo || "",
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
            disabled={isSubmitting || isUploading || uploadedImages.length >= 4}
            className="hidden"
          />
          <Label
            htmlFor="images"
            className={`flex items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
              uploadedImages.length >= 4 
                ? 'border-muted bg-muted cursor-not-allowed' 
                : 'border-border hover:border-primary hover:bg-muted/50'
            }`}
          >
            {isUploading ? (
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            ) : (
              <div className="text-center">
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  {uploadedImages.length >= 4 
                    ? "Limite de 4 imagens atingido" 
                    : "Clique para adicionar imagens"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {uploadedImages.length}/4 imagens
                </p>
              </div>
            )}
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
            disabled={isSubmitting || isUploading || !!uploadedVideo}
            className="hidden"
          />
          <Label
            htmlFor="video"
            className={`flex items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
              uploadedVideo 
                ? 'border-muted bg-muted cursor-not-allowed' 
                : 'border-border hover:border-primary hover:bg-muted/50'
            }`}
          >
            {isUploading ? (
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            ) : (
              <div className="text-center">
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  {uploadedVideo ? "Vídeo adicionado" : "Clique para adicionar vídeo"}
                </p>
              </div>
            )}
          </Label>
        </div>
        
        {/* Video Preview */}
        {videoPreviews && (
          <div className="relative group mt-4">
            <video
              src={videoPreviews}
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
