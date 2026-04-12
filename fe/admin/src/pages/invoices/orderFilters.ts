import type { Order } from '@/types';

export type OrderChannelFilter = 'all' | 'online' | 'offline';

export type OnlineWorkflowFilter =
  | 'all'
  | 'needs_confirmation'
  | 'preparing'
  | 'waiting_ship'
  | 'delivering'
  | 'completed'
  | 'cancel_requests'
  | 'return_requests';

const statusSearchLabelMap: Record<Order['status'], string> = {
  pending: 'Cho xu ly Chờ xử lý',
  confirmed: 'Da xac nhan Đã xác nhận',
  packing: 'Chuan bi hang Chuẩn bị hàng',
  ready_to_ship: 'San sang giao Sẵn sàng giao',
  in_transit: 'Dang giao Đang giao',
  out_for_delivery: 'Dang phat Đang phát',
  delivered: 'Da giao Đã giao',
  completed: 'Hoan thanh Hoàn thành',
  cancel_requested: 'Yeu cau huy Chờ xác nhận hủy',
  paid: 'Da thanh toan Đã thanh toán',
  cancelled: 'Da huy Đã hủy',
  return_requested: 'Yeu cau hoan Yêu cầu hoàn',
  return_approved: 'Da duyet hoan Đã duyệt hoàn',
  return_rejected: 'Tu choi hoan Từ chối hoàn',
  return_received: 'Da nhan hang hoan Đã nhận hàng hoàn',
  refund_pending: 'Cho hoan tien Chờ hoàn tiền',
  refunded: 'Da hoan tien Đã hoàn tiền',
  failed_delivery: 'Giao that bai Giao thất bại',
};

export function normalizeForSearch(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
}

export function initialsOfName(name: string): string {
  const words = name.split(' ').filter(Boolean);
  return words
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('');
}

export function getOrderActivityTime(order: Order): Date {
  return order.updatedAt ?? order.createdAt;
}

export function getPrimaryWorkflowAction(order: Order): { label: string; nextStatus: Order['status'] } | null {
  if (order.channel !== 'online') {
    return null;
  }

  if (order.status === 'pending') {
    return { label: 'Xác nhận đơn', nextStatus: 'confirmed' };
  }

  if (order.status === 'confirmed') {
    return { label: 'Chuẩn bị hàng', nextStatus: 'packing' };
  }

  if (order.status === 'packing') {
    return { label: 'Sẵn sàng giao', nextStatus: 'ready_to_ship' };
  }

  if (order.status === 'ready_to_ship') {
    return { label: 'Giao vận chuyển', nextStatus: 'in_transit' };
  }

  return null;
}

export function matchesWorkflowFilter(order: Order, filter: OnlineWorkflowFilter): boolean {
  if (filter === 'all') return true;
  if (filter === 'needs_confirmation') return order.status === 'pending';
  if (filter === 'preparing') return order.status === 'confirmed' || order.status === 'packing';
  if (filter === 'waiting_ship') return order.status === 'ready_to_ship';
  if (filter === 'delivering') return order.status === 'in_transit' || order.status === 'out_for_delivery';
  if (filter === 'completed') return order.status === 'delivered' || order.status === 'completed' || order.status === 'paid';
  if (filter === 'cancel_requests') return order.status === 'cancel_requested';
  if (filter === 'return_requests') return order.status === 'return_requested';
  return true;
}

export function matchesOrderSearch(order: Order, searchQuery: string): boolean {
  const q = normalizeForSearch(searchQuery).replace(/^#/, '');
  if (!q) {
    return true;
  }

  const paymentLabel = order.paymentMethod === 'cash'
    ? 'tien mat tiền mặt cash cod'
    : 'chuyen khoan chuyển khoản transfer bank';

  const channelLabel = order.channel === 'online' ? 'online trực tuyến' : 'offline tại quầy';

  const primaryHaystack = normalizeForSearch([
    order.id,
    order.orderNumber,
    order.customer?.name,
    order.customer?.email,
    order.customer?.phone,
  ].filter(Boolean).join(' '));

  const secondaryHaystack = normalizeForSearch([
    statusSearchLabelMap[order.status] ?? order.status,
    paymentLabel,
    channelLabel,
  ].filter(Boolean).join(' '));

  if (q.length <= 1) {
    return primaryHaystack.includes(q);
  }

  return primaryHaystack.includes(q) || secondaryHaystack.includes(q);
}

export function buildWorkflowFilterOptions(
  orders: Order[],
  workflowFilter: OnlineWorkflowFilter,
): Array<{ key: OnlineWorkflowFilter; label: string; count: number }> {
  const onlineOrders = orders.filter((order) => order.channel === 'online');
  const counts = {
    all: onlineOrders.length,
    needs_confirmation: onlineOrders.filter((order) => matchesWorkflowFilter(order, 'needs_confirmation')).length,
    preparing: onlineOrders.filter((order) => matchesWorkflowFilter(order, 'preparing')).length,
    waiting_ship: onlineOrders.filter((order) => matchesWorkflowFilter(order, 'waiting_ship')).length,
    delivering: onlineOrders.filter((order) => matchesWorkflowFilter(order, 'delivering')).length,
    completed: onlineOrders.filter((order) => matchesWorkflowFilter(order, 'completed')).length,
    cancel_requests: onlineOrders.filter((order) => matchesWorkflowFilter(order, 'cancel_requests')).length,
    return_requests: onlineOrders.filter((order) => matchesWorkflowFilter(order, 'return_requests')).length,
  };

  const allOptions: Array<{ key: OnlineWorkflowFilter; label: string; count: number }> = [
    { key: 'all', label: 'Tất cả', count: counts.all },
    { key: 'needs_confirmation', label: 'Chờ xác nhận', count: counts.needs_confirmation },
    { key: 'preparing', label: 'Chuẩn bị hàng', count: counts.preparing },
    { key: 'waiting_ship', label: 'Chờ bàn giao vận chuyển', count: counts.waiting_ship },
    { key: 'delivering', label: 'Đang vận chuyển', count: counts.delivering },
    { key: 'completed', label: 'Đã hoàn thành', count: counts.completed },
    { key: 'cancel_requests', label: 'Yêu cầu hủy', count: counts.cancel_requests },
    { key: 'return_requests', label: 'Yêu cầu hoàn', count: counts.return_requests },
  ];

  return allOptions.filter((option) => option.key === 'all' || option.count > 0 || option.key === workflowFilter);
}
