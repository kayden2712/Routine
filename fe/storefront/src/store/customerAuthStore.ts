import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CustomerUser } from '@/types/customer.types'

interface CustomerAuthState {
  user: CustomerUser | null
  isAuthenticated: boolean
  login: (email: string, password: string) => boolean
  register: (fullName: string, email: string, password: string) => boolean
  logout: () => void
}

export const useCustomerAuthStore = create<CustomerAuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      login: (email, password) => {
        if (!email || !password) {
          return false
        }

        set({
          isAuthenticated: true,
          user: {
            id: crypto.randomUUID(),
            fullName: 'Khách hàng Routine',
            email,
          },
        })
        return true
      },
      register: (fullName, email, password) => {
        if (!fullName || !email || !password) {
          return false
        }

        set({
          isAuthenticated: true,
          user: {
            id: crypto.randomUUID(),
            fullName,
            email,
          },
        })
        return true
      },
      logout: () => set({ user: null, isAuthenticated: false }),
    }),
    {
      name: 'routine-customer-auth',
    },
  ),
)
