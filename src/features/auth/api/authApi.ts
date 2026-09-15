import { AxiosError } from 'axios';

import { loginOrLocal, refreshOrLocal } from '@/features/auth/api/authFallback';
import { getAuthRequestMessage } from '@/features/auth/api/authRequestMessage';
import { AUTH_ENDPOINTS } from '@/features/auth/constants/authEndpoints';
import type { AuthSession, AuthUser } from '@/features/auth/store';
import { apiClient } from '@/shared/api';
import { USE_MOCK_DATA } from '@/shared/constants/env';
import { getLocalLoginCredentials, getLocalRefreshCredentials } from './mockAuth';

export type AuthCredentials = { refreshToken: string; session: AuthSession };
export type LoginPayload = { email: string; password: string };

type MobileApiSuccess<T> = { data: T; traceId: string };
type MobileAuthData = { accessToken: string; refreshToken: string; user: AuthUser };

function messageFor(error: unknown) {
  if (error instanceof AxiosError) {
    return getAuthRequestMessage(error.response?.status);
  }
  return getAuthRequestMessage(undefined);
}

function toCredentials(data: MobileAuthData): AuthCredentials {
  return {
    refreshToken: data.refreshToken,
    session: { accessToken: data.accessToken, user: data.user },
  };
}

function shouldUseLocalAuthFallback(error: unknown) {
  return !(error instanceof AxiosError && error.response);
}

async function requestLogin(payload: LoginPayload): Promise<AuthCredentials> {
  const response = await apiClient.post<MobileApiSuccess<MobileAuthData>>(
    AUTH_ENDPOINTS.login,
    payload,
  );
  return toCredentials(response.data.data);
}

async function requestSessionRefresh(refreshToken: string): Promise<AuthCredentials> {
  const response = await apiClient.post<MobileApiSuccess<MobileAuthData>>(
    AUTH_ENDPOINTS.refreshToken,
    { refreshToken },
  );
  return toCredentials(response.data.data);
}

export async function login(payload: LoginPayload): Promise<AuthCredentials> {
  try {
    return await loginOrLocal(
      requestLogin,
      getLocalLoginCredentials,
      payload,
      shouldUseLocalAuthFallback,
      USE_MOCK_DATA,
    );
  } catch (error) {
    throw new Error(messageFor(error));
  }
}

export async function logout() {
  if (USE_MOCK_DATA) {
    return;
  }

  try {
    await apiClient.post(AUTH_ENDPOINTS.logout);
  } catch (error) {
    throw new Error(messageFor(error));
  }
}

export async function refreshSession(refreshToken: string): Promise<AuthCredentials> {
  try {
    return await refreshOrLocal(
      requestSessionRefresh,
      getLocalRefreshCredentials,
      refreshToken,
      shouldUseLocalAuthFallback,
      USE_MOCK_DATA,
    );
  } catch (error) {
    throw new Error(messageFor(error));
  }
}
