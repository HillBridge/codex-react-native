import assert from 'node:assert/strict';
import test from 'node:test';

import { requestJson, usingServer } from './helpers.mjs';

test('GET /health returns the public health envelope', async () => {
  await usingServer(async (baseUrl) => {
    const response = await requestJson(baseUrl, '/health');

    assert.equal(response.status, 200);
    assert.deepEqual(response.body.data, { ok: true, service: 'rn-mall-mobile-api' });
    assert.match(response.body.traceId, /^[0-9a-f-]{36}$/i);
    assert.equal(response.headers.get('cache-control'), 'no-store');
  });
});

test('a refresh token can be used exactly once', async () => {
  await usingServer(async (baseUrl) => {
    const login = await requestJson(baseUrl, '/mobile/v1/auth/login', {
      body: JSON.stringify({ email: 'demo@example.com', password: 'nuxt-demo' }),
      headers: { 'content-type': 'application/json' },
      method: 'POST',
    });

    assert.equal(login.status, 200);

    const refreshToken = login.body.data.refreshToken;
    const refreshed = await requestJson(baseUrl, '/mobile/v1/auth/refresh', {
      body: JSON.stringify({ refreshToken }),
      headers: { 'content-type': 'application/json' },
      method: 'POST',
    });
    const reused = await requestJson(baseUrl, '/mobile/v1/auth/refresh', {
      body: JSON.stringify({ refreshToken }),
      headers: { 'content-type': 'application/json' },
      method: 'POST',
    });

    assert.equal(refreshed.status, 200);
    assert.notEqual(refreshed.body.data.refreshToken, refreshToken);
    assert.equal(reused.status, 401);
    assert.equal(reused.body.code, 'UNAUTHORIZED');
  });
});
