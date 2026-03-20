import { useEffect, useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarRange,
  Download,
  FileText,
  Printer,
  Sheet,
} from 'lucide-react';
import {
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  BarChart,
} from 'recharts';
import {
  format,
  isAfter,
  isBefore,
  parse,
  startOfDay,
  subDays,
} from 'date-fns';
import { DataTable } from '@/components/shared/DataTable';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatVND } from '@/lib/utils';
import { customers, orders, products, revenueByDay } from '@/lib/mockData';
import { toast } from '@/lib/toast';

interface DateRange {
  from: Date;
  to: Date;
}

type RevenuePeriodMode = 'week' | 'month' | 'custom';

interface RevenueRow {
  dateLabel: string;
  orders: number;
  revenue: number;
  cumulative: number;
  dayDiff: number;
  changePct: number;
}

interface TopProductRow {
  id: string;
  name: string;
  sold: number;
  revenue: number;
  stock: number;
  performance: number;
  category: string;
}

function parseRevenueDate(label: string): Date {
  const parsed = parse(label, 'dd/MM', new Date());
  parsed.setHours(12, 0, 0, 0);
  return parsed;
}

function inRange(date: Date, range: DateRange): boolean {
  return !isBefore(startOfDay(date), startOfDay(range.from)) && !isAfter(startOfDay(date), startOfDay(range.to));
}

function categoryColor(index: number): string {
  const palette = ['#2D6BE4', '#16A34A', '#D97706', '#DC2626', '#6D4BD8'];
  return palette[index % palette.length];
}

