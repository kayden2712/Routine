import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { customerLoginApi, customerRegisterApi } from '@/lib/backendApi'
import type { CustomerUser } from '@/types/customer.types'

interface CustomerAuthState {
  user: CustomerUser | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<boolean>
  register: (fullName: string, email: string, password: string) => Promise<boolean>
  logout: () => void
}

export const useCustomerAuthStore = create<CustomerAuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      login: async (email, password) => {
        if (!email || !password) {
          return false
        }

        try {
          const user = await customerLoginApi(email, password)
          set({ isAuthenticated: true, user })
          return true
        } catch {
          return false
        }
      },
      register: async (fullName, email, password) => {
        if (!fullName || !email || !password) {
          return false
        }

        try {
          const user = await customerRegisterApi(fullName, email, password)
          set({ isAuthenticated: true, user })
          return true
        } catch {
          return false
        }
      },
      logout: () => set({ user: null, isAuthenticated: false }),
    }),
    {
      name: 'routine-customer-auth',
    },
  ),
)
