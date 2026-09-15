import { ProtectedRoute } from '@/features/auth';
import { ProfileScreen } from '@/features/profile';
import { APP_ROUTES } from '@/shared/routing';
import {
  markNavigationRouteModuleLoaded,
  markNavigationRouteRenderStarted,
} from '@/shared/routing/navigationTiming';

markNavigationRouteModuleLoaded(APP_ROUTES.profile);

export default function ProfileRoute() {
  markNavigationRouteRenderStarted(APP_ROUTES.profile);

  return (
    <ProtectedRoute returnTo={APP_ROUTES.profile}>
      <ProfileScreen />
    </ProtectedRoute>
  );
}
