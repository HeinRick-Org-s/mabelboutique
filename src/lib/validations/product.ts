import { z } from "zod";

export const productSchema = z.object({
  name: z.string()
    .trim()
    .min(3, { message: "Nome deve ter pelo menos 3 caracteres" })
    .max(100, { message: "Nome deve ter no máximo 100 caracteres" }),
  
  price: z.string()
    .trim()
    .min(1, { message: "Preço é obrigatório" })
    .regex(/^R\$\s?\d{1,3}(\.\d{3})*(,\d{2})?$/, { 
      message: "Formato inválido. Use: R$ 1.299,00" 
    }),
  
  price_value: z.number()
    .positive({ message: "Valor deve ser positivo" })
    .min(0.01, { message: "Valor mínimo é R$ 0,01" }),
  
  category: z.string()
    .min(1, { message: "Categoria é obrigatória" }),
  
  description: z.string()
    .trim()
    .min(10, { message: "Descrição deve ter pelo menos 10 caracteres" })
    .max(1000, { message: "Descrição deve ter no máximo 1000 caracteres" }),
  
  sizes: z.array(z.string().trim().min(1))
    .min(1, { message: "Adicione pelo menos um tamanho" }),
  
  colors: z.array(z.string().trim().min(1))
    .min(1, { message: "Adicione pelo menos uma cor" }),
  
  image: z.string()
    .url({ message: "URL de imagem inválida" }),
  
  images: z.array(z.string().url())
    .min(1, { message: "Adicione pelo menos uma imagem" }),
  
  video: z.string()
    .url({ message: "URL de vídeo inválida" })
    .optional()
    .or(z.literal("")),
  
  stock: z.number()
    .int({ message: "Estoque deve ser um número inteiro" })
    .min(0, { message: "Estoque não pode ser negativo" }),
  
  is_visible: z.boolean(),
});

export type ProductFormData = z.infer<typeof productSchema>;
