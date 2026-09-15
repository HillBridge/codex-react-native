import assert from 'node:assert/strict';
import test from 'node:test';

import { createProductRequestAbortController } from '../../src/features/products/productRequestAbortController.ts';

test('开始下一次商品请求或离开商品页时，会中止上一条请求', () => {
  const controller = createProductRequestAbortController();
  const first = controller.begin();
  const second = controller.begin();

  assert.equal(first.aborted, true);
  assert.equal(second.aborted, false);

  controller.cancel();

  assert.equal(second.aborted, true);
});
