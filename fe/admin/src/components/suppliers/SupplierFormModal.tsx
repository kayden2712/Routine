import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            {isEdit ? 'Chỉnh Sửa Nhà Cung Cấp' : 'Thêm Nhà Cung Cấp Mới'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Tên nhà cung cấp */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tên nhà cung cấp <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.tenNcc}
              onChange={(e) => setFormData({ ...formData, tenNcc: e.target.value })}
              required
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.tenNcc ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="VD: Công ty TNHH May Mặc ABC"
            />
            {errors.tenNcc && (
              <p className="mt-1 text-sm text-red-500">{errors.tenNcc}</p>
            )}
          </div>

          {/* Grid 2 cột */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Số điện thoại */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Số điện thoại
              </label>
              <input
                type="tel"
                value={formData.soDienThoai}
                onChange={(e) => setFormData({ ...formData, soDienThoai: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.soDienThoai ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="VD: 0901234567"
              />
              {errors.soDienThoai && (
                <p className="mt-1 text-sm text-red-500">{errors.soDienThoai}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="VD: supplier@example.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-500">{errors.email}</p>
              )}
            </div>
          </div>

          {/* Người liên hệ */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Người liên hệ
            </label>
            <input
              type="text"
              value={formData.nguoiLienHe}
              onChange={(e) => setFormData({ ...formData, nguoiLienHe: e.target.value })}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.nguoiLienHe ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="VD: Nguyễn Văn A"
            />
            {errors.nguoiLienHe && (
              <p className="mt-1 text-sm text-red-500">{errors.nguoiLienHe}</p>
            )}
          </div>

          {/* Địa chỉ */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Địa chỉ
            </label>
            <textarea
              value={formData.diaChi}
              onChange={(e) => setFormData({ ...formData, diaChi: e.target.value })}
              rows={2}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.diaChi ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="VD: 123 Đường ABC, Phường XYZ, Quận 1, TP.HCM"
            />
            {errors.diaChi && (
              <p className="mt-1 text-sm text-red-500">{errors.diaChi}</p>
            )}
          </div>

          {/* Ghi chú */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ghi chú
            </label>
            <textarea
              value={formData.ghiChu}
              onChange={(e) => setFormData({ ...formData, ghiChu: e.target.value })}
              rows={3}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.ghiChu ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Thông tin bổ sung về nhà cung cấp..."
            />
            {errors.ghiChu && (
              <p className="mt-1 text-sm text-red-500">{errors.ghiChu}</p>
            )}
          </div>

          {/* Trạng thái */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Trạng thái
            </label>
            <select
              value={formData.trangThai}
              onChange={(e) => setFormData({ ...formData, trangThai: e.target.value as SupplierStatus })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="ACTIVE">Đang hoạt động</option>
              <option value="INACTIVE">Ngừng hoạt động</option>
            </select>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {loading && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              {isEdit ? 'Cập Nhật' : 'Thêm Mới'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
