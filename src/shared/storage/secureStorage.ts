import * as SecureStore from 'expo-secure-store';

const defaultOptions: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

export const secureStorage = {
  async getString(key: string) {
    return SecureStore.getItemAsync(key, defaultOptions);
  },

  async removeItem(key: string) {
    await SecureStore.deleteItemAsync(key, defaultOptions);
  },

  async setString(key: string, value: string) {
    await SecureStore.setItemAsync(key, value, defaultOptions);
  },
};
