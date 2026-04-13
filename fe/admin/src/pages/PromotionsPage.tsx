import { useEffect, useMemo, useState } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  Play,
  XCircle,
  Search,
  Filter,
  Gift,
  Calendar,
  Tag,
  TrendingUp,
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
import { promotionApi } from '../lib/promotionApi';
import { showToast } from '../lib/toast';
import { useAuthStore } from '../store/authStore';
import type { Promotion, PromotionStatus, PromotionType } from '../types';
import PromotionFormModal from '../components/promotions/PromotionFormModal';

export default function PromotionsPage() {
  const user = useAuthStore((state) => state.user);
  const isSalesReadOnly = user?.role === 'sales';

  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<PromotionStatus | 'ALL'>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);

  useEffect(() => {
    loadPromotions();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  const loadPromotions = async () => {
    try {
      setLoading(true);
      const data = await promotionApi.getAll();
      setPromotions(data);
    } catch (error) {
      showToast.error('Không thể tải danh sách khuyến mãi');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPromotions = useMemo(() => {
    let filtered = [...promotions];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          p.code.toLowerCase().includes(term) ||
          p.description?.toLowerCase().includes(term)
      );
    }

    if (statusFilter !== 'ALL') {
      filtered = filtered.filter((p) => p.status === statusFilter);
    }

    return filtered;
  }, [promotions, searchTerm, statusFilter]);

  const paginatedPromotions = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredPromotions.slice(start, start + pageSize);
  }, [filteredPromotions, currentPage]);

  const handleCreate = () => {
    if (isSalesReadOnly) {
      showToast.error('Vai trò Sales chỉ có quyền xem khuyến mãi');
      return;
    }
    setEditingPromotion(null);
    setShowFormModal(true);
  };

  const handleEdit = (promotion: Promotion) => {
    if (isSalesReadOnly) {
      showToast.error('Vai trò Sales chỉ có quyền xem khuyến mãi');
      return;
    }
    setEditingPromotion(promotion);
    setShowFormModal(true);
  };

  const handleDelete = async (id: number) => {
    if (isSalesReadOnly) {
      showToast.error('Vai trò Sales chỉ có quyền xem khuyến mãi');
      return;
    }
    if (!confirm('Bạn có chắc chắn muốn xóa khuyến mãi này?')) return;

    try {
      await promotionApi.delete(id);
      showToast.success('Xóa khuyến mãi thành công');
      loadPromotions();
    } catch (error: any) {
      showToast.error(error.message || 'Không thể xóa khuyến mãi');
    }
  };

  const handleActivate = async (id: number) => {
    if (isSalesReadOnly) {
      showToast.error('Vai trò Sales chỉ có quyền xem khuyến mãi');
      return;
    }
    try {
      await promotionApi.activate(id);
      showToast.success('Kích hoạt khuyến mãi thành công');
      loadPromotions();
    } catch (error: any) {
      showToast.error(error.message || 'Không thể kích hoạt khuyến mãi');
    }
  };

  const handleCancel = async (id: number) => {
    if (isSalesReadOnly) {
      showToast.error('Vai trò Sales chỉ có quyền xem khuyến mãi');
      return;
    }
    if (!confirm('Bạn có chắc chắn muốn hủy khuyến mãi này?')) return;

    try {
      await promotionApi.cancel(id);
      showToast.success('Hủy khuyến mãi thành công');
      loadPromotions();
    } catch (error: any) {
      showToast.error(error.message || 'Không thể hủy khuyến mãi');
    }
  };

  const handleFormSuccess = () => {
    setShowFormModal(false);
    setEditingPromotion(null);
    loadPromotions();
  };

  const getStatusBadge = (status: PromotionStatus) => {
    const badges: Record<PromotionStatus, { bg: string; color: string }> = {
      DRAFT: { bg: '#F3F2F0', color: 'var(--color-text-secondary)' },
      ACTIVE: { bg: 'var(--color-success-bg)', color: 'var(--color-success)' },
      EXPIRED: { bg: 'var(--color-error-bg)', color: 'var(--color-error)' },
      CANCELLED: { bg: 'var(--color-warning-bg)', color: 'var(--color-warning)' },
    };

    const config = badges[status];
    return (
      <span
        className="inline-flex items-center rounded-full px-[10px] py-[2px] text-xs font-medium"
        style={{ backgroundColor: config.bg, color: config.color }}
      >
        {status === 'DRAFT' ? 'Nháp' : status === 'ACTIVE' ? 'Đang hoạt động' : status === 'EXPIRED' ? 'Hết hạn' : 'Đã hủy'}
      </span>
    );
  };

  const getTypeBadge = (type: PromotionType) => {
    const badges: Record<PromotionType, { bg: string; color: string }> = {
      GIAM_PHAN_TRAM: { bg: 'var(--color-accent-light)', color: 'var(--color-accent)' },
      GIAM_TIEN: { bg: '#EEF2FF', color: '#4F46E5' },
      TANG_QUA: { bg: '#FFF1F2', color: '#BE123C' },
    };

    const config = badges[type];
    return (
      <span
        className="inline-flex items-center rounded-full px-[10px] py-[2px] text-xs font-medium"
        style={{ backgroundColor: config.bg, color: config.color }}
      >
        {type === 'GIAM_PHAN_TRAM' ? 'Giảm phần trăm' : type === 'GIAM_TIEN' ? 'Giảm tiền' : 'Tặng quà'}
      </span>
    );
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(value);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('vi-VN');
  };

  const stats = {
    total: promotions.length,
    active: promotions.filter((p) => p.status === 'ACTIVE').length,
    draft: promotions.filter((p) => p.status === 'DRAFT').length,
    expired: promotions.filter((p) => p.status === 'EXPIRED').length,
  };

  if (loading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center rounded-[12px] border border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="text-[var(--color-text-secondary)]">Đang tải danh sách khuyến mãi...</div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-[var(--font-display)] text-[26px] font-semibold text-[var(--color-text-primary)]">
            Quản lý khuyến mãi
          </h1>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">Tạo và theo dõi các chương trình ưu đãi theo từng trạng thái.</p>
        </div>
        {!isSalesReadOnly ? (
          <Button className="gap-2" onClick={handleCreate}>
            <Plus size={16} />
            Tạo Khuyến Mãi
          </Button>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <KPICard label="Tổng chương trình" value={String(stats.total)} icon={Gift} iconBg="var(--color-accent-light)" iconColor="var(--color-accent)" />
        <KPICard label="Đang hoạt động" value={String(stats.active)} icon={TrendingUp} iconBg="var(--color-success-bg)" iconColor="var(--color-success)" />
        <KPICard label="Nháp" value={String(stats.draft)} icon={Tag} iconBg="#F3F2F0" iconColor="var(--color-text-secondary)" />
        <KPICard label="Hết hạn" value={String(stats.expired)} icon={Calendar} iconBg="var(--color-error-bg)" iconColor="var(--color-error)" />
      </div>

      <section className="rounded-[12px] border border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="flex flex-wrap items-center gap-3 border-b border-[var(--color-border)] p-3">
          <div className="relative min-w-[240px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" size={16} />
            <Input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Tìm theo mã, tên hoặc mô tả"
              className="pl-9"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter size={16} className="text-[var(--color-text-muted)]" />
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as PromotionStatus | 'ALL')}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
                <SelectItem value="DRAFT">Nháp</SelectItem>
                <SelectItem value="ACTIVE">Đang hoạt động</SelectItem>
                <SelectItem value="EXPIRED">Hết hạn</SelectItem>
                <SelectItem value="CANCELLED">Đã hủy</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Table>
          <TableHeader className="bg-[#F7F6F4]">
            <TableRow className="border-b-2 border-[var(--color-border)] hover:bg-transparent">
              <TableHead className="px-3 text-[12px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-muted)]">Mã KM</TableHead>
              <TableHead className="px-3 text-[12px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-muted)]">Tên chương trình</TableHead>
              <TableHead className="px-3 text-[12px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-muted)]">Loại</TableHead>
              <TableHead className="px-3 text-[12px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-muted)]">Giá trị</TableHead>
              <TableHead className="px-3 text-[12px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-muted)]">Thời gian</TableHead>
              <TableHead className="px-3 text-[12px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-muted)]">Sử dụng</TableHead>
              <TableHead className="px-3 text-[12px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-muted)]">Trạng thái</TableHead>
              {!isSalesReadOnly ? (
                <TableHead className="px-3 text-right text-[12px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-muted)]">Thao tác</TableHead>
              ) : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedPromotions.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={isSalesReadOnly ? 7 : 8}
                  className="h-[180px] text-center text-sm text-[var(--color-text-secondary)]"
                >
                  Không tìm thấy khuyến mãi nào phù hợp.
                </TableCell>
              </TableRow>
            ) : (
              paginatedPromotions.map((promotion) => (
                <TableRow key={promotion.id} className="h-[56px] border-b border-[var(--color-border)] hover:bg-[#FAFAF9]">
                  <TableCell className="px-3 text-sm font-semibold text-[var(--color-text-primary)]">{promotion.code}</TableCell>
                  <TableCell className="px-3 py-2">
                    <div className="max-w-[280px]">
                      <p className="truncate text-sm font-medium text-[var(--color-text-primary)]">{promotion.name}</p>
                      {promotion.description ? (
                        <p className="truncate text-xs text-[var(--color-text-secondary)]">{promotion.description}</p>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell className="px-3">{getTypeBadge(promotion.type)}</TableCell>
                  <TableCell className="px-3 text-sm text-[var(--color-text-primary)]">
                    {promotion.type === 'GIAM_PHAN_TRAM' ? `${promotion.discountValue}%` : formatCurrency(promotion.discountValue)}
                  </TableCell>
                  <TableCell className="px-3 text-sm text-[var(--color-text-secondary)]">
                    <div>{formatDate(promotion.startDate)}</div>
                    <div>{formatDate(promotion.endDate)}</div>
                  </TableCell>
                  <TableCell className="px-3 text-sm text-[var(--color-text-secondary)]">
                    {promotion.usageCount}
                    {promotion.usageLimit && ` / ${promotion.usageLimit}`}
                  </TableCell>
                  <TableCell className="px-3">{getStatusBadge(promotion.status)}</TableCell>
                  {!isSalesReadOnly ? (
                    <TableCell className="px-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {promotion.status === 'DRAFT' && (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleActivate(promotion.id)}
                            title="Kích hoạt"
                            className="text-[var(--color-success)] hover:bg-[var(--color-success-bg)]"
                          >
                            <Play size={14} />
                          </Button>
                        )}
                        {(promotion.status === 'DRAFT' || promotion.status === 'ACTIVE') && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => handleEdit(promotion)}
                              title="Chỉnh sửa"
                              className="text-[var(--color-accent)] hover:bg-[var(--color-accent-light)]"
                            >
                              <Edit2 size={14} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => handleCancel(promotion.id)}
                              title="Hủy"
                              className="text-[var(--color-warning)] hover:bg-[var(--color-warning-bg)]"
                            >
                              <XCircle size={14} />
                            </Button>
                          </>
                        )}
                        {promotion.status !== 'ACTIVE' && (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleDelete(promotion.id)}
                            title="Xóa"
                            className="text-[var(--color-error)] hover:bg-[var(--color-error-bg)]"
                          >
                            <Trash2 size={14} />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  ) : null}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        <Pagination
          page={currentPage}
          pageSize={pageSize}
          total={filteredPromotions.length}
          onChange={(page) => setCurrentPage(page)}
        />
      </section>

      {!isSalesReadOnly && showFormModal && (
        <PromotionFormModal
          promotion={editingPromotion}
          onClose={() => {
            setShowFormModal(false);
            setEditingPromotion(null);
          }}
          onSuccess={handleFormSuccess}
        />
      )}
    </div>
  );
}
