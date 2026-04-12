import { apiClient } from './apiClient';
import type {
  Supplier,
  SupplierListResponse,
  SupplierRequest,
  SupplierSearchRequest,
  SupplierStatus,
  PagedResponse,
} from '../types';

export const supplierApi = {
  /**
   * Lấy tất cả nhà cung cấp (không phân trang)
   */
  getAll: async (): Promise<SupplierListResponse[]> => {
    const response = await apiClient.get<SupplierListResponse[]>('/suppliers');
    return response.data;
  },

  /**
   * Lấy nhà cung cấp đang hoạt động (dùng cho dropdown)
   */
  getActive: async (): Promise<SupplierListResponse[]> => {
    const response = await apiClient.get<SupplierListResponse[]>('/suppliers/active');
    return response.data;
  },

  /**
   * Tìm kiếm và lọc với phân trang
   */
  search: async (searchRequest: SupplierSearchRequest): Promise<PagedResponse<SupplierListResponse>> => {
    const response = await apiClient.post<PagedResponse<SupplierListResponse>>(
      '/suppliers/search',
      searchRequest
    );
    return response.data;
  },

  /**
   * Lấy chi tiết nhà cung cấp theo ID
   */
  getById: async (id: number): Promise<Supplier> => {
    const response = await apiClient.get<Supplier>(`/suppliers/${id}`);
    return response.data;
  },

  /**
   * Lấy chi tiết nhà cung cấp theo mã
   */
  getByCode: async (maNcc: string): Promise<Supplier> => {
    const response = await apiClient.get<Supplier>(`/suppliers/code/${maNcc}`);
    return response.data;
  },

  /**
   * Tạo mới nhà cung cấp
   */
  create: async (data: SupplierRequest): Promise<Supplier> => {
    const response = await apiClient.post<Supplier>('/suppliers', data);
    return response.data;
  },

  /**
   * Cập nhật nhà cung cấp
   */
  update: async (id: number, data: SupplierRequest): Promise<Supplier> => {
    const response = await apiClient.put<Supplier>(`/suppliers/${id}`, data);
    return response.data;
  },

  /**
   * Xóa nhà cung cấp
   * - Nếu có phiếu nhập: soft delete (chuyển INACTIVE)
   * - Nếu chưa có: hard delete
   */
  delete: async (id: number): Promise<{ hasRelatedData: boolean }> => {
    await apiClient.delete(`/suppliers/${id}`);
    // Note: Backend response message sẽ cho biết hard hay soft delete
    return { hasRelatedData: false }; // Can be enhanced later
  },

  /**
   * Cập nhật trạng thái nhà cung cấp
   */
  updateStatus: async (id: number, trangThai: SupplierStatus): Promise<Supplier> => {
    const response = await apiClient.patch<Supplier>(
      `/suppliers/${id}/status`,
      null,
      { params: { trangThai } }
    );
    return response.data;
  },

  /**
   * Kiểm tra nhà cung cấp có phát sinh dữ liệu không (helper, nếu cần)
   */
  checkRelatedData: async (id: number): Promise<boolean> => {
    try {
      const supplier = await supplierApi.getById(id);
      return (supplier.soPhieuNhap ?? 0) > 0;
    } catch {
      return false;
    }
  },
};
