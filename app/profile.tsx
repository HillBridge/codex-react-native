import { ProtectedRoute } from '@/features/auth';
import { ProfileScreen } from '@/features/profile';

export default function ProfileRoute() {
  return (
    <ProtectedRoute>
      <ProfileScreen />
    </ProtectedRoute>
  );
}
