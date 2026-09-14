import { GuestOnlyRoute, LoginScreen } from '@/features/auth';

export default function LoginRoute() {
  return (
    <GuestOnlyRoute>
      <LoginScreen />
    </GuestOnlyRoute>
  );
}
