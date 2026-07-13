import { useEffect } from 'react';

import { refreshSession } from '@/features/auth/api/authApi';
import { AUTH_ENDPOINTS } from '@/features/auth/constants/authEndpoints';
import { useAuthStore } from '@/features/auth/store';
import { authTokenStorage } from '@/features/auth/utils/authTokenStorage';
import { configureAccessTokenGetter, configureApiAuthHandlers } from '@/shared/api';

export function useConfigureAuthApiClient() {
  const accessToken = useAuthStore((state) => state.session?.accessToken);
  const clearSession = useAuthStore((state) => state.clearSession);
  const setSession = useAuthStore((state) => state.setSession);

  useEffect(() => {
    configureAccessTokenGetter(() => accessToken);
  }, [accessToken]);

  useEffect(() => {
    configureApiAuthHandlers({
      ignoredPaths: Object.values(AUTH_ENDPOINTS),
      async onUnauthorized() {
        await authTokenStorage.removeRefreshToken();
        clearSession();
      },
      async refreshAccessToken() {
        const refreshToken = await authTokenStorage.getRefreshToken();

        if (!refreshToken) {
          return undefined;
        }

        const credentials = await refreshSession(refreshToken);

        await authTokenStorage.setRefreshToken(credentials.refreshToken);
        setSession(credentials.session);

        return credentials.session.accessToken;
      },
    });
  }, [clearSession, setSession]);
}
