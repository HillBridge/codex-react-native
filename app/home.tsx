import { ProtectedRoute } from '@/features/auth';
import { HomeScreen } from '@/features/home';

export default function HomeRoute() {
  return (
    <ProtectedRoute>
      <HomeScreen />
    </ProtectedRoute>
  );
}
