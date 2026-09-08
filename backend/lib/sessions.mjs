import { createHash, randomUUID } from 'node:crypto';

import { createAccessToken, createRefreshToken, verifyAccessToken } from './auth.mjs';

const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export function createSessionStore({ tokenSecret }) {
  const sessions = new Map();
  const refreshTokenIndex = new Map();

  function createSession(user) {
    const session = {
      expiresAt: Date.now() + REFRESH_TOKEN_TTL_MS,
      id: randomUUID(),
      refreshTokenHash: '',
      user,
    };

    const credentials = issueCredentials(session, true);
    sessions.set(session.id, session);

    return credentials;
  }

  function getSessionForAccessToken(accessToken) {
    const payload = verifyAccessToken(accessToken, tokenSecret);

    if (!payload) {
      return undefined;
    }

    const session = getLiveSession(payload.sid);

    return session?.user.id === payload.sub ? session : undefined;
  }

  function refreshSession(refreshToken) {
    const sessionId = refreshTokenIndex.get(hashToken(refreshToken));
    const session = sessionId ? getLiveSession(sessionId) : undefined;

    if (!session || session.refreshTokenHash !== hashToken(refreshToken)) {
      return undefined;
    }

    return issueCredentials(session, true);
  }

  function revokeSession(sessionId) {
    const session = sessions.get(sessionId);

    if (!session) {
      return;
    }

    sessions.delete(sessionId);
    refreshTokenIndex.delete(session.refreshTokenHash);
  }

  function getLiveSession(sessionId) {
    const session = sessions.get(sessionId);

    if (!session) {
      return undefined;
    }

    if (session.expiresAt <= Date.now()) {
      revokeSession(sessionId);
      return undefined;
    }

    return session;
  }

  function issueCredentials(session, rotateRefreshToken) {
    let refreshToken;

    if (rotateRefreshToken) {
      refreshTokenIndex.delete(session.refreshTokenHash);
      refreshToken = createRefreshToken();
      session.refreshTokenHash = hashToken(refreshToken);
      refreshTokenIndex.set(session.refreshTokenHash, session.id);
    }

    return {
      accessToken: createAccessToken({
        sessionId: session.id,
        tokenSecret,
        userId: session.user.id,
      }),
      refreshToken,
      user: session.user,
    };
  }

  return { createSession, getSessionForAccessToken, refreshSession, revokeSession };
}

function hashToken(value) {
  return createHash('sha256').update(value).digest('base64url');
}
