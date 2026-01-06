
import { AccountCode, AppState, DocMeta } from './types';

export const DEFAULT_ACCOUNT_CODES: AccountCode[] = [
  { code: '100', name: 'General Labor', rate: 28, type: 'credit' },
  { code: '101', name: 'Skilled Labor', rate: 39.5, type: 'credit' },
  { code: '200', name: 'Materials On Hand', rate: null, type: 'credit' },
  { code: '201', name: 'Ordered Materials', rate: null, type: 'credit' },
  { code: '300', name: 'Cash Payment', rate: null, type: 'debit' },
  { code: '301', name: 'Check Payment', rate: null, type: 'debit' },
  { code: '302', name: 'Debit/Credit Payment', rate: null, type: 'debit' },
  { code: '303', name: 'Venmo/Paypal Payment', rate: null, type: 'debit' }
];

export const DOC_META_DEFAULTS: DocMeta = {
  taxRate: 0,
  taxType: 'percent',
  discountRate: 0,
  discountType: 'percent',
  feeValue: 0,
  feeType: 'percent'
};

export const INITIAL_STATE: AppState = {
  customers: [],
  invoices: [],
  orders: [],
  payments: [],
  expenses: [],
  accountCodes: DEFAULT_ACCOUNT_CODES,
  lastBackup: new Date().toISOString(),
  settings: {
    locale: 'en-US',
    currency: 'USD'
  },
  branding: {
    header: 'GlassWorks Studio',
    footer: 'Thank you for your business!',
    terms: 'Net 14 days. 1.5% monthly late fee applies to overdue balances.',
    payment: 'Payable via Check, Venmo (@GlassWorks-Studio), or Cash.',
    watermark: false,
    logo: '',
    address: '359 Pauline Street, Anchorage, AK 99503',
    phone: '(907) 555-0199',
    email: 'studio@glassworks.example'
  }
};
