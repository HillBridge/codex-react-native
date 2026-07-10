import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type AuthUser = {
  email: string;
  id: string;
  name: string;
};

export type AuthSession = {
  accessToken: string;
  user: AuthUser;
};

type AuthState = {
  clearSession: () => void;
  isAuthenticated: boolean;
  session: AuthSession | null;
  setSession: (session: AuthSession) => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      clearSession: () => set({ isAuthenticated: false, session: null }),
      isAuthenticated: false,
      session: null,
      setSession: (session) => set({ isAuthenticated: true, session }),
    }),
    {
      name: 'auth-session',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
