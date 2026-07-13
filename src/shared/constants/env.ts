function requirePublicEnv(name: string, value: string | undefined) {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export const API_BASE_URL = requirePublicEnv(
  'EXPO_PUBLIC_API_BASE_URL',
  process.env.EXPO_PUBLIC_API_BASE_URL,
);

export const API_CLIENT_ID = requirePublicEnv(
  'EXPO_PUBLIC_MATERA_WEB_CLIENT_ID',
  process.env.EXPO_PUBLIC_MATERA_WEB_CLIENT_ID,
);
