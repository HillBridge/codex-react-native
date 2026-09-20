import { apiClient } from '@/shared/api';
import { useAuthStore } from '@/features/auth/store';
import { productCatalogCache } from '@/features/products/expoProductCatalogCache';
import { getMockProduct, getMockProducts } from '@/features/products/mockProducts';
import { loadProductCatalog } from '@/features/products/productCatalogLoader';
import { loadProductOrMock } from '@/features/products/productFallback';
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

function getCatalogOwnerKey() {
  return useAuthStore.getState().session?.user.id ?? 'guest';
}

export function clearCachedProductsForUser(userId: string) {
  return productCatalogCache.clear(userId);
}

export function getProducts(filter: ProductFilter = {}, options: ProductRequestOptions = {}) {
  const shouldCacheCatalog = !filter.category && !filter.featured && !filter.q?.trim();

  return loadProductCatalog({
    filter,
    loadCache: productCatalogCache.read,
    loadMock: getMockProducts,
    loadRemote: () => requestProducts(filter, options),
    ownerKey: getCatalogOwnerKey(),
    preferMock: USE_MOCK_DATA,
    saveCache: shouldCacheCatalog ? productCatalogCache.save : async () => undefined,
  });
}

export function getProduct(slug: string, options: ProductRequestOptions = {}) {
  return loadProductOrMock(
    () => requestProduct(slug, options),
    getMockProduct,
    slug,
    USE_MOCK_DATA,
  );
}
