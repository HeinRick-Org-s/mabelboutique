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
import { X, Upload } from "lucide-react";

interface Product {
  id: number;
  name: string;
  price: string;
  category: string;
  description?: string;
  sizes?: string[];
  colors?: string[];
  image: string;
  images?: string[];
  video?: string;
}

interface ProductFormProps {
  product?: Product;
  onSubmit: (data: Partial<Product>) => void;
  onCancel: () => void;
}

const ProductForm = ({ product, onSubmit, onCancel }: ProductFormProps) => {
  const [formData, setFormData] = useState({
    name: product?.name || "",
    price: product?.price || "",
    category: product?.category || "vestidos",
    description: product?.description || "",
    sizes: product?.sizes?.join(", ") || "",
    colors: product?.colors?.join(", ") || "",
  });

  const [imageFiles, setImageFiles] = useState<string[]>([]);
  const [videoFile, setVideoFile] = useState<string>("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const productData = {
      ...formData,
      sizes: formData.sizes.split(",").map(s => s.trim()),
      colors: formData.colors.split(",").map(c => c.trim()),
      // TODO: Upload real de imagens e vídeo para Firebase Storage
      // const imageUrls = await Promise.all(imageFiles.map(file => uploadToStorage(file)))
      // const videoUrl = videoFile ? await uploadToStorage(videoFile) : undefined
      images: imageFiles.length > 0 ? imageFiles : product?.images,
      video: videoFile || product?.video,
    };
    
    onSubmit(productData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Name */}
      <div>
        <Label htmlFor="name">Nome do Produto</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
          className="mt-2"
        />
      </div>

      {/* Price */}
      <div>
        <Label htmlFor="price">Preço</Label>
        <Input
          id="price"
          value={formData.price}
          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
          placeholder="R$ 0,00"
          required
          className="mt-2"
        />
      </div>

      {/* Category */}
      <div>
        <Label htmlFor="category">Categoria</Label>
        <Select
          value={formData.category}
          onValueChange={(value) => setFormData({ ...formData, category: value })}
        >
          <SelectTrigger className="mt-2">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="vestidos">Vestidos</SelectItem>
            <SelectItem value="blusas">Blusas</SelectItem>
            <SelectItem value="calcas">Calças</SelectItem>
            <SelectItem value="saias">Saias</SelectItem>
            <SelectItem value="conjuntos">Conjuntos</SelectItem>
            <SelectItem value="acessorios">Acessórios</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Description */}
      <div>
        <Label htmlFor="description">Descrição</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={4}
          className="mt-2"
          required
        />
      </div>

      {/* Sizes */}
      <div>
        <Label htmlFor="sizes">Tamanhos (separados por vírgula)</Label>
        <Input
          id="sizes"
          value={formData.sizes}
          onChange={(e) => setFormData({ ...formData, sizes: e.target.value })}
          placeholder="P, M, G, GG"
          required
          className="mt-2"
        />
      </div>

      {/* Colors */}
      <div>
        <Label htmlFor="colors">Cores (separadas por vírgula)</Label>
        <Input
          id="colors"
          value={formData.colors}
          onChange={(e) => setFormData({ ...formData, colors: e.target.value })}
          placeholder="Preto, Branco, Verde"
          required
          className="mt-2"
        />
      </div>

      {/* Images Upload */}
      <div>
        <Label>Imagens do Produto</Label>
        <div className="mt-2 border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer">
          <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground mb-1">
            Clique para fazer upload ou arraste as imagens
          </p>
          <p className="text-xs text-muted-foreground">
            PNG, JPG até 5MB (mínimo 3 imagens)
          </p>
          <input
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              // TODO: Implementar preview e upload real
              console.log("Arquivos selecionados:", e.target.files);
            }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          <strong>Firebase Storage:</strong> Upload será feito via Firebase Storage com URLs retornadas
        </p>
      </div>

      {/* Video Upload */}
      <div>
        <Label>Vídeo do Produto (Opcional)</Label>
        <div className="mt-2 border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer">
          <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground mb-1">
            Clique para fazer upload do vídeo
          </p>
          <p className="text-xs text-muted-foreground">
            MP4 até 50MB
          </p>
          <input
            type="file"
            accept="video/*"
            className="hidden"
            onChange={(e) => {
              // TODO: Implementar preview e upload real
              console.log("Vídeo selecionado:", e.target.files?.[0]);
            }}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-border">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">
          {product ? "Salvar Alterações" : "Adicionar Produto"}
        </Button>
      </div>
    </form>
  );
};

export default ProductForm;
