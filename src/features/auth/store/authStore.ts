import { create } from 'zustand';

export type AuthUser = {
  email: string;
  id: string;
  name: string;
};

export type AuthSession = {
  accessToken: string;
  user: AuthUser;
};

export type AuthStatus = 'restoring' | 'authenticated' | 'unauthenticated';

type AuthState = {
  clearSession: () => void;
  isAuthenticated: boolean;
  session: AuthSession | null;
  setSession: (session: AuthSession) => void;
  setStatus: (status: AuthStatus) => void;
  status: AuthStatus;
};

export const useAuthStore = create<AuthState>()((set) => ({
  clearSession: () => set({ isAuthenticated: false, session: null, status: 'unauthenticated' }),
  isAuthenticated: false,
  session: null,
  setSession: (session: AuthSession) =>
    set({ isAuthenticated: true, session, status: 'authenticated' }),
  setStatus: (status: AuthStatus) => set({ status }),
  status: 'restoring',
}));
