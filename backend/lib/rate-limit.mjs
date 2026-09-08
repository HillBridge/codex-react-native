const DEFAULT_MAX_ATTEMPTS = 5;
const DEFAULT_WINDOW_MS = 15 * 60 * 1000;

export function createLoginRateLimiter({
  maxAttempts = DEFAULT_MAX_ATTEMPTS,
  windowMs = DEFAULT_WINDOW_MS,
} = {}) {
  const attemptsBySource = new Map();

  function allow(source, now = Date.now()) {
    const earliestAllowedAt = now - windowMs;
    const currentAttempts = (attemptsBySource.get(source) || []).filter(
      (attemptedAt) => attemptedAt > earliestAllowedAt,
    );

    if (currentAttempts.length >= maxAttempts) {
      attemptsBySource.set(source, currentAttempts);
      return false;
    }

    currentAttempts.push(now);
    attemptsBySource.set(source, currentAttempts);
    return true;
  }

  return { allow };
}
