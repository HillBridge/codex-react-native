import { apiClient } from '@/shared/api';
import type { ProductDetail, ProductFilter, ProductSummary } from '@/features/products/types';
type Envelope<T> = { data: T; traceId: string };
export async function getProducts(filter: ProductFilter = {}) {
  const response = await apiClient.get<Envelope<ProductSummary[]>>('/mobile/v1/products', {
    params: filter,
  });
  return response.data.data;
}
export async function getProduct(slug: string) {
  const response = await apiClient.get<Envelope<ProductDetail>>(`/mobile/v1/products/${slug}`);
  return response.data.data;
}
