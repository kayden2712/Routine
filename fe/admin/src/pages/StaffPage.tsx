import { useEffect, useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import {
  Download,
  Pencil,
  ShieldCheck,
  UserCog,
  UserPlus,
  Users,
  UserX,
} from 'lucide-react';
import { DataTable } from '@/components/shared/DataTable';
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
  createStaffApi,
  fetchStaffApi,
  updateStaffApi,
  updateStaffStatusApi,
} from '@/lib/backendApi';
import { exportRowsToExcel } from '@/lib/excel';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/lib/toast';
import { formatRelativeTime } from '@/lib/utils';
import { format } from 'date-fns';

type StaffRole = 'admin' | 'manager' | 'sales' | 'warehouse' | 'accountant';
type StaffEmployeeType = 'fulltime' | 'parttime';
type StaffStatus = 'active' | 'inactive';
type StaffRoleFilter = 'all' | StaffRole;
type StaffStatusFilter = 'all' | StaffStatus;

interface StaffMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: StaffRole;
  employeeType?: StaffEmployeeType;
  baseSalary?: number;
  status: StaffStatus;
  branch: string;
  createdAt: Date;
  lastActiveAt?: Date;
}

interface StaffFormState {
  id?: string;
  name: string;
  email: string;
  phone: string;
  password: string;
  role: StaffRole;
  employeeType: StaffEmployeeType;
  baseSalary: string;
  status: StaffStatus;
  branch: string;
}

const roleLabelMap: Record<StaffRole, string> = {
  manager: 'Quản lý',
  admin: 'Quản lý',
  sales: 'Bán hàng',
  warehouse: 'Kho',
  accountant: 'Kế toán',
};

const roleFilterLabelMap: Record<StaffRoleFilter, string> = {
  all: 'Tất cả vai trò',
  manager: 'Quản lý',
  admin: 'Quản lý',
  sales: 'Bán hàng',
  warehouse: 'Kho',
  accountant: 'Kế toán',
};

const employeeTypeLabelMap: Record<StaffEmployeeType, string> = {
  fulltime: 'Toàn thời gian',
  parttime: 'Bán thời gian',
};

function formatKValue(value: number): string {
  return `${Math.round(value).toLocaleString('vi-VN')}k`;
}

const statusFilterLabelMap: Record<StaffStatusFilter, string> = {
  all: 'Tất cả trạng thái',
  active: 'Đang làm việc',
  inactive: 'Tạm khóa',
};

const statusLabelMap: Record<StaffStatus, string> = {
  active: 'Đang làm việc',
  inactive: 'Tạm khóa',
};

function createDefaultForm(): StaffFormState {
  return {
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'sales',
    employeeType: 'fulltime',
    baseSalary: '',
    status: 'active',
    branch: '',
  };
}

