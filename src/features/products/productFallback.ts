import type { ProductDetail, ProductFilter, ProductSummary } from '@/features/products/types';

type ProductLoader = (filter: ProductFilter) => Promise<ProductSummary[]>;
type ProductDetailLoader = (slug: string) => Promise<ProductDetail>;
type ProductFallback = (filter: ProductFilter) => ProductSummary[];
type ProductDetailFallback = (slug: string) => ProductDetail | undefined;

export async function loadProductsOrMock(
  loadRemote: ProductLoader,
  loadMock: ProductFallback,
  filter: ProductFilter,
): Promise<ProductSummary[]> {
  try {
    return await loadRemote(filter);
  } catch {
    return loadMock(filter);
  }
}

export async function loadProductOrMock(
  loadRemote: ProductDetailLoader,
  loadMock: ProductDetailFallback,
  slug: string,
): Promise<ProductDetail> {
  try {
    return await loadRemote(slug);
  } catch (error) {
    const mockProduct = loadMock(slug);

    if (mockProduct) {
      return mockProduct;
    }

    throw error;
  }
}
