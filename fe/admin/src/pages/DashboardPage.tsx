import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Package,
  ShoppingBag,
  TrendingUp,
} from 'lucide-react';
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  format,
  isAfter,
  isBefore,
  isSameDay,
  startOfDay,
  startOfMonth,
  subDays,
} from 'date-fns';
import { vi } from 'date-fns/locale';
import { EmptyState } from '@/components/shared/EmptyState';
import { KPICard } from '@/components/shared/KPICard';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { fetchDashboardSummaryApi, fetchOrdersApi } from '@/lib/backendApi';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
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

const RANGE_OPTIONS = [
  { key: 'today', label: 'Hôm nay' },
  { key: '7days', label: '7 ngày' },
  { key: 'month', label: 'Tháng này' },
] as const;

type RangeKey = (typeof RANGE_OPTIONS)[number]['key'];

interface RevenueChartRow {
  day: string;
  currentWeek: number;
  previousWeek: number;
}

const weekdayMap: Record<number, string> = {
  1: 'T2',
  2: 'T3',
  3: 'T4',
  4: 'T5',
  5: 'T6',
  6: 'T7',
  7: 'CN',
};

function getRangeStart(range: RangeKey, now: Date): Date {
  if (range === 'today') {
    return startOfDay(now);
  }

  if (range === '7days') {
    return subDays(startOfDay(now), 6);
  }

  return startOfMonth(now);
}

function isInRange(date: Date, start: Date, end: Date): boolean {
  return !isBefore(date, start) && !isAfter(date, end);
}

function initialsOfName(name: string): string {
  const words = name.split(' ').filter(Boolean);
  return words
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('');
}

function parseRevenueDate(dateString: string): Date {
  const [dayText, monthText] = dateString.split('/');
  const now = new Date();
  const day = Number(dayText);
  const month = Number(monthText);

  return new Date(now.getFullYear(), month - 1, day);
}

