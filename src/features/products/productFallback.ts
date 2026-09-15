import type { ProductDetail, ProductFilter, ProductSummary } from '@/features/products/types';

type ProductLoader = (filter: ProductFilter) => Promise<ProductSummary[]>;
type ProductDetailLoader = (slug: string) => Promise<ProductDetail>;
type ProductFallback = (filter: ProductFilter) => ProductSummary[];
type ProductDetailFallback = (slug: string) => ProductDetail | undefined;

export async function loadProductsOrMock(
  loadRemote: ProductLoader,
  loadMock: ProductFallback,
  filter: ProductFilter,
  preferMock = false,
): Promise<ProductSummary[]> {
  if (preferMock) {
    return loadMock(filter);
  }

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
  preferMock = false,
): Promise<ProductDetail> {
  if (preferMock) {
    const mockProduct = loadMock(slug);

    if (mockProduct) {
      return mockProduct;
    }

    throw new Error('mock product not found');
  }

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
