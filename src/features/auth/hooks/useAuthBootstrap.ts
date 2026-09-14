import { useCallback, useEffect, useRef } from 'react';

import { refreshSession } from '@/features/auth/api/authApi';
import { createSessionRefreshGate } from '@/features/auth/sessionRefreshGate';
import { useAuthStore } from '@/features/auth/store';
import { authTokenStorage } from '@/features/auth/utils/authTokenStorage';
import { useAppForeground } from '@/shared/lifecycle';

export function useAuthBootstrap() {
  const clearSession = useAuthStore((state) => state.clearSession);
  const setSession = useAuthStore((state) => state.setSession);
  const setStatus = useAuthStore((state) => state.setStatus);
  const isMountedRef = useRef(true);
  const refreshGate = useRef(createSessionRefreshGate());

  const refreshStoredSession = useCallback(
    async (isInitialRestore: boolean) => {
      if (isInitialRestore) {
        setStatus('restoring');
      }

      try {
        const refreshToken = await authTokenStorage.getRefreshToken();

        if (!refreshToken) {
          if (isMountedRef.current) {
            clearSession();
          }
          return;
        }

        const credentials = await refreshSession(refreshToken);

        if (!isMountedRef.current) {
          return;
        }

        await authTokenStorage.setRefreshToken(credentials.refreshToken);
        setSession(credentials.session);
      } catch {
        await authTokenStorage.removeRefreshToken();

        if (isMountedRef.current) {
          clearSession();
        }
      }
    },
    [clearSession, setSession, setStatus],
  );

  useEffect(() => {
    isMountedRef.current = true;
    void refreshGate.current.run(() => refreshStoredSession(true));

    return () => {
      isMountedRef.current = false;
    };
  }, [refreshStoredSession]);

  useAppForeground(
    useCallback(() => {
      if (!useAuthStore.getState().session) {
        return;
      }

      void refreshGate.current.run(() => refreshStoredSession(false));
    }, [refreshStoredSession]),
  );
}
