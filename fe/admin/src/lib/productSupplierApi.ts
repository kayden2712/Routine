import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

export interface SupplierProductResponse {
  productId: number;
  productCode: string;
  productName: string;
  categoryName: string;
  currentPrice: number;
  currentStock: number;
  totalPurchaseOrders: number;
  totalQuantityPurchased: number;
  lastPurchasePrice?: number;
  lastPurchaseDate?: string;
  avgPurchasePrice: number;
  totalPurchaseValue: number;
}

export interface ProductSupplierResponse {
  supplierId: number;
  supplierCode: string;
  supplierName: string;
  phone?: string;
  email?: string;
  status: string;
  totalPurchaseOrders: number;
  totalQuantityPurchased: number;
  lastPurchasePrice?: number;
  lastPurchaseDate?: string;
  avgPurchasePrice: number;
  totalPurchaseValue: number;
}

export interface SupplierProductStatsResponse {
  supplierId: number;
  supplierName: string;
  totalProducts: number;
  totalPurchaseOrders: number;
  totalQuantityPurchased: number;
  totalPurchaseValue: number;
  avgOrderValue: number;
  activeProducts: number;
  inactiveProducts: number;
}

export interface PaginationParams {
  page?: number;
  size?: number;
  sortBy?: string;
  sortDirection?: 'ASC' | 'DESC';
}

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const productSupplierApi = {
  /**
   * Get all products supplied by a specific supplier
   */
  getProductsBySupplierId: async (supplierId: number): Promise<SupplierProductResponse[]> => {
    const response = await api.get(`/suppliers/${supplierId}/products`);
    return response.data.data;
  },

  /**
   * Get all suppliers for a specific product
   */
  getSuppliersByProductId: async (productId: number): Promise<ProductSupplierResponse[]> => {
    const response = await api.get(`/products/${productId}/suppliers`);
    return response.data.data;
  },

  /**
   * Get purchase history for a supplier
   */
  getPurchaseHistoryBySupplierId: async (
    supplierId: number,
    params?: PaginationParams
  ): Promise<any> => {
    const response = await api.get(`/suppliers/${supplierId}/purchase-history`, { params });
    return response.data.data;
  },

  /**
   * Get purchase history for a product
   */
  getPurchaseHistoryByProductId: async (
    productId: number,
    params?: PaginationParams
  ): Promise<any> => {
    const response = await api.get(`/products/${productId}/purchase-history`, { params });
    return response.data.data;
  },

  /**
   * Get statistics for a supplier
   */
  getSupplierStatistics: async (supplierId: number): Promise<SupplierProductStatsResponse> => {
    const response = await api.get(`/suppliers/${supplierId}/statistics`);
    return response.data.data;
  },

  /**
   * Get statistics for a product
   */
  getProductStatistics: async (productId: number): Promise<SupplierProductStatsResponse> => {
    const response = await api.get(`/products/${productId}/statistics`);
    return response.data.data;
  },
};
