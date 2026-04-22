import { apiClient } from '@/lib/apiClient';
import type {
  Customer,
  Order,
  PayrollDto,
  PayrollEmployee,
  PayrollEntryPayload,
  PayrollGenerateResult,
  Product,
  User,
  UserRole,
} from '@/types';

interface BackendAuthResponse {
  token?: string;
  refreshToken?: string;
  id: number;
  email: string;
  fullName: string;
  role: string;
  roles?: string[];
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
  channel: string;
  createdByName: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
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
  roles: UserRole[];
  employeeType?: 'fulltime' | 'parttime';
  baseSalary?: number;
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
  const parsed = value ? new Date(value) : new Date();
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
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
  const normalized = String(status ?? 'PENDING').toUpperCase();
  const statusMap: Record<string, Order['status']> = {
    PENDING: 'pending',
    CONFIRMED: 'confirmed',
    PACKING: 'packing',
    READY_TO_SHIP: 'ready_to_ship',
    IN_TRANSIT: 'in_transit',
    OUT_FOR_DELIVERY: 'out_for_delivery',
    DELIVERED: 'delivered',
    COMPLETED: 'completed',
    CANCEL_REQUESTED: 'cancel_requested',
    PAID: 'paid',
    CANCELLED: 'cancelled',
    RETURN_REQUESTED: 'return_requested',
    RETURN_APPROVED: 'return_approved',
    RETURN_REJECTED: 'return_rejected',
    RETURN_RECEIVED: 'return_received',
    REFUND_PENDING: 'refund_pending',
    REFUNDED: 'refunded',
    FAILED_DELIVERY: 'failed_delivery',
  };

  return statusMap[normalized] ?? 'pending';
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
    channel: (item.channel ?? 'OFFLINE').toLowerCase() === 'online' ? 'online' : 'offline',
    notes: item.notes,
    createdAt: parseDate(item.createdAt),
    updatedAt: parseDate(item.updatedAt ?? item.createdAt),
    createdBy: item.createdByName,
  };
}

