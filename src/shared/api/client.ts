import axios, { AxiosHeaders } from 'axios';
import type { AxiosError, AxiosResponse } from 'axios';

import { notifyUnauthorized } from '@/shared/api/apiAuth';
import { apiLogger } from '@/shared/api/apiLogger';
import {
  handleApiAuthResponse,
  type RetryableRequestConfig,
} from '@/shared/api/authResponseHandler';
import { applyApiRequestHeaders } from '@/shared/api/requestHeaders';
import { API_BASE_URL, API_TIMEOUT_MS } from '@/shared/constants/env';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT_MS,
});

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
  await applyApiRequestHeaders(config);

  apiLogger.request(config);

  return config;
});

apiClient.interceptors.response.use(
  async (response) => {
    apiLogger.response(response);

    return (await handleApiAuthResponse(response, retryRequestWithAccessToken)) ?? response;
  },
  async (error: AxiosError) => {
    apiLogger.error(error);

    if (error.response?.status === 401) {
      await notifyUnauthorized();
    }

    return Promise.reject(error);
  },
);
