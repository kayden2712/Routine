import { apiClient } from '@/lib/apiClient';
import type { Customer, Order, Product, User, UserRole } from '@/types';

interface BackendAuthResponse {
  token?: string;
  refreshToken?: string;
  id: number;
  email: string;
  fullName: string;
  role: string;
}

interface BackendProduct {
  id: number;
  code: string;
  name: string;
  categoryName: string;
  price: number;
  costPrice: number;
  stock: number;
  minStock: number;
  status: string;
  imageUrl?: string;
  createdAt?: string;
}

interface BackendCustomer {
  id: number;
  fullName: string;
  phone: string;
  email?: string;
  address?: string;
  totalOrders?: number;
  totalSpent?: number;
  lastOrderAt?: string;
  tier?: string;
  createdAt?: string;
}

interface BackendOrder {
  id: number;
  orderNumber: string;
  customer?: {
    id: number;
    fullName: string;
    phone: string;
    email?: string;
  };
  items: Array<{
    productId: number;
    productCode: string;
    productName: string;
    price: number;
    quantity: number;
    subtotal: number;
  }>;
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: string;
  status: string;
  createdByName: string;
  createdAt?: string;
}

export interface AdminDashboardSummary {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  lowStockCount: number;
  stockAlerts: Array<{
    productId: number;
    productCode: string;
    productName: string;
    stock: number;
    minStock: number;
  }>;
}

export interface AdminStaffMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  status: 'active' | 'inactive';
  branch: string;
  createdAt: Date;
  lastActiveAt?: Date;
}

const roleMap: Record<string, UserRole> = {
  MANAGER: 'manager',
  SALES: 'sales',
  WAREHOUSE: 'warehouse',
  ACCOUNTANT: 'accountant',
};

const roleReverseMap: Record<UserRole, string> = {
  manager: 'MANAGER',
  sales: 'SALES',
  warehouse: 'WAREHOUSE',
  accountant: 'ACCOUNTANT',
};

function parseDate(value?: string): Date {
  return value ? new Date(value) : new Date();
}

function mapProductStatus(status?: string): Product['status'] {
  if (status === 'OUT_OF_STOCK') return 'out_of_stock';
  if (status === 'INACTIVE') return 'inactive';
  return 'active';
}

function mapOrderStatus(status?: string): Order['status'] {
  if (status === 'PAID') return 'paid';
  if (status === 'CANCELLED') return 'cancelled';
  return 'pending';
}

function mapPaymentMethod(value?: string): Order['paymentMethod'] {
  return value === 'TRANSFER' || value === 'BANK' ? 'transfer' : 'cash';
}

export function mapBackendProduct(item: BackendProduct): Product {
  return {
    id: String(item.id),
    code: item.code,
    name: item.name,
    category: item.categoryName,
    price: Number(item.price ?? 0),
    costPrice: Number(item.costPrice ?? 0),
    stock: Number(item.stock ?? 0),
    minStock: Number(item.minStock ?? 0),
    status: mapProductStatus(item.status),
    imageUrl: item.imageUrl,
    variants: [],
    createdAt: parseDate(item.createdAt),
  };
}

export function mapBackendCustomer(item: BackendCustomer): Customer {
  return {
    id: String(item.id),
    name: item.fullName,
    phone: item.phone,
    email: item.email,
    address: item.address,
    totalOrders: Number(item.totalOrders ?? 0),
    totalSpent: Number(item.totalSpent ?? 0),
    lastOrderAt: item.lastOrderAt ? parseDate(item.lastOrderAt) : undefined,
    tier: item.tier === 'VIP' ? 'vip' : 'regular',
    createdAt: parseDate(item.createdAt),
  };
}

export function mapBackendOrder(item: BackendOrder): Order {
  return {
    id: String(item.id),
    orderNumber: item.orderNumber,
    customer: item.customer
      ? {
          id: String(item.customer.id),
          name: item.customer.fullName,
          phone: item.customer.phone,
          email: item.customer.email,
          totalOrders: 0,
          totalSpent: 0,
          tier: 'regular',
          createdAt: new Date(),
        }
      : undefined,
    items: (item.items ?? []).map((orderItem) => ({
      productId: String(orderItem.productId),
      productCode: orderItem.productCode,
      productName: orderItem.productName,
      price: Number(orderItem.price ?? 0),
      quantity: Number(orderItem.quantity ?? 0),
      subtotal: Number(orderItem.subtotal ?? 0),
    })),
    subtotal: Number(item.subtotal ?? 0),
    discount: Number(item.discount ?? 0),
    total: Number(item.total ?? 0),
    paymentMethod: mapPaymentMethod(item.paymentMethod),
    status: mapOrderStatus(item.status),
    createdAt: parseDate(item.createdAt),
    createdBy: item.createdByName,
  };
}

export async function adminLogin(email: string, password: string): Promise<User> {
  const response = await apiClient.post<BackendAuthResponse>('/auth/admin/login', {
    email,
    password,
  });

  const data = response.data;
  return {
    id: String(data.id),
    name: data.fullName,
    email: data.email,
    role: roleMap[data.role] ?? 'sales',
    avatarInitials: data.fullName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join(''),
    token: data.token,
    refreshToken: data.refreshToken,
  };
}

export async function fetchProductsApi(): Promise<Product[]> {
  const response = await apiClient.get<BackendProduct[]>('/products');
  return (response.data ?? []).map(mapBackendProduct);
}

