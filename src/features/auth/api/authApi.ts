import { AxiosError } from 'axios';

import { AUTH_ENDPOINTS } from '@/features/auth/constants/authEndpoints';
import type { AuthSession } from '@/features/auth/store';
import { apiClient } from '@/shared/api';

export type LoginPayload = {
  email: string;
  password: string;
};

type AuthApiUser = {
  email?: string;
  id?: string | number;
  name?: string;
};

type AuthApiData = {
  accessToken?: string;
  access_token?: string;
  refreshToken?: string;
  refresh_token?: string;
  token?: string;
  user?: AuthApiUser;
};

type AuthApiResponse = AuthApiData | { data?: AuthApiData };

export type AuthCredentials = {
  refreshToken: string;
  session: AuthSession;
};

function hasNestedData(response: AuthApiResponse): response is { data?: AuthApiData } {
  return Object.prototype.hasOwnProperty.call(response, 'data');
}

function getAuthData(response: AuthApiResponse): AuthApiData {
  if (hasNestedData(response)) {
    return response.data ?? {};
  }

  return response;
}

function normalizeCredentials(
  response: AuthApiResponse,
  options: {
    fallbackEmail?: string;
    fallbackRefreshToken?: string;
  } = {},
): AuthCredentials {
  const data = getAuthData(response);
  const accessToken = data.accessToken ?? data.access_token ?? data.token;
  const refreshToken = data.refreshToken ?? data.refresh_token ?? options.fallbackRefreshToken;

  if (!accessToken) {
    throw new Error('Login response is missing access token.');
  }

  if (!refreshToken) {
    throw new Error('Login response is missing refresh token.');
  }

  return {
    refreshToken,
    session: {
      accessToken,
      user: {
        email: data.user?.email ?? options.fallbackEmail ?? '',
        id: String(data.user?.id ?? ''),
        name: data.user?.name ?? options.fallbackEmail?.split('@')[0] ?? 'User',
      },
    },
  };
}

function getLoginErrorMessage(error: unknown) {
  if (error instanceof AxiosError) {
    const data = error.response?.data as { message?: string; error?: string } | undefined;
    return data?.message ?? data?.error ?? 'Unable to sign in.';
  }

  return error instanceof Error ? error.message : 'Unable to sign in.';
}

export async function login(payload: LoginPayload): Promise<AuthCredentials> {
  try {
    const response = await apiClient.post<AuthApiResponse>(AUTH_ENDPOINTS.login, payload);
    return normalizeCredentials(response.data, { fallbackEmail: payload.email });
  } catch (error) {
    throw new Error(getLoginErrorMessage(error));
  }
}

export async function refreshSession(refreshToken: string): Promise<AuthCredentials> {
  try {
    const response = await apiClient.post<AuthApiResponse>(AUTH_ENDPOINTS.refreshToken, {
      refreshToken,
    });

    return normalizeCredentials(response.data, { fallbackRefreshToken: refreshToken });
  } catch (error) {
    throw new Error(getLoginErrorMessage(error));
  }
}
