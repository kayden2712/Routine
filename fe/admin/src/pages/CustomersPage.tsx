import { useEffect, useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import {
  Crown,
  Download,
  Eye,
  Pencil,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { DataTable } from '@/components/shared/DataTable';
import { EmptyState } from '@/components/shared/EmptyState';
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
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  createCustomerApi,
  fetchCustomersApi,
  fetchOrdersApi,
  updateCustomerApi,
} from '@/lib/backendApi';
import { exportRowsToExcel } from '@/lib/excel';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { formatRelativeTime, formatVND } from '@/lib/utils';
import { toast } from '@/lib/toast';
import type { Customer, Order } from '@/types';

type TierFilter = 'all' | 'regular' | 'vip';
type SortMode = 'newest' | 'spent' | 'orders';
type HistoryFilter = 'all' | 'paid' | 'cancelled';

const PHONE_REGEX = /^0[0-9]{9}$/;

const tierFilterLabelMap: Record<TierFilter, string> = {
  all: 'Tất cả hạng',
  regular: 'Khách thường',
  vip: 'Khách VIP',
};

const sortModeLabelMap: Record<SortMode, string> = {
  newest: 'Mới nhất',
  spent: 'Chi tiêu cao nhất',
  orders: 'Nhiều đơn nhất',
};

interface CustomerFormState {
  id?: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  tier: 'regular' | 'vip';
}

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

function initialsOfName(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

function createDefaultForm(): CustomerFormState {
  return {
    name: '',
    phone: '',
    email: '',
    address: '',
    tier: 'regular',
  };
}

function sanitizePhoneInput(value: string): string {
  return value.replace(/\D/g, '').slice(0, 10);
}

export function CustomersPage() {
  useEffect(() => {
    document.title = 'Khach hang | Routine';
  }, []);

  const [customerList, setCustomerList] = useState<Customer[]>([]);
  const [ordersData, setOrdersData] = useState<Order[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [tierFilter, setTierFilter] = useState<TierFilter>('all');
  const [sortMode, setSortMode] = useState<SortMode>('newest');

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [historyFilter, setHistoryFilter] = useState<HistoryFilter>('all');

  const [formOpen, setFormOpen] = useState(false);
  const [savingForm, setSavingForm] = useState(false);
  const [formState, setFormState] = useState<CustomerFormState>(createDefaultForm());
  const isFormPhoneInvalid = formState.phone.length > 0 && !PHONE_REGEX.test(formState.phone);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [customers, orders] = await Promise.all([fetchCustomersApi(), fetchOrdersApi()]);
        setCustomerList(customers);
        setOrdersData(orders);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Không thể tải dữ liệu khách hàng');
      }
    };

    void loadData();
  }, []);

  const totalCustomers = customerList.length;
  const vipCount = customerList.filter((item) => item.tier === 'vip').length;

  const filteredCustomers = useMemo(() => {
    const query = normalize(searchTerm.trim());

    const list = customerList.filter((customer) => {
      const bySearch =
        query.length === 0 ||
        normalize(customer.name).includes(query) ||
        normalize(customer.phone).includes(query);

      const byTier = tierFilter === 'all' || customer.tier === tierFilter;
      return bySearch && byTier;
    });

    const sorted = [...list];
    sorted.sort((a, b) => {
      if (sortMode === 'newest') {
        return b.createdAt.getTime() - a.createdAt.getTime();
      }
      if (sortMode === 'spent') {
        return b.totalSpent - a.totalSpent;
      }
      return b.totalOrders - a.totalOrders;
    });

    return sorted;
  }, [customerList, searchTerm, sortMode, tierFilter]);

  const selectedCustomerOrders = useMemo(() => {
    if (!selectedCustomer) return [];

    const customerOrders = ordersData
      .filter((order) => order.customer?.id === selectedCustomer.id)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    if (historyFilter === 'all') return customerOrders;
    return customerOrders.filter((order) => order.status === historyFilter);
  }, [historyFilter, selectedCustomer, ordersData]);

  const openCreateModal = () => {
    setFormState(createDefaultForm());
    setFormOpen(true);
  };

  const openEditModal = (customer: Customer) => {
    setFormState({
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      email: customer.email ?? '',
      address: customer.address ?? '',
      tier: customer.tier,
    });
    setFormOpen(true);
  };

  const saveCustomer = async () => {
    if (!formState.name.trim()) {
      toast.error('Vui lòng nhập họ và tên');
      return;
    }

    if (!PHONE_REGEX.test(formState.phone.trim())) {
      toast.error('So dien thoai phai dung 10 so', 'Dinh dang dung: 0xxxxxxxxx');
      return;
    }

    if (formState.email && !/^\S+@\S+\.\S+$/.test(formState.email)) {
      toast.error('Email không hợp lệ');
      return;
    }

    setSavingForm(true);

    try {
      if (formState.id) {
        const updated = await updateCustomerApi(formState.id, {
          name: formState.name.trim(),
          phone: formState.phone.trim(),
          email: formState.email.trim() || undefined,
          address: formState.address.trim() || undefined,
          tier: formState.tier,
        });

        setCustomerList((prev) => prev.map((item) => (item.id === formState.id ? updated : item)));
        toast.success('Cập nhật khách hàng thành công');
      } else {
        const created = await createCustomerApi({
          name: formState.name.trim(),
          phone: formState.phone.trim(),
          email: formState.email.trim() || undefined,
          address: formState.address.trim() || undefined,
          tier: formState.tier,
        });

        setCustomerList((prev) => [created, ...prev]);
        toast.success('Thêm khách hàng thành công');
      }

      setFormOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Lưu khách hàng thất bại');
    } finally {
      setSavingForm(false);
    }
  };

  const handleExportExcel = () => {
    exportRowsToExcel({
      fileName: 'khach-hang',
      sheetName: 'KhachHang',
      headers: ['Ho ten', 'So dien thoai', 'Email', 'Tong don', 'Tong chi tieu', 'Hang', 'Ngay tao'],
      rows: filteredCustomers.map((item) => [
        item.name,
        item.phone,
        item.email ?? '',
        item.totalOrders,
        item.totalSpent,
        item.tier === 'vip' ? 'VIP' : 'Thuong',
        format(item.createdAt, 'dd/MM/yyyy'),
      ]),
    });

    toast.success('Đã xuất file Excel khách hàng');
  };

  const columns: ColumnDef<Customer>[] = [
    {
      id: 'customer',
      header: '',
      size: 220,
      accessorFn: (row) => row.name,
      cell: ({ row }) => {
        const customer = row.original;

        return (
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#EEF3FD] text-[13px] font-semibold text-[var(--color-accent)]">
              {initialsOfName(customer.name)}
            </div>
            <div className="min-w-0">
              <p className="truncate text-[14px] font-medium text-[var(--color-text-primary)]">{customer.name}</p>
              <p className="truncate text-xs text-[var(--color-text-secondary)]">{customer.email ?? 'Chưa cập nhật email'}</p>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'phone',
      header: 'SỐ ĐIỆN THOẠI',
      cell: ({ row }) => (
        <span className="font-[var(--font-mono)] text-[13px] text-[var(--color-text-secondary)]">{row.original.phone}</span>
      ),
    },
    {
      accessorKey: 'totalOrders',
      header: 'TỔNG ĐƠN',
      cell: ({ row }) => <div className="text-center text-[13px]">{row.original.totalOrders}</div>,
    },
    {
      accessorKey: 'totalSpent',
      header: 'TỔNG CHI TIÊU',
      cell: ({ row }) => (
        <div className="text-right font-[var(--font-mono)] text-[14px] font-semibold text-[var(--color-text-primary)]">
          {formatVND(row.original.totalSpent)}
        </div>
      ),
    },
    {
      id: 'lastOrder',
      header: 'ĐƠN GẦN NHẤT',
      accessorFn: (row) => row.lastOrderAt,
      cell: ({ row }) => (
        <span className="text-[13px] text-[var(--color-text-secondary)]">
          {row.original.lastOrderAt
            ? formatRelativeTime(row.original.lastOrderAt)
            : 'Chưa có'}
        </span>
      ),
    },
    {
      accessorKey: 'tier',
      header: 'HẠNG',
      cell: ({ row }) => {
        const isVip = row.original.tier === 'vip';
        return isVip ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-[#FFF8E7] px-2.5 py-1 text-xs font-medium text-[#D97706]">
            <Crown size={12} /> VIP
          </span>
        ) : (
          <span className="inline-flex rounded-full bg-[#F7F6F4] px-2.5 py-1 text-xs font-medium text-[var(--color-text-secondary)]">
            Thường
          </span>
        );
      },
    },
    {
      id: 'actions',
      header: '',
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            className="rounded-[6px] p-1.5 text-[var(--color-text-secondary)] hover:bg-[var(--color-bg)]"
            onClick={(event) => {
              event.stopPropagation();
              setSelectedCustomer(row.original);
            }}
          >
            <Eye size={16} />
          </button>
          <button
            type="button"
            className="rounded-[6px] p-1.5 text-[var(--color-text-secondary)] hover:bg-[var(--color-bg)]"
            onClick={(event) => {
              event.stopPropagation();
              openEditModal(row.original);
            }}
          >
            <Pencil size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <section className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-[var(--font-display)] text-[24px] font-semibold text-[var(--color-text-primary)]">Khách hàng</h1>

        <div className="flex items-center gap-2">
          <Button variant="outline" className="h-9 gap-2" onClick={handleExportExcel}>
            <Download size={16} />
            Xuất Excel
          </Button>
          <Button className="h-9 gap-2" onClick={openCreateModal}>
            <UserPlus size={16} />
            Thêm khách hàng
          </Button>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        <div className="flex h-[88px] items-center gap-4 rounded-[12px] border border-[var(--color-border)] bg-[var(--color-surface)] px-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-[var(--color-accent-light)] text-[var(--color-accent)]">
            <Users size={18} />
          </div>
          <div>
            <p className="text-xs text-[var(--color-text-secondary)]">Tổng khách hàng</p>
            <p className="text-[22px] font-semibold text-[var(--color-text-primary)]">{totalCustomers}</p>
          </div>
        </div>

        <div className="flex h-[88px] items-center gap-4 rounded-[12px] border border-[var(--color-border)] bg-[var(--color-surface)] px-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-[var(--color-accent-light)] text-[var(--color-accent)]">
            <UserPlus size={18} />
          </div>
          <div>
            <p className="text-xs text-[var(--color-text-secondary)]">Khách mới tháng này</p>
            <p className="text-[22px] font-semibold text-[var(--color-text-primary)]">8</p>
          </div>
        </div>

        <div className="flex h-[88px] items-center gap-4 rounded-[12px] border border-[var(--color-border)] bg-[var(--color-surface)] px-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-[#FFF8E7] text-[#D97706]">
            <Crown size={18} />
          </div>
          <div>
            <p className="text-xs text-[var(--color-text-secondary)]">Khách VIP</p>
            <p className="text-[22px] font-semibold text-[var(--color-text-primary)]">{vipCount}</p>
          </div>
        </div>
      </section>

      <section className="flex flex-wrap items-center gap-3">
        <Input
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          className="h-9 w-[280px]"
          placeholder="Tìm theo tên, số điện thoại..."
        />

        <Select value={tierFilter} onValueChange={(value) => setTierFilter((value ?? 'all') as TierFilter)}>
          <SelectTrigger className="h-9 min-w-40">
            <SelectValue>{tierFilterLabelMap[tierFilter]}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả hạng</SelectItem>
            <SelectItem value="regular">Khách thường</SelectItem>
            <SelectItem value="vip">Khách VIP</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sortMode} onValueChange={(value) => setSortMode((value ?? 'newest') as SortMode)}>
          <SelectTrigger className="h-9 min-w-44">
            <SelectValue>{sortModeLabelMap[sortMode]}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Mới nhất</SelectItem>
            <SelectItem value="spent">Chi tiêu cao nhất</SelectItem>
            <SelectItem value="orders">Nhiều đơn nhất</SelectItem>
          </SelectContent>
        </Select>
      </section>

      <DataTable
        data={filteredCustomers}
        columns={columns}
        emptyState={{
          icon: Users,
          title: 'Không tìm thấy khách hàng',
          description: 'Hãy thử thay đổi bộ lọc hoặc thêm khách hàng mới.',
        }}
      />

      <Sheet open={!!selectedCustomer} onOpenChange={(open) => !open && setSelectedCustomer(null)}>
        <SheetContent side="right" className="w-[480px] max-w-[480px] bg-[var(--color-surface)] p-0" showCloseButton={false}>
          {selectedCustomer ? (
            <>
              <SheetHeader className="border-b border-[var(--color-border)] p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#EEF3FD] text-sm font-semibold text-[var(--color-accent)]">
                      {initialsOfName(selectedCustomer.name)}
                    </div>
                    <div>
                      <SheetTitle className="text-[20px] font-semibold text-[var(--color-text-primary)]">
                        {selectedCustomer.name}
                      </SheetTitle>
                      <SheetDescription className="text-[13px] text-[var(--color-text-secondary)]">
                        Khách hàng từ {format(selectedCustomer.createdAt, "MM/yyyy", { locale: vi })}
                      </SheetDescription>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="rounded-[6px] p-1 text-[var(--color-text-secondary)] hover:bg-[var(--color-bg)]"
                    onClick={() => setSelectedCustomer(null)}
                  >
                    <X size={16} />
                  </button>
                </div>
              </SheetHeader>

              <div className="min-h-0 flex-1 overflow-y-auto p-5">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="mb-1 text-[11px] uppercase tracking-[0.08em] text-[var(--color-text-muted)]">SĐT</p>
                    <p className="text-[14px] font-medium text-[var(--color-text-primary)]">{selectedCustomer.phone}</p>
                  </div>
                  <div>
                    <p className="mb-1 text-[11px] uppercase tracking-[0.08em] text-[var(--color-text-muted)]">Email</p>
                    <p className="truncate text-[14px] font-medium text-[var(--color-text-primary)]">{selectedCustomer.email ?? '-'}</p>
                  </div>
                  <div>
                    <p className="mb-1 text-[11px] uppercase tracking-[0.08em] text-[var(--color-text-muted)]">Địa chỉ</p>
                    <p className="text-[14px] font-medium text-[var(--color-text-primary)]">{selectedCustomer.address ?? '-'}</p>
                  </div>
                  <div>
                    <p className="mb-1 text-[11px] uppercase tracking-[0.08em] text-[var(--color-text-muted)]">Ngày tham gia</p>
                    <p className="text-[14px] font-medium text-[var(--color-text-primary)]">
                      {format(selectedCustomer.createdAt, 'dd/MM/yyyy', { locale: vi })}
                    </p>
                  </div>
                </div>

                <div className="my-4 grid grid-cols-3 gap-2 rounded-[10px] bg-[#F7F6F4] p-4">
                  <div>
                    <p className="text-xs text-[var(--color-text-muted)]">Tổng đơn</p>
                    <p className="text-[16px] font-semibold text-[var(--color-text-primary)]">{selectedCustomer.totalOrders}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--color-text-muted)]">Tổng chi tiêu</p>
                    <p className="text-[16px] font-semibold text-[var(--color-text-primary)]">{formatVND(selectedCustomer.totalSpent)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--color-text-muted)]">Đơn gần nhất</p>
                    <p className="text-[16px] font-semibold text-[var(--color-text-primary)]">
                      {selectedCustomer.lastOrderAt
                        ? formatRelativeTime(selectedCustomer.lastOrderAt)
                        : 'Chưa có'}
                    </p>
                  </div>
                </div>

                <section>
                  <h3 className="mb-2 text-[15px] font-semibold text-[var(--color-text-primary)]">Lịch sử mua hàng</h3>

                  <div className="mb-2 flex items-center gap-4 border-b border-[var(--color-border)]">
                    {([
                      { key: 'all', label: 'Tất cả' },
                      { key: 'paid', label: 'Đã thanh toán' },
                      { key: 'cancelled', label: 'Đã hủy' },
                    ] as const).map((tab) => {
                      const active = historyFilter === tab.key;
                      return (
                        <button
                          key={tab.key}
                          type="button"
                          onClick={() => setHistoryFilter(tab.key)}
                          className={
                            active
                              ? 'border-b-2 border-[var(--color-text-primary)] pb-2 text-[13px] font-semibold text-[var(--color-text-primary)]'
                              : 'pb-2 text-[13px] text-[var(--color-text-secondary)]'
                          }
                        >
                          {tab.label}
                        </button>
                      );
                    })}
                  </div>

                  {selectedCustomerOrders.length === 0 ? (
                    <EmptyState
                      icon={Users}
                      title="Không có đơn hàng"
                      description="Khách hàng chưa có đơn phù hợp với bộ lọc."
                    />
                  ) : (
                    <div>
                      {selectedCustomerOrders.map((order: Order) => (
                        <div key={order.id} className="border-b border-[#F0EEE9] py-3">
                          <div className="mb-1 flex items-start justify-between gap-2">
                            <button type="button" className="font-[var(--font-mono)] text-[13px] text-[var(--color-text-secondary)] underline-offset-2 hover:underline">
                              #{order.orderNumber}
                            </button>
                            <p className="text-right text-[14px] font-semibold text-[var(--color-text-primary)]">
                              {formatVND(order.total)}
                            </p>
                          </div>

                          <div className="mb-1 flex items-center justify-between gap-2">
                            <p className="truncate text-[13px] text-[var(--color-text-secondary)]">
                              {order.items
                                .slice(0, 2)
                                .map((item) => `${item.productName} ×${item.quantity}`)
                                .join(', ')}
                            </p>
                            <span
                              className={
                                order.status === 'paid'
                                  ? 'rounded-full bg-[var(--color-success-bg)] px-2 py-0.5 text-[11px] text-[var(--color-success)]'
                                  : 'rounded-full bg-[var(--color-error-bg)] px-2 py-0.5 text-[11px] text-[var(--color-error)]'
                              }
                            >
                              {order.status === 'paid' ? 'Đã TT' : 'Đã hủy'}
                            </span>
                          </div>

                          <p className="text-[12px] text-[var(--color-text-muted)]">
                            {format(order.createdAt, "d 'tháng' M, yyyy", { locale: vi })}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-[520px]">
          <DialogHeader>
            <DialogTitle>{formState.id ? 'Chỉnh sửa khách hàng' : 'Thêm khách hàng'}</DialogTitle>
            <DialogDescription>Nhập thông tin khách hàng và lưu thay đổi.</DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div>
              <Label>Họ và tên*</Label>
              <Input
                className="mt-1 h-9"
                value={formState.name}
                onChange={(event) => setFormState((prev) => ({ ...prev, name: event.target.value }))}
              />
            </div>
            <div>
              <Label>Số điện thoại*</Label>
              <Input
                type="tel"
                pattern="0[0-9]{9}"
                inputMode="numeric"
                maxLength={10}
                className="mt-1 h-9"
                value={formState.phone}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, phone: sanitizePhoneInput(event.target.value) }))
                }
              />
              {isFormPhoneInvalid ? (
                <p className="mt-1 text-xs text-[var(--color-danger,#dc2626)]">So dien thoai phai dung 10 so, bat dau bang 0.</p>
              ) : null}
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                className="mt-1 h-9"
                value={formState.email}
                onChange={(event) => setFormState((prev) => ({ ...prev, email: event.target.value }))}
              />
            </div>
            <div>
              <Label>Địa chỉ</Label>
              <textarea
                rows={2}
                className="mt-1 w-full rounded-[8px] border border-[var(--color-border)] px-3 py-2 text-sm outline-none focus:border-[var(--color-accent)]"
                value={formState.address}
                onChange={(event) => setFormState((prev) => ({ ...prev, address: event.target.value }))}
              />
            </div>
            <div>
              <Label>Hạng khách hàng</Label>
              <div className="mt-2 flex gap-2">
                <label className="flex items-center gap-2 rounded-[8px] border border-[var(--color-border)] px-3 py-2 text-sm">
                  <input
                    type="radio"
                    checked={formState.tier === 'regular'}
                    onChange={() => setFormState((prev) => ({ ...prev, tier: 'regular' }))}
                  />
                  Khách thường
                </label>
                <label className="flex items-center gap-2 rounded-[8px] border border-[var(--color-border)] px-3 py-2 text-sm">
                  <input
                    type="radio"
                    checked={formState.tier === 'vip'}
                    onChange={() => setFormState((prev) => ({ ...prev, tier: 'vip' }))}
                  />
                  Khách VIP
                </label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)} disabled={savingForm}>
              Hủy
            </Button>
            <Button onClick={saveCustomer} disabled={savingForm || isFormPhoneInvalid}>
              {savingForm ? 'Đang lưu...' : 'Lưu'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