export function ReportsPage() {
  useEffect(() => {
    document.title = 'Bao cao | Routine';
  }, []);

  const today = new Date();

  const [dateRange, setDateRange] = useState<DateRange>({
    from: subDays(today, 29),
    to: today,
  });
  const [draftFrom, setDraftFrom] = useState(format(subDays(today, 29), 'yyyy-MM-dd'));
  const [draftTo, setDraftTo] = useState(format(today, 'yyyy-MM-dd'));
  const [revenueMode, setRevenueMode] = useState<RevenuePeriodMode>('week');

  const filteredRevenueBase = useMemo(() => {
    return revenueByDay
      .map((item) => ({ ...item, parsedDate: parseRevenueDate(item.date) }))
      .filter((item) => inRange(item.parsedDate, dateRange))
      .sort((a, b) => a.parsedDate.getTime() - b.parsedDate.getTime());
  }, [dateRange]);

  const revenueSeries = useMemo<RevenueRow[]>(() => {
    const source =
      revenueMode === 'week'
        ? filteredRevenueBase.slice(-7)
        : revenueMode === 'month'
          ? filteredRevenueBase.slice(-30)
          : filteredRevenueBase;

    let cumulative = 0;
    return source.map((item, index) => {
      cumulative += item.revenue;
      const prev = source[index - 1]?.revenue ?? item.revenue;
      const dayDiff = item.revenue - prev;
      const changePct = prev === 0 ? 0 : (dayDiff / prev) * 100;

      return {
        dateLabel: format(item.parsedDate, 'dd/MM'),
        orders: item.orders,
        revenue: item.revenue,
        cumulative,
        dayDiff,
        changePct,
      };
    });
  }, [filteredRevenueBase, revenueMode]);

  const totalRevenue = revenueSeries.reduce((sum, row) => sum + row.revenue, 0);
  const totalInvoices = revenueSeries.reduce((sum, row) => sum + row.orders, 0);
  const avgOrderValue = totalInvoices === 0 ? 0 : Math.round(totalRevenue / totalInvoices);
  const periodDelta = revenueSeries.length > 1 ? revenueSeries[revenueSeries.length - 1].changePct : 0;

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => inRange(order.createdAt, dateRange));
  }, [dateRange]);

  const topProducts = useMemo<TopProductRow[]>(() => {
    const map = new Map<string, TopProductRow>();

    filteredOrders.forEach((order) => {
      order.items.forEach((item) => {
        const product = products.find((p) => p.id === item.productId);
        const existing = map.get(item.productId);
        if (existing) {
          existing.sold += item.quantity;
          existing.revenue += item.subtotal;
          return;
        }

        map.set(item.productId, {
          id: item.productId,
          name: item.productName,
          sold: item.quantity,
          revenue: item.subtotal,
          stock: product?.stock ?? 0,
          performance: 0,
          category: product?.category ?? 'Khác',
        });
      });
    });

    const rows = Array.from(map.values()).sort((a, b) => b.sold - a.sold);
    const maxSold = Math.max(1, rows[0]?.sold ?? 1);

    return rows.map((row) => ({
      ...row,
      performance: Math.round((row.sold / maxSold) * 100),
    }));
  }, [filteredOrders]);

  const categoryPieData = useMemo(() => {
    const map = new Map<string, number>();
    topProducts.forEach((item) => {
      map.set(item.category, (map.get(item.category) ?? 0) + item.sold);
    });
    const total = Array.from(map.values()).reduce((sum, value) => sum + value, 0);

    return Array.from(map.entries())
      .map(([name, value], index) => ({
        name,
        value,
        percentage: total === 0 ? 0 : Math.round((value / total) * 100),
        fill: categoryColor(index),
      }))
      .slice(0, 5);
  }, [topProducts]);

  const newCustomersSeries = useMemo(() => {
    const map = new Map<string, number>();

    customers
      .filter((customer) => inRange(customer.createdAt, dateRange))
      .forEach((customer) => {
        const key = format(customer.createdAt, 'dd/MM');
        map.set(key, (map.get(key) ?? 0) + 1);
      });

    return Array.from(map.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => parseRevenueDate(a.date).getTime() - parseRevenueDate(b.date).getTime());
  }, [dateRange]);

  const topCustomers = useMemo(() => {
    return [...customers]
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10)
      .map((customer) => ({
        ...customer,
        avgOrder: customer.totalOrders === 0 ? 0 : Math.round(customer.totalSpent / customer.totalOrders),
      }));
  }, []);

  const activeSku = products.filter((product) => product.status === 'active').length;
  const lowSku = products.filter((product) => product.stock > 0 && product.stock <= product.minStock).length;
  const outSku = products.filter((product) => product.stock === 0).length;

  const stockPie = [
    { name: 'Còn hàng', value: activeSku, fill: '#2D6BE4' },
    { name: 'Sắp hết', value: lowSku, fill: '#D97706' },
    { name: 'Hết hàng', value: outSku, fill: '#DC2626' },
  ];

  const lowStockRows = useMemo(() => {
    return products
      .filter((product) => product.stock <= product.minStock)
      .map((product) => ({
        ...product,
        needed: Math.max(0, product.minStock * 2 - product.stock),
      }));
  }, []);

  const lowStockTable = useReactTable({
    data: lowStockRows,
    columns: [
      {
        accessorKey: 'name',
        header: 'SẢN PHẨM',
        cell: (ctx) => ctx.row.original.name,
      },
      {
        accessorKey: 'stock',
        header: 'TỒN HIỆN TẠI',
      },
      {
        accessorKey: 'minStock',
        header: 'NGƯỠNG TỐI THIỂU',
      },
      {
        id: 'needed',
        header: 'CẦN NHẬP THÊM',
        cell: (ctx) => {
          const row = ctx.row.original;
          return (
            <span className={row.stock <= row.minStock ? 'text-[var(--color-warning)]' : 'text-[var(--color-text-primary)]'}>
              {row.needed}
            </span>
          );
        },
      },
      {
        id: 'action',
        header: 'HÀNH ĐỘNG',
        cell: (ctx) => (
          <Button
            size="sm"
            onClick={() => toast.success('Đã tạo phiếu nhập', `Sản phẩm: ${ctx.row.original.name}`)}
          >
            Tạo phiếu nhập
          </Button>
        ),
      },
    ],
    getCoreRowModel: getCoreRowModel(),
  });

  const revenueColumns: ColumnDef<RevenueRow>[] = [
    { accessorKey: 'dateLabel', header: 'NGÀY' },
    { accessorKey: 'orders', header: 'SỐ ĐƠN' },
    {
      accessorKey: 'revenue',
      header: 'DOANH THU',
      cell: ({ row }) => formatVND(row.original.revenue),
    },
    {
      accessorKey: 'dayDiff',
      header: 'SO HÔM TRƯỚC',
      cell: ({ row }) => formatVND(row.original.dayDiff),
    },
    {
      id: 'change',
      header: '% THAY ĐỔI',
      accessorFn: (row) => row.changePct,
      cell: ({ row }) => {
        const pct = row.original.changePct;

        if (pct > 0) {
          return (
            <span className="inline-flex items-center gap-1 text-[var(--color-success)]">
              <ArrowUpRight size={14} />
              {pct.toFixed(1)}%
            </span>
          );
        }

        if (pct < 0) {
          return (
            <span className="inline-flex items-center gap-1 text-[var(--color-error)]">
              <ArrowDownRight size={14} />
              {Math.abs(pct).toFixed(1)}%
            </span>
          );
        }

        return <span className="text-[var(--color-text-muted)]">0%</span>;
      },
    },
  ];

  const productColumns: ColumnDef<TopProductRow>[] = [
    { accessorKey: 'name', header: 'SẢN PHẨM' },
    { accessorKey: 'sold', header: 'ĐÃ BÁN' },
    {
      accessorKey: 'revenue',
      header: 'DOANH THU',
      cell: ({ row }) => formatVND(row.original.revenue),
    },
    { accessorKey: 'stock', header: 'TỒN KHO' },
    {
      accessorKey: 'performance',
      header: 'HIỆU SUẤT',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-20 rounded-full bg-[#F0EEE9]">
            <div
              className="h-1.5 rounded-full bg-[var(--color-accent)]"
              style={{ width: `${row.original.performance}%` }}
            />
          </div>
          <span className="text-xs text-[var(--color-text-secondary)]">{row.original.performance}%</span>
        </div>
      ),
    },
  ];

  const customerColumns: ColumnDef<(typeof topCustomers)[number]>[] = [
    { accessorKey: 'name', header: 'KHÁCH HÀNG' },
    { accessorKey: 'totalOrders', header: 'TỔNG ĐƠN' },
    {
      accessorKey: 'totalSpent',
      header: 'TỔNG CHI TIÊU',
      cell: ({ row }) => formatVND(row.original.totalSpent),
    },
    {
      accessorKey: 'avgOrder',
      header: 'TB/ĐƠN',
      cell: ({ row }) => formatVND(row.original.avgOrder),
    },
    {
      accessorKey: 'tier',
      header: 'HẠNG',
      cell: ({ row }) =>
        row.original.tier === 'vip' ? (
          <span className="rounded-full bg-[#FFF8E7] px-2 py-1 text-xs text-[#D97706]">VIP</span>
        ) : (
          <span className="rounded-full bg-[#F7F6F4] px-2 py-1 text-xs text-[var(--color-text-secondary)]">Thường</span>
        ),
    },
  ];

  const handleExportClick = (label: string) => {
    toast.success('Đang chuẩn bị file...', label);
    window.setTimeout(() => {
      toast.success('Xuất báo cáo thành công', label);
    }, 900);
  };

  const applyDraftRange = () => {
    const from = new Date(draftFrom);
    const to = new Date(draftTo);
    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || isAfter(from, to)) {
      toast.error('Khoảng ngày không hợp lệ');
      return;
    }

    setDateRange({ from, to });
  };

  return (
    <div className="space-y-5">
      <section className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-[var(--font-display)] text-[24px] font-semibold text-[var(--color-text-primary)]">
          Báo cáo & Thống kê
        </h1>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="outline" className="h-9 gap-2">
                  <CalendarRange size={16} />
                  {`${format(dateRange.from, 'dd/MM/yyyy')} - ${format(dateRange.to, 'dd/MM/yyyy')}`}
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="w-[320px] p-3">
              <p className="mb-2 text-xs font-medium uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
                Chọn khoảng thời gian
              </p>
              <div className="grid grid-cols-2 gap-2">
                <Input type="date" value={draftFrom} onChange={(event) => setDraftFrom(event.target.value)} />
                <Input type="date" value={draftTo} onChange={(event) => setDraftTo(event.target.value)} />
              </div>
              <div className="mt-2 flex gap-2">
                <Button size="sm" variant="outline" onClick={() => {
                  const from = subDays(new Date(), 6);
                  const to = new Date();
                  setDraftFrom(format(from, 'yyyy-MM-dd'));
                  setDraftTo(format(to, 'yyyy-MM-dd'));
                  setDateRange({ from, to });
                }}>
                  7 ngày
                </Button>
                <Button size="sm" variant="outline" onClick={() => {
                  const from = subDays(new Date(), 29);
                  const to = new Date();
                  setDraftFrom(format(from, 'yyyy-MM-dd'));
                  setDraftTo(format(to, 'yyyy-MM-dd'));
                  setDateRange({ from, to });
                }}>
                  30 ngày
                </Button>
                <Button size="sm" onClick={applyDraftRange}>Áp dụng</Button>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="outline" className="h-9 gap-2">
                  <Download size={16} />
                  Xuất báo cáo
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={() => handleExportClick('Xuất PDF')}>
                <FileText size={14} /> Xuất PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExportClick('Xuất Excel')}>
                <Sheet size={14} /> Xuất Excel
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExportClick('In báo cáo')}>
                <Printer size={14} /> In báo cáo
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </section>

      <Tabs defaultValue="revenue" className="w-full">
        <TabsList variant="line" className="h-auto border-b border-[var(--color-border)] p-0">
          <TabsTrigger value="revenue" className="px-4 py-2 text-[15px] font-medium">Doanh thu</TabsTrigger>
          <TabsTrigger value="products" className="px-4 py-2 text-[15px] font-medium">Sản phẩm</TabsTrigger>
          <TabsTrigger value="customers" className="px-4 py-2 text-[15px] font-medium">Khách hàng</TabsTrigger>
          <TabsTrigger value="stock" className="px-4 py-2 text-[15px] font-medium">Tồn kho</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="mt-4 space-y-4">
          <section className="grid gap-3 md:grid-cols-3">
            <div className="rounded-[12px] border border-[var(--color-border)] bg-white p-5">
              <p className="text-sm text-[var(--color-text-secondary)]">Tổng doanh thu</p>
              <p className="font-[var(--font-display)] text-[24px] font-bold text-[var(--color-text-primary)]">{formatVND(totalRevenue)}</p>
              <p className="text-xs text-[var(--color-text-muted)]">Trong kỳ được chọn</p>
            </div>
            <div className="rounded-[12px] border border-[var(--color-border)] bg-white p-5">
              <p className="text-sm text-[var(--color-text-secondary)]">Số hóa đơn</p>
              <p className="font-[var(--font-display)] text-[24px] font-bold text-[var(--color-text-primary)]">{totalInvoices}</p>
              <p className={periodDelta >= 0 ? 'text-xs text-[var(--color-success)]' : 'text-xs text-[var(--color-error)]'}>
                {periodDelta >= 0 ? '+' : ''}{periodDelta.toFixed(1)}% so với kỳ trước
              </p>
            </div>
            <div className="rounded-[12px] border border-[var(--color-border)] bg-white p-5">
              <p className="text-sm text-[var(--color-text-secondary)]">TB/đơn</p>
              <p className="font-[var(--font-display)] text-[24px] font-bold text-[var(--color-text-primary)]">{formatVND(avgOrderValue)}</p>
              <p className="text-xs text-[var(--color-text-muted)]">Giá trị trung bình mỗi hóa đơn</p>
            </div>
          </section>

          <section className="rounded-[12px] border border-[var(--color-border)] bg-white p-6">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className={revenueMode === 'week' ? 'rounded-full bg-[var(--color-accent-light)] px-3 py-1 text-xs text-[var(--color-accent)]' : 'rounded-full border px-3 py-1 text-xs'}
                  onClick={() => setRevenueMode('week')}
                >
                  Tuần
                </button>
                <button
                  type="button"
                  className={revenueMode === 'month' ? 'rounded-full bg-[var(--color-accent-light)] px-3 py-1 text-xs text-[var(--color-accent)]' : 'rounded-full border px-3 py-1 text-xs'}
                  onClick={() => setRevenueMode('month')}
                >
                  Tháng
                </button>
                <button
                  type="button"
                  className={revenueMode === 'custom' ? 'rounded-full bg-[var(--color-accent-light)] px-3 py-1 text-xs text-[var(--color-accent)]' : 'rounded-full border px-3 py-1 text-xs'}
                  onClick={() => setRevenueMode('custom')}
                >
                  Tùy chọn
                </button>
              </div>
            </div>

            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={revenueSeries}>
                  <CartesianGrid vertical={false} stroke="#F0EEE9" />
                  <XAxis dataKey="dateLabel" tick={{ fontSize: 12, fill: '#A09D99' }} axisLine={false} tickLine={false} />
                  <YAxis
                    tick={{ fontSize: 12, fill: '#A09D99' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value: number) => `${Math.round(value / 1000000)}M`}
                  />
                  <Tooltip
                    contentStyle={{ border: '1px solid #E8E6E3', borderRadius: '8px', background: '#fff' }}
                    formatter={(value, name, item) => {
                      if (name === 'revenue') return [formatVND(typeof value === 'number' ? value : Number(value ?? 0)), 'Doanh thu'];
                      if (name === 'orders') return [item.payload?.orders ?? 0, 'Số đơn'];
                      return [value, name];
                    }}
                  />
                  <Legend verticalAlign="bottom" />
                  <Bar name="Doanh thu" dataKey="revenue" fill="#2D6BE4" opacity={0.9} radius={[4, 4, 0, 0]} />
                  <Line name="Lũy kế" dataKey="cumulative" stroke="#16A34A" strokeWidth={2} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-4">
              <DataTable data={revenueSeries} columns={revenueColumns} pageSize={7} />
            </div>
          </section>
        </TabsContent>

        <TabsContent value="products" className="mt-4 space-y-4">
          <section className="grid gap-4 xl:grid-cols-[3fr,2fr]">
            <div className="rounded-[12px] border border-[var(--color-border)] bg-white p-5">
              <h3 className="mb-3 text-base font-semibold">Top sản phẩm bán chạy</h3>
              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topProducts.slice(0, 8)} layout="vertical" margin={{ left: 20, right: 20 }}>
                    <defs>
                      <linearGradient id="topProductGradient" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#2D6BE4" />
                        <stop offset="100%" stopColor="#6B9DF8" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid horizontal={false} stroke="#F0EEE9" />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" width={150} tick={{ fontSize: 12, fill: '#6B6863' }} />
                    <Tooltip
                      formatter={(value, _, payload) => [
                        `${Number(value ?? 0)} sp · ${formatVND(Number(payload?.payload?.revenue ?? 0))}`,
                        'Bán ra',
                      ]}
                    />
                    <Bar dataKey="sold" fill="url(#topProductGradient)" radius={[4, 4, 4, 4]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-[12px] border border-[var(--color-border)] bg-white p-5">
              <h3 className="mb-3 text-base font-semibold">Theo danh mục</h3>
              <div className="mx-auto h-[220px] w-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryPieData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={65}
                      outerRadius={90}
                      paddingAngle={2}
                    >
                      {categoryPieData.map((entry) => (
                        <Cell key={entry.name} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${Number(value ?? 0)} sp`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 space-y-1">
                {categoryPieData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.fill }} />
                      <span>{item.name}</span>
                    </div>
                    <span className="text-[var(--color-text-secondary)]">{item.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="rounded-[12px] border border-[var(--color-border)] bg-white p-4">
            <DataTable data={topProducts} columns={productColumns} pageSize={8} />
          </section>
        </TabsContent>

        <TabsContent value="customers" className="mt-4 space-y-4">
          <section className="rounded-[12px] border border-[var(--color-border)] bg-white p-5">
            <h3 className="mb-3 text-base font-semibold">Khách hàng mới theo ngày</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={newCustomersSeries}>
                  <CartesianGrid vertical={false} stroke="#F0EEE9" />
                  <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#A09D99' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#A09D99' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="#16A34A" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="rounded-[12px] border border-[var(--color-border)] bg-white p-4">
            <DataTable data={topCustomers} columns={customerColumns} pageSize={10} />
          </section>
        </TabsContent>

        <TabsContent value="stock" className="mt-4 space-y-4">
          <section className="grid gap-3 md:grid-cols-3">
            <div className="rounded-[12px] border border-[var(--color-border)] bg-white p-4">
              <p className="text-sm text-[var(--color-text-secondary)]">Tổng SKU đang bán</p>
              <p className="text-2xl font-semibold text-[var(--color-text-primary)]">{activeSku}</p>
            </div>
            <div className="rounded-[12px] border border-[#FDE68A] bg-[#FFFBEB] p-4">
              <p className="text-sm text-[var(--color-warning)]">SKU sắp hết (&lt; min)</p>
              <p className="text-2xl font-semibold text-[var(--color-warning)]">{lowSku}</p>
            </div>
            <div className="rounded-[12px] border border-[#FECACA] bg-[#FEF2F2] p-4">
              <p className="text-sm text-[var(--color-error)]">SKU hết hàng (=0)</p>
              <p className="text-2xl font-semibold text-[var(--color-error)]">{outSku}</p>
            </div>
          </section>

          <section className="rounded-[12px] border border-[var(--color-border)] bg-white p-5">
            <div className="mx-auto h-[220px] w-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={stockPie} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90}>
                    {stockPie.map((item) => (
                      <Cell key={item.name} fill={item.fill} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${Number(value ?? 0)} SKU`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 flex items-center justify-center gap-4">
              {stockPie.map((item) => (
                <div key={item.name} className="flex items-center gap-1.5 text-sm">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.fill }} />
                  <span>{item.name}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[12px] border border-[var(--color-border)] bg-white p-4">
            <Table>
              <TableHeader>
                {lowStockTable.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id} className="text-xs uppercase text-[var(--color-text-muted)]">
                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {lowStockTable.getRowModel().rows.map((row) => {
                  const product = row.original;
                  const rowClass =
                    product.stock === 0
                      ? 'bg-[#FEF2F2]'
                      : product.stock <= product.minStock
                        ? 'bg-[#FFFBEB]'
                        : '';

                  return (
                    <TableRow key={row.id} className={rowClass}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                      ))}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </section>
        </TabsContent>
      </Tabs>

    </div>
  );
}
