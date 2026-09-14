import assert from 'node:assert/strict';
import test from 'node:test';

import { getAuthRequestMessage } from '../../src/features/auth/api/authRequestMessage.ts';

test('登录凭据错误显示本地可读提示', () => {
  assert.equal(getAuthRequestMessage(401), '邮箱或密码不正确。');
});

test('服务端异常不显示原始错误细节', () => {
  assert.equal(getAuthRequestMessage(500), '服务暂时不可用，请稍后重试。');
  assert.equal(getAuthRequestMessage(undefined), '服务暂时不可用，请稍后重试。');
});
