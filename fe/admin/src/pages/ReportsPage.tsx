import { useEffect, useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import {
  ArrowLeft,
  ArrowDownRight,
  ArrowUpRight,
  CalendarRange,
  Download,
  FileText,
  Printer,
  Sheet,
  Globe,
  Store,
  AlertCircle,
  Clock,
  ReceiptText,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  Area,
  AreaChart,
  Bar,
  CartesianGrid,
  Cell,
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
  startOfDay,
  subDays,
} from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
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
import { exportRowsToExcel } from '@/lib/excel';
import { formatVND } from '@/lib/utils';
import { toast } from '@/lib/toast';
import type { Product } from '@/types';
import { useReportsData } from '@/pages/reports/useReportsData';

interface DateRange {
  from: Date;
  to: Date;
}

type RevenuePeriodMode = 'week' | 'month' | 'custom';
type RevenueChannelMode = 'all' | 'online' | 'offline';
type ProductChannelMode = 'all' | 'online' | 'offline';

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

function inRange(date: Date, range: DateRange): boolean {
  return !isBefore(startOfDay(date), startOfDay(range.from)) && !isAfter(startOfDay(date), startOfDay(range.to));
}

function categoryColor(index: number): string {
  const palette = ['#2D6BE4', '#16A34A', '#D97706', '#DC2626', '#6D4BD8'];
  return palette[index % palette.length];
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function formatMoneyVnd(value: number): string {
  return `${new Intl.NumberFormat('vi-VN').format(Math.round(value))} VND`;
}

export function ReportsPage() {
  const navigate = useNavigate();

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
  const [revenueChannelMode, setRevenueChannelMode] = useState<RevenueChannelMode>('all');
  const [productChannelMode, setProductChannelMode] = useState<ProductChannelMode>('all');
  const {
    isLoading,
    canViewCustomers,
    ordersData,
    productsData,
    customersData,
  } = useReportsData();

  const productById = useMemo(() => {
    const map = new Map<string, Product>();
    productsData.forEach((product) => {
      map.set(product.id, product);
    });
    return map;
  }, [productsData]);

  const revenueByDay = useMemo(() => {
    const map = new Map<string, { parsedDate: Date; revenue: number; orders: number }>();

    ordersData.forEach((order) => {
      if (revenueChannelMode !== 'all' && order.channel !== revenueChannelMode) {
        return;
      }

      const day = startOfDay(order.createdAt);
      const key = format(day, 'yyyy-MM-dd');
      const current = map.get(key) ?? { parsedDate: day, revenue: 0, orders: 0 };
      current.revenue += order.total;
      current.orders += 1;
      map.set(key, current);
    });

    return Array.from(map.values())
      .sort((a, b) => a.parsedDate.getTime() - b.parsedDate.getTime())
      .map((item) => ({
        parsedDate: item.parsedDate,
        date: format(item.parsedDate, 'dd/MM'),
        revenue: item.revenue,
        orders: item.orders,
      }));
  }, [ordersData, revenueChannelMode]);

  const filteredRevenueBase = useMemo(() => {
    return revenueByDay
      .filter((item) => inRange(item.parsedDate, dateRange))
      .sort((a, b) => a.parsedDate.getTime() - b.parsedDate.getTime());
  }, [dateRange, revenueByDay]);

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

  const revenueDateKeys = useMemo(() => {
    const source =
      revenueMode === 'week'
        ? filteredRevenueBase.slice(-7)
        : revenueMode === 'month'
          ? filteredRevenueBase.slice(-30)
          : filteredRevenueBase;

    return new Set(source.map((item) => format(item.parsedDate, 'yyyy-MM-dd')));
  }, [filteredRevenueBase, revenueMode]);

  const revenueOrders = useMemo(() => {
    return ordersData.filter((order) => {
      if (revenueChannelMode !== 'all' && order.channel !== revenueChannelMode) {
        return false;
      }
      const key = format(startOfDay(order.createdAt), 'yyyy-MM-dd');
      return revenueDateKeys.has(key);
    });
  }, [ordersData, revenueDateKeys, revenueChannelMode]);

  const totalRevenue = revenueOrders.reduce((sum, order) => sum + order.total, 0);
  const totalInvoices = revenueOrders.length;
  const onlineRevenue = revenueOrders
    .filter((order) => order.channel === 'online')
    .reduce((sum, order) => sum + order.total, 0);
  const offlineRevenue = revenueOrders
    .filter((order) => order.channel === 'offline')
    .reduce((sum, order) => sum + order.total, 0);
  const averageOrderValue = totalInvoices === 0 ? 0 : Math.round(totalRevenue / totalInvoices);
  const revenueHeadingLabel = revenueChannelMode === 'online'
    ? 'Doanh thu online'
    : revenueChannelMode === 'offline'
      ? 'Doanh thu offline'
      : 'Tổng doanh thu';

  const firstRevenuePoint = revenueSeries[0];
  const lastRevenuePoint = revenueSeries[revenueSeries.length - 1];

  const calcGrowthPct = (current: number, previous: number): number => {
    if (previous <= 0) {
      return 0;
    }
    return ((current - previous) / previous) * 100;
  };

  const revenueGrowthPct = firstRevenuePoint && lastRevenuePoint
    ? calcGrowthPct(lastRevenuePoint.revenue, firstRevenuePoint.revenue)
    : 0;
  const invoiceGrowthPct = firstRevenuePoint && lastRevenuePoint
    ? calcGrowthPct(lastRevenuePoint.orders, firstRevenuePoint.orders)
    : 0;
  const firstAvgOrderValue = firstRevenuePoint
    ? Math.round(firstRevenuePoint.revenue / Math.max(1, firstRevenuePoint.orders))
    : 0;
  const avgOrderGrowthPct = calcGrowthPct(averageOrderValue, firstAvgOrderValue);

  const revenueTrendSeries = useMemo(() => {
    return revenueSeries.map((row) => {
      const baseline = Math.max(0, row.revenue - row.dayDiff);
      const orderSignal = row.orders * Math.max(1, averageOrderValue * 0.55);
      return {
        ...row,
        baseline,
        orderSignal,
      };
    });
  }, [averageOrderValue, revenueSeries]);

  const filteredOrders = useMemo(() => {
    return ordersData.filter((order) => inRange(order.createdAt, dateRange));
  }, [dateRange, ordersData]);

  const filteredProductOrders = useMemo(() => {
    return ordersData.filter((order) => {
      if (!inRange(order.createdAt, dateRange)) {
        return false;
      }
      if (productChannelMode === 'all') {
        return true;
      }
      return order.channel === productChannelMode;
    });
  }, [dateRange, ordersData, productChannelMode]);

  const topProducts = useMemo<TopProductRow[]>(() => {
    const map = new Map<string, TopProductRow>();

    filteredProductOrders.forEach((order) => {
      order.items.forEach((item) => {
        const mappedProduct = productById.get(item.productId);
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
          stock: mappedProduct?.stock ?? 0,
          performance: 0,
          category: mappedProduct?.category ?? 'Khác',
        });
      });
    });

    const rows = Array.from(map.values()).sort((a, b) => b.sold - a.sold);
    const maxSold = Math.max(1, rows[0]?.sold ?? 1);

    return rows.map((row) => ({
      ...row,
      performance: Math.round((row.sold / maxSold) * 100),
    }));
  }, [filteredProductOrders, productById]);

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
    const map = new Map<string, { parsedDate: Date; count: number }>();

    customersData
      .filter((customer) => inRange(customer.createdAt, dateRange))
      .forEach((customer) => {
        const parsedDate = startOfDay(customer.createdAt);
        const key = format(parsedDate, 'yyyy-MM-dd');
        const current = map.get(key) ?? { parsedDate, count: 0 };
        current.count += 1;
        map.set(key, current);
      });

    return Array.from(map.values())
      .sort((a, b) => a.parsedDate.getTime() - b.parsedDate.getTime())
      .map((item) => ({
        date: format(item.parsedDate, 'dd/MM'),
        count: item.count,
      }));
  }, [customersData, dateRange]);

  const topCustomers = useMemo(() => {
    return [...customersData]
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10)
      .map((customer) => ({
        ...customer,
        avgOrder: customer.totalOrders === 0 ? 0 : Math.round(customer.totalSpent / customer.totalOrders),
      }));
  }, [customersData]);

  // Order Statistics
  const todayOrders = useMemo(() => {
    const todayStart = startOfDay(today);
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);

    return ordersData.filter((order) => {
      const orderDay = startOfDay(order.createdAt);
      return !isBefore(orderDay, todayStart) && isBefore(orderDay, todayEnd);
    });
  }, [ordersData, today]);

  const onlineOrders = useMemo(() => {
    return filteredOrders.filter((order) => order.channel === 'online');
  }, [filteredOrders]);

  const offlineOrders = useMemo(() => {
    return filteredOrders.filter((order) => order.channel === 'offline');
  }, [filteredOrders]);

  const cancelledOrders = useMemo(() => {
    return filteredOrders.filter((order) => order.status === 'cancelled');
  }, [filteredOrders]);

  const todayStats = useMemo(() => {
    const total = todayOrders.length;
    const revenue = todayOrders.reduce((sum, order) => sum + order.total, 0);
    const online = todayOrders.filter((o) => o.channel === 'online').length;
    const offline = todayOrders.filter((o) => o.channel === 'offline').length;
    const cancelled = todayOrders.filter((o) => o.status === 'cancelled').length;

    return { total, revenue, online, offline, cancelled };
  }, [todayOrders]);

  const orderChannelPie = useMemo(() => {
    const onlineCount = onlineOrders.length;
    const offlineCount = offlineOrders.length;
    return [
      { name: 'Online', value: onlineCount, fill: '#2D6BE4', percentage: onlineCount + offlineCount === 0 ? 0 : Math.round((onlineCount / (onlineCount + offlineCount)) * 100) },
      { name: 'Offline', value: offlineCount, fill: '#16A34A', percentage: onlineCount + offlineCount === 0 ? 0 : Math.round((offlineCount / (onlineCount + offlineCount)) * 100) },
    ];
  }, [onlineOrders, offlineOrders]);

  const orderStatusDistribution = useMemo(() => {
    const pending = filteredOrders.filter((o) => o.status === 'pending').length;
    const paid = filteredOrders.filter((o) => o.status === 'paid').length;
    const cancelled = filteredOrders.filter((o) => o.status === 'cancelled').length;

    return [
      { name: 'Chờ xử lý', value: pending, fill: '#D97706' },
      { name: 'Đã thanh toán', value: paid, fill: '#16A34A' },
      { name: 'Đã hủy', value: cancelled, fill: '#DC2626' },
    ];
  }, [filteredOrders]);

  const activeSku = productsData.filter((product) => product.status === 'active').length;
  const lowSku = productsData.filter((product) => product.stock > 0 && product.stock <= product.minStock).length;
  const outSku = productsData.filter((product) => product.stock === 0).length;

  const stockPie = [
    { name: 'Còn hàng', value: activeSku, fill: '#2D6BE4' },
    { name: 'Sắp hết', value: lowSku, fill: '#D97706' },
    { name: 'Hết hàng', value: outSku, fill: '#DC2626' },
  ];

  const lowStockRows = useMemo(() => {
    return productsData
      .filter((product) => product.stock <= product.minStock)
      .map((product) => ({
        ...product,
        needed: Math.max(0, product.minStock * 2 - product.stock),
      }));
  }, [productsData]);

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

  const reportDateRangeLabel = `${format(dateRange.from, 'dd/MM/yyyy')} - ${format(dateRange.to, 'dd/MM/yyyy')}`;

  const revenueTableRows = useMemo(() => {
    return revenueSeries.map((row) => [
      row.dateLabel,
      String(row.orders),
      formatMoneyVnd(row.revenue),
      formatMoneyVnd(row.dayDiff),
      `${row.changePct.toFixed(1)}%`,
    ]);
  }, [revenueSeries]);

  const exportPdfReport = () => {
    if (revenueSeries.length === 0) {
      toast.error('Khong co du lieu de xuat PDF trong khoang thoi gian da chon');
      return;
    }

    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const generatedAt = format(new Date(), 'dd/MM/yyyy HH:mm');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('Bao cao doanh thu', 40, 42);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Khoang thoi gian: ${reportDateRangeLabel}`, 40, 62);
    doc.text(`Xuat luc: ${generatedAt}`, 40, 76);
    doc.text(`Tong doanh thu: ${formatMoneyVnd(totalRevenue)}`, 40, 96);
    doc.text(`So hoa don: ${totalInvoices}`, 40, 110);
    doc.text(`Doanh thu online: ${formatMoneyVnd(onlineRevenue)}`, 40, 124);
    doc.text(`Doanh thu offline: ${formatMoneyVnd(offlineRevenue)}`, 40, 138);

    autoTable(doc, {
      startY: 156,
      head: [['Ngay', 'So don', 'Doanh thu', 'So hom truoc', '% thay doi']],
      body: revenueTableRows,
      styles: {
        fontSize: 9,
        cellPadding: 6,
      },
      headStyles: {
        fillColor: [45, 107, 228],
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
    });

    doc.save(`bao-cao-${format(new Date(), 'yyyyMMdd-HHmm')}.pdf`);
    toast.success('Da xuat bao cao PDF');
  };

  const exportExcelReport = () => {
    if (revenueSeries.length === 0) {
      toast.error('Khong co du lieu de xuat Excel trong khoang thoi gian da chon');
      return;
    }

    exportRowsToExcel({
      fileName: `bao-cao-${format(new Date(), 'yyyyMMdd-HHmm')}`,
      sheetName: 'BaoCao',
      headers: ['Ngay', 'So don', 'Doanh thu', 'So hom truoc', '% thay doi'],
      rows: revenueSeries.map((row) => [
        row.dateLabel,
        row.orders,
        row.revenue,
        row.dayDiff,
        Number(row.changePct.toFixed(2)),
      ]),
    });

    toast.success('Da xuat bao cao Excel');
  };

  const printReport = () => {
    if (revenueSeries.length === 0) {
      toast.error('Khong co du lieu de in bao cao trong khoang thoi gian da chon');
      return;
    }

    const reportHtml = `
      <!doctype html>
      <html lang="vi">
      <head>
        <meta charset="utf-8" />
        <title>Bao cao doanh thu</title>
        <style>
          :root { color-scheme: light; }
          body {
            margin: 28px;
            color: #111827;
            font-family: Arial, Helvetica, sans-serif;
            font-size: 12px;
          }
          h1 {
            margin: 0 0 6px;
            font-size: 24px;
          }
          .meta {
            margin-bottom: 4px;
            color: #4b5563;
          }
          .stats {
            margin: 16px 0;
            padding: 12px;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 6px 12px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
          }
          th, td {
            border: 1px solid #e5e7eb;
            padding: 8px;
            text-align: left;
          }
          th {
            background: #f3f4f6;
            font-weight: 700;
          }
        </style>
      </head>
      <body>
        <h1>Bao cao doanh thu</h1>
        <div class="meta">Khoang thoi gian: ${escapeHtml(reportDateRangeLabel)}</div>
        <div class="meta">Xuat luc: ${escapeHtml(format(new Date(), 'dd/MM/yyyy HH:mm'))}</div>
        <div class="stats">
          <div><strong>Tong doanh thu:</strong> ${escapeHtml(formatMoneyVnd(totalRevenue))}</div>
          <div><strong>So hoa don:</strong> ${totalInvoices}</div>
          <div><strong>Doanh thu online:</strong> ${escapeHtml(formatMoneyVnd(onlineRevenue))}</div>
          <div><strong>Doanh thu offline:</strong> ${escapeHtml(formatMoneyVnd(offlineRevenue))}</div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Ngay</th>
              <th>So don</th>
              <th>Doanh thu</th>
              <th>So hom truoc</th>
              <th>% thay doi</th>
            </tr>
          </thead>
          <tbody>
            ${revenueSeries
              .map((row) => `
                <tr>
                  <td>${escapeHtml(row.dateLabel)}</td>
                  <td>${row.orders}</td>
                  <td>${escapeHtml(formatMoneyVnd(row.revenue))}</td>
                  <td>${escapeHtml(formatMoneyVnd(row.dayDiff))}</td>
                  <td>${escapeHtml(`${row.changePct.toFixed(1)}%`)}</td>
                </tr>
              `)
              .join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank', 'noopener,noreferrer,width=1024,height=768');
    if (!printWindow) {
      toast.error('Trinh duyet dang chan cua so in. Vui long cho phep pop-up');
      return;
    }

    printWindow.document.open();
    printWindow.document.write(reportHtml);
    printWindow.document.close();
    printWindow.focus();

    window.setTimeout(() => {
      printWindow.print();
    }, 180);
  };

  const handleExportClick = (action: 'pdf' | 'excel' | 'print') => {
    if (action === 'pdf') {
      exportPdfReport();
      return;
    }
    if (action === 'excel') {
      exportExcelReport();
      return;
    }
    printReport();
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
    <div className="mx-auto w-full max-w-[1480px] space-y-5">
      <section className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            className="h-9 gap-2"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft size={16} />
            Quay lại
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-9 gap-2"
            onClick={() => navigate('/invoices')}
          >
            <ReceiptText size={16} />
            Hóa đơn
          </Button>
          <h1 className="ml-1 font-[var(--font-display)] text-[24px] font-semibold text-[var(--color-text-primary)]">
            Báo cáo & Thống kê
          </h1>
        </div>

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
              <DropdownMenuItem onClick={() => handleExportClick('pdf')}>
                <FileText size={14} /> Xuất PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExportClick('excel')}>
                <Sheet size={14} /> Xuất Excel
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExportClick('print')}>
                <Printer size={14} /> In báo cáo
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </section>

      <Tabs defaultValue="revenue" className="flex-col gap-4">
        <TabsList variant="line" className="h-auto w-full justify-start border-b border-[var(--color-border)] p-0">
          <TabsTrigger value="revenue" className="flex-none px-4 py-2 text-[15px] font-medium">Doanh thu</TabsTrigger>
          <TabsTrigger value="products" className="flex-none px-4 py-2 text-[15px] font-medium">Sản phẩm</TabsTrigger>
          <TabsTrigger value="orders" className="flex-none px-4 py-2 text-[15px] font-medium">Đơn hàng</TabsTrigger>
          <TabsTrigger value="customers" className="flex-none px-4 py-2 text-[15px] font-medium">Khách hàng</TabsTrigger>
          <TabsTrigger value="stock" className="flex-none px-4 py-2 text-[15px] font-medium">Tồn kho</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="mt-4 space-y-4">
          <section className="grid gap-3 lg:grid-cols-3">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1E3A8A] via-[#1D4ED8] to-[#1E40AF] p-5 text-white shadow-[0_12px_28px_rgba(29,78,216,0.28)]">
              <p className="text-sm font-medium text-white/80">{revenueHeadingLabel}</p>
              <p className="mt-2 font-[var(--font-display)] text-[40px] font-bold leading-none">{formatVND(totalRevenue)}</p>
              <p className="mt-3 inline-flex items-center gap-1.5 text-sm text-emerald-200">
                <ArrowUpRight size={14} />
                {revenueGrowthPct.toFixed(1)}% so với đầu kỳ
              </p>
              <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
            </div>

            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0F766E] via-[#0F766E] to-[#115E59] p-5 text-white shadow-[0_12px_28px_rgba(15,118,110,0.28)]">
              <p className="text-sm font-medium text-white/80">Số hóa đơn</p>
              <p className="mt-2 font-[var(--font-display)] text-[40px] font-bold leading-none">{totalInvoices}</p>
              <p className="mt-3 inline-flex items-center gap-1.5 text-sm text-emerald-200">
                <ArrowUpRight size={14} />
                {invoiceGrowthPct.toFixed(1)}% theo kỳ chọn
              </p>
              <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
            </div>

            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#5B1E72] via-[#6B21A8] to-[#4C1D95] p-5 text-white shadow-[0_12px_28px_rgba(107,33,168,0.28)]">
              <p className="text-sm font-medium text-white/80">TB/đơn</p>
              <p className="mt-2 font-[var(--font-display)] text-[40px] font-bold leading-none">{formatVND(averageOrderValue)}</p>
              <p className="mt-3 inline-flex items-center gap-1.5 text-sm text-emerald-200">
                <ArrowUpRight size={14} />
                {avgOrderGrowthPct.toFixed(1)}% so với đầu kỳ
              </p>
              <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
            </div>
          </section>

          <section className="rounded-2xl border border-[var(--color-border)] bg-white p-6">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-[30px] font-semibold text-[var(--color-text-primary)]">Doanh thu</h3>
              <div className="flex items-center gap-2">
                <div className="inline-flex items-center gap-1 rounded-full bg-[#F6F7FB] p-1">
                  <button
                    type="button"
                    className={revenueChannelMode === 'all' ? 'rounded-full bg-white px-3 py-1 text-xs font-medium text-[#1E3A8A] shadow-sm' : 'rounded-full px-3 py-1 text-xs text-[var(--color-text-secondary)]'}
                    onClick={() => setRevenueChannelMode('all')}
                  >
                    Tổng
                  </button>
                  <button
                    type="button"
                    className={revenueChannelMode === 'online' ? 'rounded-full bg-white px-3 py-1 text-xs font-medium text-[#1E3A8A] shadow-sm' : 'rounded-full px-3 py-1 text-xs text-[var(--color-text-secondary)]'}
                    onClick={() => setRevenueChannelMode('online')}
                  >
                    Online
                  </button>
                  <button
                    type="button"
                    className={revenueChannelMode === 'offline' ? 'rounded-full bg-white px-3 py-1 text-xs font-medium text-[#1E3A8A] shadow-sm' : 'rounded-full px-3 py-1 text-xs text-[var(--color-text-secondary)]'}
                    onClick={() => setRevenueChannelMode('offline')}
                  >
                    Offline
                  </button>
                </div>

                <div className="inline-flex items-center gap-2 rounded-full bg-[#F6F7FB] p-1">
                  <button
                    type="button"
                    className={revenueMode === 'week' ? 'rounded-full bg-white px-3 py-1 text-xs font-medium text-[#1E3A8A] shadow-sm' : 'rounded-full px-3 py-1 text-xs text-[var(--color-text-secondary)]'}
                    onClick={() => setRevenueMode('week')}
                  >
                    Tuần
                  </button>
                  <button
                    type="button"
                    className={revenueMode === 'month' ? 'rounded-full bg-white px-3 py-1 text-xs font-medium text-[#1E3A8A] shadow-sm' : 'rounded-full px-3 py-1 text-xs text-[var(--color-text-secondary)]'}
                    onClick={() => setRevenueMode('month')}
                  >
                    Tháng
                  </button>
                  <button
                    type="button"
                    className={revenueMode === 'custom' ? 'rounded-full bg-white px-3 py-1 text-xs font-medium text-[#1E3A8A] shadow-sm' : 'rounded-full px-3 py-1 text-xs text-[var(--color-text-secondary)]'}
                    onClick={() => setRevenueMode('custom')}
                  >
                    Tùy chọn
                  </button>
                </div>
              </div>
            </div>

            <div className="h-[340px] rounded-xl border border-[#EEF1F6] bg-[#FBFCFF] px-3 pt-3">
              {isLoading ? (
                <div className="flex h-full items-center justify-center text-sm text-[var(--color-text-muted)]">Đang tải dữ liệu biểu đồ...</div>
              ) : revenueSeries.length === 0 ? (
                <div className="flex h-full items-center justify-center text-sm text-[var(--color-text-muted)]">Chưa có dữ liệu doanh thu trong khoảng thời gian đã chọn.</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <AreaChart data={revenueTrendSeries}>
                    <defs>
                      <linearGradient id="revenueAreaFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#3B82F6" stopOpacity={0.04} />
                      </linearGradient>
                      <linearGradient id="baselineAreaFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10B981" stopOpacity={0.2} />
                        <stop offset="100%" stopColor="#10B981" stopOpacity={0.03} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} stroke="#E6EAF2" />
                    <XAxis dataKey="dateLabel" tick={{ fontSize: 12, fill: '#7B8698' }} axisLine={false} tickLine={false} />
                    <YAxis
                      tick={{ fontSize: 12, fill: '#7B8698' }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(value: number) => `${Math.round(value / 1000000)}M`}
                    />
                    <Tooltip
                      contentStyle={{ border: '1px solid #DCE3F0', borderRadius: '10px', background: '#111827', color: '#fff' }}
                      formatter={(value, name, item) => {
                        if (name === 'revenue') return [formatVND(typeof value === 'number' ? value : Number(value ?? 0)), 'Doanh thu'];
                        if (name === 'baseline') return [formatVND(typeof value === 'number' ? value : Number(value ?? 0)), 'Mốc tham chiếu'];
                        if (name === 'orderSignal') return [formatVND(typeof value === 'number' ? value : Number(value ?? 0)), 'Nhịp số đơn'];
                        if (name === 'orders') return [item.payload?.orders ?? 0, 'Số đơn'];
                        return [value, name];
                      }}
                    />
                    <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ paddingBottom: 8 }} />
                    <Area type="monotone" name="Doanh thu" dataKey="revenue" fill="url(#revenueAreaFill)" stroke="#3B82F6" strokeWidth={2.5} />
                    <Area type="monotone" name="Mốc tham chiếu" dataKey="baseline" fill="url(#baselineAreaFill)" stroke="#10B981" strokeWidth={2} />
                    <Line type="monotone" name="Nhịp số đơn" dataKey="orderSignal" stroke="#F59E0B" strokeWidth={2} dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="mt-4">
              <DataTable data={revenueSeries} columns={revenueColumns} pageSize={7} />
            </div>
          </section>
        </TabsContent>

        <TabsContent value="products" className="mt-4 space-y-4">
          <section className="flex items-center justify-end">
            <div className="inline-flex items-center gap-1 rounded-full bg-[#F6F7FB] p-1">
              <button
                type="button"
                className={productChannelMode === 'all' ? 'rounded-full bg-white px-3 py-1 text-xs font-medium text-[#1E3A8A] shadow-sm' : 'rounded-full px-3 py-1 text-xs text-[var(--color-text-secondary)]'}
                onClick={() => setProductChannelMode('all')}
              >
                Tổng
              </button>
              <button
                type="button"
                className={productChannelMode === 'online' ? 'rounded-full bg-white px-3 py-1 text-xs font-medium text-[#1E3A8A] shadow-sm' : 'rounded-full px-3 py-1 text-xs text-[var(--color-text-secondary)]'}
                onClick={() => setProductChannelMode('online')}
              >
                Online
              </button>
              <button
                type="button"
                className={productChannelMode === 'offline' ? 'rounded-full bg-white px-3 py-1 text-xs font-medium text-[#1E3A8A] shadow-sm' : 'rounded-full px-3 py-1 text-xs text-[var(--color-text-secondary)]'}
                onClick={() => setProductChannelMode('offline')}
              >
                Offline
              </button>
            </div>
          </section>

          <section className="grid gap-4 xl:grid-cols-[3fr,2fr]">
            <div className="rounded-[12px] border border-[var(--color-border)] bg-white p-5">
              <h3 className="mb-3 text-base font-semibold">Top sản phẩm bán chạy</h3>
              <div className="h-[320px]">
                {isLoading ? (
                  <div className="flex h-full items-center justify-center text-sm text-[var(--color-text-muted)]">Đang tải dữ liệu sản phẩm...</div>
                ) : topProducts.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-sm text-[var(--color-text-muted)]">Chưa có dữ liệu bán hàng trong khoảng thời gian đã chọn.</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%" minWidth={0}>
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
                )}
              </div>
            </div>

            <div className="rounded-[12px] border border-[var(--color-border)] bg-white p-5">
              <h3 className="mb-3 text-base font-semibold">Theo danh mục</h3>
              <div className="mx-auto h-[220px] w-[220px]">
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
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

        <TabsContent value="orders" className="mt-4 space-y-4">
          <section className="grid gap-3 md:grid-cols-4">
            <div className="rounded-[12px] border border-[var(--color-border)] bg-white p-5">
              <div className="flex items-center gap-2 mb-2">
                <Clock size={16} className="text-[var(--color-accent)]" />
                <p className="text-sm text-[var(--color-text-secondary)]">Hôm nay</p>
              </div>
              <p className="font-[var(--font-display)] text-[24px] font-bold text-[var(--color-text-primary)]">{todayStats.total}</p>
              <p className="text-xs text-[var(--color-text-muted)]">{formatVND(todayStats.revenue)} doanh thu</p>
            </div>

            <div className="rounded-[12px] border border-[var(--color-border)] bg-white p-5">
              <div className="flex items-center gap-2 mb-2">
                <Globe size={16} className="text-[#2D6BE4]" />
                <p className="text-sm text-[var(--color-text-secondary)]">Đơn Online</p>
              </div>
              <p className="font-[var(--font-display)] text-[24px] font-bold text-[#2D6BE4]">{onlineOrders.length}</p>
              <p className="text-xs text-[var(--color-text-muted)]">{`${onlineOrders.length + offlineOrders.length === 0 ? 0 : Math.round((onlineOrders.length / (onlineOrders.length + offlineOrders.length)) * 100)}%`} trong kỳ</p>
            </div>

            <div className="rounded-[12px] border border-[var(--color-border)] bg-white p-5">
              <div className="flex items-center gap-2 mb-2">
                <Store size={16} className="text-[#16A34A]" />
                <p className="text-sm text-[var(--color-text-secondary)]">Đơn Offline</p>
              </div>
              <p className="font-[var(--font-display)] text-[24px] font-bold text-[#16A34A]">{offlineOrders.length}</p>
              <p className="text-xs text-[var(--color-text-muted)]">{`${onlineOrders.length + offlineOrders.length === 0 ? 0 : Math.round((offlineOrders.length / (onlineOrders.length + offlineOrders.length)) * 100)}%`} trong kỳ</p>
            </div>

            <div className="rounded-[12px] border border-[#FECACA] bg-[#FEF2F2] p-5">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle size={16} className="text-[#DC2626]" />
                <p className="text-sm text-[#DC2626]">Đã hủy</p>
              </div>
              <p className="font-[var(--font-display)] text-[24px] font-bold text-[#DC2626]">{cancelledOrders.length}</p>
              <p className="text-xs text-[var(--color-text-muted)]">{filteredOrders.length === 0 ? 0 : Math.round((cancelledOrders.length / filteredOrders.length) * 100)}% hủy/tổng</p>
            </div>
          </section>

          <section className="grid gap-4 xl:grid-cols-2">
            <div className="rounded-[12px] border border-[var(--color-border)] bg-white p-5">
              <h3 className="mb-3 text-base font-semibold">Đơn hàng theo kênh</h3>
              <div className="mx-auto h-[220px] w-[220px]">
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <PieChart>
                    <Pie
                      data={orderChannelPie}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={2}
                    >
                      {orderChannelPie.map((entry) => (
                        <Cell key={entry.name} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${Number(value ?? 0)} đơn`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 space-y-1">
                {orderChannelPie.map((item) => (
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

            <div className="rounded-[12px] border border-[var(--color-border)] bg-white p-5">
              <h3 className="mb-3 text-base font-semibold">Trạng thái đơn hàng</h3>
              <div className="mx-auto h-[220px] w-[220px]">
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <PieChart>
                    <Pie
                      data={orderStatusDistribution}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={2}
                    >
                      {orderStatusDistribution.map((entry) => (
                        <Cell key={entry.name} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${Number(value ?? 0)} đơn`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 space-y-1">
                {orderStatusDistribution.map((item) => (
                  <div key={item.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.fill }} />
                      <span>{item.name}</span>
                    </div>
                    <span className="text-[var(--color-text-secondary)]">{item.value} đơn</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="rounded-[12px] border border-[var(--color-border)] bg-white p-4">
            <h3 className="mb-3 text-base font-semibold">Đơn hàng trong kỳ</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between p-2 bg-[#F7F6F4] rounded">
                <span className="text-[var(--color-text-secondary)]">Tổng số đơn</span>
                <span className="font-semibold">{filteredOrders.length}</span>
              </div>
              <div className="flex justify-between p-2">
                <span className="text-[var(--color-text-secondary)]">Doanh thu</span>
                <span className="font-semibold">{formatVND(filteredOrders.reduce((sum, o) => sum + o.total, 0))}</span>
              </div>
              <div className="flex justify-between p-2 bg-[#F7F6F4] rounded">
                <span className="text-[var(--color-text-secondary)]">TB/đơn</span>
                <span className="font-semibold">{formatVND(filteredOrders.length === 0 ? 0 : Math.round(filteredOrders.reduce((sum, o) => sum + o.total, 0) / filteredOrders.length))}</span>
              </div>
              <div className="flex justify-between p-2">
                <span className="text-[var(--color-text-secondary)]">Đơn đã hủy</span>
                <span className="font-semibold text-[#DC2626]">{cancelledOrders.length} ({filteredOrders.length === 0 ? 0 : Math.round((cancelledOrders.length / filteredOrders.length) * 100)}%)</span>
              </div>
            </div>
          </section>
        </TabsContent>

        <TabsContent value="customers" className="mt-4 space-y-4">
          {!canViewCustomers ? (
            <section className="rounded-[12px] border border-[var(--color-border)] bg-white p-8 text-center">
              <p className="text-sm font-medium text-[var(--color-text-primary)]">Bạn chưa có quyền xem dữ liệu khách hàng.</p>
              <p className="mt-1 text-xs text-[var(--color-text-muted)]">Liên hệ quản lý để được cấp quyền truy cập mục này.</p>
            </section>
          ) : null}

          {canViewCustomers ? (
          <section className="rounded-[12px] border border-[var(--color-border)] bg-white p-5">
            <h3 className="mb-3 text-base font-semibold">Khách hàng mới theo ngày</h3>
            <div className="h-[300px]">
              {isLoading ? (
                <div className="flex h-full items-center justify-center text-sm text-[var(--color-text-muted)]">Đang tải dữ liệu khách hàng...</div>
              ) : newCustomersSeries.length === 0 ? (
                <div className="flex h-full items-center justify-center text-sm text-[var(--color-text-muted)]">Chưa có khách hàng mới trong khoảng thời gian đã chọn.</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <LineChart data={newCustomersSeries}>
                    <CartesianGrid vertical={false} stroke="#F0EEE9" />
                    <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#A09D99' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: '#A09D99' }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip />
                    <Line type="monotone" dataKey="count" stroke="#16A34A" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </section>
          ) : null}

          {canViewCustomers ? (
          <section className="rounded-[12px] border border-[var(--color-border)] bg-white p-4">
            <DataTable data={topCustomers} columns={customerColumns} pageSize={10} />
          </section>
          ) : null}
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
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
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
