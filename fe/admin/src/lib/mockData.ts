import { format, subDays } from 'date-fns';
import type { Customer, Order, Product, RevenuePoint, StockAlert, User } from '@/types';

const vietnameseNames = [
  'Nguyen Minh Anh',
  'Tran Quoc Bao',
  'Le Thu Trang',
  'Pham Gia Huy',
  'Vo Hoang Linh',
  'Dang My Duyen',
  'Bui Tuan Kiet',
  'Do Khanh Ngan',
  'Huynh Duc Thinh',
  'Phan Ngoc Han',
  'Truong Bao Chau',
  'Cao Thanh Dat',
  'Ngo Mai Phuong',
  'Dinh Hoai Nam',
  'Lam Quynh Nhu',
];

const productSeed = [
  { code: 'ASM', name: 'Ao so mi Oxford', category: 'Ao so mi', price: 329000, cost: 190000 },
  { code: 'ASK', name: 'Ao so mi ke caro', category: 'Ao so mi', price: 359000, cost: 210000 },
  { code: 'AKH', name: 'Ao khoac bomber', category: 'Ao khoac', price: 729000, cost: 420000 },
  { code: 'AKG', name: 'Ao khoac gio nhe', category: 'Ao khoac', price: 549000, cost: 310000 },
  { code: 'QKK', name: 'Quan kaki slimfit', category: 'Quan kaki', price: 469000, cost: 270000 },
  { code: 'QKO', name: 'Quan kaki ong dung', category: 'Quan kaki', price: 499000, cost: 285000 },
  { code: 'VYC', name: 'Vay chu A', category: 'Vay', price: 429000, cost: 250000 },
  { code: 'VYT', name: 'Vay xep ly', category: 'Vay', price: 489000, cost: 280000 },
  { code: 'ATH', name: 'Ao thun co tron', category: 'Ao thun', price: 239000, cost: 130000 },
  { code: 'ATP', name: 'Ao thun polo', category: 'Ao thun', price: 299000, cost: 165000 },
  { code: 'JEA', name: 'Quan jeans basic', category: 'Quan jeans', price: 599000, cost: 350000 },
  { code: 'JES', name: 'Quan jeans skinny', category: 'Quan jeans', price: 639000, cost: 370000 },
  { code: 'DAM', name: 'Dam suong cong so', category: 'Dam', price: 519000, cost: 290000 },
  { code: 'DAC', name: 'Dam co so mi', category: 'Dam', price: 569000, cost: 330000 },
  { code: 'VST', name: 'Vest nu ngan tay', category: 'Vest', price: 789000, cost: 470000 },
  { code: 'VSM', name: 'Vest nam classic', category: 'Vest', price: 799000, cost: 480000 },
  { code: 'CHN', name: 'Chan vay denim', category: 'Chan vay', price: 389000, cost: 220000 },
  { code: 'CHK', name: 'Chan vay kaki', category: 'Chan vay', price: 359000, cost: 205000 },
  { code: 'BLZ', name: 'Blazer dang rong', category: 'Blazer', price: 759000, cost: 440000 },
  { code: 'SWT', name: 'Ao len mong', category: 'Ao len', price: 449000, cost: 260000 },
];

const productImages = [
  'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1521223890158-f9f7c3d5d504?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1611312449412-6cefac5dc3e4?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1516826957135-700dedea698c?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1622445275463-afa2ab738c34?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80',
];

const managers: User[] = [
  { id: 'u1', name: 'Hoang Lan', email: 'manager@routine.vn', role: 'manager', avatarInitials: 'HL' },
  { id: 'u2', name: 'Le Minh Quan', email: 'sales@routine.vn', role: 'sales', avatarInitials: 'MQ' },
  { id: 'u3', name: 'Tran Bao Chau', email: 'accountant@routine.vn', role: 'accountant', avatarInitials: 'BC' },
];

function pick<T>(arr: T[], index: number): T {
  return arr[index % arr.length];
}

export const products: Product[] = productSeed.map((item, index) => {
  const stock = 6 + ((index * 7) % 30);
  const minStock = 8 + (index % 5);
  const status = stock === 0 ? 'out_of_stock' : stock < minStock ? 'inactive' : 'active';

  return {
    id: `p${index + 1}`,
    code: `${item.code}-${String(index + 1).padStart(3, '0')}`,
    name: item.name,
    category: item.category,
    price: item.price,
    costPrice: item.cost,
    stock,
    minStock,
    status,
    imageUrl: pick(productImages, index),
    createdAt: subDays(new Date(), 40 - index),
    variants: [
      { id: `pv-${index + 1}-1`, size: 'S', color: 'Trang', stock: Math.max(1, stock - 4) },
      { id: `pv-${index + 1}-2`, size: 'M', color: 'Den', stock: Math.max(1, stock - 1) },
      { id: `pv-${index + 1}-3`, size: 'L', color: 'Navy', stock: Math.max(0, stock - 7) },
    ],
  };
});

export const customers: Customer[] = vietnameseNames.map((name, index) => {
  const totalOrders = 1 + (index % 9);
  const totalSpent = totalOrders * (340000 + (index % 4) * 90000);

  return {
    id: `c${index + 1}`,
    name,
    phone: `09${String(10000000 + index * 21913).slice(0, 8)}`,
    email: `${name.toLowerCase().replace(/\s+/g, '.')}@mail.vn`,
    address: `${index + 15} Nguyen Trai, Quan ${1 + (index % 10)}, TP.HCM`,
    totalOrders,
    totalSpent,
    lastOrderAt: subDays(new Date(), index % 6),
    tier: index % 4 === 0 ? 'vip' : 'regular',
    createdAt: subDays(new Date(), 120 - index * 2),
  };
});

export const orders: Order[] = Array.from({ length: 30 }, (_, index) => {
  const orderItemsCount = 1 + (index % 3);
  const selectedProducts = Array.from({ length: orderItemsCount }, (__, itemIndex) =>
    pick(products, index + itemIndex * 5),
  );

  const items = selectedProducts.map((product, itemIndex) => {
    const quantity = 1 + ((index + itemIndex) % 3);
    return {
      productId: product.id,
      productCode: product.code,
      productName: product.name,
      price: product.price,
      quantity,
      subtotal: product.price * quantity,
      imageUrl: product.imageUrl,
    };
  });

  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  const discount = index % 6 === 0 ? Math.round(subtotal * 0.08) : 0;

  return {
    id: `o${index + 1}`,
    orderNumber: `DH${String(1001 + index)}`,
    customer: pick(customers, index),
    items,
    subtotal,
    discount,
    total: subtotal - discount,
    paymentMethod: index % 2 === 0 ? 'cash' : 'transfer',
    status: index % 11 === 0 ? 'pending' : 'paid',
    createdAt: subDays(new Date(), index % 7),
    createdBy: pick(managers, index).name,
  };
});

export const revenueByDay: RevenuePoint[] = Array.from({ length: 30 }, (_, index) => {
  const date = subDays(new Date(), 29 - index);
  const ordersToday = 8 + ((index * 3) % 14);
  const revenue = ordersToday * (315000 + (index % 5) * 28000);

  return {
    date: format(date, 'dd/MM'),
    revenue,
    orders: ordersToday,
  };
});

export const stockAlerts: StockAlert[] = products
  .filter((product) => product.stock <= product.minStock)
  .map((product) => ({
    product,
    currentStock: product.stock,
    minStock: product.minStock,
  }));
