import assert from 'node:assert/strict';
import test from 'node:test';

import { loginOrLocal, refreshOrLocal } from '../../src/features/auth/api/authFallback.ts';
import {
  getLocalLoginCredentials,
  getLocalRefreshCredentials,
} from '../../src/features/auth/api/mockAuth.ts';

test('登录接口无法连接时，演示账号获得本地会话', async () => {
  const credentials = await loginOrLocal(
    async () => {
      throw new Error('network unavailable');
    },
    getLocalLoginCredentials,
    { email: 'demo@example.com', password: 'nuxt-demo' },
  );

  assert.equal(credentials.session.user.id, 'user_demo_001');
  assert.equal(credentials.session.user.name, 'Nuxt Pilot');
});

test('显式 mock 模式登录不发起远程请求', async () => {
  let remoteCalls = 0;

  const credentials = await loginOrLocal(
    async () => {
      remoteCalls += 1;
      throw new Error('remote request should not run');
    },
    getLocalLoginCredentials,
    { email: 'demo@example.com', password: 'nuxt-demo' },
    undefined,
    true,
  );

  assert.equal(remoteCalls, 0);
  assert.equal(credentials.session.user.id, 'user_demo_001');
});

test('登录接口无法连接时，错误密码不会获得本地会话', async () => {
  await assert.rejects(
    () =>
      loginOrLocal(
        async () => {
          throw new Error('network unavailable');
        },
        getLocalLoginCredentials,
        { email: 'demo@example.com', password: 'incorrect-password' },
      ),
    /network unavailable/,
  );
});

test('本地会话重启后，刷新接口无法连接时仍能恢复', async () => {
  const credentials = await refreshOrLocal(
    async () => {
      throw new Error('network unavailable');
    },
    getLocalRefreshCredentials,
    'local-demo-refresh-v1',
  );

  assert.equal(credentials.session.user.email, 'demo@example.com');
});