function normalize(value: unknown): string {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

function initialsOfName(name: unknown): string {
  return String(name ?? '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export function StaffPage() {
  useEffect(() => {
    document.title = 'Nhân viên | Routine';
  }, []);

  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<StaffRoleFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StaffStatusFilter>('all');

  const [formOpen, setFormOpen] = useState(false);
  const [savingForm, setSavingForm] = useState(false);
  const [formState, setFormState] = useState<StaffFormState>(createDefaultForm());

  useEffect(() => {
    const loadStaff = async () => {
      try {
        const staff = await fetchStaffApi();
        setStaffList(staff);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Không thể tải danh sách nhân viên');
      }
    };

    void loadStaff();
  }, []);

  const totalStaff = staffList.length;
  const activeStaff = staffList.filter((item) => item.status === 'active').length;
  const inactiveStaff = totalStaff - activeStaff;
  const managerCount = staffList.filter((item) => item.role === 'manager' || item.role === 'admin').length;
  const fulltimeCount = staffList.filter((item) => item.employeeType === 'fulltime').length;
  const parttimeCount = staffList.filter((item) => item.employeeType === 'parttime').length;

  const thisMonth = new Date().getMonth();
  const thisYear = new Date().getFullYear();
  const createdThisMonth = staffList.filter((item) => {
    const date = item.createdAt instanceof Date ? item.createdAt : new Date(item.createdAt);

    if (Number.isNaN(date.getTime())) {
      return false;
    }

    return date.getMonth() === thisMonth && date.getFullYear() === thisYear;
  }).length;

  const filteredStaff = useMemo(() => {
    const query = normalize(searchTerm.trim());

    return staffList
      .filter((staff) => {
        const bySearch =
          query.length === 0 ||
          normalize(staff.name).includes(query) ||
          normalize(staff.phone).includes(query) ||
          normalize(staff.email).includes(query);

        const byRole = roleFilter === 'all' || staff.role === roleFilter;
        const byStatus = statusFilter === 'all' || staff.status === statusFilter;

        return bySearch && byRole && byStatus;
      })
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }, [roleFilter, searchTerm, staffList, statusFilter]);

  const openCreateModal = () => {
    setFormState(createDefaultForm());
    setFormOpen(true);
  };

  const openEditModal = (staff: StaffMember) => {
    setFormState({
      id: staff.id,
      name: staff.name,
      email: staff.email,
      phone: staff.phone,
      password: '',
      role: staff.role,
      employeeType: staff.employeeType ?? 'fulltime',
      baseSalary: String(staff.baseSalary ?? 0),
      status: staff.status,
      branch: staff.branch,
    });
    setFormOpen(true);
  };

  const toggleStaffStatus = async (staff: StaffMember) => {
    const nextStatus: StaffStatus = staff.status === 'active' ? 'inactive' : 'active';
    await updateStaffStatusApi(staff.id, nextStatus === 'active');
    setStaffList((prev) =>
      prev.map((item) =>
        item.id === staff.id
          ? {
              ...item,
              status: nextStatus,
              lastActiveAt: nextStatus === 'active' ? new Date() : item.lastActiveAt,
            }
          : item,
      ),
    );

    toast.success(
      nextStatus === 'active' ? 'Đã kích hoạt nhân viên' : 'Đã tạm khóa nhân viên',
      `${staff.name} - ${roleLabelMap[staff.role]}`,
    );
  };

  const handleSaveStaff = async () => {
    if (!formState.name.trim()) {
      toast.error('Vui lòng nhập họ tên nhân viên');
      return;
    }

    if (!/^0[0-9]{9}$/.test(formState.phone.trim())) {
      toast.error('Số điện thoại không hợp lệ', 'Định dạng đúng: 0xxxxxxxxx');
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(formState.email.trim())) {
      toast.error('Email không hợp lệ');
      return;
    }

    if (!formState.branch.trim()) {
      toast.error('Vui lòng nhập chi nhánh làm việc');
      return;
    }

    if (!formState.id && formState.password.length < 8) {
      toast.error('Mật khẩu nhân viên phải có ít nhất 8 ký tự');
      return;
    }

    setSavingForm(true);

    try {
      if (formState.id) {
        await updateStaffApi(formState.id, {
          name: formState.name.trim(),
          email: formState.email.trim(),
          phone: formState.phone.trim(),
          role: formState.role,
          employeeType: formState.employeeType,
          baseSalary: Number(formState.baseSalary || 0),
          status: formState.status,
          branch: formState.branch.trim(),
        });
        toast.success('Cập nhật nhân viên thành công');
      } else {
        await createStaffApi({
          name: formState.name.trim(),
          email: formState.email.trim(),
          phone: formState.phone.trim(),
          password: formState.password,
          role: formState.role,
          employeeType: formState.employeeType,
          baseSalary: Number(formState.baseSalary || 0),
          status: formState.status,
          branch: formState.branch.trim(),
        });
        toast.success('Thêm nhân viên thành công');
      }

      const staff = await fetchStaffApi();
      setStaffList(staff);
      setFormOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Lưu thông tin nhân viên thất bại');
    } finally {
      setSavingForm(false);
    }
  };

  const handleExportExcel = () => {
    exportRowsToExcel({
      fileName: 'nhan-vien',
      sheetName: 'NhanVien',
      headers: ['Ho ten', 'Email', 'So dien thoai', 'Vai tro', 'Loai nhan vien', 'Luong/1h (k)', 'Trang thai', 'Chi nhanh', 'Ngay tao'],
      rows: filteredStaff.map((item) => [
        item.name,
        item.email,
        item.phone,
        roleLabelMap[item.role],
        employeeTypeLabelMap[item.employeeType ?? 'fulltime'],
        formatKValue(item.baseSalary ?? 0),
        item.status === 'active' ? 'Dang lam viec' : 'Tam khoa',
        item.branch,
        format(item.createdAt, 'dd/MM/yyyy'),
      ]),
    });

    toast.success('Đã xuất file Excel nhân viên');
  };

  const columns: ColumnDef<StaffMember>[] = [
    {
      id: 'staff',
      header: 'NHÂN VIÊN',
      accessorFn: (row) => row.name,
      cell: ({ row }) => {
        const staff = row.original;
        return (
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#EEF3FD] text-[13px] font-semibold text-[var(--color-accent)]">
              {initialsOfName(staff.name)}
            </div>
            <div className="min-w-0">
              <p className="truncate text-[14px] font-medium text-[var(--color-text-primary)]">{staff.name}</p>
              <p className="truncate text-xs text-[var(--color-text-secondary)]">{staff.email}</p>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'role',
      header: 'VAI TRÒ',
      cell: ({ row }) => (
        <span className="inline-flex rounded-full bg-[#F7F6F4] px-2.5 py-1 text-xs font-medium text-[var(--color-text-secondary)]">
          {roleLabelMap[row.original.role]}
        </span>
      ),
    },
    {
      accessorKey: 'employeeType',
      header: 'LOẠI',
      cell: ({ row }) => (
        <span className="inline-flex rounded-full bg-[var(--color-accent-light)] px-2.5 py-1 text-xs font-medium text-[var(--color-accent)]">
          {employeeTypeLabelMap[row.original.employeeType ?? 'fulltime']}
        </span>
      ),
    },
    {
      accessorKey: 'baseSalary',
      header: 'LƯƠNG/1H (K)',
      cell: ({ row }) => (
        <span className="font-[var(--font-mono)] text-[13px] text-[var(--color-text-secondary)]">
          {formatKValue(row.original.baseSalary ?? 0)}
        </span>
      ),
    },
    {
      accessorKey: 'phone',
      header: 'SỐ ĐIỆN THOẠI',
      cell: ({ row }) => (
        <span className="font-[var(--font-mono)] text-[13px] text-[var(--color-text-secondary)]">{row.original.phone}</span>
      ),
    },
    {
      accessorKey: 'branch',
      header: 'CHI NHÁNH',
      cell: ({ row }) => <span className="text-[13px] text-[var(--color-text-primary)]">{row.original.branch}</span>,
    },
    {
      accessorKey: 'status',
      header: 'TRẠNG THÁI',
      cell: ({ row }) => {
        const isActive = row.original.status === 'active';
        return (
          <span
            className="inline-flex rounded-full px-2.5 py-1 text-xs font-medium"
            style={{
              backgroundColor: isActive ? 'var(--color-success-bg)' : '#F3F2F0',
              color: isActive ? 'var(--color-success)' : 'var(--color-text-secondary)',
            }}
          >
            {isActive ? 'Đang làm việc' : 'Tạm khóa'}
          </span>
        );
      },
    },
    {
      id: 'lastActiveAt',
      header: 'HOẠT ĐỘNG GẦN NHẤT',
      accessorFn: (row) => row.lastActiveAt,
      cell: ({ row }) => (
        <span className="text-[13px] text-[var(--color-text-secondary)]">
          {row.original.lastActiveAt ? formatRelativeTime(row.original.lastActiveAt) : 'Chưa có'}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      enableSorting: false,
      cell: ({ row }) => {
        const staff = row.original;
        const isActive = staff.status === 'active';

        return (
          <div className="flex items-center justify-end gap-1">
            <button
              type="button"
              className="rounded-[6px] p-1.5 text-[var(--color-text-secondary)] hover:bg-[var(--color-bg)]"
              onClick={(event) => {
                event.stopPropagation();
                openEditModal(staff);
              }}
            >
              <Pencil size={16} />
            </button>
            <button
              type="button"
              className="rounded-[6px] p-1.5 text-[var(--color-text-secondary)] hover:bg-[var(--color-bg)] hover:text-[var(--color-error)]"
              onClick={(event) => {
                event.stopPropagation();
                toggleStaffStatus(staff);
              }}
            >
              <UserX size={16} />
            </button>
            {!isActive ? (
              <span className="rounded-[6px] bg-[#F7F6F4] px-2 py-1 text-[10px] font-medium uppercase tracking-[0.06em] text-[var(--color-text-muted)]">
                Tạm khóa
              </span>
            ) : null}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-5">
      <section className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-[var(--font-display)] text-[24px] font-semibold text-[var(--color-text-primary)]">Nhân viên</h1>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="h-9 gap-2"
            onClick={handleExportExcel}
          >
            <Download size={16} />
            Xuất Excel
          </Button>
          <Button className="h-9 gap-2" onClick={openCreateModal}>
            <UserPlus size={16} />
            Thêm nhân viên
          </Button>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-4">
        <div className="flex h-[88px] items-center gap-4 rounded-[12px] border border-[var(--color-border)] bg-[var(--color-surface)] px-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-[var(--color-accent-light)] text-[var(--color-accent)]">
            <Users size={18} />
          </div>
          <div>
            <p className="text-xs text-[var(--color-text-secondary)]">Tổng nhân viên</p>
            <p className="text-[22px] font-semibold text-[var(--color-text-primary)]">{totalStaff}</p>
          </div>
        </div>

        <div className="flex h-[88px] items-center gap-4 rounded-[12px] border border-[var(--color-border)] bg-[var(--color-surface)] px-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-[var(--color-accent-light)] text-[var(--color-accent)]">
            <ShieldCheck size={18} />
          </div>
          <div>
            <p className="text-xs text-[var(--color-text-secondary)]">Đang làm việc</p>
            <p className="text-[22px] font-semibold text-[var(--color-text-primary)]">{activeStaff}</p>
          </div>
        </div>

        <div className="flex h-[88px] items-center gap-4 rounded-[12px] border border-[var(--color-border)] bg-[var(--color-surface)] px-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-[#FFF8E7] text-[#D97706]">
            <UserCog size={18} />
          </div>
          <div>
            <p className="text-xs text-[var(--color-text-secondary)]">Quản lý</p>
            <p className="text-[22px] font-semibold text-[var(--color-text-primary)]">{managerCount}</p>
          </div>
        </div>

        <div className="flex h-[88px] items-center gap-4 rounded-[12px] border border-[var(--color-border)] bg-[var(--color-surface)] px-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-[#FEEEEE] text-[var(--color-error)]">
            <UserX size={18} />
          </div>
          <div>
            <p className="text-xs text-[var(--color-text-secondary)]">Tạm khóa</p>
            <p className="text-[22px] font-semibold text-[var(--color-text-primary)]">{inactiveStaff}</p>
          </div>
        </div>

          <div className="flex h-[88px] items-center gap-4 rounded-[12px] border border-[var(--color-border)] bg-[var(--color-surface)] px-5">
            <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-[var(--color-success-bg)] text-[var(--color-success)]">
              <Users size={18} />
            </div>
            <div>
              <p className="text-xs text-[var(--color-text-secondary)]">Fulltime / Parttime</p>
              <p className="text-[22px] font-semibold text-[var(--color-text-primary)]">
                {fulltimeCount} / {parttimeCount}
              </p>
            </div>
          </div>
      </section>

      <section className="rounded-[12px] border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
        <div className="grid gap-2 md:grid-cols-[1fr_220px_200px_auto]">
          <Input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Tìm theo tên, email, số điện thoại"
            className="h-9"
          />

          <Select value={roleFilter} onValueChange={(value) => setRoleFilter((value ?? 'all') as StaffRoleFilter)}>
            <SelectTrigger className="h-9">
              <SelectValue>{roleFilterLabelMap[roleFilter]}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả vai trò</SelectItem>
              <SelectItem value="manager">Quản lý</SelectItem>
              <SelectItem value="sales">Bán hàng</SelectItem>
              <SelectItem value="warehouse">Kho</SelectItem>
              <SelectItem value="accountant">Kế toán</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={(value) => setStatusFilter((value ?? 'all') as StaffStatusFilter)}>
            <SelectTrigger className="h-9">
              <SelectValue>{statusFilterLabelMap[statusFilter]}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả trạng thái</SelectItem>
              <SelectItem value="active">Đang làm việc</SelectItem>
              <SelectItem value="inactive">Tạm khóa</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="ghost"
            className="h-9"
            onClick={() => {
              setSearchTerm('');
              setRoleFilter('all');
              setStatusFilter('all');
            }}
          >
            Xóa lọc
          </Button>
        </div>

        <p className="mt-2 text-xs text-[var(--color-text-muted)]">
          Mới trong tháng: {createdThisMonth} nhân viên
        </p>
      </section>

      <DataTable
        data={filteredStaff}
        columns={columns}
        pageSize={8}
        onRowClick={(staff) => openEditModal(staff)}
        emptyState={{
          icon: Users,
          title: 'Không tìm thấy nhân viên',
          description: 'Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.',
          action: (
            <Button size="sm" onClick={openCreateModal}>
              Thêm nhân viên
            </Button>
          ),
        }}
      />

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>{formState.id ? 'Cập nhật nhân viên' : 'Thêm nhân viên mới'}</DialogTitle>
            <DialogDescription>
              Quản lý thông tin tài khoản nội bộ cho nhân viên của cửa hàng.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="staff-name">Họ tên</Label>
              <Input
                id="staff-name"
                value={formState.name}
                onChange={(event) => setFormState((prev) => ({ ...prev, name: event.target.value }))}
                placeholder="Nhập họ tên nhân viên"
              />
            </div>

            <div className="grid gap-2 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="staff-email">Email công việc</Label>
                <Input
                  id="staff-email"
                  value={formState.email}
                  onChange={(event) => setFormState((prev) => ({ ...prev, email: event.target.value }))}
                  placeholder="ten@routine.vn"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="staff-phone">Số điện thoại</Label>
                <Input
                  id="staff-phone"
                  value={formState.phone}
                  onChange={(event) => setFormState((prev) => ({ ...prev, phone: event.target.value }))}
                  placeholder="0xxxxxxxxx"
                />
              </div>
            </div>

            {!formState.id ? (
              <div className="grid gap-2">
                <Label htmlFor="staff-password">Mật khẩu đăng nhập</Label>
                <Input
                  id="staff-password"
                  type="password"
                  value={formState.password}
                  onChange={(event) => setFormState((prev) => ({ ...prev, password: event.target.value }))}
                  placeholder="Tối thiểu 8 ký tự"
                />
                <p className="text-xs text-[var(--color-text-muted)]">
                  Nhân viên sẽ dùng mật khẩu này để đăng nhập lần đầu.
                </p>
              </div>
            ) : null}

            <div className="grid gap-2 md:grid-cols-2">
              <div className="grid gap-2">
                <Label>Vai trò</Label>
                <Select
                  value={formState.role}
                  onValueChange={(value) => setFormState((prev) => ({ ...prev, role: value as StaffRole }))}
                >
                  <SelectTrigger>
                    <SelectValue>{roleLabelMap[formState.role]}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manager">Quản lý</SelectItem>
                    <SelectItem value="sales">Bán hàng</SelectItem>
                    <SelectItem value="warehouse">Kho</SelectItem>
                    <SelectItem value="accountant">Kế toán</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Loại nhân viên</Label>
                <Select
                  value={formState.employeeType}
                  onValueChange={(value) => setFormState((prev) => ({ ...prev, employeeType: value as StaffEmployeeType }))}
                >
                  <SelectTrigger>
                    <SelectValue>{employeeTypeLabelMap[formState.employeeType]}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fulltime">Toàn thời gian</SelectItem>
                    <SelectItem value="parttime">Bán thời gian</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="staff-base-salary">Lương/1h (k)</Label>
                <Input
                  id="staff-base-salary"
                  value={formState.baseSalary}
                  onChange={(event) => setFormState((prev) => ({ ...prev, baseSalary: event.target.value.replace(/[^0-9]/g, '') }))}
                  placeholder="Ví dụ: 50"
                />
              </div>

              <div className="grid gap-2">
                <Label>Trạng thái</Label>
                <Select
                  value={formState.status}
                  onValueChange={(value) =>
                    setFormState((prev) => ({ ...prev, status: value as StaffStatus }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue>{statusLabelMap[formState.status]}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Đang làm việc</SelectItem>
                    <SelectItem value="inactive">Tạm khóa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <p className="text-xs text-[var(--color-text-muted)]">
              Lương/1h nhập theo nghìn đồng (k). Ví dụ nhập 50 nghĩa là 50,000 VND/giờ.
            </p>

            <div className="grid gap-2">
              <Label htmlFor="staff-branch">Chi nhánh</Label>
              <Input
                id="staff-branch"
                value={formState.branch}
                onChange={(event) => setFormState((prev) => ({ ...prev, branch: event.target.value }))}
                placeholder="Ví dụ: Routine Q1"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              Huy
            </Button>
            <Button onClick={handleSaveStaff} disabled={savingForm}>
              {savingForm ? 'Đang lưu...' : formState.id ? 'Lưu thay đổi' : 'Tạo nhân viên'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
