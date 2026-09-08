import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;

export function createAccessToken({ sessionId, tokenSecret, userId }) {
  const payload = {
    exp: Math.floor(Date.now() / 1000) + ACCESS_TOKEN_TTL_SECONDS,
    kind: 'access',
    sid: sessionId,
    sub: userId,
  };
  const encodedPayload = encode(payload);
  const signature = sign(encodedPayload, tokenSecret);

  return `${encodedPayload}.${signature}`;
}

export function createRefreshToken() {
  return randomBytes(32).toString('base64url');
}

export function readBearerToken(request) {
  const authorization = request.headers.authorization;

  if (typeof authorization !== 'string' || !authorization.startsWith('Bearer ')) {
    return undefined;
  }

  return authorization.slice('Bearer '.length).trim() || undefined;
}

export function verifyAccessToken(token, tokenSecret) {
  const [encodedPayload, signature] = token.split('.');

  if (!encodedPayload || !signature || !isValidSignature(encodedPayload, signature, tokenSecret)) {
    return undefined;
  }

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8'));

    if (
      payload?.kind !== 'access' ||
      typeof payload.exp !== 'number' ||
      typeof payload.sid !== 'string' ||
      typeof payload.sub !== 'string' ||
      payload.exp <= Math.floor(Date.now() / 1000)
    ) {
      return undefined;
    }

    return payload;
  } catch {
    return undefined;
  }
}

function encode(payload) {
  return Buffer.from(JSON.stringify(payload)).toString('base64url');
}

function isValidSignature(encodedPayload, signature, tokenSecret) {
  const expected = Buffer.from(sign(encodedPayload, tokenSecret));
  const actual = Buffer.from(signature);

  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

function sign(value, tokenSecret) {
  return createHmac('sha256', tokenSecret).update(value).digest('base64url');
}
