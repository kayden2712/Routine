import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { customerLoginApi, customerRegisterApi } from '@/lib/backendApi'
import type { CustomerUser } from '@/types/customer.types'

interface CustomerAuthState {
  user: CustomerUser | null
  isAuthenticated: boolean
  authError: string
  login: (email: string, password: string) => Promise<boolean>
  register: (fullName: string, email: string, password: string, phone: string) => Promise<boolean>
  setUser: (user: CustomerUser) => void
  logout: () => void
}

export const useCustomerAuthStore = create<CustomerAuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      authError: '',
      login: async (email, password) => {
        if (!email || !password) {
          set({ authError: 'Vui lòng nhập email và mật khẩu.' })
          return false
        }

        try {
          const user = await customerLoginApi(email, password)
          set({ isAuthenticated: true, user, authError: '' })
          return true
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Dang nhap that bai.'
          set({ authError: message })
          return false
        }
      },
      register: async (fullName, email, password, phone) => {
        if (!fullName || !email || !password || !phone) {
          set({ authError: 'Vui lòng nhập đầy đủ thông tin.' })
          return false
        }

        try {
          const user = await customerRegisterApi(fullName, email, password, phone)
          set({ isAuthenticated: true, user, authError: '' })
          return true
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Dang ky that bai.'
          set({ authError: message })
          return false
        }
      },
      setUser: (user) => set({ user, isAuthenticated: true }),
      logout: () => set({ user: null, isAuthenticated: false, authError: '' }),
    }),
    {
      name: 'routine-customer-auth',
    },
  ),
)
