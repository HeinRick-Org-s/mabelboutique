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
  sizes: string[] | null;
  colors: string[] | null;
  stock: number;
  is_visible: boolean;
  created_at: string | null;
  updated_at: string | null;
}

export interface CartItem extends Product {
  quantity: number;
}