export function DashboardPage() {
  const [isBootLoading, setIsBootLoading] = useState(true);
  const [selectedRange, setSelectedRange] = useState<RangeKey>('7days');
  const [ordersData, setOrdersData] = useState<Order[]>([]);
  const [summary, setSummary] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    lowStockCount: 0,
    totalCustomers: 0,
    stockAlerts: [] as Array<{ productId: number; productCode: string; productName: string; stock: number; minStock: number }>,
  });
  const now = useMemo(() => new Date(), []);
  const rangeStart = getRangeStart(selectedRange, now);

  useEffect(() => {
    document.title = 'Dashboard | Routine';
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [orders, dashboardSummary] = await Promise.all([
          fetchOrdersApi(),
          fetchDashboardSummaryApi(selectedRange),
        ]);
        setOrdersData(orders);
        setSummary(dashboardSummary);
      } finally {
        setIsBootLoading(false);
      }
    };

    void loadData();
  }, [selectedRange]);

  const formattedSubtitle = useMemo(() => {
    const raw = format(now, "EEEE, dd 'tháng' MM, yyyy", { locale: vi });
    return raw.charAt(0).toUpperCase() + raw.slice(1);
  }, [now]);

  const filteredOrders = useMemo(() => {
    return ordersData
      .filter((order) => isInRange(order.createdAt, rangeStart, now))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }, [now, ordersData, rangeStart]);

  const revenueByDay = useMemo(() => {
    const map = new Map<string, { date: string; revenue: number; orders: number }>();
    ordersData.forEach((order) => {
      const date = format(order.createdAt, 'dd/MM');
      const current = map.get(date) ?? { date, revenue: 0, orders: 0 };
      current.revenue += order.total;
      current.orders += 1;
      map.set(date, current);
    });
    return Array.from(map.values());
  }, [ordersData]);

  const stockAlerts = useMemo(
    () => summary.stockAlerts.map((alert) => ({
      product: { id: String(alert.productId), name: alert.productName },
      currentStock: alert.stock,
      minStock: alert.minStock,
    })),
    [summary.stockAlerts],
  );

  const soldProductsToday = useMemo(
    () => filteredOrders.reduce((sum, order) => sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0),
    [filteredOrders],
  );

  const chartData = useMemo<RevenueChartRow[]>(() => {
    const dayBuckets = Array.from({ length: 7 }, (_, index) => subDays(startOfDay(now), 6 - index));

    return dayBuckets.map((dayDate) => {
      const currentDayRevenue = revenueByDay.find((item) => isSameDay(parseRevenueDate(item.date), dayDate));
      const previousDayRevenue = revenueByDay.find((item) =>
        isSameDay(parseRevenueDate(item.date), subDays(dayDate, 7)),
      );

      const currentValue = isInRange(dayDate, rangeStart, now) ? (currentDayRevenue?.revenue ?? 0) : 0;

      return {
        day: weekdayMap[Number(format(dayDate, 'i'))],
        currentWeek: currentValue,
        previousWeek: previousDayRevenue?.revenue ?? 0,
      };
    });
  }, [now, rangeStart]);

  const topProducts = useMemo(() => {
    const summary = new Map<string, { name: string; sold: number }>();

    filteredOrders.forEach((order) => {
      order.items.forEach((item) => {
        const current = summary.get(item.productId);
        if (current) {
          current.sold += item.quantity;
          return;
        }

        summary.set(item.productId, {
          name: item.productName,
          sold: item.quantity,
        });
      });
    });

    return Array.from(summary.values())
      .sort((a, b) => b.sold - a.sold)
      .slice(0, 5);
  }, [filteredOrders]);

  const maxSold = topProducts[0]?.sold ?? 1;
  const recentOrders = filteredOrders.slice(0, 8);
  const lowStockProducts = stockAlerts.slice(0, 8);

  if (isBootLoading) {
    return (
      <div className="space-y-4">
        <div className="h-24 animate-pulse rounded-[12px] bg-[#ECEAE7]" />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-36 animate-pulse rounded-[12px] bg-[#ECEAE7]" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
          <div className="h-80 animate-pulse rounded-[12px] bg-[#ECEAE7] xl:col-span-8" />
          <div className="h-80 animate-pulse rounded-[12px] bg-[#ECEAE7] xl:col-span-4" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-3 rounded-[12px] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 md:flex-row md:items-center md:justify-between md:p-6">
        <div>
          <h2 className="font-[var(--font-display)] text-[24px] font-semibold text-[var(--color-text-primary)]">
            Tổng quan
          </h2>
          <p className="text-sm text-[var(--color-text-secondary)]">{formattedSubtitle}</p>
        </div>

        <div className="inline-flex rounded-[8px] bg-[var(--color-surface)] p-1">
          {RANGE_OPTIONS.map((option) => {
            const active = selectedRange === option.key;
            return (
              <button
                key={option.key}
                type="button"
                onClick={() => setSelectedRange(option.key)}
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
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <KPICard
          label="Doanh thu hôm nay"
          value={formatVND(summary.totalRevenue)}
          delta={{ value: '+8.2% so với hôm qua', positive: true }}
          icon={TrendingUp}
          iconBg="#EEF3FD"
          iconColor="#2D6BE4"
        />
        <KPICard
          label="Đơn hàng hôm nay"
          value={String(summary.totalOrders)}
          delta={{ value: '+5 so với hôm qua', positive: true }}
          icon={ShoppingBag}
          iconBg="#F0FDF4"
          iconColor="#16A34A"
        />
        <KPICard
          label="Sản phẩm đã bán"
          value={String(soldProductsToday)}
          delta={{ value: '-3.1% so với hôm qua', positive: false }}
          icon={Package}
          iconBg="#FFFBEB"
          iconColor="#D97706"
        />

        <div className="rounded-[12px] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <p className="mb-1 text-[13px] text-[var(--color-text-secondary)]">Sản phẩm sắp hết</p>
              <p className="font-[var(--font-display)] text-[28px] font-bold leading-none text-[var(--color-text-primary)]">
                {summary.lowStockCount}
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-[#FEF2F2]">
              <AlertTriangle size={20} className="text-[#DC2626]" />
            </div>
          </div>
          <span className="inline-flex items-center rounded-full bg-[var(--color-warning-bg)] px-2.5 py-1 text-xs font-medium text-[var(--color-warning)]">
            Cần nhập hàng
          </span>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <article className="rounded-[12px] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 xl:col-span-8">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-[16px] font-semibold text-[var(--color-text-primary)]">Doanh thu 7 ngày</h3>
            <div className="flex items-center gap-4 text-xs text-[var(--color-text-secondary)]">
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[#2D6BE4]" />
                <span>Tuần này</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[#E8E6E3]" />
                <span>Tuần trước</span>
              </div>
            </div>
          </div>

          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <ComposedChart data={chartData} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2D6BE4" stopOpacity={0.12} />
                    <stop offset="100%" stopColor="#2D6BE4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="#F0EEE9" strokeDasharray="3 3" />
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#A09D99', fontSize: 12 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#A09D99', fontSize: 12 }}
                  tickFormatter={(value: number) => `${Math.round(value / 1000000)}M`}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #E8E6E3',
                    boxShadow: '0 8px 20px rgba(26, 26, 24, 0.08)',
                    backgroundColor: '#FFFFFF',
                  }}
                  formatter={(value) => [formatVND(typeof value === 'number' ? value : Number(value ?? 0)), '']}
                  labelStyle={{ color: '#6B6863' }}
                />
                <Area type="monotone" dataKey="currentWeek" fill="url(#revenueGradient)" stroke="none" />
                <Line
                  type="monotone"
                  dataKey="currentWeek"
                  stroke="#2D6BE4"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#2D6BE4', strokeWidth: 0 }}
                />
                <Line
                  type="monotone"
                  dataKey="previousWeek"
                  stroke="#D1CEC9"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="rounded-[12px] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 xl:col-span-4">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-[16px] font-semibold text-[var(--color-text-primary)]">Sản phẩm bán chạy</h3>
            <span className="rounded-full bg-[#F7F6F4] px-2 py-1 text-xs text-[var(--color-text-muted)]">7 ngày qua</span>
          </div>

          {topProducts.length === 0 ? (
            <EmptyState
              icon={Package}
              title="Chưa có dữ liệu"
              description="Không có sản phẩm bán ra trong khoảng thời gian này."
            />
          ) : (
            <div className="space-y-4">
              {topProducts.map((item, index) => (
                <div key={`${item.name}-${index}`} className="flex items-center gap-3">
                  <span className="w-6 text-[16px] font-bold text-[var(--color-text-muted)]">{index + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-[var(--color-text-primary)]">{item.name}</p>
                    <div className="mt-1 h-1 rounded-[2px] bg-[#F0EEE9]">
                      <div
                        className="h-1 rounded-[2px] bg-[#2D6BE4]"
                        style={{ width: `${Math.max(8, (item.sold / maxSold) * 100)}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-[13px] text-[var(--color-text-secondary)]">{item.sold} sp</span>
                </div>
              ))}
            </div>
          )}
        </article>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <article className="overflow-hidden rounded-[12px] border border-[var(--color-border)] bg-[var(--color-surface)] xl:col-span-7">
          <div className="flex items-center justify-between border-b border-[var(--color-border)] px-6 py-4">
            <h3 className="text-[16px] font-semibold text-[var(--color-text-primary)]">Đơn hàng gần đây</h3>
            <button
              type="button"
              className="inline-flex items-center gap-1 text-sm font-medium text-[var(--color-accent)]"
            >
              Xem tất cả <ArrowRight size={14} />
            </button>
          </div>

          <Table>
            <TableHeader>
              <TableRow className="border-b border-[var(--color-border)] bg-[#F7F6F4] hover:bg-[#F7F6F4]">
                <TableHead className="h-11 px-4 text-xs uppercase tracking-[0.08em] text-[var(--color-text-muted)]">Mã HĐ</TableHead>
                <TableHead className="h-11 px-4 text-xs uppercase tracking-[0.08em] text-[var(--color-text-muted)]">Khách hàng</TableHead>
                <TableHead className="h-11 px-4 text-right text-xs uppercase tracking-[0.08em] text-[var(--color-text-muted)]">Tổng tiền</TableHead>
                <TableHead className="h-11 px-4 text-xs uppercase tracking-[0.08em] text-[var(--color-text-muted)]">Phương thức</TableHead>
                <TableHead className="h-11 px-4 text-xs uppercase tracking-[0.08em] text-[var(--color-text-muted)]">Thời gian</TableHead>
                <TableHead className="h-11 px-4 text-xs uppercase tracking-[0.08em] text-[var(--color-text-muted)]">Trạng thái</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {recentOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="p-0">
                    <EmptyState
                      icon={ShoppingBag}
                      title="Không có đơn hàng"
                      description="Chưa có đơn hàng trong khoảng thời gian đã chọn."
                    />
                  </TableCell>
                </TableRow>
              ) : (
                recentOrders.map((order) => (
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
                    <TableCell className="px-4 text-sm text-[var(--color-text-secondary)]">
                      {formatRelativeTime(order.createdAt)}
                    </TableCell>
                    <TableCell className="px-4">
                      <StatusBadge status={order.status} variant="order" />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </article>

        <article className="rounded-[12px] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 xl:col-span-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} className="text-[var(--color-warning)]" />
              <h3 className="text-[16px] font-semibold text-[var(--color-text-primary)]">Sắp hết hàng</h3>
            </div>
            <Badge className="bg-[var(--color-warning-bg)] text-[var(--color-warning)]">{lowStockProducts.length}</Badge>
          </div>

          <div className="space-y-3">
            {lowStockProducts.map((alert) => {
              const low = alert.currentStock <= 3;
              const badgeClass = low
                ? 'bg-[var(--color-error-bg)] text-[var(--color-error)]'
                : 'bg-[var(--color-warning-bg)] text-[var(--color-warning)]';

              return (
                <div key={alert.product.id} className="flex items-center gap-3 rounded-[8px] border border-[var(--color-border)] p-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-[#EEF3FD] text-sm font-semibold text-[var(--color-accent)]">
                    {alert.product.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium text-[var(--color-text-primary)]">{alert.product.name}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${badgeClass}`}>
                        {alert.currentStock} còn
                      </span>
                    </div>
                  </div>
                  <button type="button" className="text-xs font-medium text-[var(--color-accent)]">
                    Nhập hàng
                  </button>
                </div>
              );
            })}
          </div>

          <div className="mt-4 pt-3">
            <button type="button" className="inline-flex items-center gap-1 text-sm font-medium text-[var(--color-accent)]">
              Xem báo cáo tồn kho <ArrowRight size={14} />
            </button>
          </div>
        </article>
      </section>
    </div>
  );
}
