import type { OrderStatus, TrackingStep } from '@/types/order'

export interface OrderDetailItem {
  id: string
  productId: string
  productName: string
  quantity: number
  price: number
  size?: string
  color?: string
  image?: string
}

export interface OrderShippingInfo {
  fullName: string
  phone: string
  email?: string
  address: string
  district: string
  city: string
}

export interface OrderDetail {
  orderId: string
  orderNumber: string
  status: OrderStatus
  subtotal: number
  discount: number
  total: number
  notes?: string
  items: OrderDetailItem[]
  createdAt: Date
  deliveredAt?: Date
  tracking: TrackingStep[]
  shippingInfo?: OrderShippingInfo
  paymentMethod?: 'cod' | 'bank'
}
