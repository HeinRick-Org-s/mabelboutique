import product1 from "@/assets/product-1.jpg";
import product2 from "@/assets/product-2.jpg";
import product3 from "@/assets/product-3.jpg";
import product4 from "@/assets/product-4.jpg";
import product5 from "@/assets/product-5.jpg";
import product6 from "@/assets/product-6.jpg";
import { Product } from "@/contexts/CartContext";

export const products: Product[] = [
  {
    id: 1,
    name: "Blazer Verde Musgo",
    price: "R$ 1.299,00",
    priceValue: 1299,
    image: product1,
    category: "Blazers",
    description: "Blazer elegante em verde musgo, ideal para ocasiões formais e profissionais.",
  },
  {
    id: 2,
    name: "Blusa Seda Branca",
    price: "R$ 899,00",
    priceValue: 899,
    image: product2,
    category: "Blusas",
    description: "Blusa de seda branca com caimento perfeito e toque luxuoso.",
  },
  {
    id: 3,
    name: "Calça Pantalona Verde",
    price: "R$ 1.099,00",
    priceValue: 1099,
    image: product3,
    category: "Calças",
    description: "Calça pantalona em verde musgo com corte amplo e confortável.",
  },
  {
    id: 4,
    name: "Vestido Elegante Creme",
    price: "R$ 1.499,00",
    priceValue: 1499,
    image: product4,
    category: "Vestidos",
    description: "Vestido longo em tom creme, perfeito para eventos especiais.",
  },
  {
    id: 5,
    name: "Suéter Verde Musgo",
    price: "R$ 799,00",
    priceValue: 799,
    image: product5,
    category: "Tricot",
    description: "Suéter em tricot verde musgo, aconchegante e elegante.",
  },
  {
    id: 6,
    name: "Casaco Alfaiataria Branco",
    price: "R$ 1.899,00",
    priceValue: 1899,
    image: product6,
    category: "Casacos",
    description: "Casaco de alfaiataria branco com corte estruturado e refinado.",
  },
  {
    id: 7,
    name: "Camisa Linho Bege",
    price: "R$ 699,00",
    priceValue: 699,
    image: product1,
    category: "Camisas",
    description: "Camisa de linho em tom bege, leve e versátil.",
  },
  {
    id: 8,
    name: "Saia Midi Verde",
    price: "R$ 849,00",
    priceValue: 849,
    image: product2,
    category: "Saias",
    description: "Saia midi em verde musgo com acabamento impecável.",
  },
  {
    id: 9,
    name: "Conjunto Tricot Creme",
    price: "R$ 1.599,00",
    priceValue: 1599,
    image: product3,
    category: "Conjuntos",
    description: "Conjunto de tricot creme com blusa e saia coordenadas.",
  },
  {
    id: 10,
    name: "Jaqueta Couro Ecológico",
    price: "R$ 1.999,00",
    priceValue: 1999,
    image: product4,
    category: "Jaquetas",
    description: "Jaqueta em couro ecológico com design moderno.",
  },
  {
    id: 11,
    name: "Macacão Longo Verde",
    price: "R$ 1.399,00",
    priceValue: 1399,
    image: product5,
    category: "Macacões",
    description: "Macacão longo em verde musgo com amarração na cintura.",
  },
  {
    id: 12,
    name: "Cardigan Lã Merino",
    price: "R$ 999,00",
    priceValue: 999,
    image: product6,
    category: "Tricot",
    description: "Cardigan em lã merino com botões frontais.",
  },
];

export const featuredProducts = products.slice(0, 6);
