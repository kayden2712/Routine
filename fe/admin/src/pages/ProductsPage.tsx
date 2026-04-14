import { useEffect, useMemo, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import {
  ArrowDownUp,
  ChevronDown,
  Download,
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
import { exportRowsToExcel } from '@/lib/excel';
import { useAuthStore } from '@/store/authStore';
import { useProductStore } from '@/store/productStore';
import type { Product } from '@/types';

type SortMode = 'newest' | 'price-desc' | 'price-asc' | 'stock-low';
type ProductStatusFilter = 'all' | 'active' | 'out_of_stock' | 'inactive';
const PRODUCT_SAVE_TIMEOUT_MS = 5000;
const MAX_IMAGE_DATA_URL_LENGTH = 350_000;

async function fileToOptimizedDataUrl(file: File): Promise<string> {
  const toDataUrl = (input: File | Blob) =>
    new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result ?? ''));
      reader.readAsDataURL(input);
    });

  if (!file.type.startsWith('image/')) {
    return toDataUrl(file);
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Không thể đọc ảnh đã chọn.'));
      img.src = objectUrl;
    });

    const maxDimension = 1280;
    const ratio = Math.min(maxDimension / image.width, maxDimension / image.height, 1);
    const width = Math.max(1, Math.round(image.width * ratio));
    const height = Math.max(1, Math.round(image.height * ratio));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext('2d');
    if (!context) {
      return toDataUrl(file);
    }

    context.drawImage(image, 0, 0, width, height);
    const optimized = canvas.toDataURL('image/jpeg', 0.82);
    return optimized;
  } catch {
    return toDataUrl(file);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

interface ProductFormState {
  id?: string;
  name: string;
  code: string;
  category: string;
  gender: 'male' | 'female';
  price: string;
  salePercent: string;
  costPrice: string;
  stock: string;
  description: string;
  minStock: string;
  imageUrls: string[];
  variants: Array<{
    size: string;
    color: string;
    stock: string;
  }>;
}

const SIZE_OPTIONS = ['M', 'S', 'XL', 'XXL', 'L'] as const;
const COLOR_OPTIONS = [
  { value: 'black', label: 'Đen' },
  { value: 'white', label: 'Trắng' },
  { value: 'red', label: 'Đỏ' },
  { value: 'blue', label: 'Xanh dương' },
  { value: 'green', label: 'Xanh lá' },
  { value: 'gray', label: 'Xám' },
  { value: 'beige', label: 'Be' },
  { value: 'brown', label: 'Nâu' },
] as const;

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

function createEmptyVariantForm() {
  return {
    size: SIZE_OPTIONS[0],
    color: COLOR_OPTIONS[0].value,
    stock: '0',
  };
}

function createEmptyForm(defaultCategory: string): ProductFormState {
  return {
    name: '',
    code: '',
    category: defaultCategory,
    gender: 'male',
    price: '',
    salePercent: '0',
    costPrice: '',
    stock: '0',
    description: '',
    minStock: '5',
    imageUrls: [],
    variants: [createEmptyVariantForm()],
  };
}

function generateCode(existingCodes: Set<string>): string {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const suffix = `${Date.now().toString().slice(-5)}${Math.floor(Math.random() * 10)}`;
    const candidate = `SP${suffix}`;
    if (!existingCodes.has(candidate)) {
      return candidate;
    }
  }

  return `SP${Date.now()}${Math.floor(Math.random() * 100)}`;
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, timeoutMessage: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = window.setTimeout(() => {
      reject(new Error(timeoutMessage));
    }, timeoutMs);

    promise
      .then((value) => {
        window.clearTimeout(timer);
        resolve(value);
      })
      .catch((error: unknown) => {
        window.clearTimeout(timer);
        reject(error);
      });
  });
}

