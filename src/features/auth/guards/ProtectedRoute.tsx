import type { PropsWithChildren } from 'react';

import { useAuthStore } from '@/features/auth/store';
import { AppRedirect, APP_ROUTES } from '@/shared/routing';

import { AuthStatusScreen } from './AuthStatusScreen';

export function ProtectedRoute({ children }: PropsWithChildren) {
  const session = useAuthStore((state) => state.session);
  const status = useAuthStore((state) => state.status);

  if (status === 'restoring') {
    return <AuthStatusScreen title="Restoring" description="Checking your saved session." />;
  }

  if (!session) {
    return <AppRedirect to={APP_ROUTES.login} />;
  }

  return children;
}
