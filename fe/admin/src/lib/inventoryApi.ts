import { apiClient } from './apiClient';
import type {
  CreateExportReceiptRequest,
  CreateImportReceiptRequest,
  ExportReceipt,
  ImportReceipt,
  InventoryAdjustRequest,
  InventoryHistoryItem,
  InventoryReportItem,
  PagedResponse,
  ReceiptStatus,
} from '../types';

export const inventoryApi = {
  getReport: async (params?: { keyword?: string; lowStockOnly?: boolean }): Promise<InventoryReportItem[]> => {
    const response = await apiClient.get<InventoryReportItem[]>('/inventory/report', {
      params: {
        keyword: params?.keyword ?? '',
        lowStockOnly: params?.lowStockOnly ?? false,
      },
    });
    return response.data ?? [];
  },

  getHistory: async (params?: {
    productId?: number;
    page?: number;
    size?: number;
  }): Promise<PagedResponse<InventoryHistoryItem>> => {
    const response = await apiClient.get<PagedResponse<InventoryHistoryItem>>('/inventory/history', {
      params: {
        productId: params?.productId,
        page: params?.page ?? 0,
        size: params?.size ?? 10,
      },
    });
    return response.data;
  },

  adjustStock: async (payload: InventoryAdjustRequest): Promise<InventoryReportItem> => {
    const response = await apiClient.post<InventoryReportItem>('/inventory/adjust', payload);
    return response.data;
  },

  getImportReceipts: async (params?: {
    status?: ReceiptStatus;
    page?: number;
    size?: number;
  }): Promise<PagedResponse<ImportReceipt>> => {
    const response = await apiClient.get<PagedResponse<ImportReceipt>>('/inventory/import-receipts', {
      params: {
        status: params?.status,
        page: params?.page ?? 0,
        size: params?.size ?? 20,
      },
    });
    return response.data;
  },

  createImportReceipt: async (payload: CreateImportReceiptRequest): Promise<ImportReceipt> => {
    const response = await apiClient.post<ImportReceipt>('/inventory/import-receipts', payload);
    return response.data;
  },

  confirmImportReceipt: async (id: number): Promise<ImportReceipt> => {
    const response = await apiClient.post<ImportReceipt>(`/inventory/import-receipts/${id}/confirm`);
    return response.data;
  },

  cancelImportReceipt: async (id: number): Promise<ImportReceipt> => {
    const response = await apiClient.post<ImportReceipt>(`/inventory/import-receipts/${id}/cancel`);
    return response.data;
  },

  getExportReceipts: async (params?: {
    status?: ReceiptStatus;
    page?: number;
    size?: number;
  }): Promise<PagedResponse<ExportReceipt>> => {
    const response = await apiClient.get<PagedResponse<ExportReceipt>>('/inventory/export-receipts', {
      params: {
        status: params?.status,
        page: params?.page ?? 0,
        size: params?.size ?? 20,
      },
    });
    return response.data;
  },

  createExportReceipt: async (payload: CreateExportReceiptRequest): Promise<ExportReceipt> => {
    const response = await apiClient.post<ExportReceipt>('/inventory/export-receipts', payload);
    return response.data;
  },

  confirmExportReceipt: async (id: number): Promise<ExportReceipt> => {
    const response = await apiClient.post<ExportReceipt>(`/inventory/export-receipts/${id}/confirm`);
    return response.data;
  },

  cancelExportReceipt: async (id: number): Promise<ExportReceipt> => {
    const response = await apiClient.post<ExportReceipt>(`/inventory/export-receipts/${id}/cancel`);
    return response.data;
  },
};
