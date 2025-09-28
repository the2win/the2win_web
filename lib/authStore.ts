import { create } from 'zustand';

export interface User { id: string; email: string; balance: number; role?: 'user'|'admin'; }
export interface AuthState {
  token?: string; // retained for backward compatibility; cookie session may not supply
  user?: User;
  initializing: boolean;
  setAuth: (token: string | undefined, user: User) => void;
  setInitializing: (v: boolean) => void;
  logout: () => void;
  updateUserBalance: (balance: number) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: undefined,
  user: undefined,
  initializing: true,
  setAuth: (token, user) => set({ token, user }),
  setInitializing: (v) => set({ initializing: v }),
  logout: () => set({ token: undefined, user: undefined }),
  updateUserBalance: (balance) => set(state => state.user ? { user: { ...state.user, balance } } : {})
}));

export function getAuthToken() { return useAuthStore.getState().token; }
