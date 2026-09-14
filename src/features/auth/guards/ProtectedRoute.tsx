import type { PropsWithChildren } from 'react';
import type { Href } from 'expo-router';

import { useAuthStore } from '@/features/auth/store';
import { AppRedirect, APP_ROUTES, type AppRoute } from '@/shared/routing';

import { AuthStatusScreen } from './AuthStatusScreen';

type ProtectedRouteProps = PropsWithChildren<{
  returnTo?: AppRoute;
}>;

export function ProtectedRoute({ children, returnTo = APP_ROUTES.home }: ProtectedRouteProps) {
  const session = useAuthStore((state) => state.session);
  const status = useAuthStore((state) => state.status);

  if (status === 'restoring') {
    return <AuthStatusScreen title="Restoring" description="Checking your saved session." />;
  }

  if (!session) {
    return <AppRedirect to={{ pathname: APP_ROUTES.login, params: { next: returnTo } } as Href} />;
  }

  return children;
}
