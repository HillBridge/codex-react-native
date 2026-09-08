import type { AxiosResponse, InternalAxiosRequestConfig } from 'axios';

import {
  getFreshAccessToken,
  isAuthRefreshIgnored,
  notifyUnauthorized,
} from '@/shared/api/apiAuth';
import {
  getApiMessage,
  isAccessTokenExpired,
  isApiEnvelope,
  isRefreshTokenExpired,
} from '@/shared/api/apiEnvelope';

type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _authRetry?: boolean;
};

type RetryRequestWithAccessToken = (
  response: AxiosResponse,
  accessToken: string,
) => Promise<AxiosResponse>;

function rejectSessionExpired(message = 'Session expired. Please sign in again.') {
  return Promise.reject(new Error(message));
}

export async function handleApiAuthResponse(
  response: AxiosResponse,
  retryRequestWithAccessToken: RetryRequestWithAccessToken,
) {
  if (!isApiEnvelope(response.data) && response.status !== 401) {
    return null;
  }

  const originalConfig = response.config as RetryableRequestConfig;

  const isUnauthorizedHttpResponse = response.status === 401;

  if (isApiEnvelope(response.data) && isRefreshTokenExpired(response.data)) {
    await notifyUnauthorized();

    return rejectSessionExpired(getApiMessage(response.data));
  }

  if (
    (!(isApiEnvelope(response.data) && isAccessTokenExpired(response.data)) &&
      !isUnauthorizedHttpResponse) ||
    originalConfig._authRetry ||
    isAuthRefreshIgnored(originalConfig.url)
  ) {
    return null;
  }

  try {
    const nextAccessToken = await getFreshAccessToken();

    if (!nextAccessToken) {
      await notifyUnauthorized();

      return rejectSessionExpired(getApiMessage(response.data));
    }

    return retryRequestWithAccessToken(response, nextAccessToken);
  } catch (error) {
    await notifyUnauthorized();

    return Promise.reject(error);
  }
}

export type { RetryableRequestConfig };
