import type { ProductFilter, ProductSummary } from './types';

type CachedProductCatalog = {
  items: ProductSummary[];
  updatedAt: number;
};

export type ProductCatalogLoadResult = {
  items: ProductSummary[];
  source: 'cache' | 'mock' | 'network';
  updatedAt?: number;
};

type ProductCatalogLoaderOptions = {
  filter: ProductFilter;
  loadCache: (ownerKey: string) => Promise<CachedProductCatalog | null>;
  loadMock: (filter: ProductFilter) => ProductSummary[];
  loadRemote: (filter: ProductFilter) => Promise<ProductSummary[]>;
  ownerKey: string;
  preferMock?: boolean;
  saveCache: (ownerKey: string, items: ProductSummary[]) => Promise<void>;
};

function filterProducts(items: ProductSummary[], filter: ProductFilter) {
  const query = filter.q?.trim().toLowerCase() ?? '';

  return items.filter((product) => {
    if (filter.featured !== undefined && product.featured !== filter.featured) return false;
    if (filter.category && product.category !== filter.category) return false;

    return (
      !query ||
      [product.name, product.series, product.category, product.summary]
        .join(' ')
        .toLowerCase()
        .includes(query)
    );
  });
}

export async function loadProductCatalog({
  filter,
  loadCache,
  loadMock,
  loadRemote,
  ownerKey,
  preferMock = false,
  saveCache,
}: ProductCatalogLoaderOptions): Promise<ProductCatalogLoadResult> {
  if (preferMock) {
    return { items: loadMock(filter), source: 'mock' };
  }

  try {
    const items = await loadRemote(filter);

    try {
      await saveCache(ownerKey, items);
    } catch {
      // A successful request stays usable even when writing the offline cache fails.
    }

    return { items, source: 'network' };
  } catch {
    try {
      const cached = await loadCache(ownerKey);

      if (cached) {
        return {
          items: filterProducts(cached.items, filter),
          source: 'cache',
          updatedAt: cached.updatedAt,
        };
      }
    } catch {
      // The repository already tries its in-memory fallback; mock data is the last safety net.
    }

    return { items: loadMock(filter), source: 'mock' };
  }
}
