import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, CircleDollarSign, ClipboardList, ShieldAlert, Users } from 'lucide-react';
import { KPICard } from '@/components/shared/KPICard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  approvePayrollApi,
  fetchPayrollApi,
  fetchPayrollEmployeesApi,
  generatePayrollApi,
  updatePayrollApi,
} from '@/lib/backendApi';
import { toast } from '@/lib/toast';
import { formatVND } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import type { PayrollDto, PayrollEmployee } from '@/types';

interface PayrollRow {
  employeeId: number;
  name: string;
  type: 'fulltime' | 'parttime';
  accountStatus: 'ACTIVE' | 'LOCKED';
  baseSalary: number;
  dept?: string;
  hoursWorked: string;
  bonus: string;
  penalty: string;
  grossSalary: number;
  netSalary: number;
  errors: Partial<Record<'hoursWorked' | 'bonus' | 'penalty', string>>;
}

function onlyInteger(value: string): string {
  return value.replace(/[^0-9]/g, '');
}

function normalizeHourlySalary(value?: number): number {
  const safe = Number(value ?? 0);
  return Number.isFinite(safe) && safe > 0 ? safe : 1000;
}

function formatHourlyK(value: number): string {
  return `${Math.round((value ?? 0) / 1000).toLocaleString('vi-VN')}k`;
}

