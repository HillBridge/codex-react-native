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

  assert.equal(items.length, 2);
  assert.deepEqual(
    items.slice(0, 2).map((item) => item.slug),
    ['aero-desk-lamp', 'modular-cable-kit'],
  );
});

test('显式 mock 模式直接返回商品数据，不发起远程请求', async () => {
  let remoteCalls = 0;

  const items = await loadProductsOrMock(
    async () => {
      remoteCalls += 1;
      throw new Error('remote request should not run');
    },
    getMockProducts,
    { q: 'desk' },
    true,
  );

  assert.equal(remoteCalls, 0);
  assert.deepEqual(
    items.map((item) => item.slug),
    ['aero-desk-lamp', 'modular-cable-kit'],
  );
});

test('练习商品只保留一组本地数据且不加载远程图片', () => {
  const items = getMockProducts();

  assert.equal(items.length, 6);
  assert.equal(
    items.every((item) => item.image === ''),
    true,
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
