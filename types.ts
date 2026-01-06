
export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
}

export interface AccountCode {
  code: string;
  name: string;
  rate: number | null;
  type: 'credit' | 'debit';
}

export interface LineItem {
  account: string;
  desc: string;
  qty: number;
  price: number;
}

export interface DocMeta {
  discountRate: number;
  discountType: 'percent' | 'flat';
  taxRate: number;
  taxType: 'percent' | 'flat';
  feeValue: number;
  feeType: 'percent' | 'flat';
  laborRate?: number | null;
}

export interface Invoice {
  id: string;
  seq: number;
  customerId: string | null;
  manualCustomer?: Customer | null;
  status: 'Paid' | 'Unpaid';
  created: string;
  due: string;
  items: LineItem[];
  meta: DocMeta;
}

export interface SalesOrder {
  id: string;
  seq: number;
  customerId: string | null;
  manualCustomer?: Customer | null;
  status: 'Pending' | 'Confirmed' | 'Completed';
  created: string;
  items: LineItem[];
  meta: DocMeta;
}

export interface Payment {
  id: string;
  invoiceId: string;
  amount: number;
  method: string;
  date: string;
  note?: string;
}

export interface Expense {
  id: string;
  category: string;
  amount: number;
  date: string;
  vendor: string;
  note?: string;
}

export interface AppState {
  customers: Customer[];
  invoices: Invoice[];
  orders: SalesOrder[];
  payments: Payment[];
  expenses: Expense[];
  accountCodes: AccountCode[];
  lastBackup?: string;
  settings: {
    locale: string;
    currency: string;
  };
  branding: {
    header: string;
    footer: string;
    terms: string;
    payment: string;
    watermark: boolean;
    logo: string;
    address: string;
    phone: string;
    email: string;
  };
}

export type ViewType = 'dashboard' | 'invoices' | 'orders' | 'customers' | 'payments' | 'expenses' | 'materials' | 'reports' | 'settings';
