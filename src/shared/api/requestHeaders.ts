import { AxiosHeaders } from 'axios';
import type { InternalAxiosRequestConfig } from 'axios';

import { getCurrentAccessToken } from '@/shared/api/apiAuth';
import { API_CLIENT_ID } from '@/shared/constants/env';
import { getDeviceId } from '@/shared/device';

export async function applyApiRequestHeaders(config: InternalAxiosRequestConfig) {
  const accessToken = getCurrentAccessToken();

  config.headers = AxiosHeaders.from(config.headers);
  config.headers.set('xxx-client-id', API_CLIENT_ID);
  config.headers.set('xxx-device-id', await getDeviceId());
  config.headers.set('Accept-Language', 'en-US');

  if (accessToken) {
    config.headers.set('Authorization', `Bearer ${accessToken}`);
  }

  return config;
}
