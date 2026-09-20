import * as SQLite from 'expo-sqlite';

import {
  createProductCatalogCacheRepository,
  type ProductCatalogCacheEntry,
} from '@/features/products/productCatalogCache';

type CachedCatalogRow = {
  items_json: string;
  updated_at: number;
};

let databasePromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function getDatabase() {
  if (!databasePromise) {
    databasePromise = SQLite.openDatabaseAsync('rnmall-product-catalog.db').then(
      async (database) => {
        await database.execAsync(`
        PRAGMA journal_mode = WAL;
        CREATE TABLE IF NOT EXISTS product_catalog_cache (
          owner_key TEXT PRIMARY KEY NOT NULL,
          items_json TEXT NOT NULL,
          updated_at INTEGER NOT NULL
        );
      `);
        return database;
      },
    );
  }

  return databasePromise;
}

export const productCatalogCache = createProductCatalogCacheRepository({
  store: {
    async clear(ownerKey) {
      const database = await getDatabase();
      await database.runAsync('DELETE FROM product_catalog_cache WHERE owner_key = ?', ownerKey);
    },
    async read(ownerKey) {
      const database = await getDatabase();
      const row = await database.getFirstAsync<CachedCatalogRow>(
        'SELECT items_json, updated_at FROM product_catalog_cache WHERE owner_key = ?',
        ownerKey,
      );

      if (!row) {
        return null;
      }

      const items: unknown = JSON.parse(row.items_json);
      if (!Array.isArray(items)) {
        throw new Error('cached catalog has an invalid shape');
      }

      return {
        items: items as ProductCatalogCacheEntry['items'],
        ownerKey,
        updatedAt: row.updated_at,
      };
    },
    async write(entry) {
      const database = await getDatabase();
      await database.runAsync(
        `INSERT INTO product_catalog_cache (owner_key, items_json, updated_at)
         VALUES (?, ?, ?)
         ON CONFLICT(owner_key) DO UPDATE SET
           items_json = excluded.items_json,
           updated_at = excluded.updated_at`,
        entry.ownerKey,
        JSON.stringify(entry.items),
        entry.updatedAt,
      );
    },
  },
});
