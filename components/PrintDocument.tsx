
import React, { useEffect } from 'react';
import { Invoice, SalesOrder, AppState } from '../types';
import { calculateDocTotals, formatCurrency, getLineItemValue } from '../utils/calculations';

interface PrintDocumentProps {
  type: 'invoice' | 'order';
  data: Invoice | SalesOrder;
  state: AppState;
  onBack: () => void;
  autoPrint?: boolean;
}

const PrintDocument: React.FC<PrintDocumentProps> = ({ type, data, state, onBack, autoPrint }) => {
  const customer = state.customers.find(c => c.id === data.customerId) || data.manualCustomer;
  const totals = calculateDocTotals(data.items, data.meta, data.directMaterials || 0);
  const isInvoice = type === 'invoice';

  // Master print function with window focus to prevent browser blocking
  const handleSystemPrint = () => {
    window.focus();
    window.print();
  };

  // Automatically trigger the print dialog if coming directly from the editor
  useEffect(() => {
    if (autoPrint) {
      const timer = setTimeout(() => {
        handleSystemPrint();
      }, 800); // Slight delay allows the browser to settle the new layout
      return () => clearTimeout(timer);
    }
  }, [autoPrint]);
  
  return (
    <div className="bg-slate-200 min-h-screen w-full relative pt-[80px]">
      {/* FIXED CONTROL BAR - Always accessible, never printed */}
      <div className="no-print fixed top-0 left-0 right-0 bg-white border-b-2 border-slate-300 px-6 py-4 flex justify-between items-center z-[9999] shadow-xl">
        <div className="flex items-center gap-5">
          <button 
            type="button"
            onClick={(e) => { e.preventDefault(); onBack(); }}
            className="flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-black transition-all active:scale-95 text-xs uppercase tracking-widest cursor-pointer shadow-lg"
          >
            <span className="text-lg">←</span> RETURN TO EDITOR
          </button>
          <div className="h-8 w-px bg-slate-200"></div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Previewing</p>
            <p className="text-sm font-black text-slate-900 uppercase italic">
              {isInvoice ? 'Invoice' : 'Sales Order'} #{data.id}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest hidden md:block">Ready to generate PDF?</span>
          <button 
            type="button"
            onClick={(e) => { e.preventDefault(); handleSystemPrint(); }}
            className="px-10 py-4 bg-sky-600 hover:bg-sky-500 text-white rounded-xl font-black shadow-xl shadow-sky-200 transition-all flex items-center gap-3 uppercase tracking-widest text-xs active:scale-95 cursor-pointer"
          >
            <span>🖨️</span> PRINT TO PAPER / PDF
          </button>
        </div>
      </div>

      {/* PRINTABLE DOCUMENT - Styled for A4/Letter accuracy */}
      <div className="print-container bg-white text-slate-900 p-16 mx-auto max-w-[850px] shadow-2xl print:shadow-none print:p-0 font-serif min-h-[1056px] mb-12 print:mb-0 relative animate-in fade-in zoom-in-95 duration-500">
        
        <div className="flex justify-between items-start border-b-[6px] border-slate-900 pb-12 mb-12">
          <div>
            <h1 className="text-6xl font-black uppercase tracking-tighter text-slate-900 leading-none mb-3">
              {state.branding.header || 'GlassWorks Studio'}
            </h1>
            <p className="text-xs italic text-slate-500 font-sans font-black tracking-[0.5em] uppercase opacity-60">Architectural Stained Glass & Restoration</p>
          </div>
          <div className="text-right flex flex-col items-end">
            <h2 className="text-5xl font-black uppercase tracking-[0.1em] text-slate-100 mb-2 leading-none">
              {isInvoice ? 'Invoice' : 'Order'}
            </h2>
            <div className="font-mono text-4xl font-black bg-slate-900 text-white px-6 py-2 inline-block rounded-sm shadow-xl">
              #{data.id}
            </div>
            <div className="mt-8 space-y-1">
              <p className="text-[10px] font-sans font-black text-slate-400 uppercase tracking-widest">
                Document Date: <span className="text-slate-900 ml-2 font-bold">{data.created}</span>
              </p>
              {isInvoice && (data as Invoice).due && (
                <p className="text-[10px] font-sans font-black text-slate-400 uppercase tracking-widest">
                  Terms Due: <span className="text-rose-600 font-bold ml-2">{(data as Invoice).due}</span>
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-24 mb-16 font-sans">
          <div className="space-y-4">
            <p className="text-[10px] font-black text-slate-900 uppercase tracking-[0.5em] mb-4 border-b-2 border-slate-900 pb-2">Client Record</p>
            {customer ? (
              <div className="space-y-1">
                <p className="text-3xl font-black text-slate-900 tracking-tighter leading-tight">{customer.name}</p>
                <div className="text-[11px] text-slate-500 space-y-2 pt-4 font-bold">
                  {customer.email && <p className="flex items-center gap-3"><span className="text-slate-300 uppercase text-[9px] font-black tracking-widest w-12">Email:</span> {customer.email}</p>}
                  {customer.phone && <p className="flex items-center gap-3"><span className="text-slate-300 uppercase text-[9px] font-black tracking-widest w-12">Phone:</span> {customer.phone}</p>}
                  {customer.address && (
                    <div className="mt-6 pt-6 border-t border-slate-100">
                      <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-2">Service Address</p>
                      <p className="whitespace-pre-line leading-relaxed italic text-slate-700 text-xs">
                        {customer.address}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-sm italic text-slate-400">Manual Guest Account</p>
            )}
          </div>
          <div className="text-right space-y-4">
            <p className="text-[10px] font-black text-slate-900 uppercase tracking-[0.5em] mb-4 border-b-2 border-slate-900 pb-2">Business Authority</p>
            <div className="space-y-1 text-sm text-slate-800">
              <p className="font-black text-slate-900 text-2xl tracking-tighter leading-none mb-3 italic uppercase">{state.branding.header || 'GlassWorks Studio'}</p>
              <p className="whitespace-pre-line leading-relaxed text-slate-500 font-bold text-[11px] uppercase tracking-tight">{state.branding.address}</p>
              <div className="pt-6 space-y-1.5">
                <p className="font-black text-sky-600 text-xs">{state.branding.email}</p>
                <p className="font-black text-slate-400 text-xs font-mono">{state.branding.phone}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-16">
          <table className="w-full border-collapse font-sans">
            <thead>
              <tr className="border-y-2 border-slate-900 text-left text-[10px] font-black uppercase tracking-[0.4em] text-slate-900 bg-slate-50/50">
                <th className="py-6 pl-4 w-28">Acc. Code</th>
                <th className="py-6 px-6">Description of Service & Deliverables</th>
                <th className="py-6 text-center px-4 w-24">Qty</th>
                <th className="py-6 text-right px-4 w-36">Unit Cost</th>
                <th className="py-6 text-right pr-4 w-40">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.items.map((item, idx) => (
                <tr key={idx} className="text-sm align-top">
                  <td className="py-8 pl-4 font-mono font-bold text-slate-400 text-[11px] uppercase tracking-tighter">
                    {item.account}
                  </td>
                  <td className="py-8 px-6">
                    <p className="font-bold text-slate-900 text-base leading-snug">{item.desc}</p>
                    <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mt-2 italic">Verified Work Item</p>
                  </td>
                  <td className="py-8 text-center px-4 font-mono text-slate-600 font-bold">
                    {item.qty}
                  </td>
                  <td className="py-8 text-right px-4 font-mono text-slate-600">
                    {formatCurrency(item.price)}
                  </td>
                  <td className="py-8 text-right pr-4 font-black font-mono text-slate-900 text-lg">
                    {formatCurrency(getLineItemValue(item))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end font-sans">
          <div className="w-full max-w-sm space-y-5 bg-slate-50 p-12 border-2 border-slate-100 rounded-sm">
            {data.directMaterials && data.directMaterials > 0 ? (
              <div className="flex justify-between text-xs items-center">
                <span className="text-slate-400 uppercase font-black tracking-[0.2em]">Material Surcharge</span>
                <span className="font-mono font-bold text-slate-900">{formatCurrency(data.directMaterials)}</span>
              </div>
            ) : null}
            <div className="flex justify-between text-xs items-center">
              <span className="text-slate-400 uppercase font-black tracking-[0.2em]">Services Subtotal</span>
              <span className="font-mono font-bold text-slate-900">{formatCurrency(totals.base - (data.directMaterials || 0))}</span>
            </div>
            
            <div className="h-[2px] bg-slate-200 my-8"></div>
            
            {totals.discount > 0 && (
              <div className="flex justify-between text-xs items-center text-rose-600">
                <span className="uppercase font-black tracking-[0.2em]">Applied Credit</span>
                <span className="font-mono font-black">-{formatCurrency(totals.discount)}</span>
              </div>
            )}
            {totals.tax > 0 && (
              <div className="flex justify-between text-xs items-center">
                <span className="uppercase font-black tracking-[0.2em] text-slate-400">Sales Tax ({data.meta.taxRate}%)</span>
                <span className="font-mono font-bold text-slate-900">+{formatCurrency(totals.tax)}</span>
              </div>
            )}
            
            <div className="flex justify-between items-end border-t-[6px] border-slate-900 pt-10 mt-10">
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] leading-none mb-1">Final Balance</span>
                <span className="text-3xl font-black uppercase tracking-tighter text-slate-900 italic leading-none">Grand Total</span>
              </div>
              <span className="text-5xl font-black font-mono text-slate-900 tabular-nums leading-none tracking-tighter">
                {formatCurrency(totals.total)}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-32 border-t-[4px] border-slate-100 pt-20 font-sans">
          <div className="grid grid-cols-2 gap-20">
            <div className="space-y-12">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.5em] mb-4 text-slate-900 underline decoration-slate-300 underline-offset-8">Payment Instruction</p>
                <p className="text-xs text-slate-500 leading-relaxed font-bold italic pr-12">
                  {state.branding.payment}
                </p>
              </div>
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.5em] mb-4 text-slate-900 underline decoration-slate-300 underline-offset-8">Terms of Service</p>
                <p className="text-xs text-slate-500 leading-relaxed font-bold italic pr-12">
                  {state.branding.terms}
                </p>
              </div>
            </div>
            <div className="flex flex-col justify-end items-end text-right">
              <div className="border-[10px] border-slate-900 p-12 inline-block transform -rotate-2 bg-white relative shadow-2xl">
                <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-300 mb-4">Authorized Signature</p>
                <p className="text-5xl font-black text-slate-900 italic uppercase tracking-tighter leading-none">{state.branding.header}</p>
                <div className="mt-4 flex items-center justify-end gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-500 animate-pulse"></span>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Electronic Integrity Seal</span>
                </div>
              </div>
              <p className="text-[10px] font-black text-slate-200 mt-20 uppercase tracking-[1em] leading-none">GlassWorks Professional Suite v4.0</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrintDocument;
