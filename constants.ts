
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

export const LABOR_PRESETS = [
  { id: 'lab-general', label: 'General Labor', rate: 28 },
  { id: 'lab-skilled', label: 'Skilled Labor', rate: 39.5 },
  { id: 'lab-premium', label: 'Premium Labor', rate: 48 },
  { id: 'lab-custom', label: 'Custom', rate: 0 }
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
  settings: {
    locale: 'en-US',
    currency: 'USD'
  },
  branding: {
    header: '',
    footer: '',
    terms: '',
    payment: '',
    watermark: false,
    logo: ''
  }
};
