
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { AppState, Invoice, LineItem, Customer } from '../types';
import { calculateDocTotals, formatCurrency, getInvoiceBalance, getNextInvoiceNumber } from '../utils/calculations';
import { DOC_META_DEFAULTS } from '../constants';

interface InvoiceManagerProps {
  state: AppState;
  updateState: (updater: (prev: AppState) => AppState, allowUndo?: boolean) => void;
  flashToast: (msg: string, onUndo?: () => void) => void;
  onPrint: (invoice: Invoice) => void;
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
    if (!confirm('Are you sure you want to delete this invoice record?')) return;
    updateState(prev => ({
      ...prev,
      invoices: prev.invoices.filter(i => i.id !== id),
      payments: prev.payments.filter(p => p.invoiceId !== id)
    }), true);
    flashToast('Invoice deleted', onUndo);
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
          <p className="text-slate-500">Billing and receivables management</p>
        </div>
        <div className="flex gap-3">
           <input 
            type="text" 
            placeholder="Filter list..."
            className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-sky-500 outline-none"
            value={listSearch}
            onChange={e => setListSearch(e.target.value)}
          />
          <button 
            onClick={() => setSelectedInvoice('new')}
            className="px-6 py-2.5 bg-sky-600 text-white rounded-xl font-bold shadow-lg hover:bg-sky-500 transition-all flex items-center gap-2"
          >
            <span>📄</span> New Invoice
          </button>
        </div>
      </div>

