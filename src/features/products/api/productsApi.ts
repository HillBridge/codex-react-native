import { apiClient } from '@/shared/api';
import { getMockProduct, getMockProducts } from '@/features/products/mockProducts';
import { loadProductOrMock, loadProductsOrMock } from '@/features/products/productFallback';
import type { ProductDetail, ProductFilter, ProductSummary } from '@/features/products/types';
import { USE_MOCK_DATA } from '@/shared/constants/env';
type Envelope<T> = { data: T; traceId: string };
type ProductRequestOptions = { signal?: AbortSignal };

async function requestProducts(filter: ProductFilter, { signal }: ProductRequestOptions = {}) {
  const response = await apiClient.get<Envelope<ProductSummary[]>>('/mobile/v1/products', {
    params: filter,
    signal,
  });
  return response.data.data;
}

async function requestProduct(slug: string, { signal }: ProductRequestOptions = {}) {
  const response = await apiClient.get<Envelope<ProductDetail>>(`/mobile/v1/products/${slug}`, {
    signal,
  });
  return response.data.data;
}

export function getProducts(filter: ProductFilter = {}, options: ProductRequestOptions = {}) {
  return loadProductsOrMock(
    () => requestProducts(filter, options),
    getMockProducts,
    filter,
    USE_MOCK_DATA,
  );
}

export function getProduct(slug: string, options: ProductRequestOptions = {}) {
  return loadProductOrMock(
    () => requestProduct(slug, options),
    getMockProduct,
    slug,
    USE_MOCK_DATA,
  );
}
