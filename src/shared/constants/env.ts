function requirePublicEnv(name: string, value: string | undefined) {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function getPublicNumberEnv(name: string, value: string | undefined, fallback: number) {
  if (!value) {
    return fallback;
  }

  const numberValue = Number(value);

  if (!Number.isFinite(numberValue) || numberValue <= 0) {
    throw new Error(`Invalid environment variable: ${name}`);
  }

  return numberValue;
}

export const API_BASE_URL = requirePublicEnv(
  'EXPO_PUBLIC_API_BASE_URL',
  process.env.EXPO_PUBLIC_API_BASE_URL,
);

export const API_CLIENT_ID = requirePublicEnv(
  'EXPO_PUBLIC_MATERA_WEB_CLIENT_ID',
  process.env.EXPO_PUBLIC_MATERA_WEB_CLIENT_ID,
);

export const API_TIMEOUT_MS = getPublicNumberEnv(
  'EXPO_PUBLIC_API_TIMEOUT_MS',
  process.env.EXPO_PUBLIC_API_TIMEOUT_MS,
  60000,
);
