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
  gender?: string;
  description?: string;
  price: number;
  oldPrice?: number;
  badge?: string;
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
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  deliveredAt?: string;
  items: Array<{
    id?: number;
    productId: number;
    productCode?: string;
    productName: string;
    price?: number;
    quantity: number;
    subtotal?: number;
    size?: string;
    color?: string;
  }>;
}

export type StorefrontPromotionType = 'GIAM_PHAN_TRAM' | 'GIAM_TIEN' | 'TANG_QUA';

export interface StorefrontPromotion {
  id: number;
  code: string;
  name: string;
  type: StorefrontPromotionType;
  typeDisplayName: string;
  description?: string;
  discountValue?: number;
  maxDiscountAmount?: number;
  minOrderAmount?: number;
  applyToAllProducts?: boolean;
}

export interface ApplyStorefrontPromotionPayload {
  promotionCode: string;
  orderAmount: number;
  productIds?: number[];
}

export interface ApplyStorefrontPromotionResult {
  applicable: boolean;
  message: string;
  promotionId?: number;
  promotionCode?: string;
  promotionName?: string;
  discountAmount?: number;
  originalAmount?: number;
  finalAmount?: number;
}

export interface CheckStorefrontPromotionPayload {
  orderAmount: number;
  productIds: number[];
  customerId?: number;
}

export interface CheckStorefrontPromotionResult {
  hasApplicablePromotions: boolean;
  applicablePromotions: StorefrontPromotion[];
  message: string;
}

