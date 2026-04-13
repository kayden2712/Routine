import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ColumnDef } from '@tanstack/react-table';
import { AlertTriangle, Boxes, ClipboardCheck, Download, Filter, PackagePlus, PackageMinus, RotateCcw, Search } from 'lucide-react';
import { DataTable } from '@/components/shared/DataTable';
import { KPICard } from '@/components/shared/KPICard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn, formatVND } from '@/lib/utils';
import { toast } from '@/lib/toast';
import { exportRowsToExcel } from '@/lib/excel';
import { useAuthStore } from '@/store/authStore';
import { useProductStore } from '@/store/productStore';
import { inventoryApi } from '@/lib/inventoryApi';
import type { InventoryHistoryItem, InventoryReportItem, Product } from '@/types';

type StockFilter = 'all' | 'healthy' | 'low' | 'out';
type SortMode = 'name-asc' | 'stock-asc' | 'stock-desc' | 'value-desc';
interface InventoryRow {
  id: number;
  code: string;
  name: string;
  category: string;
  stock: number;
  minStock: number;
  value: number;
  status: Product['status'];
  totalNhap: number;
  totalXuat: number;
  lastUpdate?: string;
  imageUrl?: string;
}

const STOCK_FILTER_LABELS: Record<StockFilter, string> = {
  all: 'Tat ca muc ton',
  healthy: 'On dinh',
  low: 'Sap het',
  out: 'Het hang',
};

const SORT_LABELS: Record<SortMode, string> = {
  'name-asc': 'Ten A-Z',
  'stock-asc': 'Ton kho thap',
  'stock-desc': 'Ton kho cao',
  'value-desc': 'Gia tri ton kho cao',
};

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

