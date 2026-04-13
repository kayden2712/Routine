import { useState, useEffect } from 'react';
import { Percent, TicketPercent } from 'lucide-react';
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
import { promotionApi } from '../../lib/promotionApi';
import type { Promotion, PromotionType, CreatePromotionRequest, UpdatePromotionRequest } from '../../types';
import { showToast } from '../../lib/toast';

interface Props {
  promotion: Promotion | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function PromotionFormModal({ promotion, onClose, onSuccess }: Props) {
  const isEdit = !!promotion;
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    type: 'GIAM_PHAN_TRAM' as PromotionType,
    discountValue: '',
    maxDiscountAmount: '',
    startDate: '',
    endDate: '',
    minOrderAmount: '0',
    applyToAllProducts: true,
    usageLimit: '',
  });

  useEffect(() => {
    if (promotion) {
      setFormData({
        code: promotion.code,
        name: promotion.name,
        description: promotion.description || '',
        type: promotion.type,
        discountValue: promotion.discountValue.toString(),
        maxDiscountAmount: promotion.maxDiscountAmount?.toString() || '',
        startDate: promotion.startDate.substring(0, 16),
        endDate: promotion.endDate.substring(0, 16),
        minOrderAmount: promotion.minOrderAmount.toString(),
        applyToAllProducts: promotion.applyToAllProducts,
        usageLimit: promotion.usageLimit?.toString() || '',
      });
    }
  }, [promotion]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (new Date(formData.endDate) <= new Date(formData.startDate)) {
      showToast.error('Thời gian kết thúc phải sau thời gian bắt đầu');
      return;
    }

    if (formData.type === 'GIAM_PHAN_TRAM' && parseFloat(formData.discountValue) > 100) {
      showToast.error('Giá trị giảm phần trăm không được vượt quá 100%');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        ...(isEdit ? {} : { code: formData.code }),
        name: formData.name,
        description: formData.description || undefined,
        type: formData.type,
        discountValue: parseFloat(formData.discountValue),
        maxDiscountAmount: formData.maxDiscountAmount ? parseFloat(formData.maxDiscountAmount) : undefined,
        startDate: formData.startDate,
        endDate: formData.endDate,
        minOrderAmount: parseFloat(formData.minOrderAmount || '0'),
        applyToAllProducts: formData.applyToAllProducts,
        usageLimit: formData.usageLimit ? parseInt(formData.usageLimit) : undefined,
      };

      if (isEdit) {
        await promotionApi.update(promotion.id, payload as UpdatePromotionRequest);
        showToast.success('Cập nhật khuyến mãi thành công');
      } else {
        await promotionApi.create(payload as CreatePromotionRequest);
        showToast.success('Tạo khuyến mãi thành công');
      }

      onSuccess();
    } catch (error: any) {
      showToast.error(error.message || 'Không thể lưu khuyến mãi');
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
              <TicketPercent size={18} />
            </div>
            <div>
              <DialogTitle className="font-[var(--font-display)] text-[20px] text-[var(--color-text-primary)]">
                {isEdit ? 'Chỉnh sửa khuyến mãi' : 'Tạo khuyến mãi mới'}
              </DialogTitle>
              <DialogDescription className="text-[var(--color-text-secondary)]">
                Điền đầy đủ thông tin trước khi lưu chương trình ưu đãi.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-1.5">
              <Label>Mã khuyến mãi</Label>
              <Input
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                disabled={isEdit}
                required
                placeholder="VD: SUMMER2026"
              />
            </div>

            <div className="grid gap-1.5">
              <Label>Loại khuyến mãi</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value as PromotionType })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GIAM_PHAN_TRAM">Giảm phần trăm</SelectItem>
                  <SelectItem value="GIAM_TIEN">Giảm tiền</SelectItem>
                  <SelectItem value="TANG_QUA">Tặng quà</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label>Tên chương trình</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder="VD: Khuyến mãi mùa hè 2026"
            />
          </div>

          <div className="grid gap-1.5">
            <Label>Mô tả</Label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="min-h-[88px] w-full rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm outline-none transition-colors placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-accent)]"
              placeholder="Mô tả chi tiết về chương trình..."
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-1.5">
              <Label>Giá trị ưu đãi</Label>
              <div className="relative">
                <Input
                  type="number"
                  value={formData.discountValue}
                  onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                  required
                  min="0"
                  step="0.01"
                  placeholder={formData.type === 'GIAM_PHAN_TRAM' ? '10' : '50000'}
                  className="pr-10"
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[var(--color-text-muted)]">
                  {formData.type === 'GIAM_PHAN_TRAM' ? <Percent size={14} /> : 'đ'}
                </span>
              </div>
            </div>

            {formData.type === 'GIAM_PHAN_TRAM' ? (
              <div className="grid gap-1.5">
                <Label>Giảm tối đa</Label>
                <Input
                  type="number"
                  value={formData.maxDiscountAmount}
                  onChange={(e) => setFormData({ ...formData, maxDiscountAmount: e.target.value })}
                  min="0"
                  placeholder="500000"
                />
              </div>
            ) : null}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-1.5">
              <Label>Thời gian bắt đầu</Label>
              <Input
                type="datetime-local"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                required
              />
            </div>

            <div className="grid gap-1.5">
              <Label>Thời gian kết thúc</Label>
              <Input
                type="datetime-local"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-1.5">
              <Label>Giá trị đơn tối thiểu</Label>
              <Input
                type="number"
                value={formData.minOrderAmount}
                onChange={(e) => setFormData({ ...formData, minOrderAmount: e.target.value })}
                min="0"
              />
            </div>

            <div className="grid gap-1.5">
              <Label>Giới hạn số lần sử dụng</Label>
              <Input
                type="number"
                value={formData.usageLimit}
                onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                min="1"
                placeholder="Để trống nếu không giới hạn"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 rounded-[10px] border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text-primary)]">
            <input
              type="checkbox"
              checked={formData.applyToAllProducts}
              onChange={(e) => setFormData({ ...formData, applyToAllProducts: e.target.checked })}
            />
            Áp dụng cho tất cả sản phẩm
          </label>

          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Hủy
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Đang lưu...' : isEdit ? 'Cập nhật' : 'Tạo mới'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
