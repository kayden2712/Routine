import { apiClient } from '@/lib/apiClient';
import type { CustomerUser, Product } from '@/types/customer.types';

interface BackendAuthResponse {
  token?: string;
  refreshToken?: string;
  id: number;
  email: string;
  fullName: string;
  phone?: string;
  address?: string;
  district?: string;
  city?: string;
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
  imageUrls?: string[];
  sizes?: string[];
  colors?: string[];
  variants?: Array<{
    size?: string;
    color?: string;
    stock?: number;
  }>;
}

interface BackendOrder {
  id: number;
  orderNumber: string;
  status?: string;
  subtotal?: number;
  discount?: number;
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
  subtotal: number;
  discount: number;
  total: number;
  createdAt: Date;
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
  }>;
}

export interface CreateStorefrontOrderPayload {
  customerId?: string;
  items: Array<{
    productId: string;
    quantity: number;
    price: number;
    size: string;
    color: string;
  }>;
  subtotal: number;
  discount?: number;
  total: number;
  paymentMethod: 'cod' | 'bank';
  notes?: string;
}

export interface UpdateCustomerProfilePayload {
  fullName: string;
  phone: string;
  address?: string;
  district?: string;
  city?: string;
}

const APPAREL_SIZES: Product['sizes'] = ['S', 'M', 'L', 'XL'];
const PANTS_SIZES: Product['sizes'] = ['28', '29', '30', '31', '32'];
const ACCESSORY_SIZES: Product['sizes'] = ['M'];

const COLOR_POOL = [
  'Trắng',
  'Đen',
  'Xám',
  'Navy',
  'Be',
  'Olive',
  'Xanh đậm',
  'Xanh wash',
  'Nâu cà phê',
  'Đỏ đô',
] as const;

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

function inferSizes(category: string, id: number): Product['sizes'] {
  const normalized = category.toLowerCase();

  if (normalized.includes('quan') || normalized.includes('quần')) {
    return id % 2 === 0 ? PANTS_SIZES : ['29', '30', '31'];
  }

  if (normalized.includes('phu kien') || normalized.includes('phụ kiện')) {
    return ACCESSORY_SIZES;
  }

  return id % 3 === 0 ? APPAREL_SIZES : ['M', 'L', 'XL'];
}

function inferColors(id: number): string[] {
  const size = 3;
  const start = id % COLOR_POOL.length;
  const result: string[] = [];

  for (let index = 0; index < size; index += 1) {
    result.push(COLOR_POOL[(start + index) % COLOR_POOL.length]);
  }

  return result;
}

export function mapBackendProduct(item: BackendProduct): Product {
  const category = normalizeCategory(item.categoryName);
  const images = (item.imageUrls ?? [])
    .map((url) => String(url ?? '').trim())
    .filter((url) => url.length > 0);
  const primaryImage = images[0] || item.imageUrl || 'https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=800&q=80';
  const variants = (item.variants ?? []).map((variant) => ({
    size: String(variant.size ?? '').toUpperCase(),
    color: String(variant.color ?? '').trim() || 'Mặc định',
    stock: Number(variant.stock ?? 0),
  }));
  const sizesFromVariants = Array.from(new Set(variants.map((variant) => variant.size).filter(Boolean)));
  const colorsFromVariants = Array.from(new Set(variants.map((variant) => variant.color).filter(Boolean)));

  const fallbackSizes = item.sizes && item.sizes.length > 0 ? item.sizes : inferSizes(category, item.id);
  const fallbackColors = item.colors && item.colors.length > 0 ? item.colors : inferColors(item.id);

  return {
    id: String(item.id),
    code: item.code,
    name: item.name,
    category,
    price: Number(item.price ?? 0),
    oldPrice: undefined,
    image: primaryImage,
    images,
    colors: colorsFromVariants.length > 0 ? colorsFromVariants : fallbackColors,
    sizes: (sizesFromVariants.length > 0 ? sizesFromVariants : fallbackSizes) as Product['sizes'],
    variants,
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
    address: data.address,
    district: data.district,
    city: data.city,
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

export async function customerRegisterApi(fullName: string, email: string, password: string, phone: string): Promise<CustomerUser> {
  const response = await apiClient.post<BackendAuthResponse>('/auth/customer/register', {
    fullName,
    email,
    password,
    phone,
  });
  return mapAuthUser(response.data);
}

export async function fetchMyProfileApi(): Promise<CustomerUser> {
  const response = await apiClient.get<BackendAuthResponse>('/auth/me');
  return mapAuthUser(response.data);
}

export async function updateCustomerProfileApi(payload: UpdateCustomerProfilePayload): Promise<CustomerUser> {
  const response = await apiClient.patch<BackendAuthResponse>('/auth/customer/profile', payload);
  return mapAuthUser(response.data);
}

export async function fetchMyOrdersApi(): Promise<StorefrontOrder[]> {
  const response = await apiClient.get<BackendOrder[]>('/customer/orders');
  return (response.data ?? []).map((item) => ({
    id: String(item.id),
    orderNumber: item.orderNumber,
    status: mapOrderStatus(item.status),
    subtotal: Number(item.subtotal ?? 0),
    discount: Number(item.discount ?? 0),
    total: Number(item.total ?? 0),
    createdAt: parseDate(item.createdAt),
    items: (item.items ?? []).map((orderItem) => ({
      productId: String(orderItem.productId),
      productName: orderItem.productName,
      quantity: Number(orderItem.quantity ?? 0),
    })),
  }));
}

export async function createCustomerOrderApi(payload: CreateStorefrontOrderPayload): Promise<StorefrontOrder> {
  const customerId = payload.customerId ? Number.parseInt(payload.customerId, 10) : undefined;
  const items = payload.items.map((item) => {
    const productId = Number.parseInt(item.productId, 10);
    if (!Number.isFinite(productId)) {
      throw new Error(`Invalid product id: ${item.productId}`);
    }

    return {
      productId,
      quantity: item.quantity,
      price: item.price,
      size: item.size,
      color: item.color,
    };
  });

  const response = await apiClient.post<BackendOrder>('/customer/orders', {
    customerId,
    items,
    subtotal: payload.subtotal,
    discount: payload.discount ?? 0,
    total: payload.total,
    paymentMethod: payload.paymentMethod === 'bank' ? 'BANK' : 'COD',
    notes: payload.notes,
  });

  const order = response.data;
  return {
    id: String(order.id),
    orderNumber: order.orderNumber,
    status: mapOrderStatus(order.status),
    subtotal: Number(order.subtotal ?? 0),
    discount: Number(order.discount ?? 0),
    total: Number(order.total ?? 0),
    createdAt: parseDate(order.createdAt),
    items: (order.items ?? []).map((orderItem) => ({
      productId: String(orderItem.productId),
      productName: orderItem.productName,
      quantity: Number(orderItem.quantity ?? 0),
    })),
  };
}
