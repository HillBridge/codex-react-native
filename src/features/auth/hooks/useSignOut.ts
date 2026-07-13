import { useAuthStore } from '@/features/auth/store';
import { authTokenStorage } from '@/features/auth/utils/authTokenStorage';
import { APP_ROUTES, useAppNavigation } from '@/shared/routing';

export function useSignOut() {
  const clearSession = useAuthStore((state) => state.clearSession);
  const navigation = useAppNavigation();

  return async function signOut() {
    await authTokenStorage.removeRefreshToken();
    clearSession();
    navigation.replace(APP_ROUTES.login);
  };
}
