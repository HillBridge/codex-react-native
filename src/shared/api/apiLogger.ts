import type { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

function getRequestSummary(config: InternalAxiosRequestConfig) {
  return {
    baseURL: config.baseURL,
    data: config.data,
    method: config.method?.toUpperCase(),
    params: config.params,
    url: config.url,
  };
}

export const apiLogger = {
  request(config: InternalAxiosRequestConfig) {
    if (!__DEV__) {
      return;
    }

    console.log('[API Request]', getRequestSummary(config));
  },

  response(response: AxiosResponse) {
    if (!__DEV__) {
      return;
    }

    console.log('[API Response]', {
      data: response.data,
      status: response.status,
      url: response.config.url,
    });
  },

  error(error: AxiosError) {
    if (!__DEV__) {
      return;
    }

    console.log('[API Error]', {
      data: error.response?.data,
      message: error.message,
      status: error.response?.status,
      url: error.config?.url,
    });
  },
};
