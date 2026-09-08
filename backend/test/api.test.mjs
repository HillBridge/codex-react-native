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
