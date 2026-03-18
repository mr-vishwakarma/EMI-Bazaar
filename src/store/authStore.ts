import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type UserRole = 'customer' | 'vendor' | 'admin' | null;

interface User {
    id: string;
    phone?: string;
    email?: string;
    name: string;
    role: UserRole;
    shopId?: string; // Optional: Only for vendors
}

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    login: (userData: User) => void;
    logout: () => void;
    updateUser: (data: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            isAuthenticated: false,

            login: (userData) =>
                set({ user: userData, isAuthenticated: true }),

            logout: () =>
                set({ user: null, isAuthenticated: false }),

            updateUser: (data) =>
                set((state) => ({
                    user: state.user ? { ...state.user, ...data } : null,
                })),

        }),
        {
            name: 'emi-bazaar-auth', // This is the key stored in LocalStorage
            partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
        }
    )
);
