import axios, { AxiosHeaders } from 'axios';
import type { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

import {
  getApiMessage,
  isAccessTokenExpired,
  isApiEnvelope,
  isRefreshTokenExpired,
} from '@/shared/api/apiEnvelope';
import { apiLogger } from '@/shared/api/apiLogger';
import { API_BASE_URL, API_CLIENT_ID, API_TIMEOUT_MS } from '@/shared/constants/env';
import { getDeviceId } from '@/shared/device';

type AccessTokenGetter = () => string | undefined;
type AccessTokenRefreshHandler = () => Promise<string | undefined>;
type UnauthorizedHandler = () => Promise<void> | void;

type ApiAuthHandlerOptions = {
  ignoredPaths?: readonly string[];
  onUnauthorized?: UnauthorizedHandler;
  refreshAccessToken?: AccessTokenRefreshHandler;
};

type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _authRetry?: boolean;
};

let getAccessToken: AccessTokenGetter = () => undefined;
let ignoredAuthRefreshPaths: readonly string[] = [];
let onUnauthorized: UnauthorizedHandler | undefined;
let refreshAccessToken: AccessTokenRefreshHandler | undefined;
let refreshPromise: Promise<string | undefined> | null = null;
let unauthorizedPromise: Promise<void> | null = null;

export function configureAccessTokenGetter(getter: AccessTokenGetter) {
  getAccessToken = getter;
}

export function configureApiAuthHandlers(options: ApiAuthHandlerOptions) {
  ignoredAuthRefreshPaths = options.ignoredPaths ?? ignoredAuthRefreshPaths;
  onUnauthorized = options.onUnauthorized ?? onUnauthorized;
  refreshAccessToken = options.refreshAccessToken ?? refreshAccessToken;
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT_MS,
});

function isAuthRefreshIgnored(config: InternalAxiosRequestConfig) {
  const requestUrl = config.url ?? '';

  return ignoredAuthRefreshPaths.some((path) => requestUrl.includes(path));
}

async function getFreshAccessToken() {
  if (!refreshAccessToken) {
    return undefined;
  }

  refreshPromise ??= refreshAccessToken().finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
}

async function notifyUnauthorized() {
  if (!onUnauthorized) {
    return;
  }

  unauthorizedPromise ??= Promise.resolve(onUnauthorized()).finally(() => {
    unauthorizedPromise = null;
  });

  await unauthorizedPromise;
}

function rejectSessionExpired(message = 'Session expired. Please sign in again.') {
  return Promise.reject(new Error(message));
}

async function retryRequestWithAccessToken(
  response: AxiosResponse,
  accessToken: string,
): Promise<AxiosResponse> {
  const originalConfig = response.config as RetryableRequestConfig;

  originalConfig._authRetry = true;
  originalConfig.headers = AxiosHeaders.from(originalConfig.headers);
  originalConfig.headers.set('Authorization', `Bearer ${accessToken}`);

  return apiClient.request(originalConfig);
}

apiClient.interceptors.request.use(async (config) => {
  const accessToken = getAccessToken();

  config.headers = AxiosHeaders.from(config.headers);
  config.headers.set('xxx-client-id', API_CLIENT_ID);
  config.headers.set('xxx-device-id', await getDeviceId());
  config.headers.set('Accept-Language', 'en-US');

  if (accessToken) {
    config.headers.set('Authorization', `Bearer ${accessToken}`);
  }

  apiLogger.request(config);

  return config;
});

apiClient.interceptors.response.use(
  async (response) => {
    apiLogger.response(response);

    if (!isApiEnvelope(response.data)) {
      return response;
    }

    const originalConfig = response.config as RetryableRequestConfig;

    if (isRefreshTokenExpired(response.data)) {
      await notifyUnauthorized();

      return rejectSessionExpired(getApiMessage(response.data));
    }

    if (
      isAccessTokenExpired(response.data) &&
      !originalConfig._authRetry &&
      !isAuthRefreshIgnored(originalConfig)
    ) {
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

    return response;
  },
  async (error: AxiosError) => {
    apiLogger.error(error);

    if (error.response?.status === 401) {
      await notifyUnauthorized();
    }

    return Promise.reject(error);
  },
);
