import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            {isEdit ? 'Chỉnh Sửa Khuyến Mãi' : 'Tạo Khuyến Mãi Mới'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mã khuyến mãi <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                disabled={isEdit}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                placeholder="VD: SUMMER2026"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Loại khuyến mãi <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as PromotionType })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="GIAM_PHAN_TRAM">Giảm phần trăm</option>
                <option value="GIAM_TIEN">Giảm tiền</option>
                <option value="TANG_QUA">Tặng quà</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tên chương trình <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="VD: Khuyến mãi mùa hè 2026"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Mô tả chi tiết về chương trình..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Giá trị ưu đãi <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={formData.discountValue}
                  onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                  required
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder={formData.type === 'GIAM_PHAN_TRAM' ? '10' : '50000'}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                  {formData.type === 'GIAM_PHAN_TRAM' ? '%' : 'đ'}
                </span>
              </div>
            </div>

            {formData.type === 'GIAM_PHAN_TRAM' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Giảm tối đa
                </label>
                <input
                  type="number"
                  value={formData.maxDiscountAmount}
                  onChange={(e) => setFormData({ ...formData, maxDiscountAmount: e.target.value })}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="500000"
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Thời gian bắt đầu <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Thời gian kết thúc <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Giá trị đơn hàng tối thiểu
              </label>
              <input
                type="number"
                value={formData.minOrderAmount}
                onChange={(e) => setFormData({ ...formData, minOrderAmount: e.target.value })}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Giới hạn số lần sử dụng
              </label>
              <input
                type="number"
                value={formData.usageLimit}
                onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Không giới hạn"
              />
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.applyToAllProducts}
                onChange={(e) => setFormData({ ...formData, applyToAllProducts: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">Áp dụng cho tất cả sản phẩm</span>
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              disabled={loading}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Đang lưu...' : isEdit ? 'Cập nhật' : 'Tạo mới'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
