export interface ProductVariant {
  color: string;
  size: string;
  stock: number;
}

export interface Product {
  id: string;
  name: string;
  price: string;
  price_value: number;
  image: string;
  images: string[];
  video?: string | null;
  category: string;
  description: string | null;
  variants: ProductVariant[];
  is_visible: boolean;
  created_at: string | null;
  updated_at: string | null;
}

export interface CartItem extends Product {
  quantity: number;
  selectedColor: string;
  selectedSize: string;
}
