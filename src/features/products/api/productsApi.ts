import { apiClient } from '@/shared/api';
import { getMockProduct, getMockProducts } from '@/features/products/mockProducts';
import { loadProductOrMock, loadProductsOrMock } from '@/features/products/productFallback';
import type { ProductDetail, ProductFilter, ProductSummary } from '@/features/products/types';
type Envelope<T> = { data: T; traceId: string };

async function requestProducts(filter: ProductFilter) {
  const response = await apiClient.get<Envelope<ProductSummary[]>>('/mobile/v1/products', {
    params: filter,
  });
  return response.data.data;
}

async function requestProduct(slug: string) {
  const response = await apiClient.get<Envelope<ProductDetail>>(`/mobile/v1/products/${slug}`);
  return response.data.data;
}

export function getProducts(filter: ProductFilter = {}) {
  return loadProductsOrMock(requestProducts, getMockProducts, filter);
}

export function getProduct(slug: string) {
  return loadProductOrMock(requestProduct, getMockProduct, slug);
}
