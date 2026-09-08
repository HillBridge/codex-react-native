const DEFAULT_HOST = '127.0.0.1';
const DEFAULT_PORT = 4000;
const MINIMUM_SECRET_LENGTH = 32;

export function loadConfig(env = process.env) {
  const nodeEnv = env.NODE_ENV || 'development';
  const tokenSecret = env.MOBILE_API_TOKEN_SECRET || '';
  const port = Number(env.BACKEND_PORT || DEFAULT_PORT);

  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    throw new Error('BACKEND_PORT must be a valid TCP port.');
  }

  if (nodeEnv === 'production' && tokenSecret.length < MINIMUM_SECRET_LENGTH) {
    throw new Error('MOBILE_API_TOKEN_SECRET must be at least 32 characters in production.');
  }

  return {
    host: env.BACKEND_HOST || DEFAULT_HOST,
    nodeEnv,
    port,
    tokenSecret: tokenSecret || 'development-only-mobile-api-token-secret',
    trustProxy: env.TRUST_PROXY === 'true',
  };
}
