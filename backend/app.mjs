import { createTraceId, writeError, writeOk } from './lib/api-response.mjs';
import { readJsonBody, HttpError } from './lib/body.mjs';
import { getDemoUserByEmail, toUserProfile } from './data/demo-data.mjs';
import { createSessionStore } from './lib/sessions.mjs';

export function createApp(config) {
  const sessionStore = createSessionStore({ tokenSecret: config.tokenSecret });

  return async function app(request, response) {
    const traceId = createTraceId(request);
    const url = new URL(request.url, `http://${request.headers.host || 'localhost'}`);

    try {
      if (request.method === 'GET' && url.pathname === '/health') {
        writeOk(response, traceId, { ok: true, service: 'rn-mall-mobile-api' });
        return;
      }

      if (request.method === 'POST' && url.pathname === '/mobile/v1/auth/login') {
        const body = await readJsonBody(request);
        const user = getDemoUserByEmail(body.email);

        if (!user || body.password !== user.password) {
          writeError(response, traceId, 401, 'UNAUTHORIZED', '邮箱或密码不正确。');
          return;
        }

        const credentials = sessionStore.createSession(toUserProfile(user));
        writeOk(response, traceId, credentials);
        return;
      }

      if (request.method === 'POST' && url.pathname === '/mobile/v1/auth/refresh') {
        const body = await readJsonBody(request);
        const credentials =
          typeof body.refreshToken === 'string'
            ? sessionStore.refreshSession(body.refreshToken)
            : undefined;

        if (!credentials) {
          writeError(response, traceId, 401, 'UNAUTHORIZED', '登录状态已失效。');
          return;
        }

        writeOk(response, traceId, credentials);
        return;
      }

      writeError(response, traceId, 404, 'NOT_FOUND', '接口不存在');
    } catch (error) {
      if (error instanceof HttpError) {
        writeError(response, traceId, error.statusCode, error.code, error.message);
        return;
      }

      writeError(response, traceId, 500, 'INTERNAL_ERROR', '服务暂时不可用。');
    }
  };
}
