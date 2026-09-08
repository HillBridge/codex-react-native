import { AxiosError } from 'axios';

import { AUTH_ENDPOINTS } from '@/features/auth/constants/authEndpoints';
import type { AuthSession, AuthUser } from '@/features/auth/store';
import { apiClient } from '@/shared/api';

export type AuthCredentials = { refreshToken: string; session: AuthSession };
export type LoginPayload = { email: string; password: string };

type MobileApiSuccess<T> = { data: T; traceId: string };
type MobileAuthData = { accessToken: string; refreshToken: string; user: AuthUser };

function messageFor(error: unknown) {
  if (error instanceof AxiosError) {
    const data = error.response?.data as { message?: string } | undefined;
    return data?.message ?? '请求失败，请稍后重试。';
  }
  return error instanceof Error ? error.message : '请求失败，请稍后重试。';
}

function toCredentials(data: MobileAuthData): AuthCredentials {
  return {
    refreshToken: data.refreshToken,
    session: { accessToken: data.accessToken, user: data.user },
  };
}

export async function login(payload: LoginPayload): Promise<AuthCredentials> {
  try {
    const response = await apiClient.post<MobileApiSuccess<MobileAuthData>>(
      AUTH_ENDPOINTS.login,
      payload,
    );
    return toCredentials(response.data.data);
  } catch (error) {
    throw new Error(messageFor(error));
  }
}

export async function logout() {
  try {
    await apiClient.post(AUTH_ENDPOINTS.logout);
  } catch (error) {
    throw new Error(messageFor(error));
  }
}

export async function refreshSession(refreshToken: string): Promise<AuthCredentials> {
  try {
    const response = await apiClient.post<MobileApiSuccess<MobileAuthData>>(
      AUTH_ENDPOINTS.refreshToken,
      { refreshToken },
    );
    return toCredentials(response.data.data);
  } catch (error) {
    throw new Error(messageFor(error));
  }
}
