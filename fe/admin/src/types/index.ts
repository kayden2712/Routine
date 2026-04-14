export type UserRole = 'admin' | 'manager' | 'sales' | 'warehouse' | 'accountant';

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
  status:
    | 'pending'
    | 'confirmed'
    | 'packing'
    | 'ready_to_ship'
    | 'in_transit'
    | 'out_for_delivery'
    | 'delivered'
    | 'completed'
    | 'cancel_requested'
    | 'paid'
    | 'cancelled'
    | 'return_requested'
    | 'return_approved'
    | 'return_rejected'
    | 'return_received'
    | 'refund_pending'
    | 'refunded'
    | 'failed_delivery';
  channel: 'online' | 'offline';
  notes?: string;
  createdAt: Date;
  updatedAt?: Date;
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
  selectedSize?: string;
  selectedColor?: string;
}

export interface RevenuePoint {
  date: string;
  revenue: number;
  orders: number;
}

export type EmployeePayrollType = 'fulltime' | 'parttime';

export interface PayrollEmployee {
  id: number;
  name: string;
  type: EmployeePayrollType;
  baseSalary?: number;
  dept?: string;
  status: 'ACTIVE' | 'LOCKED';
}

export interface PayrollEntryPayload {
  employee_id: number;
  type: EmployeePayrollType;
  hours_worked?: number;
  bonus: number;
  penalty: number;
}

export interface PayrollGenerateResult {
  payroll_id: number;
  status: 'draft' | 'approved';
  total_net: number;
}

export interface PayrollEntryDto {
  employeeId: number;
  employeeName: string;
  type: EmployeePayrollType;
  baseSalary?: number;
  hoursWorked?: number;
  hourlyRate?: number;
  grossSalary: number;
  bonus: number;
  penalty: number;
  netSalary: number;
}

export interface PayrollDto {
  payrollId: number;
  month: number;
  year: number;
  status: 'draft' | 'approved';
  totalNet: number;
  entries: PayrollEntryDto[];
}

export type PromotionType = 'GIAM_PHAN_TRAM' | 'GIAM_TIEN' | 'TANG_QUA';
export type PromotionStatus = 'DRAFT' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED';

export interface Promotion {
  id: number;
  code: string;
  name: string;
  description?: string;
  type: PromotionType;
  typeDisplayName: string;
  discountValue: number;
  maxDiscountAmount?: number;
  startDate: string;
  endDate: string;
  minOrderAmount: number;
  applyToAllProducts: boolean;
  usageLimit?: number;
  usageCount: number;
  status: PromotionStatus;
  statusDisplayName: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: number;
  productCount?: number;
  isActive: boolean;
}

export interface PromotionDetail extends Promotion {
  applicableProducts: ProductSummary[];
  hasReachedLimit: boolean;
}

export interface ProductSummary {
  id: number;
  code: string;
  name: string;
  price: number;
  imageUrl?: string;
}

export interface CreatePromotionRequest {
  code: string;
  name: string;
  description?: string;
  type: PromotionType;
  discountValue: number;
  maxDiscountAmount?: number;
  startDate: string;
  endDate: string;
  minOrderAmount?: number;
  applyToAllProducts?: boolean;
  usageLimit?: number;
  productIds?: number[];
}

export interface UpdatePromotionRequest {
  name: string;
  description?: string;
  type: PromotionType;
  discountValue: number;
  maxDiscountAmount?: number;
  startDate: string;
  endDate: string;
  minOrderAmount?: number;
  applyToAllProducts?: boolean;
  usageLimit?: number;
  productIds?: number[];
}

export interface ApplyPromotionRequest {
  promotionCode: string;
  orderAmount: number;
  productIds?: number[];
  customerId?: number;
}

export interface ApplyPromotionResponse {
  applicable: boolean;
  message: string;
  promotionId?: number;
  promotionCode?: string;
  promotionName?: string;
  discountAmount?: number;
  originalAmount?: number;
  finalAmount?: number;
}

export interface CheckPromotionRequest {
  orderAmount: number;
  productIds: number[];
  customerId?: number;
}

export interface CheckPromotionResponse {
  hasApplicablePromotions: boolean;
  applicablePromotions: Promotion[];
  message: string;
}

// ===================== SUPPLIER TYPES =====================

export type SupplierStatus = 'ACTIVE' | 'INACTIVE';

export interface Supplier {
  id: number;
  maNcc: string;
  tenNcc: string;
  diaChi?: string;
  soDienThoai?: string;
  email?: string;
  nguoiLienHe?: string;
  ghiChu?: string;
  trangThai: SupplierStatus;
  soPhieuNhap?: number;
  tongGiaTriNhap?: number;
  createdAt: string;
  updatedAt: string;
}

export interface SupplierListResponse {
  id: number;
  maNcc: string;
  tenNcc: string;
  diaChi?: string;
  soDienThoai?: string;
  email?: string;
  nguoiLienHe?: string;
  trangThai: SupplierStatus;
  soPhieuNhap?: number;
  tongGiaTriNhap?: number;
  createdAt: string;
  updatedAt: string;
}

export interface SupplierRequest {
  maNcc?: string; // Optional, auto-gen nếu null
  tenNcc: string;
  diaChi?: string;
  soDienThoai?: string;
  email?: string;
  nguoiLienHe?: string;
  ghiChu?: string;
  trangThai?: SupplierStatus;
}

