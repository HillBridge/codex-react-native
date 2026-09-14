import type { PropsWithChildren } from 'react';

import { useAuthStore } from '@/features/auth/store';
import { AppRedirect, APP_ROUTES, type AppRoute } from '@/shared/routing';

import { AuthStatusScreen } from './AuthStatusScreen';

type GuestOnlyRouteProps = PropsWithChildren<{
  redirectTo?: AppRoute;
}>;

export function GuestOnlyRoute({ children, redirectTo = APP_ROUTES.home }: GuestOnlyRouteProps) {
  const session = useAuthStore((state) => state.session);
  const status = useAuthStore((state) => state.status);

  if (status === 'restoring') {
    return <AuthStatusScreen title="Restoring" description="Checking your saved session." />;
  }

  if (session) {
    return <AppRedirect to={redirectTo} />;
  }

  return children;
}
