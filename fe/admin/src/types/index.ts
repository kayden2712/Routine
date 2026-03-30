export type UserRole = 'manager' | 'sales' | 'warehouse' | 'accountant';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarInitials: string;
  token?: string;
  refreshToken?: string;
}

export interface Product {
  id: string;
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
  status: 'active' | 'inactive' | 'out_of_stock';
  imageUrl?: string;
  imageUrls?: string[];
  sizes?: string[];
  colors?: string[];
  variants?: ProductVariant[];
  createdAt: Date;
}

export interface ProductVariant {
  id: string;
  size: string;
  color: string;
  stock: number;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderAt?: Date;
  tier: 'regular' | 'vip';
  createdAt: Date;
}

export interface OrderItem {
  productId: string;
  productCode: string;
  productName: string;
  price: number;
  quantity: number;
  subtotal: number;
  imageUrl?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customer?: Customer;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: 'cash' | 'transfer';
  status: 'pending' | 'paid' | 'cancelled';
  createdAt: Date;
  createdBy: string;
}

export interface StockAlert {
  product: Product;
  currentStock: number;
  minStock: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface RevenuePoint {
  date: string;
  revenue: number;
  orders: number;
}
