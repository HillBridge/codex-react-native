import { type Href, useRouter } from 'expo-router';
import { useMemo } from 'react';

import type { AppRoute } from '@/shared/routing/routes';

function toHref(route: AppRoute) {
  return route as Href;
}

export function useAppNavigation() {
  const router = useRouter();

  return useMemo(
    () => ({
      back: router.back,
      push: (route: AppRoute) => router.push(toHref(route)),
      replace: (route: AppRoute) => router.replace(toHref(route)),
    }),
    [router],
  );
}
