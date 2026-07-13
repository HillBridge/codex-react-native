import { useEffect } from 'react';

import { useAuthStore } from '@/features/auth/store';
import { configureAccessTokenGetter } from '@/shared/api';

export function useConfigureAuthApiClient() {
  const accessToken = useAuthStore((state) => state.session?.accessToken);

  useEffect(() => {
    configureAccessTokenGetter(() => accessToken);
  }, [accessToken]);
}
