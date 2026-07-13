import { Redirect, type Href } from 'expo-router';

import type { AppRoute } from '@/shared/routing/routes';

type AppRedirectProps = {
  to: AppRoute;
};

export function AppRedirect({ to }: AppRedirectProps) {
  return <Redirect href={to as Href} />;
}
