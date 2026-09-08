import { createTraceId, writeError, writeOk } from './lib/api-response.mjs';

export function createApp() {
  return async function app(request, response) {
    const traceId = createTraceId(request);
    const url = new URL(request.url, `http://${request.headers.host || 'localhost'}`);

    if (request.method === 'GET' && url.pathname === '/health') {
      writeOk(response, traceId, { ok: true, service: 'rn-mall-mobile-api' });
      return;
    }

    writeError(response, traceId, 404, 'NOT_FOUND', '接口不存在');
  };
}
