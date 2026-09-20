import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createProductCatalogCacheRepository,
  filterCachedProducts,
} from '../../src/features/products/productCatalogCache.ts';

const products = [
  {
    id: 'lamp',
    slug: 'aero-desk-lamp',
    name: 'Aero Desk Lamp',
    series: 'Workline',
    category: '家居',
    summary: '低眩光台灯',
    price: 699,
    featured: true,
    image: '',
  },
  {
    id: 'shirt',
    slug: 'linen-everyday-shirt',
    name: 'Linen Everyday Shirt',
    series: 'Daily',
    category: '穿搭',
    summary: '亚麻衬衫',
    price: 469,
    featured: false,
    image: '',
  },
];

test('成功商品列表会按用户持久化，并保留最后更新时间', async () => {
  const records = new Map();
  const cache = createProductCatalogCacheRepository({
    now: () => 1_726_000_000_000,
    store: {
      clear: async (ownerKey) => records.delete(ownerKey),
      read: async (ownerKey) => records.get(ownerKey) ?? null,
      write: async (entry) => records.set(entry.ownerKey, entry),
    },
  });

  await cache.save('user-1', products);

  assert.deepEqual(await cache.read('user-1'), {
    items: products,
    source: 'persistent',
    updatedAt: 1_726_000_000_000,
  });
});

test('持久化读写失败时仍从内存回退读取最近商品', async () => {
  const cache = createProductCatalogCacheRepository({
    now: () => 99,
    store: {
      clear: async () => {
        throw new Error('database unavailable');
      },
      read: async () => {
        throw new Error('database unavailable');
      },
      write: async () => {
        throw new Error('database unavailable');
      },
    },
  });

  await cache.save('user-1', products);

  assert.deepEqual(await cache.read('user-1'), {
    items: products,
    source: 'memory',
    updatedAt: 99,
  });
});

test('退出登录只删除当前用户的商品缓存', async () => {
  const records = new Map();
  const cache = createProductCatalogCacheRepository({
    now: () => 88,
    store: {
      clear: async (ownerKey) => records.delete(ownerKey),
      read: async (ownerKey) => records.get(ownerKey) ?? null,
      write: async (entry) => records.set(entry.ownerKey, entry),
    },
  });

  await cache.save('user-1', products);
  await cache.save('user-2', products.slice(0, 1));
  await cache.clear('user-1');

  assert.equal(await cache.read('user-1'), null);
  assert.deepEqual((await cache.read('user-2'))?.items, products.slice(0, 1));
});

test('离线缓存沿用商品筛选规则', () => {
  assert.deepEqual(
    filterCachedProducts(products, { category: '家居' }).map((item) => item.id),
    ['lamp'],
  );
  assert.deepEqual(
    filterCachedProducts(products, { q: 'shirt' }).map((item) => item.id),
    ['shirt'],
  );
});
