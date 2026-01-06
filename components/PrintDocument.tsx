
import React from 'react';
import { Invoice, SalesOrder, AppState, Customer } from '../types';
import { calculateDocTotals, formatCurrency, getLineItemValue } from '../utils/calculations';

interface PrintDocumentProps {
  type: 'invoice' | 'order';
  data: Invoice | SalesOrder;
  state: AppState;
}

const PrintDocument: React.FC<PrintDocumentProps> = ({ type, data, state }) => {
  const customer = state.customers.find(c => c.id === data.customerId) || data.manualCustomer;
  const totals = calculateDocTotals(data.items, data.meta);
  const isInvoice = type === 'invoice';
  
  return (
    <div className="bg-white text-slate-900 p-12 min-h-screen font-serif">
      {/* Header Section */}
      <div className="flex justify-between items-start border-b-4 border-slate-900 pb-8 mb-10">
        <div>
          <h1 className="text-5xl font-black uppercase tracking-tighter text-slate-900 leading-none">
            {state.branding.header || 'GlassWorks Studio'}
          </h1>
          <p className="text-md italic text-slate-600 mt-2 font-sans tracking-wide">Fine Stained Glass Art & Restoration</p>
        </div>
        <div className="text-right">
          <h2 className="text-3xl font-black uppercase tracking-[0.2em] text-slate-300 mb-2">
            {isInvoice ? 'Invoice' : 'Sales Order'}
          </h2>
          <div className="font-mono text-xl font-bold bg-slate-900 text-white px-3 py-1 inline-block rounded">
            #{data.id}
          </div>
          <div className="mt-3 text-sm font-sans font-bold text-slate-500 uppercase tracking-widest">
            Date: <span className="text-slate-900">{data.created}</span>
          </div>
          {isInvoice && (data as Invoice).due && (
            <div className="text-sm font-sans font-bold text-slate-500 uppercase tracking-widest">
              Due: <span className="text-rose-600">{(data as Invoice).due}</span>
            </div>
          )}
        </div>
      </div>

      {/* Contact Information */}
      <div className="grid grid-cols-2 gap-16 mb-12 font-sans">
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4 border-b border-slate-100 pb-1">Billing To</p>
          {customer ? (
            <div className="space-y-1">
              <p className="text-2xl font-black text-slate-900">{customer.name}</p>
              {customer.email && <p className="text-sm text-slate-600">{customer.email}</p>}
              {customer.phone && <p className="text-sm text-slate-600">{customer.phone}</p>}
              {customer.address && (
                <p className="text-sm text-slate-600 mt-2 whitespace-pre-line leading-relaxed">
                  {customer.address}
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm italic text-slate-400">Manual Customer Entry</p>
          )}
        </div>
        <div className="text-right">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4 border-b border-slate-100 pb-1">Issued From</p>
          <div className="space-y-1 text-sm text-slate-700">
            <p className="font-black text-slate-900 text-lg">GlassWorks Studio</p>
            <p>123 Artisan Lane, Studio 402</p>
            <p>Portland, OR 97201</p>
            <p className="font-bold text-sky-700">billing@glassworks.studio</p>
            <p>+1 (503) 555-0192</p>
          </div>
        </div>
      </div>

      {/* Line Items Table */}
      <table className="w-full mb-12 border-collapse font-sans">
        <thead>
          <tr className="border-y-2 border-slate-900 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
            <th className="py-4 pl-2">Acct Code</th>
            <th className="py-4 px-4">Description</th>
            <th className="py-4 text-center px-4">Quantity</th>
            <th className="py-4 text-right px-4">Amount</th>
            <th className="py-4 text-right pr-2">Total</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {data.items.map((item, idx) => (
            <tr key={idx} className="text-sm group">
              <td className="py-5 pl-2 font-mono font-bold text-slate-400 text-xs">
                {item.account}
              </td>
              <td className="py-5 px-4">
                <p className="font-bold text-slate-800">{item.desc}</p>
              </td>
              <td className="py-5 text-center px-4 font-mono text-slate-600">
                {item.qty}
              </td>
              <td className="py-5 text-right px-4 font-mono text-slate-600">
                {formatCurrency(item.price)}
              </td>
              <td className="py-5 text-right pr-2 font-black font-mono text-slate-900">
                {formatCurrency(getLineItemValue(item))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Summary Totals */}
      <div className="flex justify-end font-sans">
        <div className="w-80 space-y-3 bg-slate-50 p-6 rounded-2xl">
          <div className="flex justify-between text-sm">
            <span className="text-slate-500 uppercase font-bold text-[10px] tracking-widest">Subtotal</span>
            <span className="font-mono font-bold">{formatCurrency(totals.base)}</span>
          </div>
          
          {totals.discount > 0 && (
            <div className="flex justify-between text-sm text-rose-600">
              <span className="uppercase font-bold text-[10px] tracking-widest">Discount</span>
              <span className="font-mono font-bold">-{formatCurrency(totals.discount)}</span>
            </div>
          )}

          {totals.tax > 0 && (
            <div className="flex justify-between text-sm">
              <span className="uppercase font-bold text-[10px] tracking-widest">Sales Tax</span>
              <span className="font-mono font-bold">{formatCurrency(totals.tax)}</span>
            </div>
          )}

          <div className="flex justify-between items-center border-t-2 border-slate-300 pt-4 mt-4">
            <span className="text-xl font-black uppercase tracking-tighter text-slate-900 underline decoration-sky-500 decoration-4 underline-offset-4">Total Due</span>
            <span className="text-3xl font-black font-mono text-slate-900">
              {formatCurrency(totals.total)}
            </span>
          </div>
        </div>
      </div>

      {/* Footer & Legal */}
      <div className="mt-20 border-t-2 border-slate-100 pt-10 font-sans">
        <div className="grid grid-cols-2 gap-12">
          <div className="space-y-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-2 text-slate-900">Payment Instructions</p>
              <p className="text-xs text-slate-500 leading-relaxed italic">
                {state.branding.payment || 'We accept Check, Venmo (@GlassWorks-Studio), or Bank Transfer. Please include the document ID in your payment reference.'}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-2 text-slate-900">Terms & Conditions</p>
              <p className="text-xs text-slate-500 leading-relaxed italic">
                {state.branding.terms || 'Net 14. A late fee of 1.5% per month will be applied to outstanding balances. Custom commission glass is non-refundable once materials have been cut.'}
              </p>
            </div>
          </div>
          <div className="flex flex-col justify-end items-end text-right">
            <div className="border-2 border-slate-900 p-4 inline-block transform -rotate-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-900">Verified Professional</p>
              <p className="text-xl font-black text-slate-900">GlassWorks Studio</p>
            </div>
            <p className="mt-6 text-[10px] font-bold text-slate-300 uppercase tracking-widest italic">
              Thank you for supporting artisan craftsmanship
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrintDocument;
