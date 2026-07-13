import { useEffect } from 'react';

import { configureAccessTokenGetter } from '@/api/client';
import { useAuthStore } from '@/features/auth';

export function useConfigureApiClient() {
  const accessToken = useAuthStore((state) => state.session?.accessToken);

  useEffect(() => {
    configureAccessTokenGetter(() => accessToken);
  }, [accessToken]);
}
