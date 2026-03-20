import { create } from 'zustand';

export type UserRole = 'customer' | 'vendor' | 'admin';

interface User {
  id: string;
  email: string;
  name?: string;
  role: UserRole;
  shopId?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  login: (user) => set({ user, isAuthenticated: true }),
  logout: () => set({ user: null, isAuthenticated: false }),
}));
