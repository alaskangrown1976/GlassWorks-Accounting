
import React from 'react';
import { Invoice, SalesOrder, AppState } from '../types';
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
    <div className="bg-slate-50 min-h-screen">
      <div className="no-print sticky top-0 bg-white/80 backdrop-blur border-b border-slate-200 px-6 py-4 flex justify-between items-center z-50">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => window.dispatchEvent(new Event('afterprint'))}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-all"
          >
            ← Back to App
          </button>
          <span className="h-6 w-[1px] bg-slate-200"></span>
          <p className="text-sm font-bold text-slate-400">Preview: {isInvoice ? 'Invoice' : 'Order'} #{data.id}</p>
        </div>
        <button 
          onClick={() => window.print()}
          className="px-6 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl font-black shadow-lg shadow-sky-100 transition-all flex items-center gap-2"
        >
          <span>🖨️</span> PRINT
        </button>
      </div>

      <div className="bg-white text-slate-900 p-12 mx-auto max-w-[800px] shadow-2xl print:shadow-none print:p-0 font-serif min-h-screen my-8 print:my-0">
        <div className="flex justify-between items-start border-b-4 border-slate-900 pb-8 mb-10">
          <div>
            <h1 className="text-5xl font-black uppercase tracking-tighter text-slate-900 leading-none">
              {state.branding.header || 'GlassWorks Studio'}
            </h1>
            <p className="text-md italic text-slate-600 mt-2 font-sans tracking-wide">Stained Glass Excellence</p>
          </div>
          <div className="text-right">
            <h2 className="text-3xl font-black uppercase tracking-[0.2em] text-slate-300 mb-2">
              {isInvoice ? 'Invoice' : 'Order'}
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

        <div className="grid grid-cols-2 gap-16 mb-12 font-sans">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4 border-b border-slate-100 pb-1">Client</p>
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
              <p className="text-sm italic text-slate-400">Manual Entry</p>
            )}
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4 border-b border-slate-100 pb-1">From</p>
            <div className="space-y-1 text-sm text-slate-700">
              <p className="font-black text-slate-900 text-lg">{state.branding.header || 'GlassWorks Studio'}</p>
              <p className="whitespace-pre-line">{state.branding.address}</p>
              <p className="font-bold text-sky-700">{state.branding.email}</p>
              <p>{state.branding.phone}</p>
            </div>
          </div>
        </div>

        <table className="w-full mb-12 border-collapse font-sans">
          <thead>
            <tr className="border-y-2 border-slate-900 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
              <th className="py-4 pl-2">Acct</th>
              <th className="py-4 px-4">Description</th>
              <th className="py-4 text-center px-4">Qty</th>
              <th className="py-4 text-right px-4">Price</th>
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
              <span className="text-xl font-black uppercase tracking-tighter text-slate-900">Total</span>
              <span className="text-3xl font-black font-mono text-slate-900">
                {formatCurrency(totals.total)}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-20 border-t-2 border-slate-100 pt-10 font-sans">
          <div className="grid grid-cols-2 gap-12">
            <div className="space-y-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-2 text-slate-900">Payment</p>
                <p className="text-xs text-slate-500 leading-relaxed italic">
                  {state.branding.payment}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-2 text-slate-900">Terms</p>
                <p className="text-xs text-slate-500 leading-relaxed italic">
                  {state.branding.terms}
                </p>
              </div>
            </div>
            <div className="flex flex-col justify-end items-end text-right">
              <div className="border-2 border-slate-900 p-4 inline-block transform -rotate-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-900">Authorized</p>
                <p className="text-xl font-black text-slate-900">{state.branding.header}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrintDocument;
