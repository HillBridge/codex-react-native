import assert from 'node:assert/strict';
import test from 'node:test';

import { validateLoginForm } from '../../src/features/auth/hooks/loginFormValidation.ts';

test('validateLoginForm rejects an invalid email address', () => {
  const errors = validateLoginForm({ email: 'not-an-email', password: 'nuxt-demo' });

  assert.deepEqual(errors, { email: '请输入有效邮箱。' });
});

test('validateLoginForm requires a password', () => {
  const errors = validateLoginForm({ email: 'demo@example.com', password: '' });

  assert.deepEqual(errors, { password: '请输入密码。' });
});

test('validateLoginForm accepts the demo credentials shape', () => {
  const errors = validateLoginForm({ email: 'demo@example.com', password: 'nuxt-demo' });

  assert.deepEqual(errors, {});
});
