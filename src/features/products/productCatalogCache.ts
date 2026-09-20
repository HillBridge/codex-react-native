import type { ProductFilter, ProductSummary } from './types';

export type ProductCatalogCacheEntry = {
  items: ProductSummary[];
  ownerKey: string;
  updatedAt: number;
};

export type ProductCatalogCacheStore = {
  clear: (ownerKey: string) => Promise<void>;
  read: (ownerKey: string) => Promise<ProductCatalogCacheEntry | null>;
  write: (entry: ProductCatalogCacheEntry) => Promise<void>;
};

export type CachedProductCatalog = Pick<ProductCatalogCacheEntry, 'items' | 'updatedAt'> & {
  source: 'memory' | 'persistent';
};

function copyItems(items: ProductSummary[]) {
  return items.map((item) => ({ ...item }));
}

function toCachedCatalog(
  entry: ProductCatalogCacheEntry,
  source: CachedProductCatalog['source'],
): CachedProductCatalog {
  return { items: copyItems(entry.items), source, updatedAt: entry.updatedAt };
}

export function filterCachedProducts(items: ProductSummary[], filter: ProductFilter = {}) {
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

export function createProductCatalogCacheRepository({
  now = Date.now,
  store,
}: {
  now?: () => number;
  store: ProductCatalogCacheStore;
}) {
  const memory = new Map<string, ProductCatalogCacheEntry>();

  return {
    async clear(ownerKey: string) {
      memory.delete(ownerKey);

      try {
        await store.clear(ownerKey);
      } catch {
        // The in-memory copy is already removed. A later logout can retry persistent cleanup.
      }
    },
    async read(ownerKey: string): Promise<CachedProductCatalog | null> {
      try {
        const persisted = await store.read(ownerKey);

        if (persisted) {
          memory.set(ownerKey, { ...persisted, items: copyItems(persisted.items) });
          return toCachedCatalog(persisted, 'persistent');
        }
      } catch {
        // Fall through to the process-local copy when SQLite is temporarily unavailable.
      }

      const inMemory = memory.get(ownerKey);
      return inMemory ? toCachedCatalog(inMemory, 'memory') : null;
    },
    async save(ownerKey: string, items: ProductSummary[]) {
      const entry = { items: copyItems(items), ownerKey, updatedAt: now() };
      memory.set(ownerKey, entry);

      try {
        await store.write(entry);
      } catch {
        // Keep the current app session usable even if on-device persistence fails.
      }
    },
  };
}
