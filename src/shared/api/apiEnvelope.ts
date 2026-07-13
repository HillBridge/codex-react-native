export type ApiEnvelope<TData = unknown> = {
  code?: number;
  data?: TData;
  error?: string;
  message?: string;
};

export const API_CODE = {
  success: 200,
  accessTokenExpired: 4011,
  refreshTokenExpired: 4012,
} as const;

export function isApiEnvelope(value: unknown): value is ApiEnvelope {
  return Boolean(value && typeof value === 'object' && 'code' in value);
}

export function isApiSuccess(value: ApiEnvelope) {
  return value.code === API_CODE.success;
}

export function isAccessTokenExpired(value: ApiEnvelope) {
  return value.code === API_CODE.accessTokenExpired;
}

export function isRefreshTokenExpired(value: ApiEnvelope) {
  return value.code === API_CODE.refreshTokenExpired;
}

export function getApiMessage(value: ApiEnvelope) {
  return value.message ?? value.error ?? 'Request failed.';
}
