import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit2, Trash2 } from 'lucide-react';
import { supplierApi } from '@/lib/supplierApi';
import { productSupplierApi } from '@/lib/productSupplierApi';
import { showToast } from '@/lib/toast';
import { SupplierProductsTable } from '@/components/suppliers/SupplierProductsTable';
import { SupplierStatsCards } from '@/components/suppliers/SupplierStatsCards';
import SupplierFormModal from '@/components/suppliers/SupplierFormModal';
import SupplierDeleteModal from '@/components/suppliers/SupplierDeleteModal';
import type { Supplier, SupplierListResponse } from '@/types';
import type { SupplierProductResponse, SupplierProductStatsResponse } from '@/lib/productSupplierApi';

type SupplierTab = 'info' | 'products' | 'stats';

export function SupplierDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const supplierId = id ? parseInt(id) : 0;

  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [products, setProducts] = useState<SupplierProductResponse[]>([]);
  const [stats, setStats] = useState<SupplierProductStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<SupplierTab>('info');

  useEffect(() => {
    if (!supplierId || Number.isNaN(supplierId)) {
      navigate('/suppliers');
      return;
    }

    void loadSupplier();
  }, [supplierId]);

  useEffect(() => {
    if (activeTab === 'products' && products.length === 0) {
      void loadProducts();
    }

    if (activeTab === 'stats' && stats === null) {
      void loadStats();
    }
  }, [activeTab]);

  const loadSupplier = async () => {
    setLoading(true);
    try {
      const data = await supplierApi.getById(supplierId);
      setSupplier(data);
    } catch (error) {
      showToast.error(error instanceof Error ? error.message : 'Cannot load supplier details');
      navigate('/suppliers');
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    setProductsLoading(true);
    try {
      const data = await productSupplierApi.getProductsBySupplierId(supplierId);
      setProducts(data);
    } catch (error) {
      showToast.error(error instanceof Error ? error.message : 'Cannot load supplier products');
    } finally {
      setProductsLoading(false);
    }
  };

  const loadStats = async () => {
    setStatsLoading(true);
    try {
      const data = await productSupplierApi.getSupplierStatistics(supplierId);
      setStats(data);
    } catch (error) {
      showToast.error(error instanceof Error ? error.message : 'Cannot load supplier statistics');
    } finally {
      setStatsLoading(false);
    }
  };

  const getStatusLabel = (status: string) => {
    return status === 'ACTIVE' ? 'Active' : 'Inactive';
  };

  const toListSupplier = (value: Supplier): SupplierListResponse => {
    return {
      id: value.id,
      maNcc: value.maNcc,
      tenNcc: value.tenNcc,
      diaChi: value.diaChi,
      soDienThoai: value.soDienThoai,
      email: value.email,
      nguoiLienHe: value.nguoiLienHe,
      trangThai: value.trangThai,
      soPhieuNhap: value.soPhieuNhap,
      tongGiaTriNhap: value.tongGiaTriNhap,
      createdAt: value.createdAt,
      updatedAt: value.updatedAt,
    };
  };

  if (loading || !supplier) {
    return <div className="p-6 text-sm text-gray-500">Loading supplier details...</div>;
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/suppliers')}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50"
          >
            <ArrowLeft size={16} /> Back
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{supplier.tenNcc}</h1>
            <p className="text-sm text-gray-500">{supplier.maNcc}</p>
          </div>
          <span className={supplier.trangThai === 'ACTIVE' ? 'rounded-full bg-green-100 px-2 py-1 text-xs text-green-700' : 'rounded-full bg-gray-200 px-2 py-1 text-xs text-gray-700'}>
            {getStatusLabel(supplier.trangThai)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setEditModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-blue-300 px-3 py-2 text-sm text-blue-700 hover:bg-blue-50"
          >
            <Edit2 size={14} /> Edit
          </button>
          <button
            onClick={() => setDeleteModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-red-300 px-3 py-2 text-sm text-red-700 hover:bg-red-50"
          >
            <Trash2 size={14} /> Delete
          </button>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <div className="mb-4 flex gap-2 border-b border-gray-200 pb-3">
          <button
            className={activeTab === 'info' ? 'rounded bg-gray-900 px-3 py-1 text-sm text-white' : 'rounded bg-gray-100 px-3 py-1 text-sm text-gray-700'}
            onClick={() => setActiveTab('info')}
          >
            Info
          </button>
          <button
            className={activeTab === 'products' ? 'rounded bg-gray-900 px-3 py-1 text-sm text-white' : 'rounded bg-gray-100 px-3 py-1 text-sm text-gray-700'}
            onClick={() => setActiveTab('products')}
          >
            Products
          </button>
          <button
            className={activeTab === 'stats' ? 'rounded bg-gray-900 px-3 py-1 text-sm text-white' : 'rounded bg-gray-100 px-3 py-1 text-sm text-gray-700'}
            onClick={() => setActiveTab('stats')}
          >
            Stats
          </button>
        </div>

        {activeTab === 'info' && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500">Address</p>
              <p className="text-sm text-gray-900">{supplier.diaChi || 'Not set'}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500">Phone</p>
              <p className="text-sm text-gray-900">{supplier.soDienThoai || 'Not set'}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500">Email</p>
              <p className="text-sm text-gray-900">{supplier.email || 'Not set'}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500">Contact Person</p>
              <p className="text-sm text-gray-900">{supplier.nguoiLienHe || 'Not set'}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500">Import Receipt Count</p>
              <p className="text-sm font-semibold text-gray-900">{supplier.soPhieuNhap ?? 0}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500">Total Import Value</p>
              <p className="text-sm font-semibold text-gray-900">{(supplier.tongGiaTriNhap ?? 0).toLocaleString('vi-VN')} ₫</p>
            </div>
          </div>
        )}

        {activeTab === 'products' && <SupplierProductsTable products={products} loading={productsLoading} />}

        {activeTab === 'stats' && (
          <>
            {statsLoading ? <p className="text-sm text-gray-500">Loading statistics...</p> : null}
            {stats ? <SupplierStatsCards stats={stats} /> : null}
          </>
        )}
      </div>

      <SupplierFormModal
        supplier={toListSupplier(supplier)}
        onClose={() => setEditModalOpen(false)}
        onSuccess={async () => {
          await loadSupplier();
          setEditModalOpen(false);
        }}
      />

      <SupplierDeleteModal
        supplier={toListSupplier(supplier)}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={async () => {
          await supplierApi.delete(supplier.id);
          setDeleteModalOpen(false);
          navigate('/suppliers');
        }}
      />
      {editModalOpen ? null : null}
      {deleteModalOpen ? null : null}
    </div>
  );
}
