import type { AuthCredentials, LoginPayload } from '@/features/auth/api/authApi';

type LoginLoader = (payload: LoginPayload) => Promise<AuthCredentials>;
type LoginFallback = (payload: LoginPayload) => AuthCredentials | undefined;
type RefreshLoader = (refreshToken: string) => Promise<AuthCredentials>;
type RefreshFallback = (refreshToken: string) => AuthCredentials | undefined;
type ShouldFallback = (error: unknown) => boolean;

const shouldAlwaysFallback: ShouldFallback = () => true;

export async function loginOrLocal(
  loadRemote: LoginLoader,
  loadLocal: LoginFallback,
  payload: LoginPayload,
  shouldFallback: ShouldFallback = shouldAlwaysFallback,
): Promise<AuthCredentials> {
  try {
    return await loadRemote(payload);
  } catch (error) {
    if (!shouldFallback(error)) {
      throw error;
    }

    const localCredentials = loadLocal(payload);

    if (localCredentials) {
      return localCredentials;
    }

    throw error;
  }
}

export async function refreshOrLocal(
  loadRemote: RefreshLoader,
  loadLocal: RefreshFallback,
  refreshToken: string,
  shouldFallback: ShouldFallback = shouldAlwaysFallback,
): Promise<AuthCredentials> {
  try {
    return await loadRemote(refreshToken);
  } catch (error) {
    if (!shouldFallback(error)) {
      throw error;
    }

    const localCredentials = loadLocal(refreshToken);

    if (localCredentials) {
      return localCredentials;
    }

    throw error;
  }
}
