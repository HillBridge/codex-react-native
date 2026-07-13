import { useEffect } from 'react';

import { refreshSession } from '@/features/auth/api/authApi';
import { authTokenStorage } from '@/features/auth/model/authTokenStorage';
import { useAuthStore } from '@/store';

export function useAuthBootstrap() {
  const clearSession = useAuthStore((state) => state.clearSession);
  const setSession = useAuthStore((state) => state.setSession);
  const setStatus = useAuthStore((state) => state.setStatus);

  useEffect(() => {
    let isMounted = true;

    async function restoreSession() {
      setStatus('restoring');

      try {
        const refreshToken = await authTokenStorage.getRefreshToken();

        if (!refreshToken) {
          clearSession();
          return;
        }

        const credentials = await refreshSession(refreshToken);

        if (!isMounted) {
          return;
        }

        await authTokenStorage.setRefreshToken(credentials.refreshToken);
        setSession(credentials.session);
      } catch {
        await authTokenStorage.removeRefreshToken();

        if (isMounted) {
          clearSession();
        }
      }
    }

    restoreSession();

    return () => {
      isMounted = false;
    };
  }, [clearSession, setSession, setStatus]);
}
