import assert from 'node:assert/strict';
import test from 'node:test';

import { loadProductCatalog } from '../../src/features/products/productCatalogLoader.ts';

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
];

test('联网成功后显示网络数据并写入用户缓存', async () => {
  const saved: unknown[] = [];
  const result = await loadProductCatalog({
    filter: {},
    loadCache: async () => null,
    loadMock: () => [],
    loadRemote: async () => products,
    ownerKey: 'user-1',
    saveCache: async (ownerKey, items) => saved.push({ items, ownerKey }),
  });

  assert.deepEqual(result, { items: products, source: 'network' });
  assert.deepEqual(saved, [{ items: products, ownerKey: 'user-1' }]);
});

test('网络不可用时显示最近缓存和更新时间', async () => {
  const result = await loadProductCatalog({
    filter: {},
    loadCache: async () => ({ items: products, source: 'persistent', updatedAt: 123 }),
    loadMock: () => [],
    loadRemote: async () => {
      throw new Error('offline');
    },
    ownerKey: 'user-1',
    saveCache: async () => undefined,
  });

  assert.deepEqual(result, { items: products, source: 'cache', updatedAt: 123 });
});

test('网络和缓存都不可用时才回退本地练习数据', async () => {
  const result = await loadProductCatalog({
    filter: {},
    loadCache: async () => null,
    loadMock: () => products,
    loadRemote: async () => {
      throw new Error('offline');
    },
    ownerKey: 'user-1',
    saveCache: async () => undefined,
  });

  assert.deepEqual(result, { items: products, source: 'mock' });
});
