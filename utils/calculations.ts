
import { LineItem, DocMeta, Invoice, SalesOrder, AppState } from '../types';

export const isDebitCode = (code: string) => code.startsWith('30');

export const getLineItemValue = (item: LineItem) => {
  const base = Number(item.qty || 0) * Number(item.price || 0);
  return isDebitCode(item.account) ? -1 * base : base;
};

export const calculateDocTotals = (items: LineItem[], meta: DocMeta) => {
  const base = items.reduce((s, i) => s + getLineItemValue(i), 0);
  
  // Calculate discount on base revenue items only
  const creditsOnly = items.filter(i => !isDebitCode(i.account)).reduce((s, i) => s + getLineItemValue(i), 0);
  const discount = meta.discountRate ? (meta.discountType === 'flat' ? meta.discountRate : creditsOnly * (meta.discountRate / 100)) : 0;
  
  const taxedBase = creditsOnly - discount;
  const tax = meta.taxRate ? (meta.taxType === 'flat' ? meta.taxRate : taxedBase * (meta.taxRate / 100)) : 0;
  
  const feeBase = taxedBase + tax;
  const fee = meta.feeValue ? (meta.feeType === 'flat' ? meta.feeValue : feeBase * (meta.feeValue / 100)) : 0;
  
  // Total includes all adjustments + payments (which are negative values in base)
  const adjustments = tax + fee - discount;
  const total = base + adjustments;
  
  return { base, discount, tax, fee, total };
};

export const getInvoiceBalance = (invoice: Invoice, allPayments: any[]) => {
  const totals = calculateDocTotals(invoice.items, invoice.meta);
  const recorded = allPayments.filter(p => p.invoiceId === invoice.id).reduce((s, p) => s + Number(p.amount || 0), 0);
  
  // Debit lines are already accounted for in totals.total as negative values relative to revenue
  // but if we want strictly "Balance Due", we calculate (Credits + Adjustments) - Payments
  const creditsAndAdjustments = calculateDocTotals(invoice.items.filter(i => !isDebitCode(i.account)), invoice.meta).total;
  const debitLinesSum = invoice.items.filter(i => isDebitCode(i.account)).reduce((s, i) => s + Math.abs(getLineItemValue(i)), 0);
  
  return Math.max(0, creditsAndAdjustments - (recorded + debitLinesSum));
};

export const formatCurrency = (value: number, locale: string = 'en-US', currency: string = 'USD') => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
  }).format(value);
};

export const getNextInvoiceNumber = (invoices: Invoice[]) => {
  const nums = invoices.map(inv => Number(inv.id)).filter(n => !isNaN(n));
  const maxSeq = nums.length ? Math.max(...nums) : 1000;
  return maxSeq + 1;
};

export const getNextOrderNumber = (orders: SalesOrder[]) => {
  const maxSeq = orders.reduce((m, ord) => Math.max(m, Number(ord.seq || 0)), 0);
  return maxSeq + 1;
};
