import assert from 'node:assert/strict';
import test from 'node:test';

import { createProductRequestGate } from '../../src/features/products/productRequestGate.ts';

test('只允许最后一次商品请求更新列表', () => {
  const gate = createProductRequestGate();
  const firstRequest = gate.begin();
  const secondRequest = gate.begin();

  assert.equal(gate.isCurrent(firstRequest), false);
  assert.equal(gate.isCurrent(secondRequest), true);
});

test('失效后的商品请求不能再更新列表', () => {
  const gate = createProductRequestGate();
  const request = gate.begin();

  gate.invalidate();

  assert.equal(gate.isCurrent(request), false);
});
