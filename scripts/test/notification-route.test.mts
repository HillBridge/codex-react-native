import assert from 'node:assert/strict';
import test from 'node:test';

import { resolveNotificationRoute } from '../../src/shared/notifications/notificationRoute.ts';

test('商品通知只会跳转到应用内商品详情', () => {
  assert.equal(
    resolveNotificationRoute({ url: 'rnmall://products/aero-desk-lamp' }),
    '/products/aero-desk-lamp',
  );
});

test('无效通知地址不会触发应用内跳转', () => {
  assert.equal(resolveNotificationRoute({ url: 'https://example.com' }), null);
  assert.equal(resolveNotificationRoute({ url: 'rnmall://profile' }), null);
  assert.equal(resolveNotificationRoute({ url: 42 }), null);
  assert.equal(resolveNotificationRoute(null), null);
});
