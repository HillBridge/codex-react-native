import assert from 'node:assert/strict';
import test from 'node:test';

import { getMockProduct, getMockProducts } from '../../src/features/products/mockProducts.ts';
import {
  loadProductOrMock,
  loadProductsOrMock,
} from '../../src/features/products/productFallback.ts';

test('商品列表接口失败时返回本地筛选结果', async () => {
  const items = await loadProductsOrMock(
    async () => {
      throw new Error('network unavailable');
    },
    getMockProducts,
    { q: 'desk' },
  );

  assert.equal(items.length, 18);
  assert.deepEqual(
    items.slice(0, 2).map((item) => item.slug),
    ['aero-desk-lamp', 'modular-cable-kit'],
  );
});

test('商品详情接口失败时返回本地商品详情', async () => {
  const item = await loadProductOrMock(
    async () => {
      throw new Error('network unavailable');
    },
    getMockProduct,
    'aero-desk-lamp',
  );

  assert.equal(item?.name, 'Aero Desk Lamp');
  assert.equal(item?.stock, 34);
});
