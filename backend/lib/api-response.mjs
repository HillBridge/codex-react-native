import { randomUUID } from 'node:crypto';

export function createTraceId(request) {
  const requestId = request.headers['x-request-id'];

  return typeof requestId === 'string' && /^[0-9a-f-]{36}$/i.test(requestId)
    ? requestId
    : randomUUID();
}

export function writeError(response, traceId, statusCode, code, message, headers = {}) {
  writeJson(response, statusCode, { code, message, traceId }, traceId, headers);
}

export function writeOk(response, traceId, data, headers = {}) {
  writeJson(response, 200, { data, traceId }, traceId, headers);
}

function writeJson(response, statusCode, body, traceId, headers) {
  response.writeHead(statusCode, {
    'cache-control': 'no-store',
    'content-type': 'application/json; charset=utf-8',
    'permissions-policy': 'geolocation=(), microphone=(), camera=()',
    'referrer-policy': 'no-referrer',
    'x-content-type-options': 'nosniff',
    'x-request-id': traceId,
    ...headers,
  });
  response.end(JSON.stringify(body));
}
