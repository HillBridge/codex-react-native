import type { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

const REDACTED = '[REDACTED]';
const SENSITIVE_KEYS = new Set([
  'authorization',
  'access_token',
  'accesstoken',
  'code',
  'login_code',
  'logincode',
  'mfa_code',
  'mfacode',
  'password',
  'pwd',
  'refresh_token',
  'refreshtoken',
  'token',
]);

function isSensitiveKey(key: string) {
  const normalizedKey = key.toLowerCase();

  return SENSITIVE_KEYS.has(normalizedKey) || normalizedKey.includes('token');
}

function redactSensitiveData(value: unknown): unknown {
  if (typeof value === 'string') {
    const trimmedValue = value.trim();

    if (trimmedValue.startsWith('{') || trimmedValue.startsWith('[')) {
      try {
        return redactSensitiveData(JSON.parse(trimmedValue));
      } catch {
        return value;
      }
    }

    return value;
  }

  if (!value || typeof value !== 'object') {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => redactSensitiveData(item));
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, entryValue]) => [
      key,
      isSensitiveKey(key) ? REDACTED : redactSensitiveData(entryValue),
    ]),
  );
}

function normalizeHeaders(config: InternalAxiosRequestConfig) {
  if (!config.headers) {
    return undefined;
  }

  if ('toJSON' in config.headers && typeof config.headers.toJSON === 'function') {
    return config.headers.toJSON();
  }

  return config.headers;
}

function getRequestSummary(config: InternalAxiosRequestConfig) {
  return {
    baseURL: config.baseURL,
    data: config.data || redactSensitiveData(config.data),
    headers: redactSensitiveData(normalizeHeaders(config)),
    method: config.method?.toUpperCase(),
    params: redactSensitiveData(config.params),
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
