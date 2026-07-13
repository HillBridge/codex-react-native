import { AxiosError } from 'axios';

import { AUTH_ENDPOINTS } from '@/features/auth/constants/authEndpoints';
import type { AuthSession } from '@/features/auth/store';
import { apiClient, getApiMessage, isApiSuccess } from '@/shared/api';
import type { ApiEnvelope } from '@/shared/api';
import { base64Encode } from '@/shared/utils/base64';

export type LoginPayload = {
  areaCode: string;
  googleCode?: string;
  loginCode?: string;
  mobile: string;
  password: string;
};

type AuthApiUser = {
  email?: string;
  id?: string | number;
  name?: string;
  phone?: string;
};

type AuthApiData = {
  accessToken?: string;
  access_token?: string;
  challenge_expire_at?: string;
  challenge_id?: string;
  code?: string;
  google_auth?: number;
  mfa_qr_code?: string;
  principal_options?: PrincipalOption[];
  qr_code_image?: string;
  refreshToken?: string;
  refresh_token?: string;
  remaining_times?: string | number;
  token?: string;
  user?: AuthApiUser;
};

type AuthApiResponse = ApiEnvelope<AuthApiData>;

type PrincipalOption = {
  merchant_name?: string;
  principal_id: string;
  principal_name?: string;
  principal_type?: string;
};

export type AuthCredentials = {
  refreshToken: string;
  session: AuthSession;
};

export type LoginResult =
  | { credentials: AuthCredentials; type: 'authenticated' }
  | { message: string; remainingTimes?: string; type: 'invalidPassword' }
  | { challenge: AuthApiData; message: string; type: 'mfaRequired' }
  | { message: string; qrCode: string; type: 'mfaQrBindingRequired' }
  | {
      challengeExpireAt?: string;
      challengeId: string;
      message: string;
      principalOptions: PrincipalOption[];
      type: 'principalSelectionRequired';
    };

function normalizeCredentials(
  data: AuthApiData,
  options: {
    fallbackPhone?: string;
    fallbackRefreshToken?: string;
  } = {},
): AuthCredentials {
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
        email: data.user?.email,
        id: String(data.user?.id ?? ''),
        name: data.user?.name ?? data.user?.phone ?? options.fallbackPhone ?? 'User',
        phone: data.user?.phone ?? options.fallbackPhone,
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

function getBusinessErrorMessage(response: AuthApiResponse) {
  return getApiMessage(response);
}

function hasPrincipalOptions(data: AuthApiData) {
  return Boolean(data.challenge_id && data.principal_options && data.principal_options.length > 0);
}

function resolveLoginResult(response: AuthApiResponse, payload: LoginPayload): LoginResult {
  const data = response.data ?? {};

  if (response.code === 4005202) {
    return {
      message: 'Login failed: Incorrect password',
      remainingTimes: data.remaining_times === undefined ? undefined : String(data.remaining_times),
      type: 'invalidPassword',
    };
  }

  if (response.code === 400201) {
    return {
      challenge: data,
      message: response.message ?? 'Google Auth verification is required.',
      type: 'mfaRequired',
    };
  }

  if (response.code === 400209 && (data.qr_code_image || data.mfa_qr_code)) {
    return {
      message: response.message ?? 'Google Auth binding is required.',
      qrCode: data.qr_code_image ?? data.mfa_qr_code ?? '',
      type: 'mfaQrBindingRequired',
    };
  }

  if (response.code === 200) {
    if (data.access_token || data.accessToken || data.token) {
      return {
        credentials: normalizeCredentials(data, { fallbackPhone: payload.mobile }),
        type: 'authenticated',
      };
    }

    if (data.mfa_qr_code) {
      return {
        message: response.message ?? 'Google Auth binding is required.',
        qrCode: data.mfa_qr_code,
        type: 'mfaQrBindingRequired',
      };
    }

    if (hasPrincipalOptions(data)) {
      return {
        challengeExpireAt: data.challenge_expire_at,
        challengeId: data.challenge_id ?? '',
        message: 'Please select a merchant identity to continue.',
        principalOptions: data.principal_options ?? [],
        type: 'principalSelectionRequired',
      };
    }
  }

  throw new Error(getBusinessErrorMessage(response));
}

export async function login(payload: LoginPayload): Promise<LoginResult> {
  try {
    const response = await apiClient.post<AuthApiResponse>(AUTH_ENDPOINTS.login, {
      area_code: payload.areaCode,
      code: payload.googleCode,
      login_code: payload.loginCode,
      mfa_code: payload.googleCode ?? '',
      phone: payload.mobile,
      pwd: base64Encode(payload.password),
    });

    return resolveLoginResult(response.data, payload);
  } catch (error) {
    throw new Error(getLoginErrorMessage(error));
  }
}

export async function refreshSession(refreshToken: string): Promise<AuthCredentials> {
  try {
    const response = await apiClient.post<AuthApiResponse>(AUTH_ENDPOINTS.refreshToken, {
      refresh_token: refreshToken,
    });

    if (!isApiSuccess(response.data)) {
      throw new Error(getBusinessErrorMessage(response.data));
    }

    return normalizeCredentials(response.data.data ?? {}, { fallbackRefreshToken: refreshToken });
  } catch (error) {
    throw new Error(getLoginErrorMessage(error));
  }
}