export async function adminLogin(email: string, password: string, selectedRole: UserRole): Promise<User> {
  const response = await apiClient.post<BackendAuthResponse>('/auth/admin/login', {
    email,
    password,
    selectedRole: roleReverseMap[selectedRole],
  });

  const data = response.data;
  return {
    id: String(data.id),
    name: data.fullName,
    email: data.email,
    role: roleMap[data.role] ?? 'sales',
    roles: (data.roles ?? [data.role]).map((value) => roleMap[String(value).toUpperCase()] ?? 'sales'),
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
  const response = await apiClient.get<BackendProduct[]>('/products?includeInactive=true');
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

export async function updateOrderStatusApi(id: string, status: Order['status'], reason?: string): Promise<Order> {
  const mappedStatus = status.toUpperCase();
  const reasonQuery = reason ? `&reason=${encodeURIComponent(reason)}` : '';

  const response = await apiClient.put<BackendOrder>(
    `/orders/${id}/status?status=${encodeURIComponent(mappedStatus)}${reasonQuery}`,
  );
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
    roles?: string[];
    employeeType?: string;
    baseSalary?: number;
    isActive: boolean;
    branch: string;
    createdAt?: string;
    updatedAt?: string;
  }>>('/admin/staff');

  return (response.data ?? []).map((item) => ({
    id: String(item.id),
    name: String(item.fullName ?? ''),
    email: String(item.email ?? ''),
    phone: String(item.phone ?? ''),
    role: roleMap[String(item.role ?? '').toUpperCase()] ?? 'sales',
    roles: (item.roles ?? [item.role]).map((value) => roleMap[String(value ?? '').toUpperCase()] ?? 'sales'),
    employeeType: item.employeeType?.toLowerCase() === 'parttime' ? 'parttime' : 'fulltime',
    baseSalary: Math.round(Number(item.baseSalary ?? 0) / 1000),
    status: item.isActive ? 'active' : 'inactive',
    branch: String(item.branch ?? ''),
    createdAt: parseDate(item.createdAt),
    lastActiveAt: item.isActive ? parseDate(item.updatedAt) : undefined,
  }));
}

export async function createStaffApi(payload: {
  name: string;
  email: string;
  phone: string;
  password: string;
  roles: UserRole[];
  employeeType: 'fulltime' | 'parttime';
  baseSalary: number;
  status: 'active' | 'inactive';
  branch: string;
}): Promise<void> {
  await apiClient.post('/admin/staff', {
    fullName: payload.name,
    email: payload.email,
    phone: payload.phone,
    password: payload.password,
    roles: payload.roles.map((role) => roleReverseMap[role]),
    role: roleReverseMap[payload.roles[0]],
    employeeType: payload.employeeType.toUpperCase(),
    baseSalary: payload.baseSalary * 1000,
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
    roles: UserRole[];
    employeeType: 'fulltime' | 'parttime';
    baseSalary: number;
    status: 'active' | 'inactive';
    branch: string;
  },
): Promise<void> {
  await apiClient.put(`/admin/staff/${id}`, {
    fullName: payload.name,
    email: payload.email,
    phone: payload.phone,
    roles: payload.roles.map((role) => roleReverseMap[role]),
    role: roleReverseMap[payload.roles[0]],
    employeeType: payload.employeeType.toUpperCase(),
    baseSalary: payload.baseSalary * 1000,
    isActive: payload.status === 'active',
    branch: payload.branch,
  });
}

export async function updateStaffStatusApi(id: string, isActive: boolean): Promise<void> {
  await apiClient.patch(`/admin/staff/${id}/status`, { isActive });
}

export async function changePasswordApi(payload: {
  currentPassword?: string;
  newPassword: string;
}): Promise<void> {
  await apiClient.patch('/auth/change-password', payload);
}

interface PayrollEmployeeApi {
  id: number;
  name: string;
  type: string;
  base_salary?: number;
  dept?: string;
  status: string;
}

interface PayrollEntryApi {
  employee_id: number;
  employee_name: string;
  type: string;
  base_salary?: number;
  hours_worked?: number;
  hourly_rate?: number;
  gross_salary: number;
  bonus: number;
  penalty: number;
  net_salary: number;
}

interface PayrollApi {
  payroll_id: number;
  month: number;
  year: number;
  status: string;
  total_net: number;
  entries: PayrollEntryApi[];
}

function mapPayrollStatus(status: string): 'draft' | 'approved' {
  return status?.toLowerCase() === 'approved' ? 'approved' : 'draft';
}

function mapPayrollType(type: string): 'fulltime' | 'parttime' {
  return type?.toLowerCase() === 'parttime' ? 'parttime' : 'fulltime';
}

export async function fetchPayrollEmployeesApi(month: number, year: number): Promise<PayrollEmployee[]> {
  const response = await apiClient.get<{ employees: PayrollEmployeeApi[] }>(
    `/employees?status=active&month=${month}&year=${year}`,
  );

  return (response.data?.employees ?? [])
    .filter((employee) => employee.status?.toUpperCase() === 'ACTIVE')
    .map((employee) => ({
      id: employee.id,
      name: employee.name,
      type: mapPayrollType(employee.type),
      baseSalary: Number(employee.base_salary ?? 0),
      dept: employee.dept,
      status: employee.status?.toUpperCase() === 'ACTIVE' ? 'ACTIVE' : 'LOCKED',
    }));
}

export async function generatePayrollApi(payload: {
  month: number;
  year: number;
  entries: PayrollEntryPayload[];
  overwrite?: boolean;
}): Promise<PayrollGenerateResult> {
  const response = await apiClient.post<{ payroll_id: number; status: string; total_net: number }>('/payroll/generate', {
    month: payload.month,
    year: payload.year,
    overwrite: payload.overwrite,
    entries: payload.entries.map((entry) => ({
      employee_id: entry.employee_id,
      type: entry.type,
      hours_worked: entry.hours_worked,
      bonus: entry.bonus,
      penalty: entry.penalty,
    })),
  });

  return {
    payroll_id: Number(response.data.payroll_id),
    status: mapPayrollStatus(response.data.status),
    total_net: Number(response.data.total_net ?? 0),
  };
}

export async function updatePayrollApi(payrollId: number, payload: {
  entries: PayrollEntryPayload[];
}): Promise<PayrollGenerateResult> {
  const response = await apiClient.put<{ payroll_id: number; status: string; total_net: number }>(`/payroll/${payrollId}`, {
    entries: payload.entries.map((entry) => ({
      employee_id: entry.employee_id,
      type: entry.type,
      hours_worked: entry.hours_worked,
      bonus: entry.bonus,
      penalty: entry.penalty,
    })),
  });

  return {
    payroll_id: Number(response.data.payroll_id),
    status: mapPayrollStatus(response.data.status),
    total_net: Number(response.data.total_net ?? 0),
  };
}

export async function approvePayrollApi(payrollId: number): Promise<{ status: 'approved' }> {
  const response = await apiClient.put<{ status: string }>(`/payroll/${payrollId}/approve`);
  return {
    status: mapPayrollStatus(response.data.status) === 'approved' ? 'approved' : 'approved',
  };
}

export async function fetchPayrollApi(month?: number, year?: number): Promise<PayrollDto[]> {
  const query = month && year ? `?month=${month}&year=${year}` : '';
  const response = await apiClient.get<PayrollApi[]>(`/payroll${query}`);
  return (response.data ?? []).map((payroll) => ({
    payrollId: payroll.payroll_id,
    month: payroll.month,
    year: payroll.year,
    status: mapPayrollStatus(payroll.status),
    totalNet: Number(payroll.total_net ?? 0),
    entries: (payroll.entries ?? []).map((entry) => ({
      employeeId: entry.employee_id,
      employeeName: entry.employee_name,
      type: mapPayrollType(entry.type),
      baseSalary: entry.base_salary,
      hoursWorked: entry.hours_worked,
      hourlyRate: entry.hourly_rate,
      grossSalary: Number(entry.gross_salary ?? 0),
      bonus: Number(entry.bonus ?? 0),
      penalty: Number(entry.penalty ?? 0),
      netSalary: Number(entry.net_salary ?? 0),
    })),
  }));
}
