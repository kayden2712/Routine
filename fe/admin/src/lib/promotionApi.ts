import { apiClient } from './apiClient';
import type {
  Promotion,
  PromotionDetail,
  CreatePromotionRequest,
  UpdatePromotionRequest,
  ApplyPromotionRequest,
  ApplyPromotionResponse,
  CheckPromotionRequest,
  CheckPromotionResponse,
  PromotionStatus,
} from '../types';

export const promotionApi = {
  getAll: async (status?: PromotionStatus): Promise<Promotion[]> => {
    const url = status ? `/promotions?status=${status}` : '/promotions';
    const response = await apiClient.get<Promotion[]>(url);
    return response.data;
  },

  getActive: async (): Promise<Promotion[]> => {
    const response = await apiClient.get<Promotion[]>('/promotions/active');
    return response.data;
  },

  getById: async (id: number): Promise<PromotionDetail> => {
    const response = await apiClient.get<PromotionDetail>(`/promotions/${id}`);
    return response.data;
  },

  getByCode: async (code: string): Promise<Promotion> => {
    const response = await apiClient.get<Promotion>(`/promotions/code/${code}`);
    return response.data;
  },

  create: async (data: CreatePromotionRequest): Promise<Promotion> => {
    const response = await apiClient.post<Promotion>('/promotions', data);
    return response.data;
  },

  update: async (id: number, data: UpdatePromotionRequest): Promise<Promotion> => {
    const response = await apiClient.put<Promotion>(`/promotions/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/promotions/${id}`);
  },

  activate: async (id: number): Promise<Promotion> => {
    const response = await apiClient.post<Promotion>(`/promotions/${id}/activate`);
    return response.data;
  },

  cancel: async (id: number): Promise<Promotion> => {
    const response = await apiClient.post<Promotion>(`/promotions/${id}/cancel`);
    return response.data;
  },

  apply: async (data: ApplyPromotionRequest, orderId?: number): Promise<ApplyPromotionResponse> => {
    const url = orderId ? `/promotions/apply?orderId=${orderId}` : '/promotions/apply';
    const response = await apiClient.post<ApplyPromotionResponse>(url, data);
    return response.data;
  },

  check: async (data: CheckPromotionRequest): Promise<CheckPromotionResponse> => {
    const response = await apiClient.post<CheckPromotionResponse>('/promotions/check', data);
    return response.data;
  },
};
