import { AlertTriangle, Package, TrendingUp } from 'lucide-react';
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${hasRelatedData ? 'bg-yellow-100' : 'bg-red-100'}`}>
              <AlertTriangle className={`w-6 h-6 ${hasRelatedData ? 'text-yellow-600' : 'text-red-600'}`} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                {hasRelatedData ? 'Xác nhận ngừng hợp tác' : 'Xác nhận xóa nhà cung cấp'}
              </h3>
              <p className="text-sm text-gray-500">
                {hasRelatedData ? 'Nhà cung cấp đã có phiếu nhập' : 'Hành động này không thể hoàn tác'}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-4 space-y-4">
          {/* Supplier Info */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="text-sm text-gray-500">Mã nhà cung cấp</p>
                <p className="font-medium text-gray-900">{supplier.maNcc}</p>
              </div>
            </div>
            <div className="mb-2">
              <p className="text-sm text-gray-500">Tên nhà cung cấp</p>
              <p className="font-medium text-gray-900">{supplier.tenNcc}</p>
            </div>
            {supplier.soDienThoai && (
              <div className="mb-2">
                <p className="text-sm text-gray-500">Số điện thoại</p>
                <p className="font-medium text-gray-900">{supplier.soDienThoai}</p>
              </div>
            )}
          </div>

          {/* Related Data Warning */}
          {hasRelatedData && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg space-y-3">
              <div className="flex items-center gap-2 text-yellow-800">
                <AlertTriangle className="w-5 h-5" />
                <p className="font-medium">Nhà cung cấp đã phát sinh dữ liệu</p>
              </div>
              
              <div className="space-y-2 text-sm text-yellow-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    <span>Số phiếu nhập:</span>
                  </div>
                  <span className="font-medium">{supplier.soPhieuNhap}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    <span>Tổng giá trị nhập:</span>
                  </div>
                  <span className="font-medium">{formatCurrency(supplier.tongGiaTriNhap)}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-yellow-200">
                <p className="text-sm text-yellow-800">
                  <strong>Lưu ý:</strong> Hệ thống sẽ chuyển trạng thái nhà cung cấp sang{' '}
                  <span className="font-semibold">"Ngừng hoạt động"</span> thay vì xóa hoàn toàn
                  để đảm bảo tính toàn vẹn dữ liệu.
                </p>
              </div>
            </div>
          )}

          {/* Delete Warning */}
          {!hasRelatedData && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-800 mb-2">
                <AlertTriangle className="w-5 h-5" />
                <p className="font-medium">Cảnh báo</p>
              </div>
              <p className="text-sm text-red-700">
                Nhà cung cấp sẽ bị <strong>xóa vĩnh viễn</strong> khỏi hệ thống.
                Hành động này không thể hoàn tác.
              </p>
            </div>
          )}

          {/* Confirmation Question */}
          <div className="pt-2">
            <p className="text-sm font-medium text-gray-900">
              {hasRelatedData 
                ? 'Bạn có chắc chắn muốn ngừng hợp tác với nhà cung cấp này?' 
                : 'Bạn có chắc chắn muốn xóa nhà cung cấp này?'}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-white transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded-lg text-white transition-colors ${
              hasRelatedData
                ? 'bg-yellow-600 hover:bg-yellow-700'
                : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            {hasRelatedData ? 'Ngừng hợp tác' : 'Xóa vĩnh viễn'}
          </button>
        </div>
      </div>
    </div>
  );
}
