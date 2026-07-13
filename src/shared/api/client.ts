import axios, { AxiosHeaders } from 'axios';

import { apiLogger } from '@/shared/api/apiLogger';
import { API_BASE_URL } from '@/shared/constants/env';

type AccessTokenGetter = () => string | undefined;

let getAccessToken: AccessTokenGetter = () => undefined;

export function configureAccessTokenGetter(getter: AccessTokenGetter) {
  getAccessToken = getter;
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

apiClient.interceptors.request.use((config) => {
  const accessToken = getAccessToken();

  if (accessToken) {
    config.headers = AxiosHeaders.from(config.headers);
    config.headers.set('Authorization', `Bearer ${accessToken}`);
  }

  apiLogger.request(config);

  return config;
});

apiClient.interceptors.response.use(
  (response) => {
    apiLogger.response(response);
    return response;
  },
  (error) => {
    apiLogger.error(error);
    return Promise.reject(error);
  },
);
