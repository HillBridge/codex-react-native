import { useLocalSearchParams } from 'expo-router';

import { GuestOnlyRoute, LoginScreen } from '@/features/auth';
import { getPostLoginRoute } from '@/features/auth/postLoginRoute';

export default function LoginRoute() {
  const { next } = useLocalSearchParams<{ next?: string }>();
  const returnTo = getPostLoginRoute(next);

  return (
    <GuestOnlyRoute redirectTo={returnTo}>
      <LoginScreen returnTo={returnTo} />
    </GuestOnlyRoute>
  );
}
