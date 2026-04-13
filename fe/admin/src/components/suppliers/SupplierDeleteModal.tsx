import { AlertTriangle, Package, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { SupplierListResponse } from '../../types';

interface Props {
  supplier: SupplierListResponse;
  onClose: () => void;
  onConfirm: () => void;
}

export default function SupplierDeleteModal({ supplier, onClose, onConfirm }: Props) {
  const hasRelatedData = (supplier.soPhieuNhap ?? 0) > 0;

  const formatCurrency = (value?: number) => {
    if (!value) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(value);
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[540px] p-0" showCloseButton={false}>
        <DialogHeader className="border-b border-[var(--color-border)] px-6 py-4">
          <div className="flex items-start gap-3">
            <div
              className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-[10px]"
              style={{
                backgroundColor: hasRelatedData ? 'var(--color-warning-bg)' : 'var(--color-error-bg)',
              }}
            >
              <AlertTriangle
                className="h-5 w-5"
                style={{ color: hasRelatedData ? 'var(--color-warning)' : 'var(--color-error)' }}
              />
            </div>
            <div>
              <DialogTitle className="font-[var(--font-display)] text-[20px] text-[var(--color-text-primary)]">
                {hasRelatedData ? 'Xác nhận ngừng hợp tác' : 'Xác nhận xóa nhà cung cấp'}
              </DialogTitle>
              <DialogDescription className="mt-1 text-[var(--color-text-secondary)]">
                {hasRelatedData ? 'Nhà cung cấp đã có phiếu nhập' : 'Hành động này không thể hoàn tác'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 px-6 py-5">
          <div className="rounded-[10px] border border-[var(--color-border)] bg-[var(--color-bg)] p-4">
            <div className="mb-2">
              <p className="text-sm text-[var(--color-text-secondary)]">Mã nhà cung cấp</p>
              <p className="font-medium text-[var(--color-text-primary)]">{supplier.maNcc}</p>
            </div>
            <div className="mb-2">
              <p className="text-sm text-[var(--color-text-secondary)]">Tên nhà cung cấp</p>
              <p className="font-medium text-[var(--color-text-primary)]">{supplier.tenNcc}</p>
            </div>
            {supplier.soDienThoai ? (
              <div>
                <p className="text-sm text-[var(--color-text-secondary)]">Số điện thoại</p>
                <p className="font-medium text-[var(--color-text-primary)]">{supplier.soDienThoai}</p>
              </div>
            ) : null}
          </div>

          {hasRelatedData ? (
            <div className="space-y-3 rounded-[10px] border border-[var(--color-warning)]/20 bg-[var(--color-warning-bg)] p-4">
              <div className="flex items-center gap-2" style={{ color: 'var(--color-warning)' }}>
                <AlertTriangle className="h-5 w-5" />
                <p className="font-medium">Nhà cung cấp đã phát sinh dữ liệu</p>
              </div>

              <div className="space-y-2 text-sm" style={{ color: '#92400E' }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    <span>Số phiếu nhập:</span>
                  </div>
                  <span className="font-medium">{supplier.soPhieuNhap}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    <span>Tổng giá trị nhập:</span>
                  </div>
                  <span className="font-medium">{formatCurrency(supplier.tongGiaTriNhap)}</span>
                </div>
              </div>

              <p className="border-t border-[#FDE68A] pt-3 text-sm" style={{ color: '#7C2D12' }}>
                <strong>Lưu ý:</strong> Hệ thống sẽ chuyển trạng thái nhà cung cấp sang <strong>"Ngừng hoạt động"</strong> thay vì xóa hoàn toàn để đảm bảo tính toàn vẹn dữ liệu.
              </p>
            </div>
          ) : (
            <div className="rounded-[10px] border border-[var(--color-error)]/20 bg-[var(--color-error-bg)] p-4">
              <div className="mb-2 flex items-center gap-2 text-[var(--color-error)]">
                <AlertTriangle className="h-5 w-5" />
                <p className="font-medium">Cảnh báo</p>
              </div>
              <p className="text-sm text-[#991B1B]">
                Nhà cung cấp sẽ bị <strong>xóa vĩnh viễn</strong> khỏi hệ thống. Hành động này không thể hoàn tác.
              </p>
            </div>
          )}

          <p className="text-sm font-medium text-[var(--color-text-primary)]">
            {hasRelatedData
              ? 'Bạn có chắc chắn muốn ngừng hợp tác với nhà cung cấp này?'
              : 'Bạn có chắc chắn muốn xóa nhà cung cấp này?'}
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button
            onClick={onConfirm}
            className={
              hasRelatedData
                ? 'bg-[#B45309] text-white hover:bg-[#92400E]'
                : 'bg-[var(--color-error)] text-white hover:bg-[#B91C1C]'
            }
          >
            {hasRelatedData ? 'Ngừng hợp tác' : 'Xóa vĩnh viễn'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
