import type { AuthSession } from '@/store';

export type LoginPayload = {
  email: string;
  password: string;
};

const loginDelayMs = 450;

export async function login(payload: LoginPayload): Promise<AuthSession> {
  await new Promise((resolve) => setTimeout(resolve, loginDelayMs));

  if (payload.password.length < 6) {
    throw new Error('Password must be at least 6 characters.');
  }

  return {
    accessToken: `mock-access-token-${Date.now()}`,
    user: {
      email: payload.email,
      id: 'user_001',
      name: payload.email.split('@')[0] || 'Expo User',
    },
  };
}
