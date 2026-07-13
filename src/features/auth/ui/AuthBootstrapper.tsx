import type { PropsWithChildren } from 'react';

import { useAuthBootstrap } from '@/features/auth/hooks';

export function AuthBootstrapper({ children }: PropsWithChildren) {
  useAuthBootstrap();

  return children;
}
