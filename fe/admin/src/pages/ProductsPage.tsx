import { useEffect, useMemo, useState } from 'react';
import type { ChangeEvent } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import {
  ArrowDownUp,
  ChevronDown,
  Package,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  Upload,
} from 'lucide-react';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { DataTable } from '@/components/shared/DataTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn, formatVND } from '@/lib/utils';
import { toast } from '@/lib/toast';
import { useAuthStore } from '@/store/authStore';
import { useProductStore } from '@/store/productStore';
import type { Product } from '@/types';

type SortMode = 'newest' | 'price-desc' | 'price-asc' | 'stock-low';
type ProductStatusFilter = 'all' | 'active' | 'out_of_stock' | 'inactive';

interface ProductFormState {
  id?: string;
  name: string;
  code: string;
  category: string;
  price: string;
  costPrice: string;
  stock: string;
  description: string;
  minStock: string;
  imageUrl?: string;
  selectedSizes: string[];
  selectedColors: string[];
}

const SIZE_OPTIONS = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '2XL'];
const COLOR_OPTIONS = [
  { name: 'black', hex: '#111827' },
  { name: 'white', hex: '#FFFFFF' },
  { name: 'navy', hex: '#1E3A8A' },
  { name: 'beige', hex: '#D6BC9A' },
  { name: 'grey', hex: '#9CA3AF' },
  { name: 'red', hex: '#DC2626' },
  { name: 'green', hex: '#16A34A' },
  { name: 'blue', hex: '#2563EB' },
];

const CATEGORY_LABELS: Record<string, string> = {
  'Ao so mi': 'Áo sơ mi',
  'Ao khoac': 'Áo khoác',
  'Quan kaki': 'Quần kaki',
  Vay: 'Váy',
  'Ao thun': 'Áo thun',
  'Quan jeans': 'Quần jeans',
  Dam: 'Đầm',
  Vest: 'Vest',
  'Chan vay': 'Chân váy',
  Blazer: 'Blazer',
  'Ao len': 'Áo len',
};

const STATUS_FILTER_LABELS: Record<ProductStatusFilter, string> = {
  all: 'Tất cả trạng thái',
  active: 'Đang bán',
  out_of_stock: 'Hết hàng',
  inactive: 'Ngừng bán',
};

const SORT_LABELS: Record<SortMode, string> = {
  newest: 'Mới nhất',
  'price-desc': 'Giá cao → thấp',
  'price-asc': 'Giá thấp → cao',
  'stock-low': 'Tồn kho thấp',
};

function getCategoryLabel(category: string): string {
  return CATEGORY_LABELS[category] ?? category;
}

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

function stockBarColor(stock: number): string {
  if (stock <= 0) return '#DC2626';
  if (stock <= 10) return '#D97706';
  return '#2D6BE4';
}

function productStatusFromStock(stock: number): Product['status'] {
  if (stock <= 0) return 'out_of_stock';
  return 'active';
}

function createEmptyForm(defaultCategory: string): ProductFormState {
  return {
    name: '',
    code: '',
    category: defaultCategory,
    price: '',
    costPrice: '',
    stock: '0',
    description: '',
    minStock: '5',
    selectedSizes: [],
    selectedColors: [],
  };
}

function generateCode(): string {
  return `SP${Math.floor(100 + Math.random() * 900)}`;
}

