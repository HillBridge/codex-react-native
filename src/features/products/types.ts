export type ProductSummary = {
  id: string;
  slug: string;
  name: string;
  series: string;
  category: string;
  summary: string;
  price: number;
  featured: boolean;
  image: string;
};
export type ProductDetail = ProductSummary & {
  description: string;
  stock: number;
  highlights: string[];
};
export type ProductFilter = { category?: string; featured?: boolean; q?: string };