export async function createProductApi(payload: {
  code: string;
  name: string;
  category: string;
  description?: string;
  price: number;
  costPrice: number;
  stock: number;
  minStock: number;
  imageUrl?: string;
}): Promise<Product> {
  const categoryId = 1;
  const response = await apiClient.post<BackendProduct>('/products', {
    code: payload.code,
    name: payload.name,
    categoryId,
    description: payload.description,
    price: payload.price,
    costPrice: payload.costPrice,
    stock: payload.stock,
    minStock: payload.minStock,
    imageUrl: payload.imageUrl,
  });
  return mapBackendProduct(response.data);
}

export async function updateProductApi(id: string, payload: {
  code: string;
  name: string;
  category: string;
  description?: string;
  price: number;
  costPrice: number;
  stock: number;
  minStock: number;
  imageUrl?: string;
}): Promise<Product> {
  const categoryId = 1;
  const response = await apiClient.put<BackendProduct>(`/products/${id}`, {
    code: payload.code,
    name: payload.name,
    categoryId,
    description: payload.description,
    price: payload.price,
    costPrice: payload.costPrice,
    stock: payload.stock,
    minStock: payload.minStock,
    imageUrl: payload.imageUrl,
  });
  return mapBackendProduct(response.data);
}

export async function deleteProductApi(id: string): Promise<void> {
  await apiClient.delete(`/products/${id}`);
}

export async function updateProductStockApi(id: string, stock: number): Promise<Product> {
  const response = await apiClient.put<BackendProduct>(`/products/${id}/stock?stock=${stock}`);
  return mapBackendProduct(response.data);
}

export async function fetchCustomersApi(): Promise<Customer[]> {
  const response = await apiClient.get<BackendCustomer[]>('/admin/customers');
  return (response.data ?? []).map(mapBackendCustomer);
}

export async function createCustomerApi(payload: {
  name: string;
  phone: string;
  email?: string;
  address?: string;
  tier: 'regular' | 'vip';
}): Promise<Customer> {
  const response = await apiClient.post<BackendCustomer>('/admin/customers', {
    fullName: payload.name,
    phone: payload.phone,
    email: payload.email,
    address: payload.address,
    tier: payload.tier === 'vip' ? 'VIP' : 'REGULAR',
  });
  return mapBackendCustomer(response.data);
}

export async function updateCustomerApi(
  id: string,
  payload: {
    name: string;
    phone: string;
    email?: string;
    address?: string;
    tier: 'regular' | 'vip';
  },
): Promise<Customer> {
  const response = await apiClient.put<BackendCustomer>(`/admin/customers/${id}`, {
    fullName: payload.name,
    phone: payload.phone,
    email: payload.email,
    address: payload.address,
    tier: payload.tier === 'vip' ? 'VIP' : 'REGULAR',
  });
  return mapBackendCustomer(response.data);
}

export async function fetchOrdersApi(): Promise<Order[]> {
  const response = await apiClient.get<BackendOrder[]>('/orders');
  return (response.data ?? []).map(mapBackendOrder);
}

export async function fetchDashboardSummaryApi(range: 'today' | '7days' | 'month'): Promise<AdminDashboardSummary> {
  const response = await apiClient.get<AdminDashboardSummary>(`/admin/dashboard/summary?range=${range}`);
  return {
    totalRevenue: Number(response.data?.totalRevenue ?? 0),
    totalOrders: Number(response.data?.totalOrders ?? 0),
    totalCustomers: Number(response.data?.totalCustomers ?? 0),
    lowStockCount: Number(response.data?.lowStockCount ?? 0),
    stockAlerts: response.data?.stockAlerts ?? [],
  };
}

export async function fetchReportSummaryApi(from?: string, to?: string) {
  const query = from && to ? `?from=${from}&to=${to}` : '';
  const response = await apiClient.get(`/admin/reports/summary${query}`);
  return response.data;
}

export async function fetchStaffApi(): Promise<AdminStaffMember[]> {
  const response = await apiClient.get<Array<{
    id: number;
    fullName: string;
    email: string;
    phone: string;
    role: string;
    isActive: boolean;
    branch: string;
    createdAt?: string;
    updatedAt?: string;
  }>>('/admin/staff');

  return (response.data ?? []).map((item) => ({
    id: String(item.id),
    name: item.fullName,
    email: item.email,
    phone: item.phone,
    role: roleMap[item.role] ?? 'sales',
    status: item.isActive ? 'active' : 'inactive',
    branch: item.branch,
    createdAt: parseDate(item.createdAt),
    lastActiveAt: item.isActive ? parseDate(item.updatedAt) : undefined,
  }));
}

export async function createStaffApi(payload: {
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  status: 'active' | 'inactive';
  branch: string;
}): Promise<void> {
  await apiClient.post('/admin/staff', {
    fullName: payload.name,
    email: payload.email,
    phone: payload.phone,
    role: roleReverseMap[payload.role],
    isActive: payload.status === 'active',
    branch: payload.branch,
  });
}

export async function updateStaffApi(
  id: string,
  payload: {
    name: string;
    email: string;
    phone: string;
    role: UserRole;
    status: 'active' | 'inactive';
    branch: string;
  },
): Promise<void> {
  await apiClient.put(`/admin/staff/${id}`, {
    fullName: payload.name,
    email: payload.email,
    phone: payload.phone,
    role: roleReverseMap[payload.role],
    isActive: payload.status === 'active',
    branch: payload.branch,
  });
}

export async function updateStaffStatusApi(id: string, isActive: boolean): Promise<void> {
  await apiClient.patch(`/admin/staff/${id}/status`, { isActive });
}
