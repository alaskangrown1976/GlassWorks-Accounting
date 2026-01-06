
import { LineItem, DocMeta, Invoice, SalesOrder, AppState } from '../types';

export const isDebitCode = (code: string) => code.startsWith('30');

export const getLineItemValue = (item: LineItem) => {
  const base = Number(item.qty || 0) * Number(item.price || 0);
  return isDebitCode(item.account) ? -1 * base : base;
};

export const calculateDocTotals = (items: LineItem[], meta: DocMeta, directMaterials: number = 0) => {
  const base = items.reduce((s, i) => s + getLineItemValue(i), 0) + directMaterials;
  
  // Calculate discount on base revenue items + direct materials
  const creditsOnly = items.filter(i => !isDebitCode(i.account)).reduce((s, i) => s + getLineItemValue(i), 0) + directMaterials;
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
  const totals = calculateDocTotals(invoice.items, invoice.meta, invoice.directMaterials || 0);
  const recorded = allPayments.filter(p => p.invoiceId === invoice.id).reduce((s, p) => s + Number(p.amount || 0), 0);
  
  const creditsAndAdjustments = calculateDocTotals(invoice.items.filter(i => !isDebitCode(i.account)), invoice.meta, invoice.directMaterials || 0).total;
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
