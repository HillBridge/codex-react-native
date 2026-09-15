import { secureStorage } from '@/shared/storage';

const BIOMETRIC_UNLOCK_KEY = 'auth.biometricUnlockEnabled';

export const biometricUnlockPreference = {
  async isEnabled() {
    return (await secureStorage.getString(BIOMETRIC_UNLOCK_KEY)) === 'true';
  },

  async setEnabled(isEnabled: boolean) {
    if (!isEnabled) {
      await secureStorage.removeItem(BIOMETRIC_UNLOCK_KEY);
      return;
    }

    await secureStorage.setString(BIOMETRIC_UNLOCK_KEY, 'true');
  },
};
