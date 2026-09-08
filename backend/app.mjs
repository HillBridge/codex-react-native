import { createTraceId, writeError, writeOk } from './lib/api-response.mjs';
import { readBearerToken } from './lib/auth.mjs';
import { readJsonBody, HttpError } from './lib/body.mjs';
import {
  getDemoUserByEmail,
  products,
  toProductSummary,
  toUserProfile,
} from './data/demo-data.mjs';
import { createLoginRateLimiter } from './lib/rate-limit.mjs';
import { createSessionStore } from './lib/sessions.mjs';

const allowedMethodsByPath = new Map([
  ['/health', 'GET'],
  ['/mobile/v1/auth/login', 'POST'],
  ['/mobile/v1/auth/logout', 'POST'],
  ['/mobile/v1/auth/me', 'GET'],
  ['/mobile/v1/auth/refresh', 'POST'],
  ['/mobile/v1/products', 'GET'],
]);

export function createApp(config) {
  const loginRateLimiter = createLoginRateLimiter();
  const logger = config.logger || console;
  const sessionStore = createSessionStore({ tokenSecret: config.tokenSecret });

  return async function app(request, response) {
    const startedAt = Date.now();
    const traceId = createTraceId(request);
    const url = new URL(request.url, `http://${request.headers.host || 'localhost'}`);

    response.once('finish', () => {
      const durationMs = Date.now() - startedAt;
      logger.info(
        `HTTP ${request.method} ${url.pathname} ${response.statusCode} ${durationMs}ms traceId=${traceId}`,
      );
    });

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

      if (request.method === 'GET' && url.pathname === '/mobile/v1/products') {
        const featured = url.searchParams.get('featured');

        if (featured && featured !== 'true' && featured !== 'false') {
          writeError(response, traceId, 422, 'VALIDATION_ERROR', '商品筛选参数不合法。');
          return;
        }

        const q = (url.searchParams.get('q') || '').trim().toLowerCase();
        const category = url.searchParams.get('category') || '';
        const data = products
          .filter((product) => {
            if (featured === 'true' && !product.featured) return false;
            if (featured === 'false' && product.featured) return false;
            if (category && product.category !== category) return false;
            return (
              !q ||
              [product.name, product.series, product.category, product.summary]
                .join(' ')
                .toLowerCase()
                .includes(q)
            );
          })
          .map(toProductSummary);

        writeOk(response, traceId, data);
        return;
      }

      if (request.method === 'GET' && url.pathname.startsWith('/mobile/v1/products/')) {
        const slug = decodeURIComponent(url.pathname.slice('/mobile/v1/products/'.length));
        const product = products.find((item) => item.slug === slug);

        if (!product) {
          writeError(response, traceId, 404, 'NOT_FOUND', '商品不存在。');
          return;
        }

        writeOk(response, traceId, product);
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
