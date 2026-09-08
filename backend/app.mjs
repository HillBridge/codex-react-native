import { createTraceId, writeError, writeOk } from './lib/api-response.mjs';
import { readBearerToken } from './lib/auth.mjs';
import { readJsonBody, HttpError } from './lib/body.mjs';
import { getDemoUserByEmail, toUserProfile } from './data/demo-data.mjs';
import { createLoginRateLimiter } from './lib/rate-limit.mjs';
import { createSessionStore } from './lib/sessions.mjs';

const allowedMethodsByPath = new Map([
  ['/health', 'GET'],
  ['/mobile/v1/auth/login', 'POST'],
  ['/mobile/v1/auth/logout', 'POST'],
  ['/mobile/v1/auth/me', 'GET'],
  ['/mobile/v1/auth/refresh', 'POST'],
]);

export function createApp(config) {
  const loginRateLimiter = createLoginRateLimiter();
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
        if (!loginRateLimiter.allow(getRequestSource(request, config.trustProxy))) {
          writeError(response, traceId, 429, 'RATE_LIMITED', '登录尝试过于频繁，请稍后再试。');
          return;
        }

        const body = await readJsonBody(request);

        if (!isValidLoginPayload(body)) {
          writeError(response, traceId, 422, 'VALIDATION_ERROR', '登录参数不合法。');
          return;
        }

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

      if (request.method === 'GET' && url.pathname === '/mobile/v1/auth/me') {
        const session = getAuthenticatedSession(request, sessionStore);

        if (!session) {
          writeError(response, traceId, 401, 'UNAUTHORIZED', '登录状态已失效。');
          return;
        }

        writeOk(response, traceId, session.user);
        return;
      }

      if (request.method === 'POST' && url.pathname === '/mobile/v1/auth/logout') {
        const session = getAuthenticatedSession(request, sessionStore);

        if (!session) {
          writeError(response, traceId, 401, 'UNAUTHORIZED', '登录状态已失效。');
          return;
        }

        sessionStore.revokeSession(session.id);
        writeOk(response, traceId, { ok: true });
        return;
      }

      const allowedMethods = allowedMethodsByPath.get(url.pathname);

      if (allowedMethods) {
        writeError(response, traceId, 405, 'BAD_REQUEST', '请求方法不被支持。', {
          allow: allowedMethods,
        });
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

function getAuthenticatedSession(request, sessionStore) {
  const accessToken = readBearerToken(request);

  return accessToken ? sessionStore.getSessionForAccessToken(accessToken) : undefined;
}

function isValidLoginPayload(body) {
  return (
    typeof body.email === 'string' &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email) &&
    typeof body.password === 'string' &&
    body.password.length > 0
  );
}

function getRequestSource(request, trustProxy) {
  if (trustProxy && typeof request.headers['x-forwarded-for'] === 'string') {
    return request.headers['x-forwarded-for'].split(',')[0].trim() || 'unknown';
  }

  return request.socket.remoteAddress || 'unknown';
}
