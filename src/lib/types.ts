export type InvoiceType = 'sale' | 'purchase' | 'sale_return' | 'purchase_return';
export type InvoiceStatus = 'draft' | 'confirmed' | 'cancelled';
export type PaymentMethod = 'cash' | 'card' | 'transfer';
export type UserRole = 'admin' | 'manager' | 'user';

export interface Product {
  id: string;
  name: string;
  sku?: string;
  barcode?: string;
  categoryId?: string;
  description?: string;
  costPrice: number;
  sellPrice: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  category?: ProductCategory;
  units?: ProductUnit[];
  _stock?: number;
}

export interface ProductCategory {
  id: string;
  name: string;
  createdAt: string;
}

export interface ProductUnit {
  id: string;
  productId: string;
  name: string;
  barcode?: string;
  conversionFactor: number;
  costPrice: number;
  sellPrice: number;
  isDefault: boolean;
}

export interface Warehouse {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WarehouseStock {
  id: string;
  warehouseId: string;
  productId: string;
  unitId?: string;
  quantity: number;
  minStock: number;
  updatedAt: string;
  warehouse?: Warehouse;
  product?: Product;
  unit?: ProductUnit;
}

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  address?: string;
  email?: string;
  taxNumber?: string;
  notes?: string;
  balance: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  phone?: string;
  address?: string;
  email?: string;
  taxNumber?: string;
  notes?: string;
  balance: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Invoice {
  id: string;
  type: InvoiceType;
  invoiceNo: string;
  customerId?: string;
  supplierId?: string;
  warehouseId: string;
  date: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paidAmount: number;
  notes?: string;
  status: InvoiceStatus;
  createdById?: string;
  createdAt: string;
  updatedAt: string;
  customer?: Customer;
  supplier?: Supplier;
  warehouse?: Warehouse;
  items?: InvoiceItem[];
}

export interface InvoiceItem {
  id: string;
  invoiceId: string;
  productId: string;
  unitId?: string;
  productName: string;
  unitName?: string;
  quantity: number;
  price: number;
  total: number;
  costPrice: number;
}

export interface Payment {
  id: string;
  invoiceId?: string;
  customerId?: string;
  supplierId?: string;
  amount: number;
  method: PaymentMethod;
  date: string;
  notes?: string;
  createdAt: string;
}

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  totalSalesToday: number;
  totalPurchasesToday: number;
  totalProducts: number;
  lowStockCount: number;
  totalCustomers: number;
  totalSuppliers: number;
  recentInvoices: Invoice[];
  topProducts: { name: string; quantity: number; total: number }[];
}

export type NavPage = 'dashboard' | 'products' | 'warehouses' | 'sale' | 'purchase' | 'sale_return' | 'purchase_return' | 'sales_report' | 'purchase_report' | 'customers' | 'suppliers' | 'balances' | 'users' | 'stock_alerts' | 'invoice_detail';
