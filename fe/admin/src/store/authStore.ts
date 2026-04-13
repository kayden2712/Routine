import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { adminLogin } from '@/lib/backendApi';
import type { User, UserRole } from '@/types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  authError: string;
  login: (email: string, password: string, role: UserRole) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      authError: '',
      login: async (email, password, role) => {
        try {
          const user = await adminLogin(email, password);
          const normalizedUser = user.role === 'admin' ? { ...user, role: 'manager' as const } : user;
          if (normalizedUser.role !== role) {
            const roleError = 'Vai tro khong khop voi tai khoan dang nhap';
            set({ authError: roleError });
            throw new Error(roleError);
          }
          set({ user: normalizedUser, isAuthenticated: true, authError: '' });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Dang nhap that bai';
          set({ authError: message });
          throw error;
        }
      },
      logout: () => {
        localStorage.removeItem('routine-auth');
        set({ user: null, isAuthenticated: false, authError: '' });
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
