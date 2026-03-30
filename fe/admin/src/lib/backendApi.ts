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
  gender?: string;
  description?: string;
  price: number;
  oldPrice?: number;
  costPrice: number;
  stock: number;
  minStock: number;
  status: string;
  imageUrl?: string;
  imageUrls?: string[];
  sizes?: string[];
  colors?: string[];
  variants?: Array<{
    size?: string;
    color?: string;
    stock?: number;
  }>;
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

interface BackendCategory {
  id: number;
  name: string;
  slug?: string;
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

function mapProductGender(gender?: string): Product['gender'] {
  return gender === 'FEMALE' ? 'female' : 'male';
}

function mapOrderStatus(status?: string): Order['status'] {
  if (status === 'PAID') return 'paid';
  if (status === 'CANCELLED') return 'cancelled';
  return 'pending';
}

function mapPaymentMethod(value?: string): Order['paymentMethod'] {
  return value === 'TRANSFER' || value === 'BANK' ? 'transfer' : 'cash';
}

function normalizeCategoryKey(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .trim()
    .toLowerCase();
}

async function resolveCategoryId(categoryName: string): Promise<number> {
  const response = await apiClient.get<BackendCategory[]>('/categories');
  const categories = response.data ?? [];

  if (categories.length === 0) {
    throw new Error('Không tìm thấy danh mục trên hệ thống.');
  }

  const requested = normalizeCategoryKey(categoryName);
  const matched = categories.find((category) => normalizeCategoryKey(category.name) === requested)
    ?? categories.find((category) => category.slug && normalizeCategoryKey(category.slug) === requested)
    ?? categories[0];

  return matched.id;
}

export function mapBackendProduct(item: BackendProduct): Product {
  const variants = (item.variants ?? []).map((variant, index) => ({
    id: `v-${item.id}-${index + 1}`,
    size: String(variant.size ?? '').toUpperCase(),
    color: String(variant.color ?? 'black').toLowerCase(),
    stock: Number(variant.stock ?? 0),
  }));

  const fallbackSizes = item.sizes ?? [];
  const fallbackColors = item.colors ?? [];

  const variantSizes = Array.from(new Set(variants.map((variant) => variant.size)));
  const variantColors = Array.from(new Set(variants.map((variant) => variant.color)));

  const imageUrls = (item.imageUrls ?? [])
    .map((url) => String(url ?? '').trim())
    .filter((url) => url.length > 0);
  const displayImageUrl = imageUrls[0] ?? item.imageUrl;

  return {
    id: String(item.id),
    code: item.code,
    name: item.name,
    category: item.categoryName,
    gender: mapProductGender(item.gender),
    description: item.description ?? '',
    price: Number(item.price ?? 0),
    oldPrice: item.oldPrice ? Number(item.oldPrice) : undefined,
    costPrice: Number(item.costPrice ?? 0),
    stock: Number(item.stock ?? 0),
    minStock: Number(item.minStock ?? 0),
    status: mapProductStatus(item.status),
    imageUrl: displayImageUrl,
    imageUrls,
    sizes: variants.length > 0 ? variantSizes : fallbackSizes,
    colors: variants.length > 0 ? variantColors : fallbackColors,
    variants,
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
  gender: 'male' | 'female';
  description?: string;
  price: number;
  oldPrice?: number;
  costPrice: number;
  stock: number;
  minStock: number;
  imageUrl?: string;
  imageUrls?: string[];
  sizes?: string[];
  colors?: string[];
  sizeStocks?: Record<string, number>;
  variants?: Array<{
    size: string;
    color: string;
    stock: number;
  }>;
}): Promise<Product> {
  const categoryId = await resolveCategoryId(payload.category);
  const response = await apiClient.post<BackendProduct>('/products', {
    code: payload.code,
    name: payload.name,
    categoryId,
    gender: payload.gender === 'female' ? 'FEMALE' : 'MALE',
    description: payload.description,
    price: payload.price,
    oldPrice: payload.oldPrice,
    costPrice: payload.costPrice,
    stock: payload.stock,
    minStock: payload.minStock,
    imageUrl: payload.imageUrl,
    imageUrls: payload.imageUrls ?? [],
    sizes: payload.sizes ?? [],
    colors: payload.colors ?? [],
    sizeStocks: payload.sizeStocks ?? {},
    variants: payload.variants ?? [],
  });
  return mapBackendProduct(response.data);
}

export async function updateProductApi(id: string, payload: {
  code: string;
  name: string;
  category: string;
  gender: 'male' | 'female';
  description?: string;
  price: number;
  oldPrice?: number;
  costPrice: number;
  stock: number;
  minStock: number;
  imageUrl?: string;
  imageUrls?: string[];
  sizes?: string[];
  colors?: string[];
  sizeStocks?: Record<string, number>;
  variants?: Array<{
    size: string;
    color: string;
    stock: number;
  }>;
}): Promise<Product> {
  const categoryId = await resolveCategoryId(payload.category);
  const response = await apiClient.put<BackendProduct>(`/products/${id}`, {
    code: payload.code,
    name: payload.name,
    categoryId,
    gender: payload.gender === 'female' ? 'FEMALE' : 'MALE',
    description: payload.description,
    price: payload.price,
    oldPrice: payload.oldPrice,
    costPrice: payload.costPrice,
    stock: payload.stock,
    minStock: payload.minStock,
    imageUrl: payload.imageUrl,
    imageUrls: payload.imageUrls ?? [],
    sizes: payload.sizes ?? [],
    colors: payload.colors ?? [],
    sizeStocks: payload.sizeStocks ?? {},
    variants: payload.variants ?? [],
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

export async function createOrderApi(payload: {
  customerId?: string;
  items: Array<{
    productId: string;
    quantity: number;
    price: number;
    size?: string;
    color?: string;
  }>;
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: 'cash' | 'transfer';
  notes?: string;
}): Promise<Order> {
  const response = await apiClient.post<BackendOrder>('/orders', {
    customerId: payload.customerId ? Number.parseInt(payload.customerId, 10) : undefined,
    items: payload.items.map((item) => ({
      productId: Number.parseInt(item.productId, 10),
      quantity: item.quantity,
      price: item.price,
      size: item.size,
      color: item.color,
    })),
    subtotal: payload.subtotal,
    discount: payload.discount,
    total: payload.total,
    paymentMethod: payload.paymentMethod === 'transfer' ? 'TRANSFER' : 'CASH',
    notes: payload.notes,
  });

  return mapBackendOrder(response.data);
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
  password: string;
  role: UserRole;
  status: 'active' | 'inactive';
  branch: string;
}): Promise<void> {
  await apiClient.post('/admin/staff', {
    fullName: payload.name,
    email: payload.email,
    phone: payload.phone,
    password: payload.password,
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

export async function changePasswordApi(payload: {
  currentPassword: string;
  newPassword: string;
}): Promise<void> {
  await apiClient.patch('/auth/change-password', payload);
}