export function ProductsPage() {
  const { products, addProduct, updateProduct, removeProducts } = useProductStore();
  const user = useAuthStore((state) => state.user);
  const isReadOnly = user?.role === 'sales';
  const [isBootLoading, setIsBootLoading] = useState(true);

  useEffect(() => {
    document.title = 'San pham | Routine';
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => setIsBootLoading(false), 500);
    return () => window.clearTimeout(timer);
  }, []);

  const categories = useMemo(() => {
    const values = Array.from(new Set(products.map((item) => item.category))).sort((a, b) =>
      a.localeCompare(b, 'vi'),
    );
    return values;
  }, [products]);

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<ProductStatusFilter>('all');
  const [sortBy, setSortBy] = useState<SortMode>('newest');

  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const [formOpen, setFormOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [variantOpen, setVariantOpen] = useState(false);
  const [formState, setFormState] = useState<ProductFormState>(() =>
    createEmptyForm(categories[0] ?? 'Ao so mi'),
  );

  const [detailProduct, setDetailProduct] = useState<Product | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);

  const filteredProducts = useMemo(() => {
    const q = normalize(searchTerm.trim());

    const filtered = products.filter((product) => {
      const bySearch =
        q.length === 0 ||
        normalize(product.name).includes(q) ||
        normalize(product.code).includes(q);
      const byCategory = categoryFilter === 'all' || product.category === categoryFilter;
      const byStatus = statusFilter === 'all' || product.status === statusFilter;
      return bySearch && byCategory && byStatus;
    });

    const sorted = [...filtered];
    sorted.sort((a, b) => {
      if (sortBy === 'newest') {
        return b.createdAt.getTime() - a.createdAt.getTime();
      }
      if (sortBy === 'price-desc') {
        return b.price - a.price;
      }
      if (sortBy === 'price-asc') {
        return a.price - b.price;
      }
      return a.stock - b.stock;
    });

    return sorted;
  }, [categoryFilter, products, searchTerm, sortBy, statusFilter]);

  const hasActiveFilters =
    searchTerm.trim().length > 0 ||
    categoryFilter !== 'all' ||
    statusFilter !== 'all' ||
    sortBy !== 'newest';

  const allFilteredIds = filteredProducts.map((item) => item.id);
  const allSelected = allFilteredIds.length > 0 && allFilteredIds.every((id) => selectedIds.includes(id));

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds((prev) => prev.filter((id) => !allFilteredIds.includes(id)));
      return;
    }

    setSelectedIds((prev) => Array.from(new Set([...prev, ...allFilteredIds])));
  };

  const toggleSelectRow = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const selectedProducts = useMemo(
    () => products.filter((product) => selectedIds.includes(product.id)),
    [products, selectedIds],
  );

  const resetFilters = () => {
    setSearchTerm('');
    setCategoryFilter('all');
    setStatusFilter('all');
    setSortBy('newest');
  };

  const openCreateModal = () => {
    if (isReadOnly) {
      toast.error('Vai tro Sales chi co quyen xem san pham');
      return;
    }

    setFormState(createEmptyForm(categories[0] ?? 'Ao so mi'));
    setVariantOpen(false);
    setFormOpen(true);
  };

  const openEditModal = (product: Product) => {
    if (isReadOnly) {
      toast.error('Vai tro Sales chi co quyen xem san pham');
      return;
    }

    setFormState({
      id: product.id,
      name: product.name,
      code: product.code,
      category: product.category,
      price: String(product.price),
      costPrice: String(product.costPrice ?? 0),
      stock: String(product.stock),
      description: '',
      minStock: String(product.minStock),
      imageUrl: product.imageUrl,
      selectedSizes: product.variants?.map((variant) => variant.size) ?? [],
      selectedColors: product.variants?.map((variant) => variant.color.toLowerCase()) ?? [],
    });
    setVariantOpen(false);
    setFormOpen(true);
  };

  const onFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setFormState((prev) => ({ ...prev, imageUrl: String(reader.result ?? '') }));
    };
    reader.readAsDataURL(file);
  };

  const saveForm = async () => {
    if (isReadOnly) {
      toast.error('Vai tro Sales chi co quyen xem san pham');
      return;
    }

    if (!formState.name.trim() || !formState.code.trim() || !formState.category || !formState.price.trim()) {
      toast.error('Vui lòng nhập đủ trường bắt buộc');
      return;
    }

    const parsedPrice = Number(formState.price);
    const parsedCost = Number(formState.costPrice || 0);
    const parsedStock = Number(formState.stock || 0);
    const parsedMinStock = Number(formState.minStock || 0);

    if (Number.isNaN(parsedPrice) || Number.isNaN(parsedStock)) {
      toast.error('Giá bán và số lượng phải là số hợp lệ');
      return;
    }

    setFormLoading(true);
    await new Promise((resolve) => window.setTimeout(resolve, 700));

    const variants = formState.selectedSizes.flatMap((size, index) => {
      const color = formState.selectedColors[index % Math.max(1, formState.selectedColors.length)] ?? 'black';
      return {
        id: `v-${formState.code}-${index + 1}`,
        size,
        color,
        stock: parsedStock,
      };
    });

    const baseProduct: Product = {
      id: formState.id ?? `p-${Date.now()}`,
      code: formState.code.trim().toUpperCase(),
      name: formState.name.trim(),
      category: formState.category,
      price: parsedPrice,
      costPrice: parsedCost,
      stock: parsedStock,
      minStock: parsedMinStock,
      status: productStatusFromStock(parsedStock),
      imageUrl: formState.imageUrl,
      variants,
      createdAt: formState.id
        ? products.find((item) => item.id === formState.id)?.createdAt ?? new Date()
        : new Date(),
    };

    if (formState.id) {
      updateProduct(baseProduct);
      toast.success('Cập nhật sản phẩm thành công');
    } else {
      addProduct(baseProduct);
      toast.success('Thêm sản phẩm thành công');
    }

    setFormLoading(false);
    setFormOpen(false);
  };

  const deleteSingle = () => {
    if (isReadOnly) {
      toast.error('Vai tro Sales chi co quyen xem san pham');
      return;
    }

    if (!deleteTarget) return;
    removeProducts([deleteTarget.id]);
    setSelectedIds((prev) => prev.filter((id) => id !== deleteTarget.id));
    toast.success('Đã xóa sản phẩm');
    setDeleteTarget(null);
  };

  const deleteBulk = () => {
    if (isReadOnly) {
      toast.error('Vai tro Sales chi co quyen xem san pham');
      return;
    }

    if (selectedIds.length === 0) return;
    removeProducts(selectedIds);
    toast.success(`Đã xóa ${selectedIds.length} sản phẩm`);
    setSelectedIds([]);
  };

  const changeBulkCategory = () => {
    if (isReadOnly) {
      toast.error('Vai tro Sales chi co quyen xem san pham');
      return;
    }

    if (selectedProducts.length === 0) return;
    const target = categories.find((category) => category !== selectedProducts[0]?.category) ?? categories[0];
    if (!target) return;

    selectedProducts.forEach((product) => {
      updateProduct({ ...product, category: target });
    });

    toast.success(`Đã đổi danh mục sang ${target}`);
    setSelectedIds([]);
  };

  const columns: ColumnDef<Product>[] = [
    {
      id: 'select',
      size: 52,
      enableSorting: false,
      header: () => (
        <div className="text-center">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={toggleSelectAll}
            disabled={isReadOnly}
            aria-label="Chọn tất cả"
            className="h-4 w-4 rounded border-[var(--color-border)]"
          />
        </div>
      ),
      cell: ({ row }) => (
        <div className="text-center" onClick={(event) => event.stopPropagation()}>
          <input
            type="checkbox"
            checked={selectedIds.includes(row.original.id)}
            onChange={() => toggleSelectRow(row.original.id)}
            disabled={isReadOnly}
            aria-label="Chọn sản phẩm"
            className="h-4 w-4 rounded border-[var(--color-border)]"
          />
        </div>
      ),
    },
    {
      id: 'image',
      accessorKey: 'imageUrl',
      header: '',
      size: 64,
      enableSorting: false,
      cell: ({ row }) => {
        const product = row.original;

        return product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="h-10 w-10 rounded-[8px] object-cover"
          />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#EEF3FD] text-sm font-semibold text-[var(--color-accent)]">
            {product.name.charAt(0).toUpperCase()}
          </div>
        );
      },
    },
    {
      accessorKey: 'code',
      header: 'MÃ SP',
      size: 100,
      cell: ({ row }) => (
        <span className="font-[var(--font-mono)] text-[13px] text-[var(--color-text-secondary)]">
          {row.original.code}
        </span>
      ),
    },
    {
      accessorKey: 'name',
      header: 'TÊN SẢN PHẨM',
      cell: ({ row }) => (
        <button
          type="button"
          className="truncate text-left text-[14px] font-medium text-[var(--color-text-primary)] hover:underline"
          onClick={(event) => {
            event.stopPropagation();
            setDetailProduct(row.original);
          }}
        >
          {row.original.name}
        </button>
      ),
    },
    {
      accessorKey: 'category',
      header: 'DANH MỤC',
      size: 130,
      cell: ({ row }) => (
        <span className="inline-flex rounded-full bg-[#F0EDFF] px-2.5 py-1 text-xs font-medium text-[#6D4BD8]">
          {row.original.category}
        </span>
      ),
    },
    {
      accessorKey: 'price',
      header: 'GIÁ BÁN',
      size: 130,
      cell: ({ row }) => (
        <div className="text-right font-[var(--font-mono)] text-[14px] font-semibold text-[var(--color-text-primary)]">
          {formatVND(row.original.price)}
        </div>
      ),
    },
    {
      id: 'stock',
      header: 'TỒN KHO',
      size: 120,
      accessorFn: (row) => row.stock,
      cell: ({ row }) => {
        const stock = row.original.stock;
        const progress = Math.min(100, (stock / Math.max(1, row.original.minStock * 3)) * 100);

        return (
          <div>
            <p className="mb-1 text-sm font-semibold text-[var(--color-text-primary)]">{stock}</p>
            <div className="h-1 w-[60px] rounded-[2px] bg-[#F0EEE9]">
              <div
                className="h-1 rounded-[2px]"
                style={{ width: `${progress}%`, backgroundColor: stockBarColor(stock) }}
              />
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'status',
      header: 'TRẠNG THÁI',
      size: 130,
      cell: ({ row }) => <StatusBadge status={row.original.status} variant="product" />,
    },
    {
      id: 'actions',
      size: 80,
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              openEditModal(row.original);
            }}
            className="rounded-[6px] p-1.5 text-[var(--color-text-secondary)] hover:bg-[var(--color-bg)] hover:text-[var(--color-text-primary)]"
            aria-label="Sửa"
            disabled={isReadOnly}
          >
            <Pencil size={16} />
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setDeleteTarget(row.original);
            }}
            className="rounded-[6px] p-1.5 text-[var(--color-text-secondary)] hover:bg-[var(--color-error-bg)] hover:text-[var(--color-error)]"
            aria-label="Xóa"
            disabled={isReadOnly}
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  if (isBootLoading) {
    return (
      <div className="space-y-4">
        <div className="h-16 animate-pulse rounded-[12px] bg-[#ECEAE7]" />
        <div className="h-12 animate-pulse rounded-[12px] bg-[#ECEAE7]" />
        <div className="h-96 animate-pulse rounded-[12px] bg-[#ECEAE7]" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <section className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h1 className="font-[var(--font-display)] text-[24px] font-semibold text-[var(--color-text-primary)]">
            Sản phẩm
          </h1>
          <span className="rounded-full border border-[var(--color-border)] bg-[#F7F6F4] px-2.5 py-1 text-[13px] text-[var(--color-text-secondary)]">
            243 sản phẩm
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="h-9 gap-2"
            disabled={isReadOnly}
            onClick={() => {
              if (isReadOnly) {
                toast.error('Vai tro Sales chi co quyen xem san pham');
              }
            }}
          >
            <Upload size={16} />
            Nhập Excel
          </Button>
          <Button className="h-9 gap-2" onClick={openCreateModal} disabled={isReadOnly}>
            <Plus size={16} />
            Thêm sản phẩm
          </Button>
        </div>
      </section>

      {isReadOnly ? (
        <p className="rounded-[8px] border border-[var(--color-warning)]/30 bg-[var(--color-warning-bg)] px-3 py-2 text-sm text-[var(--color-warning)]">
          Vai tro Sales dang o che do chi xem tren trang san pham.
        </p>
      ) : null}

      <section className="mb-5 flex flex-wrap items-center gap-3">
        <Input
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Tìm theo tên, mã sản phẩm..."
          className="h-9 w-[280px]"
        />

        <Select value={categoryFilter} onValueChange={(value) => setCategoryFilter(value ?? 'all')}>
          <SelectTrigger className="h-9 min-w-44">
            <SelectValue placeholder="Tất cả danh mục">
              {categoryFilter === 'all' ? 'Tất cả danh mục' : getCategoryLabel(categoryFilter)}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả danh mục</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category} value={category}>
                {getCategoryLabel(category)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as ProductStatusFilter)}>
          <SelectTrigger className="h-9 min-w-40">
            <SelectValue placeholder="Tất cả trạng thái">{STATUS_FILTER_LABELS[statusFilter]}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả trạng thái</SelectItem>
            <SelectItem value="active">Đang bán</SelectItem>
            <SelectItem value="out_of_stock">Hết hàng</SelectItem>
            <SelectItem value="inactive">Ngừng bán</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortMode)}>
          <SelectTrigger className="h-9 min-w-44">
            <ArrowDownUp size={14} />
            <SelectValue placeholder="Mới nhất">{SORT_LABELS[sortBy]}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Mới nhất</SelectItem>
            <SelectItem value="price-desc">Giá cao → thấp</SelectItem>
            <SelectItem value="price-asc">Giá thấp → cao</SelectItem>
            <SelectItem value="stock-low">Tồn kho thấp</SelectItem>
          </SelectContent>
        </Select>

        {hasActiveFilters ? (
          <button
            type="button"
            onClick={resetFilters}
            className="text-sm font-medium text-[var(--color-accent)] hover:underline"
          >
            Xóa bộ lọc
          </button>
        ) : null}
      </section>

      <DataTable
        data={filteredProducts}
        columns={columns}
        pageSize={10}
        emptyState={{
          icon: Package,
          title: 'Không có sản phẩm phù hợp',
          description: 'Hãy điều chỉnh bộ lọc hoặc thêm sản phẩm mới.',
        }}
      />

      {selectedIds.length > 0 && !isReadOnly ? (
        <div className="fixed bottom-24 left-1/2 z-30 flex -translate-x-1/2 animate-[slideUp_0.2s_ease] items-center gap-3 rounded-[10px] bg-[#1A1A18] px-5 py-3 text-white shadow-lg">
          <span className="text-sm">{selectedIds.length} sản phẩm đã chọn</span>
          <button
            type="button"
            onClick={deleteBulk}
            className="rounded-[6px] px-2 py-1 text-sm text-[#FCA5A5] hover:bg-white/10"
          >
            Xóa
          </button>
          <button
            type="button"
            onClick={changeBulkCategory}
            className="rounded-[6px] px-2 py-1 text-sm text-white hover:bg-white/10"
          >
            Đổi danh mục
          </button>
          <button
            type="button"
            onClick={() => setSelectedIds([])}
            className="rounded-[6px] px-2 py-1 text-sm text-white hover:bg-white/10"
          >
            ×
          </button>
        </div>
      ) : null}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-[680px] p-0" showCloseButton={!formLoading}>
          <DialogHeader className="border-b border-[var(--color-border)] p-5">
            <DialogTitle className="text-[20px] font-semibold text-[var(--color-text-primary)]">
              {formState.id ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}
            </DialogTitle>
            <DialogDescription className="text-sm text-[var(--color-text-secondary)]">
              Nhập thông tin sản phẩm theo biểu mẫu bên dưới.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-5 p-5 md:grid-cols-[220px,1fr]">
            <div>
              <label className="block h-[220px] cursor-pointer rounded-[12px] border border-dashed border-[var(--color-border-strong)] bg-[var(--color-bg)] p-3">
                {formState.imageUrl ? (
                  <img
                    src={formState.imageUrl}
                    alt="preview"
                    className="h-full w-full rounded-[10px] object-cover"
                  />
                ) : (
                  <div className="flex h-full flex-col items-center justify-center text-center">
                    <Upload size={32} className="mb-2 text-[var(--color-text-muted)]" />
                    <p className="text-[13px] font-medium text-[var(--color-text-secondary)]">Thêm ảnh sản phẩm</p>
                    <p className="text-[11px] text-[var(--color-text-muted)]">PNG, JPG tối đa 5MB</p>
                  </div>
                )}
                <input type="file" accept="image/png,image/jpeg" className="hidden" onChange={onFileChange} />
              </label>
              {formState.imageUrl ? (
                <button
                  type="button"
                  className="mt-2 text-sm text-[var(--color-error)] hover:underline"
                  onClick={() => setFormState((prev) => ({ ...prev, imageUrl: undefined }))}
                >
                  Xóa ảnh
                </button>
              ) : null}
            </div>

            <div className="space-y-3">
              <div>
                <Label>Tên sản phẩm*</Label>
                <Input
                  value={formState.name}
                  onChange={(event) => setFormState((prev) => ({ ...prev, name: event.target.value }))}
                  className="mt-1 h-9"
                />
              </div>

              <div>
                <Label>Mã sản phẩm*</Label>
                <div className="mt-1 flex gap-2">
                  <Input
                    value={formState.code}
                    onChange={(event) => setFormState((prev) => ({ ...prev, code: event.target.value }))}
                    className="h-9"
                  />
                  <Button
                    variant="outline"
                    className="h-9 gap-1"
                    onClick={() => setFormState((prev) => ({ ...prev, code: generateCode() }))}
                  >
                    <RefreshCw size={14} />
                  </Button>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label>Danh mục*</Label>
                  <Select
                    value={formState.category}
                    onValueChange={(value) =>
                      setFormState((prev) => ({ ...prev, category: value ?? prev.category }))
                    }
                  >
                    <SelectTrigger className="mt-1 h-9 w-full">
                      <SelectValue>{getCategoryLabel(formState.category)}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {getCategoryLabel(category)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Giá bán* (₫)</Label>
                  <div className="relative mt-1">
                    <Input
                      type="number"
                      value={formState.price}
                      onChange={(event) => setFormState((prev) => ({ ...prev, price: event.target.value }))}
                      className="h-9 pr-8"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--color-text-muted)]">₫</span>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label>Giá nhập (₫) (tuỳ chọn)</Label>
                  <div className="relative mt-1">
                    <Input
                      type="number"
                      value={formState.costPrice}
                      onChange={(event) => setFormState((prev) => ({ ...prev, costPrice: event.target.value }))}
                      className="h-9 pr-8"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--color-text-muted)]">₫</span>
                  </div>
                </div>

                <div>
                  <Label>Số lượng*</Label>
                  <Input
                    type="number"
                    value={formState.stock}
                    onChange={(event) => setFormState((prev) => ({ ...prev, stock: event.target.value }))}
                    className="mt-1 h-9"
                  />
                </div>
              </div>

              <div>
                <Label>Mô tả</Label>
                <textarea
                  rows={3}
                  value={formState.description}
                  onChange={(event) =>
                    setFormState((prev) => ({ ...prev, description: event.target.value }))
                  }
                  className="mt-1 w-full rounded-[8px] border border-[var(--color-border)] px-3 py-2 text-sm outline-none focus:border-[var(--color-accent)]"
                />
              </div>

              <div>
                <Label>Ngưỡng cảnh báo kho</Label>
                <Input
                  type="number"
                  value={formState.minStock}
                  onChange={(event) => setFormState((prev) => ({ ...prev, minStock: event.target.value }))}
                  className="mt-1 h-9"
                />
                <p className="mt-1 text-xs text-[var(--color-text-muted)]">Cảnh báo khi tồn dưới mức này</p>
              </div>
            </div>
          </div>

          <div className="mx-5 mb-5 rounded-[10px] border border-[var(--color-border)]">
            <button
              type="button"
              onClick={() => setVariantOpen((prev) => !prev)}
              className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium"
            >
              <span>Biến thể sản phẩm (Size / Màu)</span>
              <ChevronDown size={16} className={cn('transition-transform', variantOpen && 'rotate-180')} />
            </button>

            {variantOpen ? (
              <div className="space-y-4 border-t border-[var(--color-border)] p-4">
                <div>
                  <p className="mb-2 text-xs font-medium uppercase tracking-[0.08em] text-[var(--color-text-muted)]">Size</p>
                  <div className="flex flex-wrap gap-2">
                    {SIZE_OPTIONS.map((size) => {
                      const active = formState.selectedSizes.includes(size);
                      return (
                        <button
                          key={size}
                          type="button"
                          onClick={() =>
                            setFormState((prev) => ({
                              ...prev,
                              selectedSizes: active
                                ? prev.selectedSizes.filter((item) => item !== size)
                                : [...prev.selectedSizes, size],
                            }))
                          }
                          className={cn(
                            'rounded-full border px-3 py-1 text-xs',
                            active
                              ? 'border-[var(--color-accent)] bg-[var(--color-accent-light)] text-[var(--color-accent)]'
                              : 'border-[var(--color-border)] text-[var(--color-text-secondary)]',
                          )}
                        >
                          {size}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-xs font-medium uppercase tracking-[0.08em] text-[var(--color-text-muted)]">Màu</p>
                  <div className="flex flex-wrap gap-2">
                    {COLOR_OPTIONS.map((color) => {
                      const active = formState.selectedColors.includes(color.name);
                      return (
                        <button
                          key={color.name}
                          type="button"
                          onClick={() =>
                            setFormState((prev) => ({
                              ...prev,
                              selectedColors: active
                                ? prev.selectedColors.filter((item) => item !== color.name)
                                : [...prev.selectedColors, color.name],
                            }))
                          }
                          className={cn(
                            'h-6 w-6 rounded-full border-2',
                            active ? 'border-[var(--color-accent)]' : 'border-white ring-1 ring-[var(--color-border)]',
                          )}
                          style={{ backgroundColor: color.hex }}
                          aria-label={color.name}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-[var(--color-border)] bg-[var(--color-bg)] p-4">
            <Button variant="outline" onClick={() => setFormOpen(false)} disabled={formLoading}>
              Hủy
            </Button>
            <Button onClick={saveForm} disabled={formLoading}>
              {formLoading ? 'Đang lưu...' : 'Lưu sản phẩm'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!detailProduct} onOpenChange={(open) => !open && setDetailProduct(null)}>
        <DialogContent className="max-w-[460px]" showCloseButton>
          {detailProduct ? (
            <>
              <DialogHeader>
                <DialogTitle>{detailProduct.name}</DialogTitle>
                <DialogDescription>{detailProduct.code}</DialogDescription>
              </DialogHeader>

              {detailProduct.imageUrl ? (
                <img
                  src={detailProduct.imageUrl}
                  alt={detailProduct.name}
                  className="h-48 w-full rounded-[10px] border border-[var(--color-border)] object-cover"
                />
              ) : (
                <div className="flex h-48 w-full items-center justify-center rounded-[10px] border border-[var(--color-border)] bg-[var(--color-bg)]">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#EEF3FD] text-2xl font-semibold text-[var(--color-accent)]">
                    {detailProduct.name.charAt(0).toUpperCase()}
                  </div>
                </div>
              )}

              <div className="space-y-2 text-sm">
                <p>
                  Danh mục: <span className="font-medium">{detailProduct.category}</span>
                </p>
                <p>
                  Giá bán: <span className="font-medium">{formatVND(detailProduct.price)}</span>
                </p>
                <p>
                  Tồn kho: <span className="font-medium">{detailProduct.stock}</span>
                </p>
                <p>
                  Trạng thái: <StatusBadge status={detailProduct.status} variant="product" />
                </p>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Xóa sản phẩm"
        description={`Bạn có chắc muốn xóa ${deleteTarget?.name ?? 'sản phẩm này'}? Hành động này không thể hoàn tác.`}
        confirmLabel="Xóa sản phẩm"
        variant="danger"
        onConfirm={deleteSingle}
      />

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translate(-50%, 12px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
      `}</style>
    </div>
  );
}
