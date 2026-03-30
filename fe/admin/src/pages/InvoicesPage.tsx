import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ReceiptText, ShoppingBag } from 'lucide-react';
import { subDays } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { EmptyState } from '@/components/shared/EmptyState';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { fetchOrdersApi } from '@/lib/backendApi';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatRelativeTime, formatVND } from '@/lib/utils';
import type { Order } from '@/types';

function initialsOfName(name: string): string {
  const words = name.split(' ').filter(Boolean);
  return words
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('');
}

export function InvoicesPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [ordersData, setOrdersData] = useState<Order[]>([]);
  const [filterChannel, setFilterChannel] = useState<'all' | 'online' | 'offline'>('all');
  const threeDaysAgo = useMemo(() => subDays(new Date(), 3), []);

  useEffect(() => {
    document.title = 'Hóa đơn | Routine';
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        const orders = await fetchOrdersApi();
        setOrdersData(orders);
      } finally {
        setIsLoading(false);
      }
    };

    void loadData();
  }, []);

  const filteredOrders = useMemo(() => {
    return ordersData
      .filter((order) => order.createdAt >= threeDaysAgo)
      .filter((order) => filterChannel === 'all' || order.channel === filterChannel)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }, [ordersData, threeDaysAgo, filterChannel]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-12 animate-pulse rounded-[12px] bg-[#ECEAE7]" />
        <div className="h-96 animate-pulse rounded-[12px] bg-[#ECEAE7]" />
      </div>
    );
  }

  if (filteredOrders.length === 0) {
    return (
      <div className="space-y-4">
        <Button
          type="button"
          variant="outline"
          className="h-9 gap-2"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft size={16} />
          Quay lại
        </Button>
        <div className="rounded-[12px] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
          <EmptyState
            icon={ShoppingBag}
            title="Không có đơn hàng"
            description="Chưa có đơn hàng trong 3 ngày gần nhất."
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button
        type="button"
        variant="outline"
        className="h-9 gap-2"
        onClick={() => navigate(-1)}
      >
        <ArrowLeft size={16} />
        Quay lại
      </Button>

      <section className="flex flex-col gap-3 rounded-[12px] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 md:flex-row md:items-center md:justify-between md:p-6">
        <div>
          <h2 className="font-[var(--font-display)] text-[24px] font-semibold text-[var(--color-text-primary)]">
            Hóa đơn
          </h2>
          <p className="text-sm text-[var(--color-text-secondary)]">Tất cả đơn hàng trong 3 ngày gần nhất</p>
        </div>
        <div className="flex flex-col items-start gap-3 md:items-end">
          <div className="inline-flex items-center rounded-[8px] bg-[var(--color-surface)] px-3 py-2 text-sm font-medium text-[var(--color-text-secondary)]">
            <ReceiptText size={16} className="mr-2" />
            {filteredOrders.length} đơn hàng
          </div>
          <div className="inline-flex rounded-[8px] bg-[var(--color-surface)] p-1">
            {[
              { key: 'all', label: 'Tất cả' },
              { key: 'online', label: 'Đơn online' },
              { key: 'offline', label: 'Đơn offline' },
            ].map((option) => {
              const active = filterChannel === option.key;
              return (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => setFilterChannel(option.key as typeof filterChannel)}
                  className={
                    active
                      ? 'rounded-[8px] bg-[var(--color-text-primary)] px-3 py-2 text-sm font-medium text-white'
                      : 'rounded-[8px] border border-[var(--color-border)] bg-white px-3 py-2 text-sm font-medium text-[var(--color-text-secondary)]'
                  }
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-[12px] border border-[var(--color-border)] bg-[var(--color-surface)]">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-[var(--color-border)] bg-[#F7F6F4] hover:bg-[#F7F6F4]">
              <TableHead className="h-11 px-4 text-xs uppercase tracking-[0.08em] text-[var(--color-text-muted)]">Mã HĐ</TableHead>
              <TableHead className="h-11 px-4 text-xs uppercase tracking-[0.08em] text-[var(--color-text-muted)]">Khách hàng</TableHead>
              <TableHead className="h-11 px-4 text-right text-xs uppercase tracking-[0.08em] text-[var(--color-text-muted)]">Tổng tiền</TableHead>
              <TableHead className="h-11 px-4 text-xs uppercase tracking-[0.08em] text-[var(--color-text-muted)]">Phương thức</TableHead>
              <TableHead className="h-11 px-4 text-xs uppercase tracking-[0.08em] text-[var(--color-text-muted)]">Loại đơn</TableHead>
              <TableHead className="h-11 px-4 text-xs uppercase tracking-[0.08em] text-[var(--color-text-muted)]">Thời gian</TableHead>
              <TableHead className="h-11 px-4 text-xs uppercase tracking-[0.08em] text-[var(--color-text-muted)]">Trạng thái</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {filteredOrders.map((order) => (
              <TableRow key={order.id} className="h-[56px] border-b border-[var(--color-border)]">
                <TableCell className="px-4 font-[var(--font-mono)] text-[13px] text-[var(--color-text-secondary)]">
                  {order.orderNumber}
                </TableCell>
                <TableCell className="px-4">
                  <div className="flex items-center gap-2">
                    <Avatar size="sm">
                      <AvatarFallback>{initialsOfName(order.customer?.name ?? 'Khách lẻ')}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-[var(--color-text-primary)]">{order.customer?.name ?? 'Khách lẻ'}</span>
                  </div>
                </TableCell>
                <TableCell className="px-4 text-right font-[var(--font-mono)] text-sm font-semibold text-[var(--color-text-primary)]">
                  {formatVND(order.total)}
                </TableCell>
                <TableCell className="px-4">
                  <Badge variant="outline" className="border-[var(--color-border)] text-xs text-[var(--color-text-secondary)]">
                    {order.paymentMethod === 'cash' ? 'Tiền mặt' : 'Chuyển khoản'}
                  </Badge>
                </TableCell>
                <TableCell className="px-4">
                  <Badge
                    className={
                      order.channel === 'online'
                        ? 'bg-[#EEF3FD] text-[#2D6BE4]'
                        : 'bg-[#FEF2F2] text-[#DC2626]'
                    }
                  >
                    {order.channel === 'online' ? 'Online' : 'Offline'}
                  </Badge>
                </TableCell>
                <TableCell className="px-4 text-sm text-[var(--color-text-secondary)]">
                  {formatRelativeTime(order.createdAt)}
                </TableCell>
                <TableCell className="px-4">
                  <StatusBadge status={order.status} variant="order" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>
    </div>
  );
}
