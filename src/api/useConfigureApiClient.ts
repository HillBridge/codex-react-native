import { useEffect } from 'react';

import { configureAccessTokenGetter } from '@/api/client';
import { useAuthStore } from '@/store';

export function useConfigureApiClient() {
  const accessToken = useAuthStore((state) => state.session?.accessToken);

  useEffect(() => {
    configureAccessTokenGetter(() => accessToken);
  }, [accessToken]);
}
