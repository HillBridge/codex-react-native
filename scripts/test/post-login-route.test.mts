import assert from 'node:assert/strict';
import test from 'node:test';

import { getPostLoginRoute } from '../../src/features/auth/postLoginRoute.ts';

test('登录后返回受保护的资料页', () => {
  assert.equal(getPostLoginRoute('/profile'), '/profile');
});

test('登录后不会跳转到任意外部或公开路径', () => {
  assert.equal(getPostLoginRoute('https://example.com'), '/home');
  assert.equal(getPostLoginRoute('/products'), '/home');
});
