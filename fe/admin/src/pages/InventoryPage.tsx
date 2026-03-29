import { useEffect, useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { AlertTriangle, Boxes, Download, Filter, PackagePlus, PackageMinus, RotateCcw, Search } from 'lucide-react';
import { DataTable } from '@/components/shared/DataTable';
import { KPICard } from '@/components/shared/KPICard';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import type { Product } from '@/types';

type StockFilter = 'all' | 'healthy' | 'low' | 'out';
type SortMode = 'name-asc' | 'stock-asc' | 'stock-desc' | 'value-desc';
type AdjustMode = 'in' | 'out' | 'set';

interface InventoryRow {
  id: string;
  code: string;
  name: string;
  category: string;
  stock: number;
  minStock: number;
  value: number;
  status: Product['status'];
  imageUrl?: string;
  source: Product;
}

interface AdjustState {
  product: Product;
  mode: AdjustMode;
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

function computeStatus(product: Product): Product['status'] {
  if (product.stock <= 0) return 'out_of_stock';
  if (product.stock <= product.minStock) return 'inactive';
  return 'active';
}

export function InventoryPage() {
  const products = useProductStore((state) => state.products);
  const updateProduct = useProductStore((state) => state.updateProduct);
  const fetchProducts = useProductStore((state) => state.fetchProducts);
  const user = useAuthStore((state) => state.user);
  const isReadOnly = user?.role === 'sales';

  const [searchTerm, setSearchTerm] = useState('');
  const [stockFilter, setStockFilter] = useState<StockFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState<SortMode>('stock-asc');
  const [adjustState, setAdjustState] = useState<AdjustState | null>(null);
  const [quantityInput, setQuantityInput] = useState('1');

  useEffect(() => {
    document.title = 'Kho hang | Routine';
    void fetchProducts();
  }, []);

  const categories = useMemo(() => {
    return Array.from(new Set(products.map((item) => item.category))).sort((a, b) => a.localeCompare(b, 'vi'));
  }, [products]);

  const inventoryRows = useMemo<InventoryRow[]>(() => {
    const q = normalize(searchTerm.trim());

    const rows = products
      .map((product) => ({
        id: product.id,
        code: product.code,
        name: product.name,
        category: product.category,
        stock: product.stock,
        minStock: product.minStock,
        value: product.stock * product.costPrice,
        status: computeStatus(product),
        imageUrl: product.imageUrl,
        source: product,
      }))
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
  }, [categoryFilter, products, searchTerm, sortBy, stockFilter]);

  const summary = useMemo(() => {
    const totalSkus = products.length;
    const outCount = products.filter((item) => item.stock <= 0).length;
    const lowCount = products.filter((item) => item.stock > 0 && item.stock <= item.minStock).length;
    const totalValue = products.reduce((sum, item) => sum + item.stock * item.costPrice, 0);
    return { totalSkus, outCount, lowCount, totalValue };
  }, [products]);

  const hasActiveFilters =
    searchTerm.trim().length > 0 || stockFilter !== 'all' || categoryFilter !== 'all' || sortBy !== 'stock-asc';

  const resetFilters = () => {
    setSearchTerm('');
    setStockFilter('all');
    setCategoryFilter('all');
    setSortBy('stock-asc');
  };

  const openAdjustDialog = (product: Product, mode: AdjustMode) => {
    if (isReadOnly) {
      toast.error('Vai tro Sales chi co quyen xem ton kho');
      return;
    }

    setQuantityInput(mode === 'set' ? String(product.stock) : '1');
    setAdjustState({ product, mode });
  };

  const applyAdjust = async () => {
    if (!adjustState) return;

    const parsed = Number(quantityInput);
    if (!Number.isFinite(parsed) || parsed < 0) {
      toast.error('Vui long nhap so luong hop le');
      return;
    }

    const amount = Math.floor(parsed);
    const current = adjustState.product.stock;
    const nextStock =
      adjustState.mode === 'in' ? current + amount : adjustState.mode === 'out' ? current - amount : amount;

    if (nextStock < 0) {
      toast.error('So luong xuat vuot qua ton kho hien tai');
      return;
    }

    const nextProduct: Product = {
      ...adjustState.product,
      stock: nextStock,
      status:
        nextStock <= 0
          ? 'out_of_stock'
          : nextStock <= adjustState.product.minStock
            ? 'inactive'
            : 'active',
    };

    await updateProduct(nextProduct);
    setAdjustState(null);
    toast.success('Cap nhat ton kho thanh cong');
  };

  const restockSelected = (rows: InventoryRow[]) => {
    if (isReadOnly) {
      toast.error('Vai tro Sales chi co quyen xem ton kho');
      return;
    }

    if (rows.length === 0) {
      toast.error('Chua co san pham duoc chon');
      return;
    }

    rows.forEach((row) => {
      const nextStock = row.stock + 5;
      void updateProduct({
        ...row.source,
        stock: nextStock,
        status: nextStock <= row.minStock ? 'inactive' : 'active',
      });
    });

    toast.success(`Da nhap them cho ${rows.length} san pham (+5/sp)`);
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

    toast.success('Da xuat file Excel kho hang');
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
        id: 'actions',
        header: 'Thao tac',
        enableSorting: false,
        cell: ({ row }) => {
          const item = row.original;
          return (
            <div className="flex items-center gap-2" onClick={(event) => event.stopPropagation()}>
              <Button size="sm" variant="outline" onClick={() => openAdjustDialog(item.source, 'in')}>
                <PackagePlus size={14} />
                Nhap
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => openAdjustDialog(item.source, 'out')}
                disabled={item.stock <= 0}
              >
                <PackageMinus size={14} />
                Xuat
              </Button>
              <Button size="sm" variant="ghost" onClick={() => openAdjustDialog(item.source, 'set')}>
                Dat muc
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
        <Button variant="outline" className="h-9 gap-2" onClick={handleExportExcel}>
          <Download size={16} />
          Xuất Excel
        </Button>
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
        enableSelection
        onRowClick={(row) => openAdjustDialog(row.source, 'set')}
        pageSize={8}
        emptyState={{
          icon: Boxes,
          title: 'Khong co san pham phu hop',
          description: 'Thu thay doi bo loc hoac tu khoa tim kiem de xem du lieu kho.',
        }}
        bulkActions={(rows) => {
          return (
            <>
              <Button size="sm" variant="outline" onClick={() => restockSelected(rows)}>
                <PackagePlus size={14} />
                Nhap nhanh +5
              </Button>
            </>
          );
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

      <Dialog open={!!adjustState} onOpenChange={(open) => !open && setAdjustState(null)}>
        <DialogContent className="max-w-[420px]">
          {adjustState ? (
            <>
              <DialogHeader>
                <DialogTitle>
                  {adjustState.mode === 'in'
                    ? 'Nhap kho'
                    : adjustState.mode === 'out'
                      ? 'Xuat kho'
                      : 'Cap nhat ton kho'}
                </DialogTitle>
                <DialogDescription>
                  {adjustState.product.name} ({adjustState.product.code}) - Ton hien tai: {adjustState.product.stock}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3">
                <div className="rounded-[10px] border border-[var(--color-border)] bg-[var(--color-bg)] p-3 text-sm">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-[var(--color-text-secondary)]">Ton kho</span>
                    <span
                      className="inline-flex items-center rounded-full px-[10px] py-[2px] text-xs font-medium"
                      style={{
                        backgroundColor:
                          adjustState.product.stock <= 0
                            ? 'var(--color-error-bg)'
                            : adjustState.product.stock <= adjustState.product.minStock
                              ? 'var(--color-warning-bg)'
                              : 'var(--color-success-bg)',
                        color:
                          adjustState.product.stock <= 0
                            ? 'var(--color-error)'
                            : adjustState.product.stock <= adjustState.product.minStock
                              ? 'var(--color-warning)'
                              : 'var(--color-success)',
                      }}
                    >
                      {adjustState.product.stock <= 0
                        ? 'Het hang'
                        : adjustState.product.stock <= adjustState.product.minStock
                          ? 'Sap het'
                          : 'Con hang'}
                    </span>
                  </div>
                  <p className="text-[var(--color-text-primary)]">
                    Muc canh bao: <span className="font-medium">{adjustState.product.minStock}</span>
                  </p>
                </div>

                <div>
                  <label htmlFor="inventory-quantity" className="mb-1 block text-sm text-[var(--color-text-secondary)]">
                    {adjustState.mode === 'set' ? 'Ton kho moi' : 'So luong'}
                  </label>
                  <Input
                    id="inventory-quantity"
                    type="number"
                    min={0}
                    value={quantityInput}
                    onChange={(event) => setQuantityInput(event.target.value)}
                    className="h-10"
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setAdjustState(null)}>
                  Huy
                </Button>
                <Button onClick={applyAdjust}>Xac nhan</Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
