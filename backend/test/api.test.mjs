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

test('logout revokes the access token used to call it', async () => {
  await usingServer(async (baseUrl) => {
    const login = await requestJson(baseUrl, '/mobile/v1/auth/login', {
      body: JSON.stringify({ email: 'demo@example.com', password: 'nuxt-demo' }),
      headers: { 'content-type': 'application/json' },
      method: 'POST',
    });
    const accessToken = login.body.data.accessToken;
    const loggedOut = await requestJson(baseUrl, '/mobile/v1/auth/logout', {
      headers: { authorization: `Bearer ${accessToken}` },
      method: 'POST',
    });
    const profile = await requestJson(baseUrl, '/mobile/v1/auth/me', {
      headers: { authorization: `Bearer ${accessToken}` },
    });

    assert.equal(loggedOut.status, 200);
    assert.deepEqual(loggedOut.body.data, { ok: true });
    assert.equal(profile.status, 401);
    assert.equal(profile.body.code, 'UNAUTHORIZED');
  });
});

test('login validates an email address before checking credentials', async () => {
  await usingServer(async (baseUrl) => {
    const response = await requestJson(baseUrl, '/mobile/v1/auth/login', {
      body: JSON.stringify({ email: 'not-an-email', password: 'nuxt-demo' }),
      headers: { 'content-type': 'application/json' },
      method: 'POST',
    });

    assert.equal(response.status, 422);
    assert.equal(response.body.code, 'VALIDATION_ERROR');
  });
});

test('login rejects the sixth failed attempt from the same source', async () => {
  await usingServer(async (baseUrl) => {
    let response;

    for (let attempt = 0; attempt < 6; attempt += 1) {
      response = await requestJson(baseUrl, '/mobile/v1/auth/login', {
        body: JSON.stringify({ email: 'demo@example.com', password: 'incorrect-password' }),
        headers: { 'content-type': 'application/json' },
        method: 'POST',
      });
    }

    assert.equal(response.status, 429);
    assert.equal(response.body.code, 'RATE_LIMITED');
  });
});

test('known routes report their supported method', async () => {
  await usingServer(async (baseUrl) => {
    const response = await requestJson(baseUrl, '/mobile/v1/auth/login');

    assert.equal(response.status, 405);
    assert.equal(response.headers.get('allow'), 'POST');
  });
});
