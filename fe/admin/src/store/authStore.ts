import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, UserRole } from '@/types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string, role: UserRole) => Promise<void>;
  logout: () => void;
}

const roleNameMap: Record<UserRole, string> = {
  manager: 'Quan ly cua hang',
  sales: 'Nhan vien ban hang',
  warehouse: 'Nhan vien kho',
  accountant: 'Ke toan',
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      login: async (email, _password, role) => {
        await new Promise((resolve) => setTimeout(resolve, 300));

        const user: User = {
          id: `u-${Date.now()}`,
          name: roleNameMap[role],
          email,
          role,
          avatarInitials: role.slice(0, 2).toUpperCase(),
        };

        set({ user, isAuthenticated: true });
      },
      logout: () => {
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
