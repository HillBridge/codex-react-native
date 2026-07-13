import axios, { AxiosHeaders } from 'axios';

import { apiLogger } from '@/shared/api/apiLogger';
import { API_BASE_URL, API_CLIENT_ID } from '@/shared/constants/env';
import { getDeviceId } from '@/shared/device';

type AccessTokenGetter = () => string | undefined;

let getAccessToken: AccessTokenGetter = () => undefined;

export function configureAccessTokenGetter(getter: AccessTokenGetter) {
  getAccessToken = getter;
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

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
  (response) => {
    apiLogger.response(response);
    return response;
  },
  (error) => {
    apiLogger.error(error);
    return Promise.reject(error);
  },
);
