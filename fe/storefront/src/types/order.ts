export type OrderStatus =
  | 'processing'
  | 'preparing'
  | 'shipping'
  | 'received'
  | 'cancelled'
  | 'cancel_requested'
  | 'refund_requested'
  | 'refunded'

export interface TrackingStep {
  label: string
  state: 'completed' | 'current' | 'upcoming'
}

export interface OrderStatusChangedEvent {
  orderId?: number
}