export function InventoryPage() {
  const navigate = useNavigate();
  const products = useProductStore((state) => state.products);
  const fetchProducts = useProductStore((state) => state.fetchProducts);
  const user = useAuthStore((state) => state.user);
  const isReadOnly = user?.role === 'sales';

  const [searchTerm, setSearchTerm] = useState('');
  const [stockFilter, setStockFilter] = useState<StockFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState<SortMode>('stock-asc');
  const [inventoryReport, setInventoryReport] = useState<InventoryReportItem[]>([]);
  const [inventoryHistory, setInventoryHistory] = useState<InventoryHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.title = 'Kho hang | Routine';
    void loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      await fetchProducts();

      const [report, history] = await Promise.all([
        inventoryApi.getReport(),
        inventoryApi.getHistory({ page: 0, size: 10 }),
      ]);

      setInventoryReport(report);
      setInventoryHistory(history.content ?? []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Khong the tai du lieu kho');
    } finally {
      setLoading(false);
    }
  };

  const productMap = useMemo(() => {
    const map = new Map<number, Product>();
    products.forEach((item) => {
      const id = Number(item.id);
      if (!Number.isNaN(id)) {
        map.set(id, item);
      }
    });
    return map;
  }, [products]);

  const categories = useMemo(() => {
    return Array.from(
      new Set(
        inventoryReport
          .map((item) => productMap.get(item.productId)?.category)
          .filter((item): item is string => Boolean(item)),
      ),
    ).sort((a, b) => a.localeCompare(b, 'vi'));
  }, [inventoryReport, productMap]);

  const inventoryRows = useMemo<InventoryRow[]>(() => {
    const q = normalize(searchTerm.trim());

    const rows = inventoryReport
      .map((reportItem) => {
        const product = productMap.get(reportItem.productId);
        const category = product?.category ?? 'Khac';
        const costPrice = product?.costPrice ?? 0;
        const stock = reportItem.currentStock;
        const minStock = reportItem.minStock;

        const status: Product['status'] = stock <= 0
          ? 'out_of_stock'
          : stock <= minStock
            ? 'inactive'
            : 'active';

        return {
          id: reportItem.productId,
          code: reportItem.productCode,
          name: reportItem.productName,
          category,
          stock,
          minStock,
          value: stock * costPrice,
          status,
          totalNhap: reportItem.totalNhap,
          totalXuat: reportItem.totalXuat,
          lastUpdate: reportItem.lastUpdate,
          imageUrl: product?.imageUrl,
        };
      })
      .filter((row) => {
        const matchSearch =
          q.length === 0 || normalize(row.name).includes(q) || normalize(row.code).includes(q);
        const matchCategory = categoryFilter === 'all' || row.category === categoryFilter;

        const matchStock =
          stockFilter === 'all'
            ? true
            : stockFilter === 'out'
              ? row.stock <= 0
              : stockFilter === 'low'
                ? row.stock > 0 && row.stock <= row.minStock
                : row.stock > row.minStock;

        return matchSearch && matchCategory && matchStock;
      });

    const sorted = [...rows];
    sorted.sort((a, b) => {
      if (sortBy === 'name-asc') return a.name.localeCompare(b.name, 'vi');
      if (sortBy === 'stock-asc') return a.stock - b.stock;
      if (sortBy === 'stock-desc') return b.stock - a.stock;
      return b.value - a.value;
    });

    return sorted;
  }, [categoryFilter, inventoryReport, productMap, searchTerm, sortBy, stockFilter]);

  const summary = useMemo(() => {
    const totalSkus = inventoryReport.length;
    const outCount = inventoryReport.filter((item) => item.currentStock <= 0).length;
    const lowCount = inventoryReport.filter((item) => item.currentStock > 0 && item.currentStock <= item.minStock).length;
    const totalValue = inventoryRows.reduce((sum, item) => sum + item.value, 0);
    return { totalSkus, outCount, lowCount, totalValue };
  }, [inventoryReport, inventoryRows]);

  const hasActiveFilters =
    searchTerm.trim().length > 0 || stockFilter !== 'all' || categoryFilter !== 'all' || sortBy !== 'stock-asc';

  const resetFilters = () => {
    setSearchTerm('');
    setStockFilter('all');
    setCategoryFilter('all');
    setSortBy('stock-asc');
  };

  const goToCreateReceipt = (mode: 'import' | 'export', row?: InventoryRow) => {
    if (isReadOnly) {
      toast.error('Vai trò Sales chỉ có quyền xem tồn kho');
      return;
    }

    const basePath = mode === 'import' ? '/inventory/import-receipts' : '/inventory/export-receipts';
    const params = row ? `?create=1&productId=${row.id}` : '?create=1';
    navigate(`${basePath}${params}`);
  };

  const handleExportExcel = () => {
    exportRowsToExcel({
      fileName: 'kho-hang',
      sheetName: 'KhoHang',
      headers: ['Ma SP', 'Ten san pham', 'Danh muc', 'Ton hien tai', 'Muc toi thieu', 'Gia tri ton', 'Tinh trang'],
      rows: inventoryRows.map((item) => [
        item.code,
        item.name,
        item.category,
        item.stock,
        item.minStock,
        item.value,
        item.stock <= 0 ? 'Het hang' : item.stock <= item.minStock ? 'Sap het' : 'Con hang',
      ]),
    });

    toast.success('Đã xuất file Excel kho hàng');
  };

  const columns = useMemo<ColumnDef<InventoryRow>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'San pham',
        cell: ({ row }) => {
          const item = row.original;
          return (
            <div className="flex items-center gap-3">
              {item.imageUrl ? (
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="h-10 w-10 rounded-[8px] border border-[var(--color-border)] object-cover"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-[8px] border border-[var(--color-border)] bg-[#EEF3FD] text-xs font-semibold text-[var(--color-accent)]">
                  {item.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <p className="font-medium text-[var(--color-text-primary)]">{item.name}</p>
                <p className="text-xs text-[var(--color-text-muted)]">
                  {item.code} · {item.category}
                </p>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: 'stock',
        header: 'Ton hien tai',
        cell: ({ row }) => {
          const item = row.original;
          return (
            <div>
              <p className="font-semibold text-[var(--color-text-primary)]">{item.stock}</p>
              <p className="text-xs text-[var(--color-text-muted)]">Toi thieu: {item.minStock}</p>
            </div>
          );
        },
      },
      {
        accessorKey: 'status',
        header: 'Tinh trang',
        cell: ({ row }) => {
          const item = row.original;
          const isOut = item.stock <= 0;
          const isLow = item.stock > 0 && item.stock <= item.minStock;

          const label = isOut ? 'Het hang' : isLow ? 'Sap het' : 'Con hang';
          const bg = isOut
            ? 'var(--color-error-bg)'
            : isLow
              ? 'var(--color-warning-bg)'
              : 'var(--color-success-bg)';
          const color = isOut
            ? 'var(--color-error)'
            : isLow
              ? 'var(--color-warning)'
              : 'var(--color-success)';

          return (
            <span
              className="inline-flex items-center rounded-full px-[10px] py-[2px] text-xs font-medium"
              style={{ backgroundColor: bg, color }}
            >
              {label}
            </span>
          );
        },
      },
      {
        accessorKey: 'value',
        header: 'Gia tri ton',
        cell: ({ row }) => (
          <span className="font-medium text-[var(--color-text-primary)]">{formatVND(row.original.value)}</span>
        ),
      },
      {
        id: 'flow',
        header: 'Nhap/Xuat',
        enableSorting: false,
        cell: ({ row }) => {
          const item = row.original;
          return (
            <span className="text-xs text-[var(--color-text-muted)]">
              +{item.totalNhap} / -{item.totalXuat}
            </span>
          );
        },
      },
      {
        id: 'actions',
        header: 'Thao tac',
        enableSorting: false,
        cell: ({ row }) => {
          const item = row.original;
          return (
            <div className="flex items-center gap-2" onClick={(event) => event.stopPropagation()}>
              <Button size="sm" variant="outline" onClick={() => goToCreateReceipt('import', item)}>
                <PackagePlus size={14} />
                Nhap
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => goToCreateReceipt('export', item)}
                disabled={item.stock <= 0}
              >
                <PackageMinus size={14} />
                Xuat
              </Button>
            </div>
          );
        },
      },
    ],
    [],
  );

  return (
    <div className="space-y-5">
      <section className="flex items-center justify-between gap-3">
        <h1 className="font-[var(--font-display)] text-[24px] font-semibold text-[var(--color-text-primary)]">Kho hàng</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="h-9 gap-2" onClick={() => navigate('/inventory/check')}>
            <ClipboardCheck size={16} />
            Kiem ke
          </Button>
          <Button variant="outline" className="h-9 gap-2" onClick={() => goToCreateReceipt('import')}>
            <PackagePlus size={16} />
            Tao phieu nhap
          </Button>
          <Button variant="outline" className="h-9 gap-2" onClick={() => goToCreateReceipt('export')}>
            <PackageMinus size={16} />
            Tao phieu xuat
          </Button>
          <Button variant="outline" className="h-9 gap-2" onClick={handleExportExcel}>
            <Download size={16} />
            Xuất Excel
          </Button>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KPICard
          label="Tong ma SKU"
          value={String(summary.totalSkus)}
          icon={Boxes}
          iconBg="#E8F0FE"
          iconColor="#2D6BE4"
        />
        <KPICard
          label="Sap het hang"
          value={String(summary.lowCount)}
          icon={AlertTriangle}
          iconBg="#FFF4E5"
          iconColor="#D97706"
        />
        <KPICard
          label="Het hang"
          value={String(summary.outCount)}
          icon={PackageMinus}
          iconBg="#FEEBEE"
          iconColor="#C62828"
        />
        <KPICard
          label="Gia tri ton kho"
          value={formatVND(summary.totalValue)}
          icon={Search}
          iconBg="#E7F6EC"
          iconColor="#237A4B"
        />
      </section>

      <DataTable
        data={inventoryRows}
        columns={columns}
        isLoading={loading}
        enableSelection
        pageSize={8}
        emptyState={{
          icon: Boxes,
          title: 'Không có sản phẩm phù hợp',
          description: 'Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm để xem dữ liệu kho.',
        }}
        filterBar={
          <div className="flex flex-1 flex-wrap items-center gap-2">
            <div className="relative min-w-[220px] flex-1">
              <Search
                size={14}
                className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
              />
              <Input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Tim ma, ten san pham..."
                className="h-9 pl-8"
              />
            </div>

            <Select value={stockFilter} onValueChange={(value) => setStockFilter(value as StockFilter)}>
              <SelectTrigger className="h-9 w-[180px]">
                <SelectValue>{STOCK_FILTER_LABELS[stockFilter]}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(STOCK_FILTER_LABELS) as StockFilter[]).map((key) => (
                  <SelectItem key={key} value={key}>
                    {STOCK_FILTER_LABELS[key]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={(value) => setCategoryFilter(value ?? 'all')}>
              <SelectTrigger className="h-9 w-[180px]">
                <SelectValue>{categoryFilter === 'all' ? 'Tat ca danh muc' : categoryFilter}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tat ca danh muc</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortMode)}>
              <SelectTrigger className="h-9 w-[180px]">
                <SelectValue>{SORT_LABELS[sortBy]}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(SORT_LABELS) as SortMode[]).map((key) => (
                  <SelectItem key={key} value={key}>
                    {SORT_LABELS[key]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              size="sm"
              variant="outline"
              onClick={resetFilters}
              disabled={!hasActiveFilters}
              className={cn('h-9', !hasActiveFilters && 'opacity-60')}
            >
              <RotateCcw size={14} />
              Bo loc
            </Button>

            <div className="inline-flex items-center gap-1 rounded-full border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-1 text-xs text-[var(--color-text-secondary)]">
              <Filter size={12} />
              {inventoryRows.length} ket qua
            </div>
          </div>
        }
      />

      <section className="rounded-[12px] border border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="border-b border-[var(--color-border)] px-4 py-3">
          <h2 className="font-[var(--font-display)] text-[18px] font-semibold text-[var(--color-text-primary)]">
            Lich su ton kho gan day
          </h2>
        </div>
        <div className="max-h-[320px] overflow-auto">
          {inventoryHistory.length === 0 ? (
            <p className="px-4 py-6 text-sm text-[var(--color-text-muted)]">Chua co lich su ton kho.</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)] bg-[#F7F6F4] text-xs uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
                  <th className="px-4 py-3">Thoi gian</th>
                  <th className="px-4 py-3">San pham</th>
                  <th className="px-4 py-3">Bien dong</th>
                  <th className="px-4 py-3">Nguoi thuc hien</th>
                </tr>
              </thead>
              <tbody>
                {inventoryHistory.map((item) => {
                  const positive = item.soLuongThayDoi > 0;
                  return (
                    <tr key={item.id} className="border-b border-[var(--color-border)]">
                      <td className="px-4 py-3 text-[var(--color-text-secondary)]">
                        {new Date(item.thoiGian).toLocaleString('vi-VN')}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-[var(--color-text-primary)]">{item.product.name}</p>
                        <p className="text-xs text-[var(--color-text-muted)]">{item.product.code}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="inline-flex items-center rounded-full px-[10px] py-[2px] text-xs font-medium"
                          style={{
                            backgroundColor: positive ? 'var(--color-success-bg)' : 'var(--color-error-bg)',
                            color: positive ? 'var(--color-success)' : 'var(--color-error)',
                          }}
                        >
                          {positive ? '+' : ''}{item.soLuongThayDoi} ({item.soLuongTruoc} → {item.soLuongSau})
                        </span>
                        {item.ghiChu ? (
                          <p className="mt-1 text-xs text-[var(--color-text-muted)]">{item.ghiChu}</p>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-[var(--color-text-secondary)]">{item.nguoiThucHien.fullName}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}
