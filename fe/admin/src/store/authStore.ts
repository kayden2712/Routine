import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { adminLogin } from '@/lib/backendApi';
import type { User, UserRole } from '@/types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string, role: UserRole) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      login: async (email, password, role) => {
        const user = await adminLogin(email, password);
        if (user.role !== role) {
          throw new Error('Vai trò không khớp với tài khoản đăng nhập');
        }
        set({ user, isAuthenticated: true });
      },
      logout: () => {
        localStorage.removeItem('routine-auth');
        set({ user: null, isAuthenticated: false });
      },
    }),
    {
      name: 'routine-auth',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