export interface SupplierSearchRequest {
  keyword?: string;
  trangThai?: SupplierStatus | null;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDirection?: 'ASC' | 'DESC';
}

export interface PagedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

// ===================== INVENTORY TYPES =====================

export interface InventoryReportItem {
  productId: number;
  productCode: string;
  productName: string;
  currentStock: number;
  minStock: number;
  isLowStock: boolean;
  lastUpdate?: string;
  totalNhap: number;
  totalXuat: number;
}

export interface InventoryHistoryItem {
  id: number;
  product: {
    id: number;
    code: string;
    name: string;
    stock: number;
  };
  loaiThayDoi: 'NHAP_KHO' | 'XUAT_KHO' | 'DIEU_CHINH_KIEM_KE';
  soLuongTruoc: number;
  soLuongThayDoi: number;
  soLuongSau: number;
  maChungTu?: string;
  chungTuType?: 'PHIEU_NHAP' | 'PHIEU_XUAT' | 'KIEM_KE';
  nguoiThucHien: {
    id: number;
    username: string;
    fullName: string;
  };
  ghiChu?: string;
  thoiGian: string;
}

export interface InventoryAdjustRequest {
  productId: number;
  mode: 'IN' | 'OUT' | 'SET';
  quantity: number;
  note?: string;
}

export type ReceiptStatus = 'DRAFT' | 'CONFIRMED' | 'CANCELLED';
export type ExportReason = 'BAN_HANG' | 'CHUYEN_KHO' | 'HONG_THAT_THOAT' | 'KHAC';

export interface ReceiptProduct {
  id: number;
  code: string;
  name: string;
  stock: number;
}

export interface ImportReceiptLine {
  id: number;
  product: ReceiptProduct;
  soLuongNhap: number;
  giaNhap: number;
  thanhTien: number;
  soLuongTonTruocNhap: number;
  ghiChu?: string;
}

export interface ExportReceiptLine {
  id: number;
  product: ReceiptProduct;
  soLuongXuat: number;
  soLuongTonTruocXuat: number;
  ghiChu?: string;
}

export interface ImportReceipt {
  id: number;
  maPhieuNhap: string;
  ngayNhap: string;
  trangThai: ReceiptStatus;
  tongSoLuong: number;
  tongTien: number;
  ghiChu?: string;
  nhaCungCap?: {
    id: number;
    maNcc: string;
    tenNcc: string;
  };
  chiTietList: ImportReceiptLine[];
}

export interface ExportReceipt {
  id: number;
  maPhieuXuat: string;
  ngayXuat: string;
  lyDoXuat: ExportReason;
  trangThai: ReceiptStatus;
  tongSoLuong: number;
  ghiChu?: string;
  chiTietList: ExportReceiptLine[];
}

export interface CreateImportReceiptRequest {
  ngayNhap: string;
  supplierId: number;
  ghiChu?: string;
  chiTietList: Array<{
    productId: number;
    soLuongNhap: number;
    giaNhap: number;
    ghiChu?: string;
  }>;
}

export interface CreateExportReceiptRequest {
  ngayXuat: string;
  lyDoXuat: ExportReason;
  orderId?: number;
  ghiChu?: string;
  chiTietList: Array<{
    productId: number;
    soLuongXuat: number;
    ghiChu?: string;
  }>;
}

export type InventoryCheckStatus =
  | 'PENDING'
  | 'MATCH'
  | 'DISCREPANCY'
  | 'WARNING'
  | 'CONFIRMED'
  | 'RECHECK_REQUIRED';

export interface InventoryCheckItem {
  itemId: number;
  name: string;
  sku: string;
  unit: string;
  systemQty: number;
  actualQty: number | null;
  discrepancy: number | null;
  status: InventoryCheckStatus;
  warning: boolean;
  checkedBy?: {
    id: number;
    username: string;
    fullName: string;
  } | null;
  checkedAt?: string | null;
  note?: string;
}

export interface InventoryCheckListData {
  stocktakeId: number;
  stocktakeCode: string;
  checkDate: string;
  status: 'DANG_KIEM' | 'HOAN_THANH' | 'HUY';
  warningThreshold: number;
  items: InventoryCheckItem[];
}

export interface InventoryCheckSession {
  stocktakeId: number;
  stocktakeCode: string;
  checkDate: string;
  status: 'DANG_KIEM' | 'HOAN_THANH' | 'HUY';
  totalItems: number;
  checkedItems: number;
  evaluation: 'CHUA_KIEM' | 'DU' | 'THUA' | 'THIEU';
}

export interface InventoryDiscrepancyReport {
  stocktakeId: number;
  stocktakeCode: string;
  checkDate: string;
  totalItems: number;
  checkedItems: number;
  discrepancyItems: number;
  warningItems: number;
  items: InventoryCheckItem[];
}

export interface InventoryCheckSubmitRequest {
  stocktakeId: number;
  itemId: number;
  actualQty: number;
  note?: string;
}

export interface InventoryCheckApproveRequest {
  stocktakeId: number;
}

export interface InventoryCheckConfirmRequest {
  stocktakeId: number;
  itemId: number;
  action: 'CONFIRM' | 'RECHECK';
  note?: string;
}
