import type { OrderStatus, TrackingStep } from '@/types/order'

export const cancelReasonOptions = [
  'Đổi ý, không còn nhu cầu mua',
  'Muốn thay đổi sản phẩm hoặc biến thể',
  'Đặt nhầm sản phẩm',
  'Thời gian giao dự kiến quá lâu',
  'Lý do khác',
] as const

export const orderStatusLabelMap: Record<OrderStatus, string> = {
  processing: 'Đang xử lý',
  preparing: 'Đang chuẩn bị',
  shipping: 'Đang giao',
  received: 'Đã nhận',
  cancelled: 'Đã hủy',
  cancel_requested: 'Chờ xác nhận hủy',
  refund_requested: 'Đang xử lý hoàn tiền',
  refunded: 'Đã hoàn tiền',
}

export const orderStatusClassMap: Record<OrderStatus, string> = {
  processing: 'border border-slate-500/30 bg-slate-500/10 text-slate-600',
  preparing: 'border border-indigo-500/30 bg-indigo-500/10 text-indigo-600',
  shipping: 'border border-blue-500/30 bg-blue-500/10 text-blue-500',
  received: 'border border-green-500/30 bg-green-500/10 text-green-600',
  cancelled: 'border border-red-500/30 bg-red-500/10 text-red-600',
  cancel_requested: 'border border-amber-500/30 bg-amber-500/10 text-amber-600',
  refund_requested: 'border border-orange-500/30 bg-orange-500/10 text-orange-600',
  refunded: 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-600',
}

export const orderStatusColorMap: Record<OrderStatus, { bg: string; text: string; border: string }> = {
  processing: { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-300' },
  preparing: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-300' },
  shipping: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-300' },
  received: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-300' },
  cancelled: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-300' },
  cancel_requested: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-300' },
  refund_requested: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-300' },
  refunded: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-300' },
}

export function buildOrderDetailTracking(status: OrderStatus): TrackingStep[] {
  if (status === 'refunded') {
    return [
      { label: 'Đang xử lý', state: 'completed' },
      { label: 'Đang chuẩn bị hàng', state: 'completed' },
      { label: 'Đã giao hàng', state: 'completed' },
      { label: 'Đã hoàn tiền', state: 'current' },
    ]
  }

  if (status === 'refund_requested') {
    return [
      { label: 'Đang xử lý', state: 'completed' },
      { label: 'Đang chuẩn bị hàng', state: 'completed' },
      { label: 'Đã giao hàng', state: 'completed' },
      { label: 'Đang xử lý hoàn tiền', state: 'current' },
    ]
  }

  if (status === 'cancelled') {
    return [
      { label: 'Đang xử lý', state: 'completed' },
      { label: 'Đang chuẩn bị hàng', state: 'completed' },
      { label: 'Đơn đã hủy', state: 'current' },
      { label: 'Đã giao', state: 'upcoming' },
    ]
  }

  if (status === 'cancel_requested') {
    return [
      { label: 'Đang xử lý', state: 'completed' },
      { label: 'Đang chuẩn bị hàng', state: 'completed' },
      { label: 'Đã gửi yêu cầu hủy', state: 'current' },
      { label: 'Chờ shop xác nhận', state: 'upcoming' },
    ]
  }

  return [
    { label: 'Đang xử lý', state: status === 'processing' ? 'current' : 'completed' },
    {
      label: 'Đang chuẩn bị hàng',
      state: status === 'preparing' ? 'current' : status === 'processing' ? 'upcoming' : 'completed',
    },
    {
      label: 'Đang giao hàng',
      state: status === 'shipping' ? 'current' : status === 'processing' || status === 'preparing' ? 'upcoming' : 'completed',
    },
    { label: 'Đã giao', state: status === 'received' ? 'current' : 'upcoming' },
  ]
}

export function buildAccountTracking(status: OrderStatus): TrackingStep[] {
  if (status === 'cancelled') {
    return [
      { label: 'Đơn hàng đã đặt', state: 'completed' },
      { label: 'Cửa hàng đã xác nhận', state: 'completed' },
      { label: 'Đơn đã hủy', state: 'current' },
    ]
  }

  if (status === 'cancel_requested') {
    return [
      { label: 'Đơn hàng đã đặt', state: 'completed' },
      { label: 'Cửa hàng đã xác nhận', state: 'completed' },
      { label: 'Đã gửi yêu cầu hủy', state: 'current' },
      { label: 'Chờ shop xác nhận', state: 'upcoming' },
    ]
  }

  if (status === 'refund_requested') {
    return [
      { label: 'Đơn hàng đã đặt', state: 'completed' },
      { label: 'Đã nhận hàng', state: 'completed' },
      { label: 'Đang xử lý hoàn tiền', state: 'current' },
    ]
  }

  if (status === 'refunded') {
    return [
      { label: 'Đơn hàng đã đặt', state: 'completed' },
      { label: 'Đã nhận hàng', state: 'completed' },
      { label: 'Đã hoàn tiền', state: 'current' },
    ]
  }

  return [
    { label: 'Đơn hàng đã đặt', state: 'completed' },
    { label: 'Đang xử lý', state: status === 'processing' ? 'current' : 'completed' },
    {
      label: 'Đang chuẩn bị hàng',
      state: status === 'preparing' ? 'current' : status === 'processing' ? 'upcoming' : 'completed',
    },
    {
      label: 'Đang giao hàng',
      state: status === 'shipping' ? 'current' : status === 'processing' || status === 'preparing' ? 'upcoming' : 'completed',
    },
    { label: 'Đã nhận hàng', state: status === 'received' ? 'current' : 'upcoming' },
  ]
}
