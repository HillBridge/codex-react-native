import * as LocalAuthentication from 'expo-local-authentication';

import { createBiometricUnlockService, resolveBiometricUnlock } from './biometricUnlockService';

export const biometricUnlockService = createBiometricUnlockService({
  authenticate: () =>
    LocalAuthentication.authenticateAsync({
      biometricsSecurityLevel: 'strong',
      cancelLabel: '取消',
      disableDeviceFallback: true,
      fallbackLabel: '',
      promptMessage: '解锁已保存会话',
    }),
  hasHardware: () => LocalAuthentication.hasHardwareAsync(),
  isEnrolled: () => LocalAuthentication.isEnrolledAsync(),
});

export function unlockSavedSession() {
  return resolveBiometricUnlock({
    unlock: () => biometricUnlockService.unlock(),
    useMockFallback: process.env.EXPO_PUBLIC_USE_MOCK_BIOMETRICS === 'true',
  });
}
