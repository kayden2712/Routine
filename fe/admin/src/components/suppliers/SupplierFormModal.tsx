import { useState, useEffect } from 'react';
import { Building2 } from 'lucide-react';
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
import { supplierApi } from '../../lib/supplierApi';
import type { SupplierListResponse, SupplierRequest, SupplierStatus } from '../../types';
import { showToast } from '../../lib/toast';

interface Props {
  supplier: SupplierListResponse | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function SupplierFormModal({ supplier, onClose, onSuccess }: Props) {
  const isEdit = !!supplier;
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<SupplierRequest>({
    tenNcc: '',
    diaChi: '',
    soDienThoai: '',
    email: '',
    nguoiLienHe: '',
    ghiChu: '',
    trangThai: 'ACTIVE',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (supplier) {
      setFormData({
        tenNcc: supplier.tenNcc,
        diaChi: supplier.diaChi || '',
        soDienThoai: supplier.soDienThoai || '',
        email: supplier.email || '',
        nguoiLienHe: supplier.nguoiLienHe || '',
        ghiChu: '',
        trangThai: supplier.trangThai,
      });
    }
  }, [supplier]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate tên
    if (!formData.tenNcc || formData.tenNcc.trim().length < 2) {
      newErrors.tenNcc = 'Tên nhà cung cấp phải có ít nhất 2 ký tự';
    } else if (formData.tenNcc.length > 200) {
      newErrors.tenNcc = 'Tên nhà cung cấp không được vượt quá 200 ký tự';
    }

    // Validate số điện thoại (Vietnamese phone number)
    if (formData.soDienThoai && formData.soDienThoai.trim()) {
      const phoneRegex = /^(0|\+84)(3|5|7|8|9)[0-9]{8}$/;
      if (!phoneRegex.test(formData.soDienThoai.replace(/\s/g, ''))) {
        newErrors.soDienThoai = 'Số điện thoại không đúng định dạng Việt Nam';
      }
    }

    // Validate email
    if (formData.email && formData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        newErrors.email = 'Email không hợp lệ';
      } else if (formData.email.length > 100) {
        newErrors.email = 'Email không được vượt quá 100 ký tự';
      }
    }

    // Validate địa chỉ
    if (formData.diaChi && formData.diaChi.length > 500) {
      newErrors.diaChi = 'Địa chỉ không được vượt quá 500 ký tự';
    }

    // Validate người liên hệ
    if (formData.nguoiLienHe && formData.nguoiLienHe.length > 100) {
      newErrors.nguoiLienHe = 'Tên người liên hệ không được vượt quá 100 ký tự';
    }

    // Validate ghi chú
    if (formData.ghiChu && formData.ghiChu.length > 1000) {
      newErrors.ghiChu = 'Ghi chú không được vượt quá 1000 ký tự';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      showToast.error('Vui lòng kiểm tra lại thông tin');
      return;
    }

    setLoading(true);

    try {
      const payload: SupplierRequest = {
        tenNcc: formData.tenNcc.trim(),
        diaChi: formData.diaChi?.trim() || undefined,
        soDienThoai: formData.soDienThoai?.trim() || undefined,
        email: formData.email?.trim() || undefined,
        nguoiLienHe: formData.nguoiLienHe?.trim() || undefined,
        ghiChu: formData.ghiChu?.trim() || undefined,
        trangThai: formData.trangThai,
      };

      if (isEdit && supplier) {
        await supplierApi.update(supplier.id, payload);
        showToast.success('Cập nhật nhà cung cấp thành công');
      } else {
        await supplierApi.create(payload);
        showToast.success('Thêm nhà cung cấp thành công');
      }

      onSuccess();
    } catch (error: any) {
      showToast.error(error.message || 'Không thể lưu nhà cung cấp');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[92vh] max-w-[760px] overflow-y-auto p-0" showCloseButton={false}>
        <DialogHeader className="border-b border-[var(--color-border)] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-[var(--color-accent-light)] text-[var(--color-accent)]">
              <Building2 size={18} />
            </div>
            <div>
              <DialogTitle className="font-[var(--font-display)] text-[20px] text-[var(--color-text-primary)]">
                {isEdit ? 'Chỉnh sửa nhà cung cấp' : 'Thêm nhà cung cấp mới'}
              </DialogTitle>
              <DialogDescription className="text-[var(--color-text-secondary)]">
                Cập nhật thông tin liên hệ và trạng thái hợp tác với nhà cung cấp.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
          <div className="grid gap-1.5">
            <Label>Tên nhà cung cấp</Label>
            <Input
              value={formData.tenNcc}
              onChange={(e) => setFormData({ ...formData, tenNcc: e.target.value })}
              required
              placeholder="VD: Công ty TNHH May Mặc ABC"
              className={errors.tenNcc ? 'border-[var(--color-error)]' : undefined}
            />
            {errors.tenNcc ? <p className="text-xs text-[var(--color-error)]">{errors.tenNcc}</p> : null}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-1.5">
              <Label>Số điện thoại</Label>
              <Input
                type="tel"
                value={formData.soDienThoai}
                onChange={(e) => setFormData({ ...formData, soDienThoai: e.target.value })}
                placeholder="VD: 0901234567"
                className={errors.soDienThoai ? 'border-[var(--color-error)]' : undefined}
              />
              {errors.soDienThoai ? <p className="text-xs text-[var(--color-error)]">{errors.soDienThoai}</p> : null}
            </div>

            <div className="grid gap-1.5">
              <Label>Email</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="VD: supplier@example.com"
                className={errors.email ? 'border-[var(--color-error)]' : undefined}
              />
              {errors.email ? <p className="text-xs text-[var(--color-error)]">{errors.email}</p> : null}
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label>Người liên hệ</Label>
            <Input
              value={formData.nguoiLienHe}
              onChange={(e) => setFormData({ ...formData, nguoiLienHe: e.target.value })}
              placeholder="VD: Nguyễn Văn A"
              className={errors.nguoiLienHe ? 'border-[var(--color-error)]' : undefined}
            />
            {errors.nguoiLienHe ? <p className="text-xs text-[var(--color-error)]">{errors.nguoiLienHe}</p> : null}
          </div>

          <div className="grid gap-1.5">
            <Label>Địa chỉ</Label>
            <textarea
              value={formData.diaChi}
              onChange={(e) => setFormData({ ...formData, diaChi: e.target.value })}
              rows={2}
              className={`min-h-[72px] w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-accent)] ${
                errors.diaChi ? 'border-[var(--color-error)]' : 'border-[var(--color-border)]'
              }`}
              placeholder="VD: 123 Đường ABC, Phường XYZ, Quận 1, TP.HCM"
            />
            {errors.diaChi ? <p className="text-xs text-[var(--color-error)]">{errors.diaChi}</p> : null}
          </div>

          <div className="grid gap-1.5">
            <Label>Ghi chú</Label>
            <textarea
              value={formData.ghiChu}
              onChange={(e) => setFormData({ ...formData, ghiChu: e.target.value })}
              rows={3}
              className={`min-h-[88px] w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-accent)] ${
                errors.ghiChu ? 'border-[var(--color-error)]' : 'border-[var(--color-border)]'
              }`}
              placeholder="Thông tin bổ sung về nhà cung cấp..."
            />
            {errors.ghiChu ? <p className="text-xs text-[var(--color-error)]">{errors.ghiChu}</p> : null}
          </div>

          <div className="grid gap-1.5">
            <Label>Trạng thái</Label>
            <Select
              value={formData.trangThai}
              onValueChange={(value) => setFormData({ ...formData, trangThai: value as SupplierStatus })}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">Đang hoạt động</SelectItem>
                <SelectItem value="INACTIVE">Ngừng hoạt động</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Hủy
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Đang lưu...' : isEdit ? 'Cập nhật' : 'Thêm mới'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
