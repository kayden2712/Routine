import { apiClient } from '@/lib/apiClient';
import type { CustomerUser, Product } from '@/types/customer.types';

interface BackendAuthResponse {
  token?: string;
  refreshToken?: string;
  id: number;
  email: string;
  fullName: string;
  phone?: string;
}

interface BackendProduct {
  id: number;
  code?: string;
  name: string;
  categoryName?: string;
  description?: string;
  price: number;
  stock?: number;
  minStock?: number;
  imageUrl?: string;
}

interface BackendOrder {
  id: number;
  orderNumber: string;
  status?: string;
  total?: number;
  createdAt?: string;
  items: Array<{
    productId: number;
    productName: string;
    quantity: number;
  }>;
}

export interface StorefrontOrder {
  id: string;
  orderNumber: string;
  status: 'shipping' | 'received' | 'cancelled';
  total: number;
  createdAt: Date;
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
  }>;
}

const DEFAULT_COLORS = ['Mặc định'];
const DEFAULT_SIZES: Product['sizes'] = ['M', 'L'];

function normalizeCategory(category?: string): string {
  return category && category.trim() ? category : 'Thời trang';
}

function parseDate(value?: string): Date {
  return value ? new Date(value) : new Date();
}

function mapOrderStatus(status?: string): StorefrontOrder['status'] {
  if (status === 'CANCELLED') return 'cancelled';
  if (status === 'PAID') return 'received';
  return 'shipping';
}

export function mapBackendProduct(item: BackendProduct): Product {
  return {
    id: String(item.id),
    code: item.code,
    name: item.name,
    category: normalizeCategory(item.categoryName),
    price: Number(item.price ?? 0),
    oldPrice: undefined,
    image: item.imageUrl || 'https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=800&q=80',
    colors: DEFAULT_COLORS,
    sizes: DEFAULT_SIZES,
    rating: 4.5,
    reviewCount: 0,
    badge: undefined,
    description: item.description || `Sản phẩm ${item.name} đang có tại Routine.`,
    stock: Number(item.stock ?? 0),
    minStock: Number(item.minStock ?? 0),
  };
}

function mapAuthUser(data: BackendAuthResponse): CustomerUser {
  return {
    id: String(data.id),
    fullName: data.fullName,
    email: data.email,
    phone: data.phone,
    token: data.token,
    refreshToken: data.refreshToken,
  };
}

export async function fetchProductsApi(): Promise<Product[]> {
  const response = await apiClient.get<BackendProduct[]>('/products');
  return (response.data ?? []).map(mapBackendProduct);
}

export async function customerLoginApi(email: string, password: string): Promise<CustomerUser> {
  const response = await apiClient.post<BackendAuthResponse>('/auth/customer/login', { email, password });
  return mapAuthUser(response.data);
}

export async function customerRegisterApi(fullName: string, email: string, password: string): Promise<CustomerUser> {
  const response = await apiClient.post<BackendAuthResponse>('/auth/customer/register', {
    fullName,
    email,
    password,
  });
  return mapAuthUser(response.data);
}

export async function fetchMyProfileApi(): Promise<CustomerUser> {
  const response = await apiClient.get<BackendAuthResponse>('/auth/me');
  return mapAuthUser(response.data);
}

export async function fetchMyOrdersApi(): Promise<StorefrontOrder[]> {
  const response = await apiClient.get<BackendOrder[]>('/orders');
  return (response.data ?? []).map((item) => ({
    id: String(item.id),
    orderNumber: item.orderNumber,
    status: mapOrderStatus(item.status),
    total: Number(item.total ?? 0),
    createdAt: parseDate(item.createdAt),
    items: (item.items ?? []).map((orderItem) => ({
      productId: String(orderItem.productId),
      productName: orderItem.productName,
      quantity: Number(orderItem.quantity ?? 0),
    })),
  }));
}