export interface StorefrontOrder {
  id: string;
  orderNumber: string;
  status:
    | 'processing'
    | 'preparing'
    | 'shipping'
    | 'received'
    | 'cancelled'
    | 'cancel_requested'
    | 'refund_requested'
    | 'refunded';
  subtotal: number;
  discount: number;
  total: number;
  notes?: string;
  createdAt: Date;
  updatedAt?: Date;
  deliveredAt?: Date;
  items: Array<{
    id?: string;
    productId: string;
    productCode?: string;
    productName: string;
    price?: number;
    quantity: number;
    subtotal?: number;
    size?: string;
    color?: string;
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

export interface ChangeCustomerPasswordPayload {
  currentPassword: string;
  newPassword: string;
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
  if (status === 'CANCEL_REQUESTED') return 'cancel_requested';
  if (
    status === 'RETURN_REQUESTED'
    || status === 'RETURN_APPROVED'
    || status === 'RETURN_RECEIVED'
    || status === 'REFUND_PENDING'
  ) {
    return 'refund_requested';
  }
  if (status === 'REFUNDED') return 'refunded';
  if (status === 'RETURN_REJECTED') return 'received';
  if (status === 'COMPLETED' || status === 'DELIVERED' || status === 'PAID') return 'received';
  if (status === 'IN_TRANSIT' || status === 'OUT_FOR_DELIVERY') return 'shipping';
  if (status === 'CONFIRMED' || status === 'PACKING' || status === 'READY_TO_SHIP') return 'preparing';
  return 'processing';
}

function mapProductGender(value?: string): Product['gender'] {
  if (value === 'FEMALE') return 'female';
  if (value === 'MALE') return 'male';
  return undefined;
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
    gender: mapProductGender(item.gender),
    price: Number(item.price ?? 0),
    oldPrice: item.oldPrice ? Number(item.oldPrice) : undefined,
    image: primaryImage,
    images,
    colors: colorsFromVariants.length > 0 ? colorsFromVariants : fallbackColors,
    sizes: (sizesFromVariants.length > 0 ? sizesFromVariants : fallbackSizes) as Product['sizes'],
    variants,
    rating: 4.5,
    reviewCount: 0,
    badge: item.badge === 'sale' || item.badge === 'new' || item.badge === 'bestseller'
      ? item.badge
      : undefined,
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

export async function fetchPromotionByCodeApi(code: string): Promise<StorefrontPromotion> {
  const response = await apiClient.get<StorefrontPromotion>(`/promotions/code/${encodeURIComponent(code)}`);
  return response.data;
}

export async function applyPromotionCodeApi(
  payload: ApplyStorefrontPromotionPayload,
): Promise<ApplyStorefrontPromotionResult> {
  const response = await apiClient.post<ApplyStorefrontPromotionResult>('/promotions/apply', payload);
  return response.data;
}

export async function checkApplicablePromotionsApi(
  payload: CheckStorefrontPromotionPayload,
): Promise<CheckStorefrontPromotionResult> {
  const response = await apiClient.post<CheckStorefrontPromotionResult>('/promotions/check', payload);
  return response.data;
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

export async function changeCustomerPasswordApi(payload: ChangeCustomerPasswordPayload): Promise<void> {
  await apiClient.patch('/auth/change-password', payload);
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
    notes: item.notes,
    createdAt: parseDate(item.createdAt),
    updatedAt: item.updatedAt ? parseDate(item.updatedAt) : undefined,
    deliveredAt: item.deliveredAt ? parseDate(item.deliveredAt) : undefined,
    items: (item.items ?? []).map((orderItem) => ({
      id: orderItem.id != null ? String(orderItem.id) : undefined,
      productId: String(orderItem.productId),
      productCode: orderItem.productCode,
      productName: orderItem.productName,
      price: orderItem.price != null ? Number(orderItem.price) : undefined,
      quantity: Number(orderItem.quantity ?? 0),
      subtotal: orderItem.subtotal != null ? Number(orderItem.subtotal) : undefined,
      size: orderItem.size,
      color: orderItem.color,
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
    notes: order.notes,
    createdAt: parseDate(order.createdAt),
    updatedAt: order.updatedAt ? parseDate(order.updatedAt) : undefined,
    items: (order.items ?? []).map((orderItem) => ({
      id: orderItem.id != null ? String(orderItem.id) : undefined,
      productId: String(orderItem.productId),
      productCode: orderItem.productCode,
      productName: orderItem.productName,
      price: orderItem.price != null ? Number(orderItem.price) : undefined,
      quantity: Number(orderItem.quantity ?? 0),
      subtotal: orderItem.subtotal != null ? Number(orderItem.subtotal) : undefined,
      size: orderItem.size,
      color: orderItem.color,
    })),
  };
}

export async function requestOrderCancellationApi(orderId: string, reason: string): Promise<StorefrontOrder> {
  const response = await apiClient.put<BackendOrder>(`/customer/orders/${orderId}/cancel-request`, {
    reason,
  });
  const item = response.data;
  return {
    id: String(item.id),
    orderNumber: item.orderNumber,
    status: mapOrderStatus(item.status),
    subtotal: Number(item.subtotal ?? 0),
    discount: Number(item.discount ?? 0),
    total: Number(item.total ?? 0),
    notes: item.notes,
    createdAt: parseDate(item.createdAt),
    items: (item.items ?? []).map((orderItem) => ({
      id: orderItem.id != null ? String(orderItem.id) : undefined,
      productId: String(orderItem.productId),
      productCode: orderItem.productCode,
      productName: orderItem.productName,
      price: orderItem.price != null ? Number(orderItem.price) : undefined,
      quantity: Number(orderItem.quantity ?? 0),
      subtotal: orderItem.subtotal != null ? Number(orderItem.subtotal) : undefined,
      size: orderItem.size,
      color: orderItem.color,
    })),
  };
}

export async function revokeOrderCancellationApi(orderId: string): Promise<StorefrontOrder> {
  const response = await apiClient.put<BackendOrder>(`/customer/orders/${orderId}/cancel-request/revoke`);
  const item = response.data;
  return {
    id: String(item.id),
    orderNumber: item.orderNumber,
    status: mapOrderStatus(item.status),
    subtotal: Number(item.subtotal ?? 0),
    discount: Number(item.discount ?? 0),
    total: Number(item.total ?? 0),
    notes: item.notes,
    createdAt: parseDate(item.createdAt),
    deliveredAt: item.deliveredAt ? parseDate(item.deliveredAt) : undefined,
    items: (item.items ?? []).map((orderItem) => ({
      id: orderItem.id != null ? String(orderItem.id) : undefined,
      productId: String(orderItem.productId),
      productCode: orderItem.productCode,
      productName: orderItem.productName,
      price: orderItem.price != null ? Number(orderItem.price) : undefined,
      quantity: Number(orderItem.quantity ?? 0),
      subtotal: orderItem.subtotal != null ? Number(orderItem.subtotal) : undefined,
      size: orderItem.size,
      color: orderItem.color,
    })),
  };
}

export async function requestOrderReturnApi(orderId: string, reason: string): Promise<StorefrontOrder> {
  const response = await apiClient.put<BackendOrder>(`/customer/orders/${orderId}/return-request`, {
    reason,
  });
  const item = response.data;
  return {
    id: String(item.id),
    orderNumber: item.orderNumber,
    status: mapOrderStatus(item.status),
    subtotal: Number(item.subtotal ?? 0),
    discount: Number(item.discount ?? 0),
    total: Number(item.total ?? 0),
    notes: item.notes,
    createdAt: parseDate(item.createdAt),
    deliveredAt: item.deliveredAt ? parseDate(item.deliveredAt) : undefined,
    items: (item.items ?? []).map((orderItem) => ({
      id: orderItem.id != null ? String(orderItem.id) : undefined,
      productId: String(orderItem.productId),
      productCode: orderItem.productCode,
      productName: orderItem.productName,
      price: orderItem.price != null ? Number(orderItem.price) : undefined,
      quantity: Number(orderItem.quantity ?? 0),
      subtotal: orderItem.subtotal != null ? Number(orderItem.subtotal) : undefined,
      size: orderItem.size,
      color: orderItem.color,
    })),
  };
}

export async function confirmCompletedOrderApi(orderId: string): Promise<StorefrontOrder> {
  const response = await apiClient.put<BackendOrder>(`/customer/orders/${orderId}/confirm-completed`);
  const item = response.data;
  return {
    id: String(item.id),
    orderNumber: item.orderNumber,
    status: mapOrderStatus(item.status),
    subtotal: Number(item.subtotal ?? 0),
    discount: Number(item.discount ?? 0),
    total: Number(item.total ?? 0),
    notes: item.notes,
    createdAt: parseDate(item.createdAt),
    deliveredAt: item.deliveredAt ? parseDate(item.deliveredAt) : undefined,
    items: (item.items ?? []).map((orderItem) => ({
      id: orderItem.id != null ? String(orderItem.id) : undefined,
      productId: String(orderItem.productId),
      productCode: orderItem.productCode,
      productName: orderItem.productName,
      price: orderItem.price != null ? Number(orderItem.price) : undefined,
      quantity: Number(orderItem.quantity ?? 0),
      subtotal: orderItem.subtotal != null ? Number(orderItem.subtotal) : undefined,
      size: orderItem.size,
      color: orderItem.color,
    })),
  };
}

export async function submitOrderProductReviewApi(
  orderId: string,
  payload: {
    productId: string;
    rating: number;
    comment?: string;
    imageUrls?: string[];
  },
): Promise<void> {
  const productId = Number.parseInt(payload.productId, 10);
  if (!Number.isFinite(productId)) {
    throw new Error('Mã sản phẩm không hợp lệ để đánh giá.');
  }

  await apiClient.post(`/customer/orders/${orderId}/reviews`, {
    productId,
    rating: payload.rating,
    comment: payload.comment?.trim() || '',
    imageUrls: payload.imageUrls ?? [],
  });
}
