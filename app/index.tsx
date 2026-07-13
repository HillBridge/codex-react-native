import { GuestOnlyRoute, LoginScreen } from '@/features/auth';

export default function IndexRoute() {
  return (
    <GuestOnlyRoute>
      <LoginScreen />
    </GuestOnlyRoute>
  );
}