export function ProductsPage() {
  const { products, addProduct, updateProduct, removeProducts, fetchProducts } = useProductStore();
  const user = useAuthStore((state) => state.user);
  const isReadOnly = user?.role === 'sales';
  const canDeleteProduct = user?.role === 'manager';
  const [isBootLoading, setIsBootLoading] = useState(true);

  useEffect(() => {
    document.title = 'San pham | Routine';
    void fetchProducts();
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
  const [statusFilter, setStatusFilter] = useState<ProductStatusFilter>('active');
  const [sortBy, setSortBy] = useState<SortMode>('newest');

  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const [formOpen, setFormOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [variantOpen, setVariantOpen] = useState(false);
  const [formState, setFormState] = useState<ProductFormState>(() =>
    createEmptyForm(categories[0] ?? 'Ao so mi'),
  );
  const imageInputRef = useRef<HTMLInputElement | null>(null);

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
    statusFilter !== 'active' ||
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
    setStatusFilter('active');
    setSortBy('newest');
  };

  const openCreateModal = () => {
    if (isReadOnly) {
      toast.error('Vai trò Sales chỉ có quyền xem sản phẩm');
      return;
    }

    const existingCodes = new Set(products.map((item) => item.code.trim().toUpperCase()));
    const initialCode = generateCode(existingCodes);
    setFormState({
      ...createEmptyForm(categories[0] ?? 'Ao so mi'),
      code: initialCode,
    });
    setVariantOpen(false);
    setFormOpen(true);
  };

  const openEditModal = (product: Product) => {
    if (isReadOnly) {
      toast.error('Vai trò Sales chỉ có quyền xem sản phẩm');
      return;
    }

    const variants = (product.variants ?? []).length > 0
      ? (product.variants ?? []).map((variant) => ({
          size: variant.size || SIZE_OPTIONS[0],
          color: variant.color || 'black',
          stock: String(Math.max(0, Number(variant.stock ?? 0))),
        }))
      : [createEmptyVariantForm()];

    const totalStock = variants.reduce((sum, variant) => sum + Math.max(0, Number(variant.stock) || 0), 0);

    setFormState({
      id: product.id,
      name: product.name,
      code: product.code,
      category: product.category,
      gender: product.gender,
      price: String(product.oldPrice ?? product.price),
      salePercent:
        product.oldPrice && product.oldPrice > 0 && product.oldPrice > product.price
          ? String(Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100))
          : '0',
      costPrice: String(product.costPrice ?? 0),
      stock: String(totalStock),
      description: product.description ?? '',
      minStock: String(product.minStock),
      imageUrls:
        (product.imageUrls ?? []).length > 0
          ? (product.imageUrls ?? []).filter((url) => String(url ?? '').trim().length > 0)
          : product.imageUrl
            ? [product.imageUrl]
            : [],
      variants,
    });
    setVariantOpen(false);
    setFormOpen(true);
  };

  const onFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) {
      return;
    }

    const converted = await Promise.all(files.map((file) => fileToOptimizedDataUrl(file)));
    const nextImages = converted
      .map((url) => url.trim())
      .filter((url) => url.length > 0);

    const acceptedImages = nextImages.filter(
      (url) => !url.startsWith('data:') || url.length <= MAX_IMAGE_DATA_URL_LENGTH,
    );

    const droppedCount = nextImages.length - acceptedImages.length;
    if (droppedCount > 0) {
      toast.error('Một số ảnh quá lớn nên không thể lưu. Vui lòng chọn ảnh nhỏ hơn.');
    }

    setFormState((prev) => ({
      ...prev,
      imageUrls: Array.from(new Set([...prev.imageUrls, ...acceptedImages])),
    }));

    // Allow re-selecting the same file(s) by resetting input value.
    event.target.value = '';
  };

  const saveForm = async () => {
    if (isReadOnly) {
      toast.error('Vai trò Sales chỉ có quyền xem sản phẩm');
      return;
    }

    if (!formState.name.trim() || !formState.code.trim() || !formState.category || !formState.price.trim()) {
      toast.error('Vui lòng nhập đủ trường bắt buộc');
      return;
    }

    const existingCodes = new Set(
      products
        .filter((item) => item.id !== formState.id)
        .map((item) => item.code.trim().toUpperCase()),
    );

    let normalizedCode = formState.code.trim().toUpperCase();
    if (existingCodes.has(normalizedCode)) {
      if (formState.id) {
        toast.error('Mã sản phẩm đã tồn tại. Vui lòng dùng mã khác.');
        return;
      }

      normalizedCode = generateCode(existingCodes);
      setFormState((prev) => ({ ...prev, code: normalizedCode }));
    }

    const parsedBasePrice = Number(formState.price);
    const parsedSalePercent = Number(formState.salePercent || 0);
    const parsedCost = Number(formState.costPrice || 0);
    const parsedMinStock = Number(formState.minStock || 0);

    const normalizedVariants = formState.variants
      .map((variant, index) => ({
        id: `v-${formState.code}-${index + 1}`,
        size: variant.size.trim().toUpperCase(),
        color: variant.color.trim().toLowerCase(),
        stock: Math.max(0, Number(variant.stock || 0)),
      }))
      .filter((variant) => variant.size.length > 0 && variant.color.length > 0);

    const parsedStock = normalizedVariants.reduce((sum, variant) => sum + variant.stock, 0);

    if (Number.isNaN(parsedBasePrice)) {
      toast.error('Giá gốc phải là số hợp lệ');
      return;
    }

    if (Number.isNaN(parsedSalePercent) || parsedSalePercent < 0 || parsedSalePercent > 100) {
      toast.error('Sale (%) phải nằm trong khoảng 0 - 100');
      return;
    }

    const effectivePrice = Math.max(0, Math.round(parsedBasePrice * (1 - parsedSalePercent / 100)));
    const effectiveOldPrice = parsedSalePercent > 0 ? parsedBasePrice : undefined;

    if (effectivePrice <= 0) {
      toast.error('Giá hiện tại phải lớn hơn 0. Vui lòng giảm % sale.');
      return;
    }

    if (normalizedVariants.length === 0) {
      toast.error('Vui lòng nhập ít nhất 1 biến thể size/màu.');
      return;
    }

    const duplicateKeys = new Set<string>();
    for (const variant of normalizedVariants) {
      const key = `${variant.size}::${variant.color}`;
      if (duplicateKeys.has(key)) {
        toast.error(`Biến thể bị trùng: ${variant.size}/${variant.color}`);
        return;
      }
      duplicateKeys.add(key);
    }

    if (parsedStock <= 0) {
      toast.error('Vui lòng nhập số lượng cho ít nhất 1 biến thể');
      return;
    }

    setFormLoading(true);

    const variants = normalizedVariants;
    const sizes = Array.from(new Set(variants.map((variant) => variant.size)));
    const colors = Array.from(new Set(variants.map((variant) => variant.color)));
    const normalizedImageUrls = formState.imageUrls
      .map((url) => String(url ?? '').trim())
      .filter((url) => url.length > 0)
      .filter((url) => !url.startsWith('data:') || url.length <= MAX_IMAGE_DATA_URL_LENGTH);

    const baseProduct: Product = {
      id: formState.id ?? `p-${Date.now()}`,
      code: normalizedCode,
      name: formState.name.trim(),
      category: formState.category,
      gender: formState.gender,
      description: formState.description.trim(),
      price: effectivePrice,
      oldPrice: effectiveOldPrice,
      costPrice: parsedCost,
      stock: parsedStock,
      minStock: parsedMinStock,
      status: productStatusFromStock(parsedStock),
      imageUrl: normalizedImageUrls[0],
      imageUrls: normalizedImageUrls,
      sizes,
      colors,
      variants,
      createdAt: formState.id
        ? products.find((item) => item.id === formState.id)?.createdAt ?? new Date()
        : new Date(),
    };

    try {
      if (formState.id) {
        await withTimeout(
          updateProduct(baseProduct),
          PRODUCT_SAVE_TIMEOUT_MS,
          'Lưu sản phẩm quá 5 giây, vui lòng thử lại.',
        );
        toast.success('Cập nhật sản phẩm thành công');
      } else {
        await withTimeout(
          addProduct(baseProduct),
          PRODUCT_SAVE_TIMEOUT_MS,
          'Lưu sản phẩm quá 5 giây, vui lòng thử lại.',
        );
        toast.success('Thêm sản phẩm thành công');
      }

      setFormOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Lưu sản phẩm thất bại');
    } finally {
      setFormLoading(false);
    }
  };

  const deleteSingle = async () => {
    if (!canDeleteProduct) {
      toast.error('Chỉ Manager mới có quyền xóa sản phẩm');
      return;
    }

    if (!deleteTarget) return;
    try {
      await removeProducts([deleteTarget.id]);
      setSelectedIds((prev) => prev.filter((id) => id !== deleteTarget.id));
      toast.success('Đã xóa sản phẩm');
      setDeleteTarget(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Xóa sản phẩm thất bại');
    }
  };

  const deleteBulk = async () => {
    if (!canDeleteProduct) {
      toast.error('Chỉ Manager mới có quyền xóa sản phẩm');
      return;
    }

    if (selectedIds.length === 0) return;
    try {
      await removeProducts(selectedIds);
      toast.success(`Đã xóa ${selectedIds.length} sản phẩm`);
      setSelectedIds([]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Xóa sản phẩm thất bại');
    }
  };

  const handleExportExcel = () => {
    exportRowsToExcel({
      fileName: 'san-pham',
      sheetName: 'SanPham',
      headers: ['Ma SP', 'Ten san pham', 'Danh muc', 'Gia ban', 'Gia von', 'Ton kho', 'Trang thai'],
      rows: filteredProducts.map((item) => [
        item.code,
        item.name,
        item.category,
        item.price,
        item.costPrice,
        item.stock,
        item.status,
      ]),
    });

    toast.success('Đã xuất file Excel sản phẩm');
  };

  const changeBulkCategory = () => {
    if (isReadOnly) {
      toast.error('Vai trò Sales chỉ có quyền xem sản phẩm');
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
      header: () => <div className="text-center">ẢNH</div>,
      size: 64,
      enableSorting: false,
      cell: ({ row }) => {
        const product = row.original;

        return product.imageUrl ? (
          <div className="flex justify-center">
            <img
              src={product.imageUrl}
              alt={product.name}
              className="h-10 w-10 rounded-[8px] object-cover"
            />
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#EEF3FD] text-sm font-semibold text-[var(--color-accent)]">
              {product.name.charAt(0).toUpperCase()}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'code',
      header: () => <div className="justify-center text-center">MÃ SP</div>,
      size: 100,
      cell: ({ row }) => (
        <div className="text-center">
          <span className="font-[var(--font-mono)] text-[13px] text-[var(--color-text-secondary)]">
            {row.original.code}
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'name',
      header: () => <div className="text-center">TÊN SẢN PHẨM</div>,
      cell: ({ row }) => (
        <div className="text-center">
          <button
            type="button"
            className="max-w-[240px] truncate text-[14px] font-medium text-[var(--color-text-primary)] hover:underline"
            onClick={(event) => {
              event.stopPropagation();
              setDetailProduct(row.original);
            }}
          >
            {row.original.name}
          </button>
        </div>
      ),
    },
    {
      accessorKey: 'category',
      header: () => <div className="text-center">DANH MỤC</div>,
      size: 130,
      cell: ({ row }) => (
        <div className="text-center">
          <span className="inline-flex rounded-full bg-[#F0EDFF] px-2.5 py-1 text-xs font-medium text-[#6D4BD8]">
            {row.original.category}
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'gender',
      header: () => <div className="text-center">GIỚI TÍNH</div>,
      size: 110,
      cell: ({ row }) => (
        <div className="text-center text-[13px] font-medium text-[var(--color-text-primary)]">
          {row.original.gender === 'female' ? 'Đồ nữ' : 'Đồ nam'}
        </div>
      ),
    },
    {
      id: 'sizes',
      header: () => <div className="text-center">SIZE</div>,
      size: 160,
      cell: ({ row }) => (
        <div className="text-center text-[13px] text-[var(--color-text-secondary)]">
          {(row.original.sizes && row.original.sizes.length > 0
            ? row.original.sizes
            : row.original.variants?.map((variant) => variant.size) ?? []
          ).join(', ') || '-'}
        </div>
      ),
    },
    {
      id: 'variantStocks',
      header: () => <div className="text-center">SIZE / MÀU / TỒN</div>,
      size: 260,
      cell: ({ row }) => {
        const variants = row.original.variants ?? [];
        return (
          <div className="text-center text-[12px] text-[var(--color-text-secondary)]">
            {variants.length > 0
              ? variants.map((variant) => `${variant.size}/${variant.color}:${variant.stock}`).join(' | ')
              : '-'}
          </div>
        );
      },
    },
    {
      accessorKey: 'price',
      header: () => <div className="text-center">GIÁ BÁN</div>,
      size: 130,
      cell: ({ row }) => (
        <div className="text-center font-[var(--font-mono)] text-[14px] font-semibold text-[var(--color-text-primary)]">
          {formatVND(row.original.price)}
        </div>
      ),
    },
    {
      id: 'stock',
      header: () => <div className="text-center">TỒN KHO</div>,
      size: 120,
      accessorFn: (row) => row.stock,
      cell: ({ row }) => {
        const stock = row.original.stock;
        const progress = Math.min(100, (stock / Math.max(1, row.original.minStock * 3)) * 100);

        return (
          <div className="flex flex-col items-center">
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
      header: () => <div className="text-center">TRẠNG THÁI</div>,
      size: 130,
      cell: ({ row }) => (
        <div className="text-center">
          <StatusBadge status={row.original.status} variant="product" />
        </div>
      ),
    },
    {
      id: 'actions',
      header: () => <div className="text-center">THAO TÁC</div>,
      size: 80,
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex items-center justify-center gap-1">
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
            disabled={!canDeleteProduct}
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
            onClick={handleExportExcel}
          >
            <Download size={16} />
            Xuất Excel
          </Button>
          <Button className="h-9 gap-2" onClick={openCreateModal} disabled={isReadOnly}>
            <Plus size={16} />
            Thêm sản phẩm
          </Button>
        </div>
      </section>

      {isReadOnly ? (
        <p className="rounded-[8px] border border-[var(--color-warning)]/30 bg-[var(--color-warning-bg)] px-3 py-2 text-sm text-[var(--color-warning)]">
          Vai trò Sales đang ở chế độ chỉ xem trên trang sản phẩm.
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

      {selectedIds.length > 0 && canDeleteProduct ? (
        <div className="fixed bottom-24 left-1/2 z-30 flex -translate-x-1/2 animate-[slideUp_0.2s_ease] items-center gap-3 rounded-[10px] bg-[#1A1A18] px-5 py-3 text-white shadow-lg">
          <span className="text-sm">{selectedIds.length} sản phẩm đã chọn</span>
          <button
            type="button"
            onClick={() => void deleteBulk()}
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
        <DialogContent className="w-[min(96vw,1100px)] sm:max-w-[1100px] max-h-[92vh] overflow-y-auto p-0" showCloseButton={!formLoading}>
          <DialogHeader className="border-b border-[var(--color-border)] p-5">
            <DialogTitle className="text-[20px] font-semibold text-[var(--color-text-primary)]">
              {formState.id ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}
            </DialogTitle>
            <DialogDescription className="text-sm text-[var(--color-text-secondary)]">
              Nhập thông tin sản phẩm theo biểu mẫu bên dưới.
            </DialogDescription>
          </DialogHeader>

          <div className="grid items-start gap-5 p-5 sm:grid-cols-[220px,minmax(0,1fr)]">
            <div className="sm:w-[220px]">
              <label className="block h-[220px] cursor-pointer rounded-[12px] border border-dashed border-[var(--color-border-strong)] bg-[var(--color-bg)] p-3">
                {formState.imageUrls[0] ? (
                  <img
                    src={formState.imageUrls[0]}
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
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/png,image/jpeg"
                  multiple
                  className="hidden"
                  onChange={onFileChange}
                />
              </label>

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2 h-8 w-full gap-1"
                onClick={() => imageInputRef.current?.click()}
              >
                <Plus size={14} />
                Thêm ảnh
              </Button>

              <p className="mt-2 text-xs text-[var(--color-text-muted)]">Ảnh đầu tiên là ảnh đại diện sản phẩm.</p>

              {formState.imageUrls.length > 0 ? (
                <div className="mt-3 grid grid-cols-4 gap-2">
                  {formState.imageUrls.map((imageUrl, index) => (
                    <div key={`${imageUrl}-${index}`} className="relative overflow-hidden rounded-[8px] border border-[var(--color-border)]">
                      <img src={imageUrl} alt={`Ảnh ${index + 1}`} className="h-12 w-full object-cover" />
                      <button
                        type="button"
                        className="absolute right-1 top-1 rounded-[4px] bg-black/55 px-1 text-[10px] text-white hover:bg-black/70"
                        onClick={() =>
                          setFormState((prev) => ({
                            ...prev,
                            imageUrls: prev.imageUrls.filter((_, i) => i !== index),
                          }))
                        }
                        aria-label={`Xóa ảnh ${index + 1}`}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
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
                    onClick={() => {
                      const existingCodes = new Set(
                        products
                          .filter((item) => item.id !== formState.id)
                          .map((item) => item.code.trim().toUpperCase()),
                      );

                      setFormState((prev) => ({ ...prev, code: generateCode(existingCodes) }));
                    }}
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
                  <Label>Giới tính*</Label>
                  <Select
                    value={formState.gender}
                    onValueChange={(value) =>
                      setFormState((prev) => ({ ...prev, gender: (value as 'male' | 'female') ?? prev.gender }))
                    }
                  >
                    <SelectTrigger className="mt-1 h-9 w-full">
                      <SelectValue>{formState.gender === 'female' ? 'Đồ nữ' : 'Đồ nam'}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Đồ nam</SelectItem>
                      <SelectItem value="female">Đồ nữ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label>Giá gốc* (₫)</Label>
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

                <div>
                  <Label>Sale (%)</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={formState.salePercent}
                    onChange={(event) => setFormState((prev) => ({ ...prev, salePercent: event.target.value }))}
                    className="mt-1 h-9"
                  />
                </div>
              </div>

              <div>
                <Label>Giá hiện tại (₫)</Label>
                <Input
                  readOnly
                  value={(() => {
                    const basePrice = Number(formState.price || 0);
                    const salePercent = Number(formState.salePercent || 0);
                    if (Number.isNaN(basePrice) || Number.isNaN(salePercent)) {
                      return '';
                    }

                    const currentPrice = Math.max(0, Math.round(basePrice * (1 - salePercent / 100)));
                    return String(currentPrice);
                  })()}
                  className="mt-1 h-9 bg-[var(--color-bg)]"
                />
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
                  <Label>Tổng số lượng*</Label>
                  <Input
                    type="number"
                    value={formState.variants.reduce((sum, variant) => sum + Math.max(0, Number(variant.stock) || 0), 0)}
                    readOnly
                    className="mt-1 h-9 bg-[var(--color-bg)]"
                  />
                  <p className="mt-1 text-xs text-[var(--color-text-muted)]">Tự động tính từ từng dòng biến thể</p>
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
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs font-medium uppercase tracking-[0.08em] text-[var(--color-text-muted)]">Biến thể nhập tay</p>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-8 gap-1"
                      onClick={() =>
                        setFormState((prev) => ({
                          ...prev,
                          variants: [...prev.variants, createEmptyVariantForm()],
                        }))
                      }
                    >
                      <Plus size={14} />
                      Thêm biến thể
                    </Button>
                  </div>

                  <div className="grid gap-2 [grid-template-columns:repeat(auto-fit,minmax(420px,1fr))]">
                    {formState.variants.map((variant, index) => (
                      <div key={`variant-row-${index}`} className="flex h-full items-center gap-2 rounded-[8px] border border-[var(--color-border)] p-2">
                        <Select
                          value={variant.size || SIZE_OPTIONS[0]}
                          onValueChange={(value) =>
                            setFormState((prev) => ({
                              ...prev,
                              variants: prev.variants.map((item, i) =>
                                i === index ? { ...item, size: value ?? item.size } : item,
                              ),
                            }))
                          }
                        >
                          <SelectTrigger className="h-8 w-[92px] min-w-[92px]">
                            <SelectValue>{variant.size || 'Size'}</SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {SIZE_OPTIONS.map((size) => (
                              <SelectItem key={size} value={size}>
                                {size}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <Select
                          value={variant.color || COLOR_OPTIONS[0].value}
                          onValueChange={(value) =>
                            setFormState((prev) => ({
                              ...prev,
                              variants: prev.variants.map((item, i) =>
                                i === index ? { ...item, color: value ?? item.color } : item,
                              ),
                            }))
                          }
                        >
                          <SelectTrigger className="h-8 min-w-[140px] flex-1">
                            <SelectValue>
                              {COLOR_OPTIONS.find((option) => option.value === variant.color)?.label ?? 'Màu'}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {COLOR_OPTIONS.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <Input
                          type="text"
                          inputMode="numeric"
                          value={variant.stock}
                          onChange={(event) => {
                            const value = event.target.value;
                            if (value === '' || /^\d+$/.test(value)) {
                              setFormState((prev) => ({
                                ...prev,
                                variants: prev.variants.map((item, i) =>
                                  i === index ? { ...item, stock: value } : item,
                                ),
                              }))
                            }
                          }}
                          placeholder="Số lượng"
                          className="h-8 w-[90px] min-w-[90px]"
                        />

                        <button
                          type="button"
                          onClick={() =>
                            setFormState((prev) => ({
                              ...prev,
                              variants:
                                prev.variants.length > 1
                                  ? prev.variants.filter((_, i) => i !== index)
                                  : [createEmptyVariantForm()],
                            }))
                          }
                          className="flex h-8 w-8 items-center justify-center rounded-[6px] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-error-bg)] hover:text-[var(--color-error)]"
                          aria-label="Xóa biến thể"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>

                  <p className="text-xs text-[var(--color-text-muted)]">
                    Có thể nhập nhiều size cho 1 màu, và nhiều màu cho 1 size.
                  </p>
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

              {(detailProduct.imageUrls ?? []).length > 0 || detailProduct.imageUrl ? (
                <div className="space-y-2">
                  <img
                    src={detailProduct.imageUrls?.[0] ?? detailProduct.imageUrl}
                    alt={detailProduct.name}
                    className="h-48 w-full rounded-[10px] border border-[var(--color-border)] object-cover"
                  />
                  {(detailProduct.imageUrls ?? []).length > 1 ? (
                    <div className="grid grid-cols-5 gap-2">
                      {detailProduct.imageUrls?.slice(1).map((imageUrl, index) => (
                        <img
                          key={`${detailProduct.id}-extra-${index}`}
                          src={imageUrl}
                          alt={`${detailProduct.name} ${index + 2}`}
                          className="h-14 w-full rounded-[8px] border border-[var(--color-border)] object-cover"
                        />
                      ))}
                    </div>
                  ) : null}
                </div>
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
                  Giới tính: <span className="font-medium">{detailProduct.gender === 'female' ? 'Đồ nữ' : 'Đồ nam'}</span>
                </p>
                <p>
                  Size: <span className="font-medium">{(detailProduct.sizes ?? []).join(', ') || '-'}</span>
                </p>
                <p>
                  Màu: <span className="font-medium">{(detailProduct.colors ?? []).join(', ') || '-'}</span>
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
                <div>
                  <p className="font-medium text-[var(--color-text-primary)]">Tồn kho theo biến thể:</p>
                  <div className="mt-1 space-y-1 text-[var(--color-text-secondary)]">
                    {(detailProduct.variants ?? []).length > 0 ? (
                      detailProduct.variants?.map((variant) => (
                        <p key={variant.id}>
                          {variant.size} / {variant.color}: {variant.stock}
                        </p>
                      ))
                    ) : (
                      <p>-</p>
                    )}
                  </div>
                </div>
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
        onConfirm={() => void deleteSingle()}
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
