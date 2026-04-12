import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  Banknote,
  Building2,
  CheckCircle2,
  Minus,
  Package,
  Search,
  Shirt,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
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
import { createCustomerApi, createOrderApi, fetchCustomersApi } from '@/lib/backendApi';
import { promotionApi } from '@/lib/promotionApi';
import { cn, formatVND } from '@/lib/utils';
import { toast } from '@/lib/toast';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import { useProductStore } from '@/store/productStore';
import type { Customer, Order, Product, PromotionType } from '@/types';

type CategoryKey = 'all' | 'ao' | 'quan' | 'vay' | 'ao-khoac' | 'phu-kien';
type PaymentMethod = 'cash' | 'transfer';

interface CategoryTab {
  key: CategoryKey;
  label: string;
}

interface CustomerFormState {
  name: string;
  phone: string;
}

interface InvoiceExportSnapshot {
  orderNumber: string;
  createdAt: Date;
  paymentMethod: PaymentMethod;
  status: Order['status'];
  customerName: string;
  customerPhone: string;
  cashierName: string;
  items: Array<{
    productName: string;
    quantity: number;
    price: number;
    subtotal: number;
  }>;
  subtotal: number;
  discount: number;
  total: number;
}

const PHONE_REGEX = /^0\d{9}$/;

function sanitizePhoneInput(value: string): string {
  return value.replace(/\D/g, '').slice(0, 10);
}

function isValidPhone(phone: string): boolean {
  return PHONE_REGEX.test(phone);
}

const CATEGORY_TABS: CategoryTab[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 'ao', label: 'Áo' },
  { key: 'quan', label: 'Quần' },
  { key: 'vay', label: 'Váy' },
  { key: 'ao-khoac', label: 'Áo khoác' },
  { key: 'phu-kien', label: 'Phụ kiện' },
];

const categoryVisualMap: Record<
  CategoryKey,
  { gradient: string; icon: LucideIcon }
> = {
  all: {
    gradient: 'from-[#7FA7EF] to-[#2D6BE4]',
    icon: Sparkles,
  },
  ao: {
    gradient: 'from-[#7AA6FF] to-[#2D6BE4]',
    icon: Shirt,
  },
  quan: {
    gradient: 'from-[#77D39E] to-[#16A34A]',
    icon: ShoppingBag,
  },
  vay: {
    gradient: 'from-[#F8A2B7] to-[#E26C8B]',
    icon: Sparkles,
  },
  'ao-khoac': {
    gradient: 'from-[#9C9BA8] to-[#666573]',
    icon: Package,
  },
  'phu-kien': {
    gradient: 'from-[#F7C47A] to-[#D97706]',
    icon: Sparkles,
  },
};

function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

function inferCategory(category: string): CategoryKey {
  const c = normalize(category);

  if (c.includes('ao khoac') || c.includes('blazer') || c.includes('vest')) {
    return 'ao-khoac';
  }

  if (c.includes('ao')) {
    return 'ao';
  }

  if (c.includes('quan') || c.includes('jeans')) {
    return 'quan';
  }

  if (c.includes('vay') || c.includes('dam')) {
    return 'vay';
  }

  return 'phu-kien';
}

function customerInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('');
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function buildInvoiceWordContent(invoice: InvoiceExportSnapshot): string {
  const rows = invoice.items
    .map((item, index) => `
      <tr>
        <td style="padding:8px;border:1px solid #d9d9d9;text-align:center;">${index + 1}</td>
        <td style="padding:8px;border:1px solid #d9d9d9;">${escapeHtml(item.productName)}</td>
        <td style="padding:8px;border:1px solid #d9d9d9;text-align:center;">${item.quantity}</td>
        <td style="padding:8px;border:1px solid #d9d9d9;text-align:right;">${formatVND(item.price)}</td>
        <td style="padding:8px;border:1px solid #d9d9d9;text-align:right;">${formatVND(item.subtotal)}</td>
      </tr>
    `)
    .join('');

  const paymentMethodLabel = invoice.paymentMethod === 'transfer' ? 'Chuyển khoản' : 'Tiền mặt';
  const createdTime = invoice.createdAt.toLocaleString('vi-VN');

  return `
    <html>
      <head>
        <meta charset="UTF-8" />
        <title>Hoa don ${escapeHtml(invoice.orderNumber)}</title>
      </head>
      <body style="font-family:Arial,sans-serif;color:#222;padding:24px;">
        <h2 style="margin:0 0 8px 0;">ROUTINE - HOA DON BAN HANG</h2>
        <p style="margin:0 0 4px 0;"><strong>So hoa don:</strong> ${escapeHtml(invoice.orderNumber)}</p>
        <p style="margin:0 0 4px 0;"><strong>Thoi gian:</strong> ${escapeHtml(createdTime)}</p>
        <p style="margin:0 0 4px 0;"><strong>Trang thai:</strong> ${escapeHtml(invoice.status.toUpperCase())}</p>
        <p style="margin:0 0 4px 0;"><strong>Thu ngan:</strong> ${escapeHtml(invoice.cashierName)}</p>
        <p style="margin:0 0 4px 0;"><strong>Khach hang:</strong> ${escapeHtml(invoice.customerName)} (${escapeHtml(invoice.customerPhone)})</p>
        <p style="margin:0 0 16px 0;"><strong>Thanh toan:</strong> ${escapeHtml(paymentMethodLabel)}</p>

        <table style="border-collapse:collapse;width:100%;font-size:13px;">
          <thead>
            <tr>
              <th style="padding:8px;border:1px solid #d9d9d9;background:#f4f4f4;">STT</th>
              <th style="padding:8px;border:1px solid #d9d9d9;background:#f4f4f4;text-align:left;">San pham</th>
              <th style="padding:8px;border:1px solid #d9d9d9;background:#f4f4f4;">SL</th>
              <th style="padding:8px;border:1px solid #d9d9d9;background:#f4f4f4;text-align:right;">Don gia</th>
              <th style="padding:8px;border:1px solid #d9d9d9;background:#f4f4f4;text-align:right;">Thanh tien</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>

        <div style="margin-top:16px;margin-left:auto;width:320px;font-size:13px;">
          <p style="margin:0 0 6px 0;display:flex;justify-content:space-between;"><span>Tam tinh:</span><strong>${formatVND(invoice.subtotal)}</strong></p>
          <p style="margin:0 0 6px 0;display:flex;justify-content:space-between;"><span>Giam gia:</span><strong>-${formatVND(invoice.discount)}</strong></p>
          <p style="margin:0;display:flex;justify-content:space-between;font-size:15px;"><span><strong>Tong cong:</strong></span><strong>${formatVND(invoice.total)}</strong></p>
        </div>
      </body>
    </html>
  `;
}

