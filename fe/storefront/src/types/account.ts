import type { TrackingStep, OrderStatus } from '@/types/order'

export type AccountTab = 'orders' | 'profile' | 'security'

export interface AccountOrder {
  orderId: string
  id: string
  date: string
  createdAt: Date
  updatedAt?: Date
  status: OrderStatus
  subtotal: number
  discount: number
  shippingFee: number
  total: number
  notes?: string
  items: Array<{ id: string; name: string; image: string }>
  tracking: TrackingStep[]
}
