import { createServer } from 'node:http';

import { createApp } from '../app.mjs';

const testConfig = {
  host: '127.0.0.1',
  nodeEnv: 'test',
  port: 0,
  tokenSecret: 'test-token-secret-that-is-long-enough-for-hmac',
  trustProxy: false,
};

export async function requestJson(baseUrl, path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, options);
  const body = await response.json();

  return { body, headers: response.headers, status: response.status };
}

export async function usingServer(run) {
  const server = createServer(createApp(testConfig));

  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, testConfig.host, resolve);
  });

  const address = server.address();
  const baseUrl = `http://${testConfig.host}:${address.port}`;

  try {
    await run(baseUrl);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}
