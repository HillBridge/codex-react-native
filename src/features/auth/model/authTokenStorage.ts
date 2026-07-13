import { secureStorage } from '@/shared/storage';

const REFRESH_TOKEN_KEY = 'auth.refreshToken';

export const authTokenStorage = {
  getRefreshToken() {
    return secureStorage.getString(REFRESH_TOKEN_KEY);
  },

  removeRefreshToken() {
    return secureStorage.removeItem(REFRESH_TOKEN_KEY);
  },

  setRefreshToken(refreshToken: string) {
    return secureStorage.setString(REFRESH_TOKEN_KEY, refreshToken);
  },
};
