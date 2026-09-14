import type { AuthCredentials, LoginPayload } from '@/features/auth/api/authApi';

const LOCAL_DEMO_EMAIL = 'demo@example.com';
const LOCAL_DEMO_PASSWORD = 'nuxt-demo';
const LOCAL_REFRESH_TOKEN = 'local-demo-refresh-v1';

function createLocalCredentials(): AuthCredentials {
  return {
    refreshToken: LOCAL_REFRESH_TOKEN,
    session: {
      accessToken: 'local-demo-access-v1',
      user: {
        email: LOCAL_DEMO_EMAIL,
        id: 'user_demo_001',
        name: 'Nuxt Pilot',
        points: 12880,
        preference: '低延迟购物体验',
        tier: 'Pro',
      },
    },
  };
}

export function getLocalLoginCredentials(payload: LoginPayload): AuthCredentials | undefined {
  if (payload.email !== LOCAL_DEMO_EMAIL || payload.password !== LOCAL_DEMO_PASSWORD) {
    return undefined;
  }

  return createLocalCredentials();
}

export function getLocalRefreshCredentials(refreshToken: string): AuthCredentials | undefined {
  return refreshToken === LOCAL_REFRESH_TOKEN ? createLocalCredentials() : undefined;
}
