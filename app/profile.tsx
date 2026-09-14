import { ProtectedRoute } from '@/features/auth';
import { ProfileScreen } from '@/features/profile';
import { APP_ROUTES } from '@/shared/routing';

export default function ProfileRoute() {
  return (
    <ProtectedRoute returnTo={APP_ROUTES.profile}>
      <ProfileScreen />
    </ProtectedRoute>
  );
}
