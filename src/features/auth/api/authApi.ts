import { AxiosError } from 'axios';

import { apiClient } from '@/api';
import { AUTH_ENDPOINTS } from '@/features/auth/api/authEndpoints';
import type { AuthSession } from '@/store';

export type LoginPayload = {
  email: string;
  password: string;
};

type LoginApiUser = {
  email?: string;
  id?: string | number;
  name?: string;
};

type LoginApiData = {
  accessToken?: string;
  access_token?: string;
  token?: string;
  user?: LoginApiUser;
};

type LoginApiResponse = LoginApiData | { data?: LoginApiData };

function hasNestedData(response: LoginApiResponse): response is { data?: LoginApiData } {
  return Object.prototype.hasOwnProperty.call(response, 'data');
}

function getLoginData(response: LoginApiResponse): LoginApiData {
  if (hasNestedData(response)) {
    return response.data ?? {};
  }

  return response;
}

function normalizeSession(response: LoginApiResponse, payload: LoginPayload): AuthSession {
  const data = getLoginData(response);
  const accessToken = data.accessToken ?? data.access_token ?? data.token;

  if (!accessToken) {
    throw new Error('Login response is missing access token.');
  }

  return {
    accessToken,
    user: {
      email: data.user?.email ?? payload.email,
      id: String(data.user?.id ?? ''),
      name: data.user?.name ?? payload.email.split('@')[0] ?? 'User',
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

export async function login(payload: LoginPayload): Promise<AuthSession> {
  try {
    const response = await apiClient.post<LoginApiResponse>(AUTH_ENDPOINTS.login, payload);
    return normalizeSession(response.data, payload);
  } catch (error) {
    throw new Error(getLoginErrorMessage(error));
  }
}