export function PayrollPage() {
  const user = useAuthStore((state) => state.user);
  const role = user?.role;

  const canEdit = role === 'accountant' || role === 'manager';
  const canApprove = role === 'manager';
  const canAccess = role === 'accountant' || role === 'manager';

  const now = new Date();
  const [month, setMonth] = useState(String(now.getMonth() + 1));
  const [year, setYear] = useState(String(now.getFullYear()));
  const [rows, setRows] = useState<PayrollRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [payrollListLoading, setPayrollListLoading] = useState(false);
  const [payrollList, setPayrollList] = useState<PayrollDto[]>([]);
  const [currentPayrollId, setCurrentPayrollId] = useState<number | null>(null);
  const [currentPayrollStatus, setCurrentPayrollStatus] = useState<'draft' | 'approved' | null>(null);
  const isApprovedPayroll = currentPayrollStatus === 'approved';
  const canEditCurrentPayroll = canEdit && !isApprovedPayroll;

  const summary = useMemo(() => {
    const fulltime = rows.filter((row) => row.type === 'fulltime').length;
    const parttime = rows.filter((row) => row.type === 'parttime').length;
    const totalNet = rows.reduce((sum, row) => sum + row.netSalary, 0);
    const totalGross = rows.reduce((sum, row) => sum + row.grossSalary, 0);
    const totalBonus = rows.reduce((sum, row) => sum + Number(row.bonus || 0) * 1000, 0);
    const totalPenalty = rows.reduce((sum, row) => sum + Number(row.penalty || 0) * 1000, 0);

    return {
      total: rows.length,
      fulltime,
      parttime,
      totalNet,
      totalGross,
      totalBonus,
      totalPenalty,
    };
  }, [rows]);

  const selectedMonth = Number(month);
  const selectedYear = Number(year);

  const recompute = (row: PayrollRow): PayrollRow => {
    const bonusAmount = Number(row.bonus || 0) * 1000;
    const penaltyAmount = Number(row.penalty || 0) * 1000;

    const hours = Number(row.hoursWorked || 0);
    const gross = hours * row.baseSalary;

    return {
      ...row,
      grossSalary: gross,
      netSalary: gross + bonusAmount - penaltyAmount,
    };
  };

  const mapEmployeesToRows = (employees: PayrollEmployee[]): PayrollRow[] => {
    return employees.map((employee) => {
      const initial: PayrollRow = {
        employeeId: employee.id,
        name: employee.name,
        type: employee.type,
        accountStatus: employee.status,
        baseSalary: normalizeHourlySalary(employee.baseSalary),
        dept: employee.dept,
        hoursWorked: '',
        bonus: '',
        penalty: '',
        grossSalary: 0,
        netSalary: 0,
        errors: {},
      };
      return recompute(initial);
    });
  };

  const mergePayrollEntries = (baseRows: PayrollRow[], payroll: PayrollDto): PayrollRow[] => {
    const byEmployeeId = new Map(payroll.entries.map((entry) => [entry.employeeId, entry]));

    const mergedBase = baseRows.map((row) => {
      const entry = byEmployeeId.get(row.employeeId);
      if (!entry) return row;

      return recompute({
        ...row,
        baseSalary: normalizeHourlySalary(Number(entry.baseSalary ?? entry.hourlyRate ?? row.baseSalary)),
        hoursWorked: entry.hoursWorked ? String(entry.hoursWorked) : '',
        bonus: String(entry.bonus ?? 0),
        penalty: String(entry.penalty ?? 0),
        grossSalary: Number(entry.grossSalary ?? row.grossSalary),
        netSalary: Number(entry.netSalary ?? row.netSalary),
        errors: {},
      });
    });

    const existingIds = new Set(mergedBase.map((row) => row.employeeId));
    const missingRows: PayrollRow[] = payroll.entries
      .filter((entry) => !existingIds.has(entry.employeeId))
      .map((entry) =>
        recompute({
          employeeId: entry.employeeId,
          name: entry.employeeName,
          type: entry.type,
          accountStatus: 'LOCKED',
          baseSalary: normalizeHourlySalary(Number(entry.baseSalary ?? entry.hourlyRate ?? 0)),
          dept: '--',
          hoursWorked: entry.hoursWorked ? String(entry.hoursWorked) : '',
          bonus: String(entry.bonus ?? 0),
          penalty: String(entry.penalty ?? 0),
          grossSalary: Number(entry.grossSalary ?? 0),
          netSalary: Number(entry.netSalary ?? 0),
          errors: {},
        }),
      );

    return [...mergedBase, ...missingRows];
  };

  const loadPayrollList = async () => {
    setPayrollListLoading(true);
    try {
      const list = await fetchPayrollApi();
      setPayrollList(list);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể tải danh sách bảng lương');
    } finally {
      setPayrollListLoading(false);
    }
  };

  useEffect(() => {
    void loadPayrollList();
  }, []);

  const loadEmployees = async () => {
    if (!selectedMonth || !selectedYear) {
      toast.error('Vui lòng chọn tháng/năm trước khi tải danh sách nhân viên');
      return;
    }

    setLoading(true);
    try {
      const [employees, payrolls] = await Promise.all([
        fetchPayrollEmployeesApi(selectedMonth, selectedYear),
        fetchPayrollApi(selectedMonth, selectedYear),
      ]);

      const activeEmployees = employees.filter((employee) => employee.status === 'ACTIVE');
      const baseRows = mapEmployeesToRows(activeEmployees);

      const existing = payrolls[0];
      setPayrollList(payrolls);
      if (!existing) {
        setRows(baseRows);
        setCurrentPayrollId(null);
        setCurrentPayrollStatus(null);
        return;
      }

      setRows(mergePayrollEntries(baseRows, existing));
      setCurrentPayrollId(existing.payrollId);
      setCurrentPayrollStatus(existing.status);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể tải dữ liệu bảng lương');
    } finally {
      setLoading(false);
    }
  };

  const openPayroll = async (payroll: PayrollDto) => {
    setLoading(true);
    setMonth(String(payroll.month));
    setYear(String(payroll.year));

    try {
      const employees = await fetchPayrollEmployeesApi(payroll.month, payroll.year);
      const activeEmployees = employees.filter((employee) => employee.status === 'ACTIVE');
      const baseRows = mapEmployeesToRows(activeEmployees);
      setRows(mergePayrollEntries(baseRows, payroll));
      setCurrentPayrollId(payroll.payrollId);
      setCurrentPayrollStatus(payroll.status);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể mở bảng lương');
    } finally {
      setLoading(false);
    }
  };

  const updateRow = (employeeId: number, field: 'hoursWorked' | 'bonus' | 'penalty', value: string) => {
    if (!canEditCurrentPayroll) {
      return;
    }

    const hasInvalidChar = /[^0-9]/.test(value) || value.includes('-');
    if (hasInvalidChar) {
      toast.error('Không được nhập ký tự hoặc số âm');
    }
    setRows((prev) =>
      prev.map((row) => {
        if (row.employeeId !== employeeId) return row;
        const next = recompute({
          ...row,
          [field]: onlyInteger(value),
          errors: {
            ...row.errors,
            [field]: hasInvalidChar ? 'Chỉ được nhập số nguyên không âm' : undefined,
          },
        });
        return next;
      }),
    );
  };

  const validateRows = (): boolean => {
    let hasError = false;

    setRows((prev) =>
      prev.map((row) => {
        const errors: PayrollRow['errors'] = {};

        const bonus = row.bonus ? Number(row.bonus) : 0;
        const penalty = row.penalty ? Number(row.penalty) : 0;
        const hours = Number(row.hoursWorked || 0);
        const hourlySalary = Number(row.baseSalary || 0);

        if (!Number.isInteger(bonus) || bonus < 0) {
          errors.bonus = 'Thưởng phải là số nguyên >= 0';
          hasError = true;
        }
        if (!Number.isInteger(penalty) || penalty < 0) {
          errors.penalty = 'Phạt phải là số nguyên >= 0';
          hasError = true;
        }

        if (!Number.isInteger(hours) || hours < 1 || hours > 744) {
          errors.hoursWorked = 'Số giờ phải từ 1-744';
          hasError = true;
        }

        if (hours > 0 && (!Number.isFinite(hourlySalary) || hourlySalary <= 0)) {
          errors.hoursWorked = 'Nhân viên chưa có lương/1h hợp lệ';
          hasError = true;
        }

        return {
          ...row,
          errors,
        };
      }),
    );

    if (hasError) {
      toast.error('Dữ liệu không hợp lệ, vui lòng kiểm tra các ô bôi đỏ');
    }

    return !hasError;
  };

  const buildPayload = () => rows.map((row) => ({
    employee_id: row.employeeId,
    type: row.type,
    hours_worked: Number(row.hoursWorked || 0),
    bonus: Number(row.bonus || 0),
    penalty: Number(row.penalty || 0),
  }));

  const handleSubmit = async () => {
    if (!canEdit) {
      toast.error('Bạn không có quyền chỉnh sửa');
      return;
    }
    if (isApprovedPayroll) {
      toast.error('Bảng lương đã phê duyệt, không thể chỉnh sửa');
      return;
    }

    if (!selectedMonth || !selectedYear) {
      toast.error('Tháng là bắt buộc khi submit');
      return;
    }

    if (!validateRows()) {
      return;
    }

    setSaving(true);
    try {
      if (currentPayrollId) {
        const result = await updatePayrollApi(currentPayrollId, {
          entries: buildPayload(),
        });

        setCurrentPayrollStatus(result.status);
        await loadPayrollList();
        toast.success('Cập nhật bảng lương thành công');
        return;
      }

      const result = await generatePayrollApi({
        month: selectedMonth,
        year: selectedYear,
        entries: buildPayload(),
      });

      setCurrentPayrollId(result.payroll_id);
      setCurrentPayrollStatus(result.status);
      await loadPayrollList();
      toast.success('Tạo bảng lương thành công');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể tạo bảng lương');
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async () => {
    if (!currentPayrollId) {
      toast.error('Chưa có bảng lương để phê duyệt');
      return;
    }

    if (!canApprove) {
      toast.error('Bạn không có quyền phê duyệt bảng lương');
      return;
    }

    try {
      await approvePayrollApi(currentPayrollId);
      setCurrentPayrollStatus('approved');
      await loadPayrollList();
      toast.success('Phê duyệt bảng lương thành công');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể phê duyệt bảng lương');
    }
  };

  if (!canAccess) {
    return (
      <section className="rounded-[12px] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <div className="flex items-center gap-3 text-[var(--color-error)]">
          <ShieldAlert size={20} />
          <p className="font-medium">Bạn không có quyền truy cập module bảng lương.</p>
        </div>
      </section>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-[var(--font-display)] text-[26px] font-semibold text-[var(--color-text-primary)]">Bảng lương</h1>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">Tạo và quản lý lương theo tháng cho nhân viên đang hoạt động.</p>
        </div>

        <div className="flex items-center gap-2">
          {canApprove && currentPayrollId && currentPayrollStatus === 'draft' ? (
            <Button variant="outline" onClick={handleApprove} className="gap-2">
              <CheckCircle2 size={16} />
              Phê duyệt
            </Button>
          ) : null}
          <Button onClick={handleSubmit} disabled={saving || loading || rows.length === 0 || !canEditCurrentPayroll}>
            {saving ? 'Đang lưu...' : isApprovedPayroll ? 'Bảng lương đã phê duyệt' : currentPayrollId ? 'Cập nhật bảng lương' : 'Tạo bảng lương'}
          </Button>
        </div>
      </div>

      {!canEdit ? (
        <div className="rounded-[10px] border border-[#FDE68A] bg-[var(--color-warning-bg)] px-4 py-3 text-sm text-[#92400E]">
          Bạn không có quyền chỉnh sửa
        </div>
      ) : null}
      {canEdit && isApprovedPayroll ? (
        <div className="rounded-[10px] border border-[#BFDBFE] bg-[#EFF6FF] px-4 py-3 text-sm text-[#1D4ED8]">
          Bảng lương này đã được phê duyệt nên không thể chỉnh sửa.
        </div>
      ) : null}

      <section className="rounded-[12px] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <p className="text-sm font-medium text-[var(--color-text-primary)]">Danh sách bảng lương theo tháng</p>
          <Button variant="outline" size="sm" onClick={loadPayrollList} disabled={payrollListLoading}>
            {payrollListLoading ? 'Đang tải...' : 'Làm mới'}
          </Button>
        </div>

        {payrollList.length === 0 ? (
          <p className="text-sm text-[var(--color-text-secondary)]">Chưa có bảng lương nào.</p>
        ) : (
          <div className="grid gap-2 md:grid-cols-2">
            {payrollList.map((payroll) => {
              const active = currentPayrollId === payroll.payrollId;
              return (
                <button
                  key={payroll.payrollId}
                  type="button"
                  onClick={() => void openPayroll(payroll)}
                  className="rounded-[10px] border px-3 py-2 text-left transition-colors"
                  style={{
                    borderColor: active ? 'var(--color-accent)' : 'var(--color-border)',
                    backgroundColor: active ? 'var(--color-accent-light)' : 'var(--color-surface)',
                  }}
                >
                  <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                    Bảng lương {payroll.month}/{payroll.year}
                  </p>
                  <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
                    Trạng thái: {payroll.status === 'approved' ? 'Đã duyệt' : 'Nháp'} | Tổng: {formatVND(payroll.totalNet)}
                  </p>
                </button>
              );
            })}
          </div>
        )}
      </section>

      <section className="rounded-[12px] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <p className="mb-3 text-sm font-medium text-[var(--color-text-primary)]">Chọn tháng / năm</p>
        <div className="grid gap-3 md:grid-cols-[140px_180px_auto]">
          <Input
            type="number"
            min={1}
            max={12}
            value={month}
            onChange={(event) => setMonth(onlyInteger(event.target.value))}
            disabled={!canEdit}
            className={!month ? 'border-[var(--color-error)]' : undefined}
          />
          <Input
            type="number"
            min={2000}
            value={year}
            onChange={(event) => setYear(onlyInteger(event.target.value))}
            disabled={!canEdit}
            className={!year ? 'border-[var(--color-error)]' : undefined}
          />
          <Button variant="outline" onClick={loadEmployees} disabled={loading}>
            {loading ? 'Đang tải...' : 'Tải danh sách nhân viên'}
          </Button>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <KPICard label="Tổng nhân viên" value={String(summary.total)} icon={Users} iconBg="var(--color-accent-light)" iconColor="var(--color-accent)" />
        <KPICard label="Fulltime" value={String(summary.fulltime)} icon={ClipboardList} iconBg="var(--color-accent-light)" iconColor="var(--color-accent)" />
        <KPICard label="Parttime" value={String(summary.parttime)} icon={AlertCircle} iconBg="var(--color-warning-bg)" iconColor="var(--color-warning)" />
        <KPICard label="Tổng thực nhận" value={formatVND(summary.totalNet)} icon={CircleDollarSign} iconBg="var(--color-success-bg)" iconColor="var(--color-success)" />
      </section>

      <section className="rounded-[12px] border border-[var(--color-border)] bg-[var(--color-surface)]">
        <Table>
          <TableHeader className="bg-[#F7F6F4]">
            <TableRow className="hover:bg-transparent">
              <TableHead>Nhân viên</TableHead>
              <TableHead>Loại</TableHead>
              <TableHead>Tài khoản</TableHead>
              <TableHead>Lương/1h (k)</TableHead>
              <TableHead>Số giờ công</TableHead>
              <TableHead>Thưởng (k)</TableHead>
              <TableHead>Phạt (k)</TableHead>
              <TableHead>Lương gộp</TableHead>
              <TableHead>Thực nhận</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-[140px] text-center text-[var(--color-text-secondary)]">
                  Chưa có dữ liệu. Hãy chọn tháng/năm và tải danh sách nhân viên.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.employeeId}>
                  <TableCell>
                    <div>
                      <p className="font-medium text-[var(--color-text-primary)]">{row.name}</p>
                      <p className="text-xs text-[var(--color-text-secondary)]">{row.dept || '--'}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span
                      className="inline-flex rounded-full px-2.5 py-1 text-xs font-medium"
                      style={{
                        backgroundColor: row.type === 'fulltime' ? 'var(--color-accent-light)' : 'var(--color-warning-bg)',
                        color: row.type === 'fulltime' ? 'var(--color-accent)' : 'var(--color-warning)',
                      }}
                    >
                      {row.type === 'fulltime' ? 'Fulltime' : 'Parttime'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span
                      className="inline-flex rounded-full px-2.5 py-1 text-xs font-medium"
                      style={{
                        backgroundColor: row.accountStatus === 'ACTIVE' ? 'var(--color-success-bg)' : '#F3F2F0',
                        color: row.accountStatus === 'ACTIVE' ? 'var(--color-success)' : 'var(--color-text-secondary)',
                      }}
                    >
                      {row.accountStatus === 'ACTIVE' ? 'Hoạt động' : 'Tạm khóa'}
                    </span>
                  </TableCell>
                  <TableCell>{formatHourlyK(row.baseSalary)}</TableCell>
                  <TableCell>
                    <Input
                      value={row.hoursWorked}
                      onChange={(event) => updateRow(row.employeeId, 'hoursWorked', event.target.value)}
                      disabled={!canEditCurrentPayroll}
                      className={row.errors.hoursWorked ? 'border-[var(--color-error)]' : undefined}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={row.bonus}
                      onChange={(event) => updateRow(row.employeeId, 'bonus', event.target.value)}
                      disabled={!canEditCurrentPayroll}
                      className={row.errors.bonus ? 'border-[var(--color-error)]' : undefined}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={row.penalty}
                      onChange={(event) => updateRow(row.employeeId, 'penalty', event.target.value)}
                      disabled={!canEditCurrentPayroll}
                      className={row.errors.penalty ? 'border-[var(--color-error)]' : undefined}
                    />
                  </TableCell>
                  <TableCell>{formatVND(row.grossSalary)}</TableCell>
                  <TableCell className="font-medium">{formatVND(row.netSalary)}</TableCell>
                </TableRow>
              ))
            )}
            {rows.length > 0 ? (
              <TableRow className="bg-[#FAFAF9] font-semibold">
                <TableCell colSpan={5}>Tổng</TableCell>
                <TableCell>{formatVND(summary.totalBonus)}</TableCell>
                <TableCell>{formatVND(summary.totalPenalty)}</TableCell>
                <TableCell>{formatVND(summary.totalGross)}</TableCell>
                <TableCell>{formatVND(summary.totalNet)}</TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </section>
    </div>
  );
}
