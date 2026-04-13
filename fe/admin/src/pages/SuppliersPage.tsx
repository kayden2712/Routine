import { useState, useEffect } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  Search,
  Filter,
  Package,
  Phone,
  Mail,
  MapPin,
  TrendingUp,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { KPICard } from '@/components/shared/KPICard';
import { Pagination } from '@/components/shared/Pagination';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { supplierApi } from '../lib/supplierApi';
import type { SupplierListResponse, SupplierStatus } from '../types';
import { showToast } from '../lib/toast';
import SupplierFormModal from '../components/suppliers/SupplierFormModal';
import SupplierDeleteModal from '../components/suppliers/SupplierDeleteModal';

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<SupplierListResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<SupplierStatus | 'ALL'>('ALL');
  
  // Modal states
  const [showFormModal, setShowFormModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<SupplierListResponse | null>(null);
  const [deletingSupplier, setDeletingSupplier] = useState<SupplierListResponse | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 10;
  const [totalElements, setTotalElements] = useState(0);

  useEffect(() => {
    loadSuppliers();
  }, [searchTerm, statusFilter, currentPage]);

  const loadSuppliers = async () => {
    try {
      setLoading(true);
      const response = await supplierApi.search({
        keyword: searchTerm || undefined,
        trangThai: statusFilter === 'ALL' ? null : statusFilter,
        page: currentPage,
        size: pageSize,
        sortBy: 'createdAt',
        sortDirection: 'DESC',
      });

      setSuppliers(response.content);
      setTotalElements(response.totalElements);
    } catch (error) {
      showToast.error('Không thể tải danh sách nhà cung cấp');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingSupplier(null);
    setShowFormModal(true);
  };

  const handleEdit = (supplier: SupplierListResponse) => {
    setEditingSupplier(supplier);
    setShowFormModal(true);
  };

  const handleDeleteClick = (supplier: SupplierListResponse) => {
    setDeletingSupplier(supplier);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingSupplier) return;

    try {
      await supplierApi.delete(deletingSupplier.id);
      showToast.success('Xóa nhà cung cấp thành công');
      setShowDeleteModal(false);
      setDeletingSupplier(null);
      loadSuppliers();
    } catch (error: any) {
      showToast.error(error.message || 'Không thể xóa nhà cung cấp');
    }
  };

  const handleFormSuccess = () => {
    setShowFormModal(false);
    setEditingSupplier(null);
    loadSuppliers();
  };

  const handleStatusChange = async (id: number, newStatus: SupplierStatus) => {
    try {
      await supplierApi.updateStatus(id, newStatus);
      showToast.success(
        newStatus === 'ACTIVE' 
          ? 'Kích hoạt nhà cung cấp thành công' 
          : 'Ngừng hoạt động nhà cung cấp thành công'
      );
      loadSuppliers();
    } catch (error: any) {
      showToast.error(error.message || 'Không thể cập nhật trạng thái');
    }
  };

  const formatCurrency = (value?: number) => {
    if (!value) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(value);
  };

  const getStatusBadge = (status: SupplierStatus) => {
    if (status === 'ACTIVE') {
      return (
        <span
          className="inline-flex items-center gap-1 rounded-full px-[10px] py-[2px] text-xs font-medium"
          style={{ backgroundColor: 'var(--color-success-bg)', color: 'var(--color-success)' }}
        >
          <CheckCircle className="w-3 h-3" />
          Đang hoạt động
        </span>
      );
    }
    return (
      <span
        className="inline-flex items-center gap-1 rounded-full px-[10px] py-[2px] text-xs font-medium"
        style={{ backgroundColor: '#F3F2F0', color: 'var(--color-text-secondary)' }}
      >
        <XCircle className="w-3 h-3" />
        Ngừng hoạt động
      </span>
    );
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-[var(--font-display)] text-[26px] font-semibold text-[var(--color-text-primary)]">Quản lý nhà cung cấp</h1>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            Quản lý thông tin nhà cung cấp và theo dõi hiệu suất nhập hàng.
          </p>
        </div>
        <Button className="gap-2" onClick={handleCreate}>
          <Plus className="w-4 h-4" />
          Thêm nhà cung cấp
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <KPICard label="Tổng nhà cung cấp" value={String(totalElements)} icon={Package} iconBg="var(--color-accent-light)" iconColor="var(--color-accent)" />
        <KPICard
          label="Đang hoạt động"
          value={String(suppliers.filter((s) => s.trangThai === 'ACTIVE').length)}
          icon={CheckCircle}
          iconBg="var(--color-success-bg)"
          iconColor="var(--color-success)"
        />
        <KPICard
          label="Ngừng hoạt động"
          value={String(suppliers.filter((s) => s.trangThai === 'INACTIVE').length)}
          icon={XCircle}
          iconBg="#F3F2F0"
          iconColor="var(--color-text-secondary)"
        />
      </div>

      <section className="rounded-[12px] border border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="flex flex-wrap items-center gap-3 border-b border-[var(--color-border)] p-3">
          <div className="relative min-w-[240px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" size={16} />
            <Input
              value={searchTerm}
              placeholder="Tìm theo tên, điện thoại, email"
              onChange={(event) => {
                setSearchTerm(event.target.value);
                setCurrentPage(0);
              }}
              className="pl-9"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="text-[var(--color-text-muted)]" size={16} />
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value as SupplierStatus | 'ALL');
                setCurrentPage(0);
              }}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
                <SelectItem value="ACTIVE">Đang hoạt động</SelectItem>
                <SelectItem value="INACTIVE">Ngừng hoạt động</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Table>
          <TableHeader className="bg-[#F7F6F4]">
            <TableRow className="border-b-2 border-[var(--color-border)] hover:bg-transparent">
              <TableHead className="px-3 text-[12px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
                  Mã NCC
              </TableHead>
              <TableHead className="px-3 text-[12px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
                  Tên nhà cung cấp
              </TableHead>
              <TableHead className="px-3 text-[12px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
                  Liên hệ
              </TableHead>
              <TableHead className="px-3 text-[12px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
                  Địa chỉ
              </TableHead>
              <TableHead className="px-3 text-[12px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
                  Số phiếu nhập
              </TableHead>
              <TableHead className="px-3 text-[12px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
                  Tổng giá trị
              </TableHead>
              <TableHead className="px-3 text-[12px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
                  Trạng thái
              </TableHead>
              <TableHead className="px-3 text-right text-[12px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
                  Thao tác
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-[180px] text-center text-sm text-[var(--color-text-secondary)]">
                    <div className="flex items-center justify-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--color-accent)] border-t-transparent" />
                      Đang tải...
                    </div>
                  </TableCell>
                </TableRow>
              ) : suppliers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-[180px] text-center text-sm text-[var(--color-text-secondary)]">
                    Không có nhà cung cấp phù hợp với bộ lọc hiện tại.
                  </TableCell>
                </TableRow>
              ) : (
                suppliers.map((supplier) => (
                  <TableRow key={supplier.id} className="h-[56px] border-b border-[var(--color-border)] hover:bg-[#FAFAF9]">
                    <TableCell className="px-3 text-sm font-semibold text-[var(--color-text-primary)]">
                      {supplier.maNcc}
                    </TableCell>
                    <TableCell className="px-3 py-2">
                      <div className="text-sm font-medium text-[var(--color-text-primary)]">{supplier.tenNcc}</div>
                      {supplier.nguoiLienHe && (
                        <div className="text-xs text-[var(--color-text-secondary)]">Liên hệ: {supplier.nguoiLienHe}</div>
                      )}
                    </TableCell>
                    <TableCell className="px-3">
                      <div className="space-y-1 text-sm text-[var(--color-text-primary)]">
                        {supplier.soDienThoai && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3 text-[var(--color-text-muted)]" />
                            <span>{supplier.soDienThoai}</span>
                          </div>
                        )}
                        {supplier.email && (
                          <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3 text-[var(--color-text-muted)]" />
                            <span className="text-xs">{supplier.email}</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="px-3">
                      {supplier.diaChi ? (
                        <div className="flex max-w-[260px] items-start gap-1 text-sm text-[var(--color-text-secondary)]">
                          <MapPin className="mt-0.5 h-3 w-3 shrink-0" />
                          <span className="line-clamp-2">{supplier.diaChi}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-[var(--color-text-muted)]">-</span>
                      )}
                    </TableCell>
                    <TableCell className="px-3 text-sm text-[var(--color-text-primary)]">
                      <div className="flex items-center gap-1">
                        <TrendingUp className="h-4 w-4 text-[var(--color-accent)]" />
                        {supplier.soPhieuNhap || 0}
                      </div>
                    </TableCell>
                    <TableCell className="px-3 text-sm font-medium text-[var(--color-text-primary)]">
                      {formatCurrency(supplier.tongGiaTriNhap)}
                    </TableCell>
                    <TableCell className="px-3">{getStatusBadge(supplier.trangThai)}</TableCell>
                    <TableCell className="px-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {supplier.trangThai === 'INACTIVE' && (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleStatusChange(supplier.id, 'ACTIVE')}
                            className="text-[var(--color-success)] hover:bg-[var(--color-success-bg)]"
                            title="Kích hoạt"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                        )}
                        {supplier.trangThai === 'ACTIVE' && (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleStatusChange(supplier.id, 'INACTIVE')}
                            className="text-[var(--color-text-secondary)] hover:bg-[#F3F2F0]"
                            title="Ngừng hoạt động"
                          >
                            <XCircle className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleEdit(supplier)}
                          className="text-[var(--color-accent)] hover:bg-[var(--color-accent-light)]"
                          title="Chỉnh sửa"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleDeleteClick(supplier)}
                          className="text-[var(--color-error)] hover:bg-[var(--color-error-bg)]"
                          title="Xóa"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
          </TableBody>
        </Table>

        <Pagination
          page={currentPage + 1}
          pageSize={pageSize}
          total={totalElements}
          onChange={(page) => setCurrentPage(page - 1)}
        />
      </section>

      {showFormModal && (
        <SupplierFormModal
          supplier={editingSupplier}
          onClose={() => {
            setShowFormModal(false);
            setEditingSupplier(null);
          }}
          onSuccess={handleFormSuccess}
        />
      )}

      {showDeleteModal && deletingSupplier && (
        <SupplierDeleteModal
          supplier={deletingSupplier}
          onClose={() => {
            setShowDeleteModal(false);
            setDeletingSupplier(null);
          }}
          onConfirm={handleDeleteConfirm}
        />
      )}
    </div>
  );
}