export function POSPage() {
  const currentUser = useAuthStore((state) => state.user);
  const products = useProductStore((state) => state.products);
  const fetchProducts = useProductStore((state) => state.fetchProducts);
  const {
    items,
    customer,
    discountCode,
    discountAmount,
    addItem,
    removeItem,
    updateQuantity,
    setCustomer,
    applyManualDiscount,
    applyDiscount,
    clearCart,
  } = useCartStore();

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
    [items],
  );
  const total = useMemo(() => Math.max(0, subtotal - discountAmount), [discountAmount, subtotal]);

  useEffect(() => {
    document.title = 'POS | Routine';
    const loadInitialData = async () => {
      try {
        const [customerList] = await Promise.all([
          fetchCustomersApi(),
          fetchProducts(),
        ]);
        setCustomerDirectory(customerList);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Khong the tai du lieu ban hang');
      }
    };

    void loadInitialData();
  }, []);

  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<CategoryKey>('all');
  const [lastPressedProduct, setLastPressedProduct] = useState<string | null>(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerDirectory, setCustomerDirectory] = useState<Customer[]>([]);
  const [isCustomerSearchOpen, setIsCustomerSearchOpen] = useState(false);
  const [addCustomerOpen, setAddCustomerOpen] = useState(false);
  const [customerForm, setCustomerForm] = useState<CustomerFormState>({ name: '', phone: '' });
  const [savingCustomer, setSavingCustomer] = useState(false);
  const [discountInput, setDiscountInput] = useState('');
  const [discountInvalid, setDiscountInvalid] = useState(false);
  const [isApplyingDiscount, setIsApplyingDiscount] = useState(false);
  const [appliedPromotionType, setAppliedPromotionType] = useState<PromotionType | null>(null);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [cashReceivedInput, setCashReceivedInput] = useState('');
  const [isConfirming, setIsConfirming] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [createdOrderCode, setCreatedOrderCode] = useState('');
  const [createdInvoice, setCreatedInvoice] = useState<InvoiceExportSnapshot | null>(null);
  const [pendingProduct, setPendingProduct] = useState<Product | null>(null);
  const [isVariantDialogOpen, setIsVariantDialogOpen] = useState(false);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');

  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const customerSearchRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target;
      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
        return;
      }

      if (event.key === '/') {
        event.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (!customerSearchRef.current?.contains(event.target as Node)) {
        setIsCustomerSearchOpen(false);
      }
    };

    window.addEventListener('pointerdown', onPointerDown);
    return () => window.removeEventListener('pointerdown', onPointerDown);
  }, []);

  const productList = useMemo(() => {
    const q = normalize(query);

    return products
      .filter((product) => {
        const byCategory =
          activeCategory === 'all' || inferCategory(product.category) === activeCategory;

        if (!byCategory) {
          return false;
        }

        if (!q) {
          return true;
        }

        return normalize(product.name).includes(q) || normalize(product.code).includes(q);
      })
      .sort((a, b) => a.name.localeCompare(b.name, 'vi'));
  }, [activeCategory, products, query]);

  const customerMatches = useMemo(() => {
    const q = normalize(customerSearch.trim());
    if (!q) {
      return customerDirectory.slice(0, 6);
    }

    return customerDirectory
      .filter(
        (item) => normalize(item.name).includes(q) || normalize(item.phone).includes(q),
      )
      .slice(0, 6);
  }, [customerDirectory, customerSearch]);

  const extractPhone = (value: string): string => sanitizePhoneInput(value);

  const findCustomerByPhone = (phoneInput: string): Customer | undefined => {
    const phone = extractPhone(phoneInput);
    return customerDirectory.find((item) => item.phone === phone);
  };

  const customerResolvedFromSearch = useMemo(() => {
    const phone = extractPhone(customerSearch);
    if (!isValidPhone(phone)) {
      return null;
    }

    return customerDirectory.find((item) => item.phone === phone) ?? null;
  }, [customerDirectory, customerSearch]);

  const resolvedCustomer = customer ?? customerResolvedFromSearch;

  const openAddCustomerDialog = () => {
    setCustomerForm({
      name: '',
      phone: sanitizePhoneInput(customerSearch),
    });
    setAddCustomerOpen(true);
  };

  const isCustomerFormPhoneInvalid = customerForm.phone.length > 0 && !isValidPhone(customerForm.phone);

  const handleCreateCustomer = async () => {
    const name = customerForm.name.trim();
    const phone = extractPhone(customerForm.phone);

    if (!name) {
      toast.error('Vui lòng nhập tên khách hàng');
      return;
    }

    if (!isValidPhone(phone)) {
      toast.error('So dien thoai phai dung 10 so', 'Dinh dang dung: 0xxxxxxxxx');
      return;
    }

    const existed = findCustomerByPhone(phone);
    if (existed) {
      setCustomer(existed);
      setCustomerSearch(existed.phone);
      setAddCustomerOpen(false);
      toast.success('Khách hàng đã tồn tại', `Đã chọn ${existed.name}`);
      return;
    }

    setSavingCustomer(true);
    try {
      const created = await createCustomerApi({ name, phone, tier: 'regular' });
      setCustomerDirectory((prev) => [created, ...prev]);
      setCustomer(created);
      setCustomerSearch(created.phone);
      setAddCustomerOpen(false);
      toast.success('Đã thêm khách hàng mới', `${created.name} - ${created.phone}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Them khach hang that bai');
    } finally {
      setSavingCustomer(false);
    }
  };

  const cashReceived = Number(cashReceivedInput || 0);
  const change = Math.max(0, cashReceived - total);

  const addProductToCart = (product: Product) => {
    if (product.stock <= 0 || product.status === 'out_of_stock') {
      return;
    }

    setLastPressedProduct(product.id);

    // If product has variants (colors/sizes), show dialog for selection
    if (product.colors?.length || product.sizes?.length) {
      setPendingProduct(product);
      setSelectedSize(product.sizes?.[0] || '');
      setSelectedColor(product.colors?.[0] || '');
      setIsVariantDialogOpen(true);
    } else {
      // Add directly if no variants
      addItem(product);
      window.setTimeout(() => setLastPressedProduct(null), 180);
    }
  };

  const handleConfirmVariantSelection = () => {
    if (pendingProduct) {
      addItem(pendingProduct, selectedSize || undefined, selectedColor || undefined);
      setIsVariantDialogOpen(false);
      setPendingProduct(null);
      setSelectedSize('');
      setSelectedColor('');
      window.setTimeout(() => setLastPressedProduct(null), 180);
    }
  };

  const handleApplyDiscount = async () => {
    const code = discountInput.trim().toUpperCase();

    if (!code) {
      applyDiscount('');
      setAppliedPromotionType(null);
      setDiscountInvalid(false);
      return;
    }

    const orderAmount = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
    const productIds = Array.from(
      new Set(
        items
          .map((item) => Number.parseInt(item.product.id, 10))
          .filter((id) => Number.isFinite(id)),
      ),
    );

    setIsApplyingDiscount(true);
    try {
      const promotion = await promotionApi.getByCode(code);
      const result = await promotionApi.apply({
        promotionCode: code,
        orderAmount,
        productIds,
        customerId: customer ? Number.parseInt(customer.id, 10) : undefined,
      });

      if (!result.applicable) {
        applyDiscount('');
        setAppliedPromotionType(null);
        setDiscountInvalid(true);
        toast.error('Mã giảm giá không hợp lệ', result.message || 'Không thể áp dụng mã này cho đơn hiện tại.');
        window.setTimeout(() => setDiscountInvalid(false), 380);
        return;
      }

      const discountValue = Number(result.discountAmount ?? 0);
      applyManualDiscount(code, discountValue);
      setAppliedPromotionType(promotion.type);
      setDiscountInvalid(false);

      if (promotion.type === 'TANG_QUA') {
        toast.success('Áp dụng ưu đãi thành công', `Mã ${code} đã kích hoạt quà tặng/ưu đãi kèm theo.`);
      } else {
        toast.success('Áp dụng mã thành công', `Mã ${code} đã giảm ${formatVND(discountValue)}.`);
      }
      return;
    } catch (error) {
      setAppliedPromotionType(null);
      setDiscountInvalid(true);
      applyDiscount('');
      toast.error(
        'Mã giảm giá không hợp lệ',
        error instanceof Error ? error.message : 'Không thể áp dụng mã này.',
      );
      window.setTimeout(() => setDiscountInvalid(false), 380);
    } finally {
      setIsApplyingDiscount(false);
    }
  };

  const handleCheckoutClick = () => {
    if (items.length === 0) {
      return;
    }

    if (!resolvedCustomer) {
      toast.error('Vui lòng xác định khách hàng', 'Chọn khách hàng trước khi thanh toán.');
      return;
    }

    if (!customer && customerResolvedFromSearch) {
      setCustomer(customerResolvedFromSearch);
    }

    setPaymentMethod('cash');
    setCashReceivedInput('');
    setPaymentSuccess(false);
    setCreatedOrderCode('');
    setCreatedInvoice(null);
    setPaymentOpen(true);
  };

  const handleExportWordInvoice = () => {
    if (!createdInvoice) {
      toast.error('Không tìm thấy dữ liệu hóa đơn để in');
      return;
    }

    const content = buildInvoiceWordContent(createdInvoice);
    const blob = new Blob([`\ufeff${content}`], {
      type: 'application/msword;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `hoa-don-${createdInvoice.orderNumber}.doc`;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  const handleConfirmPayment = async () => {
    const invoiceCustomer = resolvedCustomer;

    if (!invoiceCustomer) {
      if (customerSearch.trim()) {
        const phone = extractPhone(customerSearch);
        if (!isValidPhone(phone)) {
          toast.error('Số điện thoại khách hàng không hợp lệ', 'Vui lòng nhập đúng định dạng 0xxxxxxxxx.');
          return;
        }

        toast.error('Khách hàng chưa tồn tại', 'Vui lòng bấm "Thêm khách hàng" để tạo nhanh tên và số điện thoại.');
        return;
      }

      toast.error('Vui lòng xác định khách hàng', 'Chọn khách hàng trước khi hoàn thành hóa đơn.');
      return;
    }

    if (!customer && customerResolvedFromSearch) {
      setCustomer(customerResolvedFromSearch);
    }

    if (paymentMethod === 'cash' && cashReceived < total) {
      toast.error('Số tiền khách đưa chưa đủ', 'Vui lòng nhập số tiền lớn hơn hoặc bằng tổng thanh toán.');
      return;
    }

    setIsConfirming(true);
    try {
      const createdOrder = await createOrderApi({
        customerId: invoiceCustomer?.id,
        items: items.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
          price: item.product.price,
          size: item.selectedSize || (item.product.sizes?.[0] || 'M'),
          color: item.selectedColor || (item.product.colors?.[0] || 'Black'),
        })),
        subtotal,
        discount: discountAmount,
        total,
        paymentMethod,
      });

      setPaymentSuccess(true);
      setCreatedOrderCode(createdOrder.orderNumber);
      setCreatedInvoice({
        orderNumber: createdOrder.orderNumber,
        createdAt: createdOrder.createdAt,
        paymentMethod,
        status: createdOrder.status,
        customerName: invoiceCustomer?.name ?? 'Khach le',
        customerPhone: invoiceCustomer?.phone ?? (customerSearch.trim() || 'N/A'),
        cashierName: currentUser?.name ?? 'N/A',
        items: items.map((item) => ({
          productName: item.product.name,
          quantity: item.quantity,
          price: item.product.price,
          subtotal: item.product.price * item.quantity,
        })),
        subtotal,
        discount: discountAmount,
        total,
      });
      toast.success(
        'Thanh toán thành công',
        createdOrder.status === 'paid'
          ? 'Hóa đơn đã lưu vào hệ thống với trạng thái PAID.'
          : 'Hóa đơn đã lưu vào hệ thống.',
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể tạo hóa đơn. Vui lòng thử lại.');
    } finally {
      setIsConfirming(false);
    }
  };

  const closeSuccessModal = () => {
    clearCart();
    setDiscountInput('');
    setAppliedPromotionType(null);
    setPaymentOpen(false);
    setPaymentSuccess(false);
    setCreatedInvoice(null);
  };

  return (
    <>
      <div className="flex h-[calc(100vh-56px-32px)] min-h-[620px] overflow-hidden rounded-[12px] border border-[var(--color-border)] bg-[var(--color-bg)]">
        <section className="min-w-[600px] flex-1 overflow-y-auto p-6">
          <div className="relative mb-4">
            <Search
              size={18}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
            />
            <input
              ref={searchInputRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Tìm sản phẩm theo tên hoặc mã..."
              className="h-12 w-full rounded-[10px] border-2 border-[var(--color-border)] bg-white pr-14 pl-11 text-sm text-[var(--color-text-primary)] outline-none transition-[border,box-shadow] duration-150 ease-in placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-accent)] focus:shadow-[0_0_0_4px_#EEF3FD]"
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded-[4px] border border-[var(--color-border)] bg-[#F7F6F4] px-1.5 py-0.5 text-xs text-[var(--color-text-secondary)]">
              ⌘K
            </span>
          </div>

          <div className="mb-4 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex min-w-max items-center gap-1 border-b border-[var(--color-border)]">
              {CATEGORY_TABS.map((tab) => {
                const active = activeCategory === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveCategory(tab.key)}
                    className={cn(
                      'h-10 px-4 text-sm transition-colors duration-150',
                      active
                        ? 'border-b-[2.5px] border-b-[#1A1A18] font-semibold text-[var(--color-text-primary)]'
                        : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]',
                    )}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-3">
            {productList.map((product) => {
              const categoryKey = inferCategory(product.category);
              const visual = categoryVisualMap[categoryKey];
              const Icon = visual.icon;
              const outOfStock = product.stock <= 0 || product.status === 'out_of_stock';

              return (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => addProductToCart(product)}
                  disabled={outOfStock}
                  className={cn(
                    'group overflow-hidden rounded-[10px] border border-[var(--color-border)] bg-white text-left transition-all duration-150 ease-in',
                    'hover:-translate-y-[2px] hover:border-[var(--color-accent)] hover:shadow-[0_4px_12px_rgba(45,107,228,0.12)]',
                    lastPressedProduct === product.id && 'scale-[0.94]',
                    outOfStock && 'pointer-events-none opacity-45',
                  )}
                >
                  <div className="relative h-40">
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className={cn('flex h-full w-full items-center justify-center bg-gradient-to-br', visual.gradient)}>
                        <Icon size={40} className="text-white" />
                      </div>
                    )}

                    {outOfStock ? (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                        <span className="text-sm font-semibold text-white">Hết hàng</span>
                      </div>
                    ) : null}
                  </div>

                  <div className="p-[10px] px-3">
                    <p className="truncate text-[13px] font-medium text-[var(--color-text-primary)]">{product.name}</p>
                    <p className="mt-0.5 font-[var(--font-mono)] text-[11px] text-[var(--color-text-muted)]">{product.code}</p>

                    <div className="mt-2 flex items-center justify-between gap-2">
                      <span className="text-[14px] font-bold text-[var(--color-text-primary)]">
                        {formatVND(product.price)}
                      </span>
                      <span
                        className={cn(
                          'text-[11px] font-medium',
                          product.stock <= product.minStock
                            ? 'text-[var(--color-error)]'
                            : 'text-[var(--color-success)]',
                        )}
                      >
                        Kho {product.stock}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <aside className="w-[380px] flex-shrink-0 border-l border-[var(--color-border)] bg-white">
          <div className="flex h-full flex-col">
            <div className="border-b border-[var(--color-border)] p-4">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h2 className="text-[18px] font-semibold text-[var(--color-text-primary)]">Hóa đơn mới</h2>
                  <span className="rounded-full bg-[#F7F6F4] px-2 py-1 text-xs text-[var(--color-text-secondary)]">
                    {items.length} sản phẩm
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="text-[var(--color-text-secondary)] hover:text-[var(--color-error)]"
                  onClick={clearCart}
                  disabled={items.length === 0}
                >
                  <Trash2 size={16} />
                </Button>
              </div>

              <p className="mb-2 text-[12px] uppercase tracking-[0.08em] text-[var(--color-text-muted)]">Khách hàng</p>

              {customer ? (
                <div className="flex items-center justify-between gap-2 rounded-[8px] bg-[#F7F6F4] px-3 py-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-xs font-semibold text-[var(--color-text-primary)]">
                      {customerInitials(customer.name)}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-[var(--color-text-primary)]">{customer.name}</p>
                      <p className="text-xs text-[var(--color-text-secondary)]">{customer.phone}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-error)]"
                    onClick={() => setCustomer(null)}
                  >
                    ×
                  </button>
                </div>
              ) : (
                <div ref={customerSearchRef} className="relative">
                  <Input
                    value={customerSearch}
                    onChange={(event) => {
                      setCustomerSearch(event.target.value);
                      setIsCustomerSearchOpen(true);
                    }}
                    onFocus={() => setIsCustomerSearchOpen(true)}
                    placeholder="Tìm khách hàng theo tên hoặc số điện thoại"
                    className="h-9"
                  />

                  <div className="mt-2 flex items-center justify-between gap-2">
                    <p className="text-xs text-[var(--color-text-muted)]">Khách chưa có trong danh sách?</p>
                    <Button type="button" size="sm" variant="outline" className="h-7" onClick={openAddCustomerDialog}>
                      Thêm khách hàng
                    </Button>
                  </div>

                  {isCustomerSearchOpen && customerMatches.length > 0 ? (
                    <div className="absolute z-20 mt-1 max-h-52 w-full overflow-y-auto rounded-[8px] border border-[var(--color-border)] bg-white shadow-lg">
                      {customerMatches.map((item: Customer) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            setCustomer(item);
                            setCustomerSearch(item.phone);
                            setIsCustomerSearchOpen(false);
                          }}
                          className="flex w-full items-center justify-between px-3 py-2 text-left hover:bg-[#F7F6F4]"
                        >
                          <span className="text-sm text-[var(--color-text-primary)]">{item.name}</span>
                          <span className="text-xs text-[var(--color-text-secondary)]">{item.phone}</span>
                        </button>
                      ))}
                    </div>
                  ) : null}

                  {isCustomerSearchOpen && customerSearch.trim().length > 0 && customerMatches.length === 0 ? (
                    <div className="absolute z-20 mt-1 w-full rounded-[8px] border border-[var(--color-border)] bg-white p-3 shadow-lg">
                      <p className="text-xs text-[var(--color-text-secondary)]">Không tìm thấy khách phù hợp.</p>
                      <Button type="button" size="sm" className="mt-2 h-8" onClick={openAddCustomerDialog}>
                        Thêm khách hàng mới
                      </Button>
                    </div>
                  ) : null}
                </div>
              )}

              <div className="my-4 h-px bg-[var(--color-border)]" />
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-4">
              {items.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <ShoppingCart size={48} className="mb-3 text-[var(--color-text-muted)] opacity-30" />
                  <p className="text-sm text-[var(--color-text-secondary)]">Chưa có sản phẩm</p>
                  <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                    Tìm và click sản phẩm để thêm vào hóa đơn
                  </p>
                </div>
              ) : (
                items.map((item) => {
                  const categoryKey = inferCategory(item.product.category);
                  const visual = categoryVisualMap[categoryKey];

                  return (
                    <div key={item.product.id} className="border-b border-[#F0EEE9] py-3">
                      <div className="flex items-start gap-3">
                        <div className="h-12 w-12 overflow-hidden rounded-[6px]">
                          {item.product.imageUrl ? (
                            <img
                              src={item.product.imageUrl}
                              alt={item.product.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className={cn('flex h-full w-full items-center justify-center bg-gradient-to-br', visual.gradient)}>
                              <span className="text-sm font-semibold text-white">
                                {item.product.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="truncate text-[13px] font-medium text-[var(--color-text-primary)]">
                                {item.product.name}
                              </p>
                              <p className="text-[11px] text-[var(--color-text-muted)]">
                                {item.selectedColor && `Màu ${item.selectedColor}`}
                                {item.selectedColor && item.selectedSize && ' · '}
                                {item.selectedSize && `Size ${item.selectedSize}`}
                              </p>
                              <p className="mt-1 text-[13px] font-bold text-[var(--color-text-primary)]">
                                {formatVND(item.product.price)}
                              </p>
                            </div>

                            <button
                              type="button"
                              className="text-[var(--color-text-muted)] hover:text-[var(--color-error)]"
                              onClick={() => removeItem(item.product.id, item.selectedSize, item.selectedColor)}
                            >
                              <X size={14} />
                            </button>
                          </div>

                          <div className="mt-2 flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.product.id, item.quantity - 1, item.selectedSize, item.selectedColor)}
                              className="flex h-7 w-7 items-center justify-center rounded-[6px] border border-[var(--color-border)] bg-white hover:bg-[#F7F6F4]"
                            >
                              <Minus size={14} />
                            </button>
                            <input
                              type="number"
                              min={1}
                              value={item.quantity}
                              onChange={(event) => {
                                const qty = Number(event.target.value);
                                if (Number.isFinite(qty) && qty > 0) {
                                  updateQuantity(item.product.id, qty, item.selectedSize, item.selectedColor);
                                }
                              }}
                              className="h-7 w-9 appearance-none rounded-[6px] border border-[var(--color-border)] text-center text-[13px] font-semibold text-[var(--color-text-primary)] outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                            />
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.product.id, item.quantity + 1, item.selectedSize, item.selectedColor)}
                              className="flex h-7 w-7 items-center justify-center rounded-[6px] border border-[var(--color-border)] bg-white hover:bg-[#F7F6F4]"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="sticky bottom-0 border-t border-[var(--color-border)] bg-white p-4">
              <div className="mb-3 space-y-1.5 text-sm">
                <div className="flex items-center justify-between text-[var(--color-text-secondary)]">
                  <span>Tạm tính:</span>
                  <span>{formatVND(subtotal)}</span>
                </div>
                {discountAmount > 0 ? (
                  <div className="flex items-center justify-between text-[var(--color-success)]">
                    <span>Giảm giá:</span>
                    <span>-{formatVND(discountAmount)}</span>
                  </div>
                ) : null}
                <div className="my-2 h-px bg-[var(--color-border)]" />
                <div className="flex items-center justify-between font-[var(--font-display)] text-[16px] font-bold text-[var(--color-text-primary)]">
                  <span>Tổng cộng:</span>
                  <span>{formatVND(total)}</span>
                </div>
              </div>

              <div className="mb-3 flex gap-2">
                <Input
                  value={discountInput}
                  onChange={(event) => setDiscountInput(event.target.value)}
                  placeholder="Mã giảm giá"
                  className={cn(
                    'h-9',
                    discountInvalid &&
                      'border-[var(--color-error)] ring-2 ring-[var(--color-error-bg)] animate-[shake_0.35s_ease]',
                  )}
                />
                <Button
                  variant="outline"
                  className="h-9"
                  onClick={() => void handleApplyDiscount()}
                  disabled={isApplyingDiscount || items.length === 0}
                >
                  {isApplyingDiscount ? 'Đang áp dụng...' : 'Áp dụng'}
                </Button>
              </div>

              {discountCode && appliedPromotionType === 'TANG_QUA' ? (
                <p className="mb-2 text-xs text-[var(--color-success)]">
                  Mã {discountCode} đã áp dụng ưu đãi quà tặng kèm theo chương trình.
                </p>
              ) : null}

              <Button
                className="h-[52px] w-full justify-between rounded-[8px] bg-[#1A1A18] px-4 text-base font-semibold text-white hover:bg-[#2D2D2A]"
                onClick={handleCheckoutClick}
                disabled={items.length === 0 || !resolvedCustomer}
              >
                Thanh toán
                <ArrowRight size={20} />
              </Button>
            </div>
          </div>
        </aside>
      </div>

      <Dialog
        open={addCustomerOpen}
        onOpenChange={setAddCustomerOpen}
      >
        <DialogContent className="max-w-[420px] rounded-[12px] p-5">
          <DialogHeader>
            <DialogTitle className="text-[19px] font-semibold text-[var(--color-text-primary)]">Thêm khách hàng</DialogTitle>
            <DialogDescription>
              Tạo nhanh khách mới bằng tên và số điện thoại để gán vào hóa đơn hiện tại.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div>
              <label htmlFor="new-customer-name" className="mb-1 block text-sm text-[var(--color-text-secondary)]">
                Tên khách hàng
              </label>
              <Input
                id="new-customer-name"
                value={customerForm.name}
                onChange={(event) => setCustomerForm((prev) => ({ ...prev, name: event.target.value }))}
                placeholder="Nhập tên khách"
                className="h-9"
              />
            </div>

            <div>
              <label htmlFor="new-customer-phone" className="mb-1 block text-sm text-[var(--color-text-secondary)]">
                Số điện thoại
              </label>
              <Input
                id="new-customer-phone"
                value={customerForm.phone}
                onChange={(event) =>
                  setCustomerForm((prev) => ({ ...prev, phone: sanitizePhoneInput(event.target.value) }))
                }
                placeholder="0xxxxxxxxx"
                type="tel"
                inputMode="numeric"
                maxLength={10}
                className="h-9"
              />
              {isCustomerFormPhoneInvalid ? (
                <p className="mt-1 text-xs text-[var(--color-danger,#dc2626)]">So dien thoai phai dung 10 so, bat dau bang 0.</p>
              ) : null}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddCustomerOpen(false)} disabled={savingCustomer}>
              Hủy
            </Button>
            <Button onClick={handleCreateCustomer} disabled={savingCustomer || isCustomerFormPhoneInvalid}>
              {savingCustomer ? 'Đang lưu...' : 'Thêm khách hàng'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isVariantDialogOpen} onOpenChange={setIsVariantDialogOpen}>
        <DialogContent className="max-w-[400px] rounded-[12px] p-6">
          <DialogHeader>
            <DialogTitle className="text-[19px] font-semibold text-[var(--color-text-primary)]">
              Chọn {pendingProduct?.name}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {pendingProduct?.colors && pendingProduct.colors.length > 0 && (
              <div>
                <label className="mb-2 block text-sm font-medium text-[var(--color-text-primary)]">
                  Màu sắc
                </label>
                <div className="flex flex-wrap gap-2">
                  {pendingProduct.colors.map((color) => {
                    const colorVariants = pendingProduct.variants?.filter((v) => v.color === color) || [];
                    const colorStock = colorVariants.reduce((sum, v) => sum + v.stock, 0);
                    const isOutOfStock = colorStock === 0;

                    return (
                      <button
                        key={color}
                        type="button"
                        disabled={isOutOfStock}
                        onClick={() => setSelectedColor(color)}
                        className={cn(
                          'rounded-[8px] border-2 px-3 py-2 text-sm font-medium transition-all',
                          isOutOfStock
                            ? 'border-[var(--color-border)] bg-[#F5F5F5] text-[#999] cursor-not-allowed opacity-50'
                            : selectedColor === color
                              ? 'border-[#2D6BE4] bg-[#EEF3FD] text-[#2D6BE4]'
                              : 'border-[var(--color-border)] bg-white text-[var(--color-text-primary)] hover:border-[#2D6BE4]',
                        )}
                      >
                        <span>{color}</span>
                        {!isOutOfStock && <span className="ml-1 text-xs text-[#666]">({colorStock})</span>}
                        {isOutOfStock && <span className="ml-1 text-xs">Hết hàng</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {pendingProduct?.sizes && pendingProduct.sizes.length > 0 && (
              <div>
                <label className="mb-2 block text-sm font-medium text-[var(--color-text-primary)]">
                  Kích cỡ
                </label>
                <div className="flex flex-wrap gap-2">
                  {pendingProduct.sizes.map((size) => {
                    const sizeVariants = pendingProduct.variants?.filter((v) => v.size === size) || [];
                    const sizeStock = sizeVariants.reduce((sum, v) => sum + v.stock, 0);
                    const isOutOfStock = sizeStock === 0;

                    return (
                      <button
                        key={size}
                        type="button"
                        disabled={isOutOfStock}
                        onClick={() => setSelectedSize(size)}
                        className={cn(
                          'rounded-[8px] border-2 px-3 py-2 text-sm font-medium transition-all',
                          isOutOfStock
                            ? 'border-[var(--color-border)] bg-[#F5F5F5] text-[#999] cursor-not-allowed opacity-50'
                            : selectedSize === size
                              ? 'border-[#2D6BE4] bg-[#EEF3FD] text-[#2D6BE4]'
                              : 'border-[var(--color-border)] bg-white text-[var(--color-text-primary)] hover:border-[#2D6BE4]',
                        )}
                      >
                        <span>{size}</span>
                        {!isOutOfStock && <span className="ml-1 text-xs text-[#666]">({sizeStock})</span>}
                        {isOutOfStock && <span className="ml-1 text-xs">Hết hàng</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {selectedColor && selectedSize && (
              <div className="rounded-[10px] border border-[var(--color-border)] bg-[#F7F6F4] p-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[var(--color-text-secondary)]">
                    Màu {selectedColor} · Size {selectedSize}
                  </span>
                  {(() => {
                    const variant = pendingProduct?.variants?.find(
                      (v) => v.color === selectedColor && v.size === selectedSize,
                    );
                    const stock = variant?.stock ?? 0;
                    return (
                      <span
                        className={cn(
                          'font-semibold',
                          stock > 0 ? 'text-[var(--color-success)]' : 'text-[var(--color-error)]',
                        )}
                      >
                        {stock > 0 ? `Còn ${stock}` : 'Hết hàng'}
                      </span>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsVariantDialogOpen(false);
                setPendingProduct(null);
                setSelectedSize('');
                setSelectedColor('');
              }}
            >
              Hủy
            </Button>
            <Button
              onClick={handleConfirmVariantSelection}
              disabled={(() => {
                if (!selectedColor || !selectedSize) return true;
                const variant = pendingProduct?.variants?.find(
                  (v) => v.color === selectedColor && v.size === selectedSize,
                );
                return !variant || variant.stock === 0;
              })()}
            >
              Thêm vào giỏ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={paymentOpen}
        onOpenChange={(open) => {
          if (!open && paymentSuccess) {
            closeSuccessModal();
            return;
          }
          setPaymentOpen(open);
        }}
      >
        <DialogContent className="max-w-[520px] rounded-[12px] p-6" showCloseButton={!isConfirming}>
          {paymentSuccess ? (
            <div className="py-4 text-center">
              <CheckCircle2 className="mx-auto mb-4 h-14 w-14 animate-[successPop_0.35s_ease] text-[var(--color-success)]" />
              <h3 className="mb-1 text-[20px] font-semibold text-[var(--color-text-primary)]">Thanh toán thành công!</h3>
              <p className="text-sm text-[var(--color-text-secondary)]">Hóa đơn #{createdOrderCode} đã được tạo</p>

              <div className="mt-6 grid grid-cols-2 gap-2">
                <Button variant="outline" onClick={handleExportWordInvoice}>
                  In hóa đơn Word
                </Button>
                <Button onClick={closeSuccessModal}>Đóng</Button>
              </div>
            </div>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle className="text-[20px] font-semibold text-[var(--color-text-primary)]">
                  Xác nhận thanh toán
                </DialogTitle>
                <DialogDescription className="text-sm text-[var(--color-text-secondary)]">
                  {items.length} SP · {formatVND(total)}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cash')}
                    className={cn(
                      'rounded-[10px] border p-4 text-left transition-all duration-150',
                      paymentMethod === 'cash'
                        ? 'border-2 border-[#2D6BE4] bg-[#EEF3FD]'
                        : 'border-[1.5px] border-[var(--color-border)] bg-white',
                    )}
                  >
                    <Banknote size={18} className="mb-2 text-[var(--color-text-primary)]" />
                    <p className="text-sm font-medium text-[var(--color-text-primary)]">Tiền mặt</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('transfer')}
                    className={cn(
                      'rounded-[10px] border p-4 text-left transition-all duration-150',
                      paymentMethod === 'transfer'
                        ? 'border-2 border-[#2D6BE4] bg-[#EEF3FD]'
                        : 'border-[1.5px] border-[var(--color-border)] bg-white',
                    )}
                  >
                    <Building2 size={18} className="mb-2 text-[var(--color-text-primary)]" />
                    <p className="text-sm font-medium text-[var(--color-text-primary)]">Chuyển khoản</p>
                  </button>
                </div>

                {paymentMethod === 'cash' ? (
                  <div className="space-y-2 rounded-[10px] border border-[var(--color-border)] p-3">
                    <p className="text-xs uppercase tracking-[0.08em] text-[var(--color-text-muted)]">Khách đưa</p>
                    <Input
                      type="number"
                      value={cashReceivedInput}
                      onChange={(event) => setCashReceivedInput(event.target.value)}
                      placeholder="Nhập số tiền khách đưa"
                      className="h-9"
                    />
                    <p className="text-sm text-[var(--color-success)]">Tiền thối: {formatVND(change)}</p>
                  </div>
                ) : (
                  <div className="rounded-[10px] border border-[var(--color-border)] bg-[#F7F6F4] p-3 text-sm text-[var(--color-text-secondary)]">
                    <p>STK: 1234567890</p>
                    <p>Ngân hàng: MB Bank</p>
                  </div>
                )}

                <Button
                  className="h-12 w-full text-base"
                  onClick={handleConfirmPayment}
                  disabled={isConfirming || !resolvedCustomer}
                >
                  {isConfirming ? 'Đang xử lý...' : 'Xác nhận & In hóa đơn'}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <style>{`
        @keyframes shake {
          0% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          50% { transform: translateX(4px); }
          75% { transform: translateX(-2px); }
          100% { transform: translateX(0); }
        }

        @keyframes successPop {
          0% { transform: scale(0.7); opacity: 0.5; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </>
  );
}
