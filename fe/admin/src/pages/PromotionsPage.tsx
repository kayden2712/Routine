import { useState, useEffect } from 'react';
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
import { promotionApi } from '../lib/promotionApi';
import type { Promotion, PromotionStatus, PromotionType } from '../types';
import { showToast } from '../lib/toast';
import PromotionFormModal from '../components/promotions/PromotionFormModal';
import { useAuthStore } from '../store/authStore';

export default function PromotionsPage() {
  const user = useAuthStore((state) => state.user);
  const isSalesReadOnly = user?.role === 'sales';

  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [filteredPromotions, setFilteredPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<PromotionStatus | 'ALL'>('ALL');
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);

  useEffect(() => {
    loadPromotions();
  }, []);

  useEffect(() => {
    filterPromotions();
  }, [promotions, searchTerm, statusFilter]);

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

  const filterPromotions = () => {
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

    setFilteredPromotions(filtered);
  };

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
    const badges = {
      DRAFT: 'bg-gray-100 text-gray-800',
      ACTIVE: 'bg-green-100 text-green-800',
      EXPIRED: 'bg-red-100 text-red-800',
      CANCELLED: 'bg-orange-100 text-orange-800',
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  const getTypeBadge = (type: PromotionType) => {
    const badges = {
      GIAM_PHAN_TRAM: 'bg-blue-100 text-blue-800',
      GIAM_TIEN: 'bg-purple-100 text-purple-800',
      TANG_QUA: 'bg-pink-100 text-pink-800',
    };
    return badges[type] || 'bg-gray-100 text-gray-800';
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
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản Lý Khuyến Mãi</h1>
          <p className="text-gray-600 mt-1">Tạo và quản lý chương trình khuyến mãi</p>
        </div>
        {!isSalesReadOnly ? (
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            <Plus size={20} />
            Tạo Khuyến Mãi
          </button>
        ) : null}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Tổng số</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <Gift className="text-gray-400" size={32} />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Đang hoạt động</p>
              <p className="text-2xl font-bold text-green-600">{stats.active}</p>
            </div>
            <TrendingUp className="text-green-400" size={32} />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Nháp</p>
              <p className="text-2xl font-bold text-gray-600">{stats.draft}</p>
            </div>
            <Tag className="text-gray-400" size={32} />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Hết hạn</p>
              <p className="text-2xl font-bold text-red-600">{stats.expired}</p>
            </div>
            <Calendar className="text-red-400" size={32} />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Tìm kiếm theo mã, tên, mô tả..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="text-gray-400" size={20} />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as PromotionStatus | 'ALL')}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="DRAFT">Nháp</option>
                <option value="ACTIVE">Đang hoạt động</option>
                <option value="EXPIRED">Hết hạn</option>
                <option value="CANCELLED">Đã hủy</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mã KM</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên chương trình</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Loại</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Giá trị</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thời gian</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sử dụng</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                {!isSalesReadOnly ? (
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
                ) : null}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPromotions.length === 0 ? (
                <tr>
                  <td colSpan={isSalesReadOnly ? 7 : 8} className="px-6 py-12 text-center text-gray-500">
                    Không tìm thấy khuyến mãi nào
                  </td>
                </tr>
              ) : (
                filteredPromotions.map((promotion) => (
                  <tr key={promotion.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{promotion.code}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{promotion.name}</div>
                      {promotion.description && (
                        <div className="text-sm text-gray-500 truncate max-w-xs">{promotion.description}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeBadge(promotion.type)}`}>
                        {promotion.typeDisplayName}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {promotion.type === 'GIAM_PHAN_TRAM'
                        ? `${promotion.discountValue}%`
                        : formatCurrency(promotion.discountValue)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>{formatDate(promotion.startDate)}</div>
                      <div>{formatDate(promotion.endDate)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {promotion.usageCount}
                      {promotion.usageLimit && ` / ${promotion.usageLimit}`}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(promotion.status)}`}>
                        {promotion.statusDisplayName}
                      </span>
                    </td>
                    {!isSalesReadOnly ? (
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          {promotion.status === 'DRAFT' && (
                            <button
                              onClick={() => handleActivate(promotion.id)}
                              className="text-green-600 hover:text-green-900"
                              title="Kích hoạt"
                            >
                              <Play size={16} />
                            </button>
                          )}
                          {(promotion.status === 'DRAFT' || promotion.status === 'ACTIVE') && (
                            <>
                              <button
                                onClick={() => handleEdit(promotion)}
                                className="text-blue-600 hover:text-blue-900"
                                title="Chỉnh sửa"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button
                                onClick={() => handleCancel(promotion.id)}
                                className="text-orange-600 hover:text-orange-900"
                                title="Hủy"
                              >
                                <XCircle size={16} />
                              </button>
                            </>
                          )}
                          {promotion.status !== 'ACTIVE' && (
                            <button
                              onClick={() => handleDelete(promotion.id)}
                              className="text-red-600 hover:text-red-900"
                              title="Xóa"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    ) : null}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

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