      <div className="glass overflow-hidden rounded-3xl border border-slate-200 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[800px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-black text-slate-400 uppercase tracking-widest">
                <th className="px-6 py-4">ID</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Total</th>
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
                    <td className="px-6 py-4 font-mono font-bold text-sm text-slate-400 tracking-tighter group-hover:text-sky-600 transition-colors">#{inv.id}</td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-800">{customer?.name || inv.manualCustomer?.name || 'Unknown'}</p>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{inv.created}</p>
                    </td>
                    <td className="px-6 py-4 font-black text-slate-900 tabular-nums">{formatCurrency(calculateDocTotals(inv.items, inv.meta, inv.directMaterials || 0).total)}</td>
                    <td className="px-6 py-4 font-black text-amber-600 tabular-nums">{formatCurrency(balance)}</td>
                    <td className="px-6 py-4 text-right">
                      <button className="px-4 py-1.5 bg-slate-100 text-slate-500 rounded-lg text-[10px] font-black uppercase hover:bg-sky-600 hover:text-white transition-all">
                        Edit Bill
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filteredInvoices.length === 0 && (
          <div className="p-16 text-center text-slate-400">
            <div className="text-4xl mb-4 opacity-20 italic">📂</div>
            <p className="font-bold">No matching records.</p>
          </div>
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
  onPrint: (inv: Invoice) => void;
  onDelete: (id: string) => void;
}> = ({ invoice, onClose, state, updateState, flashToast, onPrint, onDelete }) => {
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

  const handleSave = () => {
    if (!formData.customerId) {
      flashToast('Customer selection is required');
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
    flashToast(invoice ? 'Record updated' : 'Invoice created');
    onClose();
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

  return (
    <div className="fixed inset-0 z-[100] bg-slate-100 flex flex-col md:flex-row h-screen animate-in fade-in duration-300 no-print">
      <div className="w-full md:w-80 bg-slate-900 text-white flex flex-col p-8 border-r border-slate-800 shadow-2xl overflow-y-auto">
        <div className="mb-12">
          <p className="text-[10px] font-black text-sky-400 uppercase tracking-widest mb-2">Invoice Workflow</p>
          <h2 className="text-2xl font-black tracking-tighter uppercase italic leading-none">Live Bill Editor</h2>
          <div className="mt-6 p-5 bg-slate-800 rounded-3xl border border-slate-700">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Billable</p>
            <p className="text-4xl font-black text-sky-400 tabular-nums">{formatCurrency(totals.total)}</p>
          </div>
        </div>
        
        <div className="flex flex-col gap-4">
          <button 
            onClick={handleSave}
            className="w-full py-5 bg-sky-500 hover:bg-sky-400 text-slate-900 rounded-2xl font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-3 shadow-xl active:scale-[0.98]"
          >
            💾 SAVE RECORD
          </button>
          <button 
            onClick={() => onPrint(formData as Invoice)}
            className="w-full py-5 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-3 border border-slate-700"
          >
            🖨️ PRINT PREVIEW
          </button>
          {invoice && (
            <button 
              onClick={() => onDelete(invoice.id)}
              className="w-full py-4 bg-rose-900/30 hover:bg-rose-900/50 text-rose-300 rounded-2xl font-black uppercase tracking-widest text-xs transition-all"
            >
              🗑️ DELETE PERMANENTLY
            </button>
          )}
          <button 
            onClick={onClose}
            className="mt-4 w-full py-4 text-slate-500 hover:text-white font-black text-xs uppercase tracking-widest transition-all"
          >
            CANCEL / EXIT
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-slate-200/50 p-4 md:p-12">
        <div className="max-w-[850px] mx-auto bg-white shadow-2xl rounded-[40px] border border-slate-200 p-8 md:p-16 min-h-[1050px] flex flex-col relative animate-in slide-in-from-bottom-6 duration-500">
          <div className="absolute top-0 left-0 w-full h-3 bg-sky-500 rounded-t-[40px]"></div>

          <div className="flex justify-between items-start mb-16 border-b-4 border-slate-900 pb-10 mt-4">
            <div>
              <h1 className="text-5xl font-black uppercase tracking-tighter text-slate-900 leading-none mb-4">{state.branding.header}</h1>
              <div className="flex items-center gap-4">
                <span className="text-[10px] font-black bg-slate-100 text-slate-400 px-3 py-1.5 rounded uppercase tracking-widest">INV #{formData.id}</span>
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] italic">Official Financial Record</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-4xl font-black text-slate-200 uppercase tracking-[0.3em] mb-4">Invoice</div>
              <div className="flex flex-col gap-1 items-end">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Billing Date</label>
                <input type="text" value={formData.created} readOnly className="text-sm font-bold bg-transparent border-none text-right outline-none w-32 cursor-default" />
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Due Date</label>
                <input 
                  type="date" 
                  value={formData.due} 
                  onChange={e => setFormData({...formData, due: e.target.value})}
                  className="text-sm font-black text-rose-600 bg-slate-50 border border-slate-100 p-2 rounded-xl outline-none text-right focus:ring-4 focus:ring-rose-500/10 transition-all"
                />
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-16 mb-16">
            <div className="relative group">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6 border-b border-slate-100 pb-2">Bill To Client</p>
              <div className="relative">
                <input 
                  ref={searchInputRef}
                  placeholder="Start typing client name..."
                  className="w-full text-2xl font-black text-slate-900 outline-none placeholder:text-slate-200 bg-transparent"
                  value={customerSearch}
                  onChange={e => {
                    setCustomerSearch(e.target.value);
                    setShowSuggestions(true);
                    if (e.target.value === '') setFormData({ ...formData, customerId: '' });
                  }}
                  onFocus={() => setShowSuggestions(true)}
                />
                {showSuggestions && (
                  <div className="absolute left-0 right-0 top-full mt-4 bg-white shadow-2xl rounded-3xl border border-slate-200 z-[110] overflow-hidden animate-in zoom-in-95 duration-200">
                    <div className="p-3 bg-slate-50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest flex justify-between items-center">
                      <span>Matching Customers</span>
                      <button onClick={() => setShowSuggestions(false)} className="hover:text-rose-500 transition-colors">Close ×</button>
                    </div>
                    <div className="max-h-72 overflow-y-auto">
                      {filteredCustomers.length > 0 ? (
                        filteredCustomers.map(c => (
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
                              <span className="font-black text-slate-800 group-hover/item:text-sky-600 transition-colors">{c.name}</span>
                              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{c.email || 'No email contact'}</span>
                            </div>
                            <span className="text-xl opacity-0 group-hover/item:opacity-100 transition-all translate-x-4 group-hover/item:translate-x-0">➔</span>
                          </div>
                        ))
                      ) : (
                        <div className="p-12 text-center text-slate-400 text-sm italic font-medium">No results for "{customerSearch}"</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              {formData.customerId && (
                <div className="mt-6 p-5 bg-sky-50 rounded-2xl border border-sky-100 text-sm text-sky-800 font-bold animate-in slide-in-from-top-3 duration-300">
                  <p className="flex items-start gap-3 mb-2 leading-snug">
                    <span className="opacity-40 mt-1">📍</span> 
                    {state.customers.find(x => x.id === formData.customerId)?.address || 'No address in profile'}
                  </p>
                  <p className="flex items-center gap-3 text-xs opacity-60">
                    <span className="opacity-40">📱</span> 
                    {state.customers.find(x => x.id === formData.customerId)?.phone || 'No phone recorded'}
                  </p>
                </div>
              )}
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6 border-b border-slate-100 pb-2">Business Record</p>
              <div className="text-sm text-slate-600 space-y-2">
                <p className="font-black text-slate-900 text-lg leading-none">{state.branding.header}</p>
                <p className="whitespace-pre-line leading-relaxed font-medium text-xs opacity-80">{state.branding.address}</p>
                <div className="pt-3 border-t border-slate-50">
                  <p className="font-bold text-sky-600">{state.branding.email}</p>
                  <p className="font-bold text-slate-400 mt-1">{state.branding.phone}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 rounded-[40px] p-10 border border-slate-200 mb-16 shadow-inner relative overflow-hidden group hover:border-sky-200 transition-all duration-500">
            <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:opacity-25 transition-opacity pointer-events-none text-sky-400 text-6xl">📐</div>
            <div className="flex items-center gap-4 mb-10">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.4em]">MATERIALS CALCULATOR</h3>
              <div className="h-0.5 flex-1 bg-gradient-to-r from-slate-200 to-transparent"></div>
            </div>
            
            <div className="grid grid-cols-3 gap-10 mb-12">
              <div className="space-y-3">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Length (Inches)</label>
                <input 
                  type="number"
                  placeholder="0.0"
                  className="w-full p-6 bg-white border border-slate-200 rounded-3xl text-2xl font-black outline-none focus:ring-4 focus:ring-sky-500/10 transition-all shadow-sm text-center"
                  value={formData.matLength || ''}
                  onChange={e => setFormData({...formData, matLength: Number(e.target.value)})}
                />
              </div>
              <div className="space-y-3">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Width (Inches)</label>
                <input 
                  type="number"
                  placeholder="0.0"
                  className="w-full p-6 bg-white border border-slate-200 rounded-3xl text-2xl font-black outline-none focus:ring-4 focus:ring-sky-500/10 transition-all shadow-sm text-center"
                  value={formData.matWidth || ''}
                  onChange={e => setFormData({...formData, matWidth: Number(e.target.value)})}
                />
              </div>
              <div className="space-y-3">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Pieces</label>
                <input 
                  type="number"
                  placeholder="0"
                  className="w-full p-6 bg-white border border-slate-200 rounded-3xl text-2xl font-black outline-none focus:ring-4 focus:ring-sky-500/10 transition-all shadow-sm text-center"
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
              <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.4em]">MANUAL LINE ITEMS</h3>
              <button 
                onClick={addItem} 
                className="px-8 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-700 transition-all shadow-xl shadow-slate-200 active:scale-95"
              >
                + ADD LINE ENTRY
              </button>
            </div>

            <div className="border-2 border-slate-50 rounded-[40px] overflow-hidden shadow-inner bg-slate-50/20">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="text-left text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-50/80 border-b border-slate-100">
                    <th className="py-6 px-8 w-24">CODE</th>
                    <th className="py-6 px-8">DETAILED DESCRIPTION</th>
                    <th className="py-6 px-4 w-28 text-center">QTY</th>
                    <th className="py-6 px-4 w-40 text-right">UNIT PRICE</th>
                    <th className="py-6 px-8 w-40 text-right">TOTAL</th>
                    <th className="py-6 px-4 w-12"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {(formData.items || []).map((item, idx) => (
                    <tr key={idx} className="group hover:bg-white transition-all duration-300">
                      <td className="py-5 px-8">
                        <select 
                          className="w-full text-xs font-bold text-sky-600 bg-transparent outline-none appearance-none cursor-pointer hover:bg-sky-50 rounded p-1 transition-colors"
                          value={item.account}
                          onChange={e => updateItem(idx, 'account', e.target.value)}
                        >
                          {state.accountCodes.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
                        </select>
                      </td>
                      <td className="py-5 px-8">
                        <input 
                          className="w-full font-bold text-slate-800 bg-transparent outline-none focus:bg-white focus:ring-4 focus:ring-sky-500/10 rounded-xl p-3 transition-all"
                          placeholder="Project detail or service..."
                          value={item.desc}
                          onChange={e => updateItem(idx, 'desc', e.target.value)}
                        />
                      </td>
                      <td className="py-5 px-4 text-center">
                        <input 
                          type="number"
                          className="w-20 font-black text-slate-600 bg-transparent text-center outline-none focus:bg-white focus:ring-1 focus:ring-sky-500/20 rounded-lg p-2 tabular-nums"
                          value={item.qty || ''}
                          onChange={e => updateItem(idx, 'qty', Number(e.target.value))}
                        />
                      </td>
                      <td className="py-5 px-4 text-right">
                        <input 
                          type="number"
                          className="w-28 font-black text-emerald-600 bg-transparent text-right outline-none focus:bg-white focus:ring-1 focus:ring-sky-500/20 rounded-lg p-2 tabular-nums"
                          value={item.price || ''}
                          onChange={e => updateItem(idx, 'price', Number(e.target.value))}
                        />
                      </td>
                      <td className="py-5 px-8 text-right font-black tabular-nums text-slate-900 text-lg leading-none">
                        {formatCurrency(item.qty * item.price)}
                      </td>
                      <td className="py-5 px-4 text-right">
                        <button 
                          onClick={() => removeItem(idx)} 
                          className="text-rose-200 hover:text-rose-600 font-black text-2xl opacity-0 group-hover:opacity-100 transition-all hover:scale-125"
                        >
                          ×
                        </button>
                      </td>
                    </tr>
                  ))}
                  {(formData.items || []).length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-16 text-center text-slate-300 text-sm font-medium italic tracking-wide leading-relaxed">
                        Click 'Add Line Entry' to include specific services or overhead.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-20 flex justify-end">
            <div className="w-full md:w-[420px] space-y-6 bg-slate-900 text-white p-14 rounded-[60px] shadow-2xl shadow-slate-400 relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-48 h-48 bg-sky-500/10 rounded-full -mr-24 -mt-24 blur-3xl pointer-events-none transition-all group-hover:bg-sky-500/20"></div>
               <div className="flex justify-between items-center text-[11px] opacity-40 font-black uppercase tracking-[0.2em]">
                 <span>DIRECT MATERIALS TOTAL</span>
                 <span className="font-mono text-xs">{formatCurrency(materialBreakdown.total)}</span>
               </div>
               <div className="flex justify-between items-center text-[11px] opacity-40 font-black uppercase tracking-[0.2em]">
                 <span>SERVICES & LABOR SUB-TOTAL</span>
                 <span className="font-mono text-xs">{formatCurrency((formData.items || []).reduce((s,i) => s + (i.qty * i.price), 0))}</span>
               </div>
               <div className="h-px bg-white/10 my-8"></div>
               <div className="flex justify-between items-end relative z-10">
                 <span className="text-2xl font-black uppercase tracking-tighter italic leading-none">Grand Total</span>
                 <div className="text-right">
                   <p className="text-5xl font-black font-mono text-sky-400 drop-shadow-[0_0_20px_rgba(56,189,248,0.4)] leading-none">{formatCurrency(totals.total)}</p>
                   <p className="text-[10px] font-black text-sky-700 uppercase tracking-widest mt-3 opacity-60">REFLECTING ALL MATERIAL COSTS</p>
                 </div>
               </div>
            </div>
          </div>

          <div className="mt-24 pt-10 border-t border-slate-100 italic text-slate-300 text-[10px] text-center uppercase tracking-[0.4em] font-black leading-relaxed">
            {state.branding.footer || 'Generated by GlassWorks Financial Suite v4.0'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceManager;
