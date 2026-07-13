import type { PropsWithChildren } from 'react';

import { useAuthBootstrap } from '@/features/auth/model/useAuthBootstrap';

export function AuthBootstrapper({ children }: PropsWithChildren) {
  useAuthBootstrap();

  return children;
}
