import assert from 'node:assert/strict';
import test from 'node:test';

import { canLoadProductImage } from '../../src/features/products/productImage.ts';

test('空图片地址使用本地占位图，不创建远程图片加载', () => {
  assert.equal(canLoadProductImage(''), false);
  assert.equal(canLoadProductImage('  '), false);
  assert.equal(canLoadProductImage('https://images.example.com/product.jpg'), true);
});
