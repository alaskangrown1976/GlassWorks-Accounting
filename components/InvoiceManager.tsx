
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { AppState, Invoice, LineItem, Customer } from '../types';
import { calculateDocTotals, formatCurrency, getInvoiceBalance, getNextInvoiceNumber } from '../utils/calculations';
import { DOC_META_DEFAULTS } from '../constants';

interface InvoiceManagerProps {
  state: AppState;
  updateState: (updater: (prev: AppState) => AppState, allowUndo?: boolean) => void;
  flashToast: (msg: string, onUndo?: () => void) => void;
  onPrint: (invoice: Invoice, autoPrint?: boolean) => void;
  onUndo?: () => void;
}

const InvoiceManager: React.FC<InvoiceManagerProps> = ({ state, updateState, flashToast, onPrint, onUndo }) => {
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | 'new' | null>(null);
  const [listSearch, setListSearch] = useState('');

  const filteredInvoices = useMemo(() => {
    return state.invoices.filter(inv => {
      const customer = state.customers.find(c => c.id === inv.customerId);
      const name = customer?.name || inv.manualCustomer?.name || '';
      return name.toLowerCase().includes(listSearch.toLowerCase()) || inv.id.includes(listSearch);
    });
  }, [state.invoices, state.customers, listSearch]);

  const handleDelete = (id: string) => {
    if (!confirm('Move this invoice to archives? This action can be reverted.')) return;
    updateState(prev => ({
      ...prev,
      invoices: prev.invoices.filter(i => i.id !== id),
      payments: prev.payments.filter(p => p.invoiceId !== id)
    }), true);
    flashToast('Invoice archived', onUndo);
    setSelectedInvoice(null);
  };

  if (selectedInvoice) {
    return (
      <InvoiceEditor 
        invoice={selectedInvoice === 'new' ? null : selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
        state={state}
        updateState={updateState}
        flashToast={flashToast}
        onPrint={onPrint}
        onDelete={handleDelete}
      />
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Invoices</h2>
          <p className="text-slate-500">Financial records and billing history</p>
        </div>
        <div className="flex gap-3">
           <input 
            type="text" 
            placeholder="Search all invoices..."
            className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-sky-500 outline-none w-64 shadow-sm"
            value={listSearch}
            onChange={e => setListSearch(e.target.value)}
          />
          <button 
            onClick={() => setSelectedInvoice('new')}
            className="px-6 py-2.5 bg-sky-600 text-white rounded-xl font-bold shadow-lg hover:bg-sky-500 transition-all flex items-center gap-2"
          >
            <span>📄</span> Create New Bill
          </button>
        </div>
      </div>

      <div className="glass overflow-hidden rounded-3xl border border-slate-200 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[800px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-black text-slate-400 uppercase tracking-widest">
                <th className="px-6 py-4">Serial</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Due Date</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Balance</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInvoices.map(inv => {
                const customer = state.customers.find(c => c.id === inv.customerId);
                const balance = getInvoiceBalance(inv, state.payments);
                return (
                  <tr 
                    key={inv.id} 
                    onClick={() => setSelectedInvoice(inv)}
                    className="hover:bg-sky-50/50 transition-colors cursor-pointer group"
                  >
                    <td className="px-6 py-4 font-mono font-bold text-sm text-slate-400 group-hover:text-sky-600 transition-colors">#{inv.id}</td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-800">{customer?.name || inv.manualCustomer?.name || 'Manual Entry'}</p>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{inv.created}</p>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-600">{inv.due}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                        balance === 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                      }`}>
                        {balance === 0 ? 'PAID' : 'UNPAID'}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-black tabular-nums">{formatCurrency(balance)}</td>
                    <td className="px-6 py-4 text-right">
                      <button className="px-4 py-1.5 bg-slate-100 text-slate-500 rounded-lg text-[10px] font-black uppercase hover:bg-sky-600 hover:text-white transition-all">
                        Edit
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filteredInvoices.length === 0 && (
          <div className="p-20 text-center text-slate-400 italic">No invoices matching search criteria.</div>
        )}
      </div>
    </div>
  );
};

const InvoiceEditor: React.FC<{
  invoice: Invoice | null;
  onClose: () => void;
  state: AppState;
  updateState: (u: (p: AppState) => AppState, allowUndo?: boolean) => void;
  flashToast: (m: string, onUndo?: () => void) => void;
  onPrint: (inv: Invoice, autoPrint?: boolean) => void;
  onDelete: (id: string) => void;
}> = ({ invoice, onClose, state, updateState, flashToast, onPrint, onDelete }) => {
  const [showSuccess, setShowSuccess] = useState(false);
  const [formData, setFormData] = useState<Partial<Invoice>>(invoice || {
    id: String(getNextInvoiceNumber(state.invoices)),
    seq: getNextInvoiceNumber(state.invoices),
    customerId: '',
    status: 'Unpaid',
    created: new Date().toLocaleDateString(),
    due: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    items: [{ account: state.accountCodes[0]?.code || '100', desc: '', qty: 1, price: 0 }],
    meta: DOC_META_DEFAULTS,
    directMaterials: 0,
    matLength: 0,
    matWidth: 0,
    matPieces: 0
  });

  const [customerSearch, setCustomerSearch] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (formData.customerId) {
      const c = state.customers.find(x => x.id === formData.customerId);
      if (c) setCustomerSearch(c.name);
    } else if (!invoice) {
      searchInputRef.current?.focus();
      setShowSuggestions(true);
    }
  }, [formData.customerId, state.customers, invoice]);

  const filteredCustomers = useMemo(() => 
    state.customers.filter(c => c.name.toLowerCase().includes(customerSearch.toLowerCase())),
    [state.customers, customerSearch]
  );

  const materialBreakdown = useMemo(() => {
    const pieces = formData.matPieces || 0;
    const linearInches = pieces * 3.5;
    const solder = linearInches * 0.12;
    const foil = linearInches * 2 * 0.013;
    return { solder, foil, total: solder + foil };
  }, [formData.matPieces]);

  const totals = useMemo(() => 
    calculateDocTotals(formData.items || [], formData.meta || DOC_META_DEFAULTS, materialBreakdown.total),
    [formData.items, formData.meta, materialBreakdown.total]
  );

  const handleSave = (silent = false) => {
    if (!formData.customerId && !formData.manualCustomer) {
      flashToast('Please link a client record.');
      setShowSuggestions(true);
      return;
    }
    
    const finalInvoice = { 
      ...formData, 
      directMaterials: materialBreakdown.total,
      items: (formData.items || []).filter(i => i.desc.trim() !== '')
    } as Invoice;

    updateState(prev => {
      const isNew = !invoice;
      if (isNew) {
        return { ...prev, invoices: [...prev.invoices, finalInvoice] };
      } else {
        return { ...prev, invoices: prev.invoices.map(i => i.id === finalInvoice.id ? finalInvoice : i) };
      }
    });

    if (!silent) {
      setShowSuccess(true);
    } else {
      flashToast('Record updated successfully');
      onClose();
    }
  };

  const addItem = () => {
    const code = state.accountCodes[0];
    const newItem: LineItem = { account: code?.code || '100', desc: '', qty: 1, price: code?.rate || 0 };
    setFormData({ ...formData, items: [...(formData.items || []), newItem] });
  };

  const updateItem = (idx: number, field: keyof LineItem, val: any) => {
    const items = [...(formData.items || [])];
    items[idx] = { ...items[idx], [field]: val };
    if (field === 'account') {
      const code = state.accountCodes.find(c => c.code === val);
      if (code?.rate) items[idx].price = code.rate;
    }
    setFormData({ ...formData, items });
  };

  const removeItem = (idx: number) => {
    setFormData({ ...formData, items: (formData.items || []).filter((_, i) => i !== idx) });
  };

  const updateMeta = (field: keyof typeof DOC_META_DEFAULTS, value: any) => {
    setFormData({
      ...formData,
      meta: { ...(formData.meta || DOC_META_DEFAULTS), [field]: value }
    });
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-100 flex flex-col md:flex-row h-screen animate-in fade-in duration-300 overflow-hidden no-print">
      <div className="w-full md:w-80 bg-slate-900 text-white flex flex-col p-6 border-r border-slate-800 shadow-2xl overflow-y-auto">
        <div className="mb-8">
          <p className="text-[10px] font-black text-sky-400 uppercase tracking-widest mb-2">Invoice Details</p>
          <h2 className="text-xl font-black tracking-tighter uppercase italic leading-none">Bill Editor</h2>
          <div className="mt-6 p-4 bg-slate-800 rounded-2xl border border-slate-700">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Amount</p>
            <p className="text-3xl font-black text-sky-400 tabular-nums">{formatCurrency(totals.total)}</p>
          </div>
        </div>

        <div className="space-y-6 mb-8">
           <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Due Date</label>
              <input 
                type="date"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs font-bold focus:ring-1 focus:ring-sky-500 outline-none"
                value={formData.due}
                onChange={e => setFormData({ ...formData, due: e.target.value })}
              />
            </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Tax (%)</label>
              <input 
                type="number"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs font-bold focus:ring-1 focus:ring-sky-500 outline-none"
                value={formData.meta?.taxRate || 0}
                onChange={e => updateMeta('taxRate', Number(e.target.value))}
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Disc (%)</label>
              <input 
                type="number"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs font-bold focus:ring-1 focus:ring-sky-500 outline-none"
                value={formData.meta?.discountRate || 0}
                onChange={e => updateMeta('discountRate', Number(e.target.value))}
              />
            </div>
          </div>
        </div>
        
        <div className="flex flex-col gap-3 mt-auto">
          <button 
            onClick={() => handleSave()}
            className="w-full py-4 bg-sky-500 hover:bg-sky-400 text-slate-900 rounded-xl font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2 shadow-xl active:scale-[0.98]"
          >
            💾 SAVE INVOICE
          </button>
          <button 
            onClick={() => onPrint(formData as Invoice, true)}
            className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2 border border-slate-700"
          >
            🖨️ PRINT TO PAPER
          </button>
          {invoice && (
            <button 
              onClick={() => onDelete(invoice.id)}
              className="w-full py-3 bg-rose-900/30 hover:bg-rose-900/50 text-rose-300 rounded-xl font-black uppercase tracking-widest text-xs transition-all"
            >
              🗑️ ARCHIVE
            </button>
          )}
          <button 
            onClick={onClose}
            className="mt-2 w-full py-2 text-slate-500 hover:text-white font-black text-[10px] uppercase tracking-widest transition-all"
          >
            BACK TO LIST
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-slate-200/50 p-4 md:p-12">
        <div className="max-w-[850px] mx-auto bg-white shadow-2xl rounded-[40px] border border-slate-200 p-8 md:p-16 min-h-[1050px] flex flex-col relative animate-in slide-in-from-bottom-6 duration-500">
          <div className="absolute top-0 left-0 w-full h-3 bg-sky-600 rounded-t-[40px]"></div>

          <div className="flex justify-between items-start mb-16 border-b-4 border-slate-900 pb-10 mt-4">
            <div>
              <h1 className="text-5xl font-black uppercase tracking-tighter text-slate-900 leading-none mb-4">{state.branding.header}</h1>
              <div className="flex items-center gap-4">
                <span className="text-[10px] font-black bg-sky-50 text-sky-600 px-3 py-1.5 rounded uppercase tracking-widest shadow-sm font-mono">INV: #{formData.id}</span>
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] italic">Official Billing Document</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-4xl font-black text-slate-200 uppercase tracking-[0.3em] mb-4">Invoice</div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Date Created: {formData.created}</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-16 mb-16">
            <div className="relative group">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6 border-b border-slate-100 pb-2">Bill To</p>
              <div className="relative">
                <input 
                  ref={searchInputRef}
                  placeholder="Link client record..."
                  className="w-full text-2xl font-black text-slate-900 outline-none placeholder:text-slate-200 bg-transparent"
                  value={customerSearch}
                  onChange={e => {
                    setCustomerSearch(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                />
                {showSuggestions && (
                  <div className="absolute left-0 right-0 top-full mt-4 bg-white shadow-2xl rounded-3xl border border-slate-200 z-[110] overflow-hidden animate-in zoom-in-95 duration-200">
                    <div className="p-3 bg-sky-50 border-b border-sky-100 text-[10px] font-black text-sky-600 uppercase tracking-widest flex justify-between items-center">
                      <span>Matching Records</span>
                      <button onClick={() => setShowSuggestions(false)} className="hover:text-rose-500 transition-colors">Close ×</button>
                    </div>
                    <div className="max-h-72 overflow-y-auto">
                      {state.customers.filter(c => c.name.toLowerCase().includes(customerSearch.toLowerCase())).map(c => (
                        <div 
                          key={c.id} 
                          onClick={() => {
                            setFormData({ ...formData, customerId: c.id });
                            setCustomerSearch(c.name);
                            setShowSuggestions(false);
                          }}
                          className="p-4 hover:bg-sky-50 cursor-pointer border-b border-slate-50 flex items-center justify-between group/item transition-colors"
                        >
                          <div className="flex flex-col">
                            <span className="font-black text-slate-800">{c.name}</span>
                            <span className="text-[10px] text-slate-400 font-bold uppercase mt-1">{c.email || 'No email'}</span>
                          </div>
                          <span className="text-xl opacity-0 group-hover/item:opacity-100 transition-all text-sky-400">➔</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6 border-b border-slate-100 pb-2">From</p>
              <p className="font-black text-slate-900 text-lg leading-none mb-2">{state.branding.header}</p>
              <p className="text-sm text-slate-500 whitespace-pre-line">{state.branding.address}</p>
            </div>
          </div>

          <div className="bg-slate-50 rounded-[40px] p-10 border border-slate-200 mb-16 shadow-inner relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:opacity-25 transition-opacity pointer-events-none text-sky-400 text-6xl italic font-black">ESTIMATOR</div>
            <div className="flex items-center gap-4 mb-10">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.4em]">Materials Costing Utility</h3>
              <div className="h-0.5 flex-1 bg-gradient-to-r from-slate-200 to-transparent"></div>
            </div>
            
            <div className="grid grid-cols-3 gap-10 mb-12">
              <div className="space-y-3">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Length (Inches)</label>
                <input 
                  type="number"
                  placeholder="0.0"
                  className="w-full p-6 bg-white border border-slate-200 rounded-3xl text-2xl font-black outline-none focus:ring-4 focus:ring-sky-500/10 transition-all shadow-sm text-center tabular-nums"
                  value={formData.matLength || ''}
                  onChange={e => setFormData({...formData, matLength: Number(e.target.value)})}
                />
              </div>
              <div className="space-y-3">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Width (Inches)</label>
                <input 
                  type="number"
                  placeholder="0.0"
                  className="w-full p-6 bg-white border border-slate-200 rounded-3xl text-2xl font-black outline-none focus:ring-4 focus:ring-sky-500/10 transition-all shadow-sm text-center tabular-nums"
                  value={formData.matWidth || ''}
                  onChange={e => setFormData({...formData, matWidth: Number(e.target.value)})}
                />
              </div>
              <div className="space-y-3">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Pieces</label>
                <input 
                  type="number"
                  placeholder="0"
                  className="w-full p-6 bg-white border border-slate-200 rounded-3xl text-2xl font-black outline-none focus:ring-4 focus:ring-sky-500/10 transition-all shadow-sm text-center tabular-nums"
                  value={formData.matPieces || ''}
                  onChange={e => setFormData({...formData, matPieces: Number(e.target.value)})}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-10 py-12 border-t border-slate-200">
               <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm group/card hover:border-sky-300 transition-all hover:shadow-xl hover:shadow-sky-900/5">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 group-hover/card:text-sky-500 transition-colors">SOLDER CONSUMPTION (EST.)</p>
                 <p className="text-4xl font-black text-slate-800 tabular-nums leading-none mb-4">{formatCurrency(materialBreakdown.solder)}</p>
                 <div className="h-1 w-12 bg-sky-200 rounded-full"></div>
                 <p className="text-[10px] text-slate-400 font-bold uppercase mt-4 tracking-widest leading-relaxed">System Calculation: $0.12 per linear inch</p>
               </div>
               <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm group/card hover:border-sky-300 transition-all hover:shadow-xl hover:shadow-sky-900/5">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 group-hover/card:text-sky-500 transition-colors">COPPER FOIL CONSUMPTION (EST.)</p>
                 <p className="text-4xl font-black text-slate-800 tabular-nums leading-none mb-4">{formatCurrency(materialBreakdown.foil)}</p>
                 <div className="h-1 w-12 bg-sky-200 rounded-full"></div>
                 <p className="text-[10px] text-slate-400 font-bold uppercase mt-4 tracking-widest leading-relaxed">System Calculation: 2 runs @ $0.013/inch</p>
               </div>
            </div>

            <div className="flex justify-between items-center pt-12 border-t-4 border-white mt-4">
              <span className="text-sm font-black text-slate-900 uppercase tracking-[0.5em]">TOTAL DIRECT MATERIALS</span>
              <span className="text-5xl font-black text-sky-600 tabular-nums drop-shadow-sm">{formatCurrency(materialBreakdown.total)}</span>
            </div>
          </div>

          <div className="flex-1 space-y-8">
             <div className="flex justify-between items-center px-4">
              <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.4em]">Itemized Billing</h3>
              <button 
                onClick={addItem} 
                className="px-8 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-700 transition-all shadow-xl"
              >
                + ADD LINE ITEM
              </button>
            </div>

            <div className="border-2 border-slate-50 rounded-[40px] overflow-hidden bg-slate-50/20 shadow-inner">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="text-left text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-50/80 border-b border-slate-50">
                    <th className="py-6 px-8 w-24">CODE</th>
                    <th className="py-6 px-8">DESCRIPTION</th>
                    <th className="py-6 px-4 w-28 text-center">QTY</th>
                    <th className="py-6 px-4 w-40 text-right">PRICE</th>
                    <th className="py-6 px-8 w-40 text-right">TOTAL</th>
                    <th className="py-6 px-4 w-12"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {(formData.items || []).map((item, idx) => (
                    <tr key={idx} className="group hover:bg-white transition-all duration-300">
                      <td className="py-5 px-8">
                        <select 
                          className="w-full text-xs font-bold text-sky-600 bg-transparent outline-none cursor-pointer"
                          value={item.account}
                          onChange={e => updateItem(idx, 'account', e.target.value)}
                        >
                          {state.accountCodes.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
                        </select>
                      </td>
                      <td className="py-5 px-8">
                        <input 
                          className="w-full font-bold text-slate-800 bg-transparent outline-none focus:ring-2 focus:ring-sky-500/10 rounded-lg p-2"
                          placeholder="Service description..."
                          value={item.desc}
                          onChange={e => updateItem(idx, 'desc', e.target.value)}
                        />
                      </td>
                      <td className="py-5 px-4 text-center">
                        <input 
                          type="number"
                          className="w-20 font-black text-slate-600 bg-transparent text-center outline-none"
                          value={item.qty || ''}
                          onChange={e => updateItem(idx, 'qty', Number(e.target.value))}
                        />
                      </td>
                      <td className="py-5 px-4 text-right">
                        <input 
                          type="number"
                          className="w-32 font-black text-sky-600 bg-transparent text-right outline-none"
                          value={item.price || ''}
                          onChange={e => updateItem(idx, 'price', Number(e.target.value))}
                        />
                      </td>
                      <td className="py-5 px-8 text-right font-black text-slate-900 tabular-nums">
                        {formatCurrency(item.qty * item.price)}
                      </td>
                      <td className="py-5 px-4 text-right">
                        <button onClick={() => removeItem(idx)} className="text-rose-200 hover:text-rose-600 font-black text-xl opacity-0 group-hover:opacity-100 transition-all">×</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-20 flex justify-end">
            <div className="w-full md:w-96 space-y-4 bg-slate-900 text-white p-12 rounded-[60px] shadow-2xl relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
               <div className="flex justify-between items-center text-[11px] opacity-40 font-black uppercase tracking-[0.2em]">
                 <span>SUBTOTAL</span>
                 <span className="font-mono">{formatCurrency(totals.base)}</span>
               </div>
               {totals.discount > 0 && (
                  <div className="flex justify-between items-center text-[11px] font-black uppercase tracking-[0.2em] text-rose-400">
                    <span>DISCOUNT</span>
                    <span className="font-mono">-{formatCurrency(totals.discount)}</span>
                  </div>
               )}
               {totals.tax > 0 && (
                  <div className="flex justify-between items-center text-[11px] font-black uppercase tracking-[0.2em]">
                    <span>TAX ({formData.meta?.taxRate}%)</span>
                    <span className="font-mono">+{formatCurrency(totals.tax)}</span>
                  </div>
               )}
               <div className="h-px bg-white/10 my-6"></div>
               <div className="flex justify-between items-end relative z-10">
                 <span className="text-2xl font-black uppercase tracking-tighter italic leading-none">Total Due</span>
                 <p className="text-5xl font-black font-mono text-sky-400 leading-none shadow-sky-500/20">{formatCurrency(totals.total)}</p>
               </div>
            </div>
          </div>

          <div className="mt-24 pt-10 border-t border-slate-100 italic text-slate-300 text-[10px] text-center uppercase tracking-[0.4em] font-black">
            {state.branding.footer || 'Official Financial Document — GlassWorks Studio'}
          </div>
        </div>
      </div>

      {/* Success Modal Choice */}
      {showSuccess && (
        <div className="fixed inset-0 z-[200] bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-[40px] w-full max-w-lg shadow-2xl p-12 text-center animate-in zoom-in-95 duration-300">
            <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-4xl mx-auto mb-8 shadow-inner">✓</div>
            <h3 className="text-3xl font-black text-slate-900 mb-2 italic uppercase">Record Saved</h3>
            <p className="text-slate-500 font-bold mb-10 leading-relaxed">The invoice has been committed to your local ledger. How would you like to proceed?</p>
            
            <div className="grid grid-cols-1 gap-4">
              <button 
                onClick={() => { onPrint(formData as Invoice, true); setShowSuccess(false); }}
                className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-sm flex items-center justify-center gap-3 shadow-xl hover:bg-slate-800 transition-all active:scale-[0.98]"
              >
                🖨️ PRINT TO PAPER NOW
              </button>
              <button 
                onClick={() => { setShowSuccess(false); onClose(); }}
                className="w-full py-5 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-slate-200 transition-all active:scale-[0.98]"
              >
                DONE, RETURN TO LIST
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceManager;
