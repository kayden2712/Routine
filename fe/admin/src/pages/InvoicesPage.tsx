import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ReceiptText, Search, ShoppingBag } from 'lucide-react';
import { subDays } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { EmptyState } from '@/components/shared/EmptyState';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { updateOrderStatusApi } from '@/lib/backendApi';
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
import { toast } from '@/lib/toast';
import { formatRelativeTime, formatVND } from '@/lib/utils';
import type { Order } from '@/types';
import {
  buildWorkflowFilterOptions,
  getOrderActivityTime,
  getPrimaryWorkflowAction,
  initialsOfName,
  matchesOrderSearch,
  matchesWorkflowFilter,
  type OnlineWorkflowFilter,
  type OrderChannelFilter,
} from '@/pages/invoices/orderFilters';
import { useInvoicesData } from '@/pages/invoices/useInvoicesData';

interface InvoicesPageProps {
  initialChannel?: OrderChannelFilter;
  pageTitle?: string;
  pageDescription?: string;
  showChannelTabs?: boolean;
}

export function InvoicesPage({
  initialChannel = 'all',
  pageTitle = 'Hóa đơn',
  pageDescription = 'Tất cả đơn hàng trong 3 ngày gần nhất',
  showChannelTabs = true,
}: InvoicesPageProps) {
  const navigate = useNavigate();
  const { isLoading, ordersData, setOrdersData } = useInvoicesData();
  const [actioningOrderId, setActioningOrderId] = useState<string | null>(null);
  const [filterChannel, setFilterChannel] = useState<OrderChannelFilter>(initialChannel);
  const [workflowFilter, setWorkflowFilter] = useState<OnlineWorkflowFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const threeDaysAgo = useMemo(() => subDays(new Date(), 3), []);

  useEffect(() => {
    document.title = `${pageTitle} | Routine`;
  }, [pageTitle]);

  useEffect(() => {
    setFilterChannel(initialChannel);
  }, [initialChannel]);

  const channelFilteredOrders = useMemo(() => {
    return ordersData
      .filter((order) => getOrderActivityTime(order) >= threeDaysAgo)
      .filter((order) => filterChannel === 'all' || order.channel === filterChannel)
      .sort((a, b) => getOrderActivityTime(b).getTime() - getOrderActivityTime(a).getTime());
  }, [ordersData, threeDaysAgo, filterChannel]);

  const filteredOrders = useMemo(() => {
    const baseOrders = filterChannel !== 'online'
      ? channelFilteredOrders
      : channelFilteredOrders.filter((order) => matchesWorkflowFilter(order, workflowFilter));

    return baseOrders.filter((order) => matchesOrderSearch(order, searchQuery));
  }, [channelFilteredOrders, filterChannel, workflowFilter, searchQuery]);

  const workflowFilterOptions = useMemo(() => {
    return buildWorkflowFilterOptions(channelFilteredOrders, workflowFilter);
  }, [channelFilteredOrders, workflowFilter]);

  const pendingCancelCount = useMemo(
    () => channelFilteredOrders.filter((order) => order.status === 'cancel_requested').length,
    [channelFilteredOrders],
  );

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }

    if (initialChannel === 'online' || filterChannel === 'online') {
      navigate('/online-orders', { replace: true });
      return;
    }

    navigate('/invoices', { replace: true });
  };

  const handleResolveCancelRequest = async (orderId: string, approve: boolean) => {
    setActioningOrderId(orderId);
    try {
      const updated = await updateOrderStatusApi(orderId, approve ? 'cancelled' : 'confirmed');
      setOrdersData((prev) => prev.map((order) => (order.id === orderId ? updated : order)));
      toast.success(
        approve ? 'Đã xác nhận hủy đơn' : 'Đã từ chối yêu cầu hủy',
        `Đơn ${updated.orderNumber}`,
      );
    } catch (error) {
      toast.error('Không thể xử lý yêu cầu hủy', error instanceof Error ? error.message : 'Vui lòng thử lại.');
    } finally {
      setActioningOrderId(null);
    }
  };

  const handleAdvanceWorkflow = async (order: Order) => {
    const action = getPrimaryWorkflowAction(order);
    if (!action) {
      return;
    }

    setActioningOrderId(order.id);
    try {
      const updated = await updateOrderStatusApi(order.id, action.nextStatus);
      setOrdersData((prev) => prev.map((item) => (item.id === order.id ? updated : item)));
      toast.success('Đã cập nhật trạng thái', `${updated.orderNumber}: ${action.label}`);
    } catch (error) {
      toast.error('Không thể cập nhật trạng thái', error instanceof Error ? error.message : 'Vui lòng thử lại.');
    } finally {
      setActioningOrderId(null);
    }
  };

  const handleCancelPendingConfirmation = async (order: Order) => {
    setActioningOrderId(order.id);
    try {
      const apologyMessage = 'Xin loi quy khach, don hang khong du ton kho nen da duoc huy boi cua hang.';
      const updated = await updateOrderStatusApi(order.id, 'cancelled', apologyMessage);
      setOrdersData((prev) => prev.map((item) => (item.id === order.id ? updated : item)));
      toast.success('Đã hủy xác nhận đơn', `${updated.orderNumber}`);
    } catch (error) {
      toast.error('Không thể hủy xác nhận', error instanceof Error ? error.message : 'Vui lòng thử lại.');
    } finally {
      setActioningOrderId(null);
    }
  };

  const handleResolveReturnRequest = async (orderId: string, approve: boolean) => {
    setActioningOrderId(orderId);
    try {
      if (!approve) {
        const rejected = await updateOrderStatusApi(orderId, 'return_rejected');
        setOrdersData((prev) => prev.map((order) => (order.id === orderId ? rejected : order)));
        toast.success('Đã từ chối yêu cầu hoàn hàng', `Đơn ${rejected.orderNumber}`);
        return;
      }

      const approved = await updateOrderStatusApi(orderId, 'return_approved');
      const cancelled = await updateOrderStatusApi(orderId, 'cancelled');
      setOrdersData((prev) => prev.map((order) => (order.id === orderId ? cancelled : order)));
      toast.success('Đã xác nhận hoàn hàng và hoàn tiền', `Đơn ${approved.orderNumber}`);
    } catch (error) {
      toast.error('Không thể xử lý yêu cầu hoàn hàng', error instanceof Error ? error.message : 'Vui lòng thử lại.');
    } finally {
      setActioningOrderId(null);
    }
  };

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
          onClick={handleBack}
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
        onClick={handleBack}
      >
        <ArrowLeft size={16} />
        Quay lại
      </Button>

      <section className="flex flex-col gap-3 rounded-[12px] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 md:flex-row md:items-center md:justify-between md:p-6">
        <div>
          <h2 className="font-[var(--font-display)] text-[24px] font-semibold text-[var(--color-text-primary)]">
            {pageTitle}
          </h2>
          <p className="text-sm text-[var(--color-text-secondary)]">{pageDescription}</p>
        </div>
        <div className="flex flex-col items-start gap-3 md:items-end">
          <div className="relative w-full md:w-[320px]">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Tìm mã đơn, khách hàng, trạng thái..."
              className="h-9 w-full rounded-[8px] border border-[var(--color-border)] bg-white pl-9 pr-3 text-sm text-[var(--color-text-primary)] outline-none focus:ring-2 focus:ring-[var(--color-accent-light)]"
            />
          </div>
          <div className="inline-flex items-center rounded-[8px] bg-[var(--color-surface)] px-3 py-2 text-sm font-medium text-[var(--color-text-secondary)]">
            <ReceiptText size={16} className="mr-2" />
            {filteredOrders.length} đơn hàng
          </div>
          {pendingCancelCount > 0 ? (
            <div className="inline-flex items-center rounded-[8px] bg-[var(--color-warning-bg)] px-3 py-2 text-xs font-medium text-[var(--color-warning)]">
              Có {pendingCancelCount} yêu cầu hủy chờ xác nhận
            </div>
          ) : null}
          {showChannelTabs ? (
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
                    onClick={() => setFilterChannel(option.key as OrderChannelFilter)}
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
          ) : null}
        </div>
      </section>

      {filterChannel === 'online' ? (
        <section className="rounded-[12px] border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
          <div className="flex flex-wrap gap-2">
            {workflowFilterOptions.map((item) => {
              const active = workflowFilter === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setWorkflowFilter(item.key)}
                  className={
                    active
                      ? 'inline-flex items-center gap-2 rounded-full bg-[var(--color-text-primary)] px-3 py-1.5 text-xs font-medium text-white'
                      : 'inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-white px-3 py-1.5 text-xs font-medium text-[var(--color-text-secondary)]'
                  }
                >
                  <span>{item.label}</span>
                  <span className={active ? 'rounded-full bg-white/20 px-1.5 py-0.5' : 'rounded-full bg-[#F3F2F0] px-1.5 py-0.5'}>
                    {item.count}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      ) : null}

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
              <TableHead className="h-11 px-4 text-xs uppercase tracking-[0.08em] text-[var(--color-text-muted)]">Yêu cầu hủy/hoàn</TableHead>
              <TableHead className="h-11 px-4 text-xs uppercase tracking-[0.08em] text-[var(--color-text-muted)]">Thao tác</TableHead>
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
                  {formatRelativeTime(getOrderActivityTime(order))}
                </TableCell>
                <TableCell className="px-4">
                  <StatusBadge status={order.status} variant="order" />
                </TableCell>
                <TableCell className="px-4">
                  {order.status === 'cancel_requested' ? (
                    <div className="space-y-2">
                      <p className="max-w-[280px] text-xs text-[var(--color-text-secondary)]">
                        {order.notes ?? 'Khách hàng gửi yêu cầu hủy đơn.'}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => void handleResolveCancelRequest(order.id, true)}
                          disabled={actioningOrderId === order.id}
                        >
                          Xác nhận hủy
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => void handleResolveCancelRequest(order.id, false)}
                          disabled={actioningOrderId === order.id}
                        >
                          Từ chối
                        </Button>
                      </div>
                    </div>
                  ) : order.status === 'return_requested' ? (
                    <div className="space-y-2">
                      <p className="max-w-[280px] text-xs text-[var(--color-text-secondary)]">
                        {order.notes ?? 'Khách hàng gửi yêu cầu hoàn hàng.'}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => void handleResolveReturnRequest(order.id, true)}
                          disabled={actioningOrderId === order.id}
                        >
                          Xác nhận hoàn hàng
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => void handleResolveReturnRequest(order.id, false)}
                          disabled={actioningOrderId === order.id}
                        >
                          Từ chối
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <span className="text-xs text-[var(--color-text-muted)]">-</span>
                  )}
                </TableCell>
                <TableCell className="px-4">
                  {(() => {
                    const workflowAction = getPrimaryWorkflowAction(order);
                    if (!workflowAction) {
                      return <span className="text-xs text-[var(--color-text-muted)]">-</span>;
                    }

                    return (
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => void handleAdvanceWorkflow(order)}
                          disabled={actioningOrderId === order.id || order.status === 'cancel_requested' || order.status === 'return_requested'}
                        >
                          {workflowAction.label}
                        </Button>
                        {order.channel === 'online' && order.status === 'pending' ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => void handleCancelPendingConfirmation(order)}
                            disabled={actioningOrderId === order.id}
                          >
                            Hủy xác nhận
                          </Button>
                        ) : null}
                      </div>
                    );
                  })()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>
    </div>
  );
}
