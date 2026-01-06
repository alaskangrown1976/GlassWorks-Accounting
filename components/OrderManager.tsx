
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { AppState, SalesOrder, LineItem, Customer, Invoice } from '../types';
import { calculateDocTotals, formatCurrency, getNextOrderNumber, getNextInvoiceNumber } from '../utils/calculations';
import { DOC_META_DEFAULTS } from '../constants';

interface OrderManagerProps {
  state: AppState;
  updateState: (updater: (prev: AppState) => AppState, allowUndo?: boolean) => void;
  flashToast: (msg: string, onUndo?: () => void) => void;
  onPrint: (order: SalesOrder) => void;
  onUndo?: () => void;
}

const OrderManager: React.FC<OrderManagerProps> = ({ state, updateState, flashToast, onPrint, onUndo }) => {
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | 'new' | null>(null);
  const [listSearch, setListSearch] = useState('');

  const filteredOrders = useMemo(() => {
    return state.orders.filter(ord => {
      const customer = state.customers.find(c => c.id === ord.customerId);
      const name = customer?.name || ord.manualCustomer?.name || '';
      return name.toLowerCase().includes(listSearch.toLowerCase()) || ord.id.includes(listSearch);
    });
  }, [state.orders, state.customers, listSearch]);

  const handleDelete = (id: string) => {
    if (!confirm('Permanently remove this sales order from the active pipeline?')) return;
    updateState(prev => ({ ...prev, orders: prev.orders.filter(o => o.id !== id) }), true);
    flashToast('Order record deleted', onUndo);
    setSelectedOrder(null);
  };

  const handleConvertToInvoice = (ord: SalesOrder) => {
    if (!confirm('Convert this active Sales Order into a billable Invoice? This will also mark the order as Completed.')) return;
    const invSeq = getNextInvoiceNumber(state.invoices);
    const newInvoice: Invoice = {
      id: String(invSeq),
      seq: invSeq,
      customerId: ord.customerId,
      manualCustomer: ord.manualCustomer,
      status: 'Unpaid',
      created: new Date().toLocaleDateString(),
      due: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      items: ord.items,
      meta: ord.meta,
      directMaterials: ord.directMaterials,
      matLength: ord.matLength,
      matWidth: ord.matWidth,
      matPieces: ord.matPieces
    };

    updateState(prev => ({
      ...prev,
      invoices: [...prev.invoices, newInvoice],
      orders: prev.orders.map(o => o.id === ord.id ? { ...o, status: 'Completed' } : o)
    }));

    flashToast(`Invoice #${invSeq} generated successfully`);
    setSelectedOrder(null);
  };

  if (selectedOrder) {
    return (
      <OrderEditor 
        order={selectedOrder === 'new' ? null : selectedOrder}
        onClose={() => setSelectedOrder(null)}
        state={state}
        updateState={updateState}
        flashToast={flashToast}
        onPrint={onPrint}
        onDelete={handleDelete}
        onConvertToInvoice={handleConvertToInvoice}
      />
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Sales Orders</h2>
          <p className="text-slate-500">Pipeline and confirmed project tracking</p>
        </div>
        <div className="flex gap-3">
          <input 
            type="text" 
            placeholder="Search orders..."
            className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            value={listSearch}
            onChange={e => setListSearch(e.target.value)}
          />
          <button 
            onClick={() => setSelectedOrder('new')}
            className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold shadow-lg hover:bg-indigo-500 transition-all flex items-center gap-2"
          >
            <span>🛒</span> New Sales Order
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
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Total</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.map(ord => {
                const customer = state.customers.find(c => c.id === ord.customerId);
                return (
                  <tr 
                    key={ord.id} 
                    onClick={() => setSelectedOrder(ord)}
                    className="hover:bg-indigo-50/50 transition-colors cursor-pointer group"
                  >
                    <td className="px-6 py-4 font-mono font-bold text-sm text-slate-400 group-hover:text-indigo-600 transition-colors">SO-{ord.seq}</td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-800">{customer?.name || ord.manualCustomer?.name || 'Manual'}</p>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{ord.created}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                        ord.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' : 
                        ord.status === 'Confirmed' ? 'bg-sky-100 text-sky-700' : 'bg-indigo-100 text-indigo-700'
                      }`}>
                        {ord.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-black tabular-nums">{formatCurrency(calculateDocTotals(ord.items, ord.meta, ord.directMaterials || 0).total)}</td>
                    <td className="px-6 py-4 text-right">
                      <button className="px-4 py-1.5 bg-slate-100 text-slate-500 rounded-lg text-[10px] font-black uppercase hover:bg-indigo-600 hover:text-white transition-all">
                        Edit Draft
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filteredOrders.length === 0 && (
          <div className="p-16 text-center text-slate-400 italic">No sales orders found matching your search.</div>
        )}
      </div>
    </div>
  );
};

const OrderEditor: React.FC<{
  order: SalesOrder | null;
  onClose: () => void;
  state: AppState;
  updateState: (u: (p: AppState) => AppState, allowUndo?: boolean) => void;
  flashToast: (m: string, onUndo?: () => void) => void;
  onPrint: (ord: SalesOrder) => void;
  onDelete: (id: string) => void;
  onConvertToInvoice: (ord: SalesOrder) => void;
}> = ({ order, onClose, state, updateState, flashToast, onPrint, onDelete, onConvertToInvoice }) => {
  const [formData, setFormData] = useState<Partial<SalesOrder>>(order || {
    id: `SO-${getNextOrderNumber(state.orders)}`,
    seq: getNextOrderNumber(state.orders),
    customerId: '',
    status: 'Pending',
    created: new Date().toLocaleDateString(),
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
    } else if (!order) {
      searchInputRef.current?.focus();
      setShowSuggestions(true);
    }
  }, [formData.customerId, state.customers, order]);

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
      flashToast('Please link a customer to this order');
      setShowSuggestions(true);
      return;
    }
    
    const finalOrder = { 
      ...formData, 
      directMaterials: materialBreakdown.total,
      items: (formData.items || []).filter(i => i.desc.trim() !== '')
    } as SalesOrder;

    updateState(prev => {
      const isNew = !order;
      if (isNew) {
        return { ...prev, orders: [...prev.orders, finalOrder] };
      } else {
        return { ...prev, orders: prev.orders.map(o => o.id === finalOrder.id ? finalOrder : o) };
      }
    });
    flashToast(order ? 'Project draft updated' : 'Sales order generated');
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
    <div className="fixed inset-0 z-[100] bg-slate-100 flex flex-col md:flex-row h-screen animate-in fade-in duration-300 overflow-hidden no-print">
      <div className="w-full md:w-80 bg-indigo-950 text-white flex flex-col p-8 border-r border-indigo-900 shadow-2xl overflow-y-auto">
        <div className="mb-12">
          <p className="text-[10px] font-black text-sky-400 uppercase tracking-widest mb-2">Order Workflow</p>
          <h2 className="text-2xl font-black tracking-tighter uppercase italic leading-none">Project Live Draft</h2>
          <div className="mt-6 p-5 bg-indigo-900/50 rounded-3xl border border-indigo-800">
            <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-1">Projected Revenue</p>
            <p className="text-4xl font-black text-sky-400 tabular-nums">{formatCurrency(totals.total)}</p>
          </div>
        </div>
        
        <div className="flex flex-col gap-4 mt-auto">
          <button 
            onClick={handleSave}
            className="w-full py-5 bg-sky-500 hover:bg-sky-400 text-slate-900 rounded-2xl font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-3 shadow-xl active:scale-[0.98]"
          >
            💾 SAVE DRAFT
          </button>
          <button 
            onClick={() => onPrint(formData as SalesOrder)}
            className="w-full py-5 bg-indigo-900 hover:bg-indigo-800 text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-3 border border-indigo-800"
          >
            🖨️ PRINT DRAFT
          </button>
          {order && (
            <>
              <button 
                onClick={() => onConvertToInvoice(order)}
                className="w-full py-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-3 shadow-lg active:scale-[0.98]"
              >
                ⚡ CONVERT TO BILL
              </button>
              <button 
                onClick={() => onDelete(order.id)}
                className="w-full py-4 bg-rose-900/30 hover:bg-rose-900/50 text-rose-300 rounded-2xl font-black uppercase tracking-widest text-xs transition-all"
              >
                🗑️ REMOVE FROM PIPELINE
              </button>
            </>
          )}
          <button 
            onClick={onClose}
            className="mt-4 w-full py-4 text-indigo-400 hover:text-white font-black text-xs uppercase tracking-widest transition-all"
          >
            CANCEL / EXIT
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-slate-200/50 p-4 md:p-12">
        <div className="max-w-[850px] mx-auto bg-white shadow-2xl rounded-[40px] border border-slate-200 p-8 md:p-16 min-h-[1050px] flex flex-col relative animate-in slide-in-from-bottom-6 duration-500">
          <div className="absolute top-0 left-0 w-full h-3 bg-indigo-600 rounded-t-[40px]"></div>

          <div className="flex justify-between items-start mb-16 border-b-4 border-indigo-900 pb-10 mt-4">
            <div>
              <h1 className="text-5xl font-black uppercase tracking-tighter text-slate-900 leading-none mb-4">{state.branding.header}</h1>
              <div className="flex items-center gap-4">
                <span className="text-[10px] font-black bg-indigo-50 text-indigo-400 px-3 py-1.5 rounded uppercase tracking-widest shadow-sm">ORDER ID: {formData.id}</span>
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] italic">Active Pipeline Draft</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-4xl font-black text-slate-200 uppercase tracking-[0.3em] mb-4">Pipeline</div>
              <div className="flex flex-col gap-2 items-end">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Workflow Status</label>
                <select 
                  className="p-3 bg-indigo-50 border border-indigo-100 rounded-2xl text-xs font-black uppercase text-indigo-700 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all cursor-pointer"
                  value={formData.status}
                  onChange={e => setFormData({...formData, status: e.target.value as any})}
                >
                  <option value="Pending">Pending</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-16 mb-16">
            <div className="relative group">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6 border-b border-slate-100 pb-2">Client Reference</p>
              <div className="relative">
                <input 
                  ref={searchInputRef}
                  placeholder="Select customer for linking..."
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
                    <div className="p-3 bg-indigo-50 border-b border-indigo-100 text-[10px] font-black text-indigo-400 uppercase tracking-widest flex justify-between items-center">
                      <span>Matching Records</span>
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
                            className="p-4 hover:bg-indigo-50 cursor-pointer border-b border-slate-50 flex items-center justify-between group/item transition-colors"
                          >
                            <div className="flex flex-col">
                              <span className="font-black text-slate-800 group-hover/item:text-indigo-600 transition-colors">{c.name}</span>
                              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{c.email || 'No email contact'}</span>
                            </div>
                            <span className="text-xl opacity-0 group-hover/item:opacity-100 transition-all translate-x-4 group-hover/item:translate-x-0 text-indigo-400">➔</span>
                          </div>
                        ))
                      ) : (
                        <div className="p-12 text-center text-slate-400 text-sm italic">No matching customers found.</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              {formData.customerId && (
                <div className="mt-6 p-5 bg-indigo-50 rounded-2xl border border-indigo-100 text-sm text-indigo-800 font-bold animate-in slide-in-from-top-3 duration-300">
                  <p className="flex items-start gap-3 mb-2 leading-snug">
                    <span className="opacity-40 mt-1 text-indigo-400">📍</span> 
                    {state.customers.find(x => x.id === formData.customerId)?.address || 'Address not listed'}
                  </p>
                </div>
              )}
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6 border-b border-slate-100 pb-2">Business Details</p>
              <div className="text-sm text-slate-600 space-y-2">
                <p className="font-black text-slate-900 text-lg leading-none">{state.branding.header}</p>
                <div className="pt-4 border-t border-slate-50">
                  <p className="font-bold text-sky-600">{state.branding.email}</p>
                  <p className="font-black text-slate-300 text-[10px] uppercase tracking-widest mt-3 italic">ENTRY CREATED: {formData.created}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-indigo-50/40 rounded-[40px] p-10 border border-indigo-100 mb-16 shadow-inner relative overflow-hidden group hover:border-indigo-300 transition-all duration-500">
            <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:opacity-25 transition-opacity pointer-events-none text-indigo-400 text-6xl italic font-black">ESTIMATOR</div>
            <div className="flex items-center gap-4 mb-10">
              <h3 className="text-xs font-black text-indigo-900 uppercase tracking-[0.4em]">Project Materials Calculator</h3>
              <div className="h-0.5 flex-1 bg-gradient-to-r from-indigo-100 to-transparent"></div>
            </div>
            
            <div className="grid grid-cols-3 gap-10 mb-12">
              <div className="space-y-3">
                <label className="block text-[10px] font-black text-indigo-400 uppercase tracking-widest">Length (Inches)</label>
                <input 
                  type="number"
                  placeholder="0.0"
                  className="w-full p-6 bg-white border border-indigo-100 rounded-3xl text-2xl font-black outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-sm text-center"
                  value={formData.matLength || ''}
                  onChange={e => setFormData({...formData, matLength: Number(e.target.value)})}
                />
              </div>
              <div className="space-y-3">
                <label className="block text-[10px] font-black text-indigo-400 uppercase tracking-widest">Width (Inches)</label>
                <input 
                  type="number"
                  placeholder="0.0"
                  className="w-full p-6 bg-white border border-indigo-100 rounded-3xl text-2xl font-black outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-sm text-center"
                  value={formData.matWidth || ''}
                  onChange={e => setFormData({...formData, matWidth: Number(e.target.value)})}
                />
              </div>
              <div className="space-y-3">
                <label className="block text-[10px] font-black text-indigo-400 uppercase tracking-widest">Total Pieces</label>
                <input 
                  type="number"
                  placeholder="0"
                  className="w-full p-6 bg-white border border-indigo-100 rounded-3xl text-2xl font-black outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-sm text-center"
                  value={formData.matPieces || ''}
                  onChange={e => setFormData({...formData, matPieces: Number(e.target.value)})}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-10 py-12 border-t border-indigo-100">
               <div className="bg-white p-8 rounded-[32px] border border-indigo-50 shadow-sm group/card hover:border-indigo-300 transition-all hover:shadow-xl hover:shadow-indigo-900/5">
                 <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-3 group-hover/card:text-indigo-600 transition-colors">SOLDER BREAKDOWN (EST.)</p>
                 <p className="text-4xl font-black text-slate-800 tabular-nums leading-none mb-4">{formatCurrency(materialBreakdown.solder)}</p>
                 <div className="h-1 w-12 bg-indigo-200 rounded-full"></div>
                 <p className="text-[10px] text-slate-400 font-bold uppercase mt-4 tracking-widest leading-relaxed">System Calculation: $0.12 per linear inch</p>
               </div>
               <div className="bg-white p-8 rounded-[32px] border border-indigo-50 shadow-sm group/card hover:border-indigo-300 transition-all hover:shadow-xl hover:shadow-indigo-900/5">
                 <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-3 group-hover/card:text-indigo-600 transition-colors">COPPER FOIL BREAKDOWN (EST.)</p>
                 <p className="text-4xl font-black text-slate-800 tabular-nums leading-none mb-4">{formatCurrency(materialBreakdown.foil)}</p>
                 <div className="h-1 w-12 bg-indigo-200 rounded-full"></div>
                 <p className="text-[10px] text-slate-400 font-bold uppercase mt-4 tracking-widest leading-relaxed">System Calculation: 2 runs @ $0.013/inch</p>
               </div>
            </div>

            <div className="flex justify-between items-center pt-12 border-t-4 border-white mt-4">
              <span className="text-sm font-black text-slate-900 uppercase tracking-[0.5em]">DIRECT MATERIALS SUBTOTAL</span>
              <span className="text-5xl font-black text-indigo-600 tabular-nums drop-shadow-sm">{formatCurrency(materialBreakdown.total)}</span>
            </div>
          </div>

          <div className="flex-1 space-y-8">
            <div className="flex justify-between items-center px-4">
              <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.4em]">PROJECT SCOPE ITEMS</h3>
              <button 
                onClick={addItem} 
                className="px-8 py-3 bg-indigo-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl active:scale-95 shadow-indigo-100"
              >
                + ADD SCOPE ENTRY
              </button>
            </div>

            <div className="border-2 border-indigo-50 rounded-[40px] overflow-hidden shadow-inner bg-slate-50/20">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="text-left text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-50/80 border-b border-indigo-50">
                    <th className="py-6 px-8 w-24">CODE</th>
                    <th className="py-6 px-8">PROJECT SCOPE DESCRIPTION</th>
                    <th className="py-6 px-4 w-28 text-center">QTY</th>
                    <th className="py-6 px-4 w-40 text-right">UNIT PRICE</th>
                    <th className="py-6 px-8 w-40 text-right">TOTAL</th>
                    <th className="py-6 px-4 w-12"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-indigo-50/50">
                  {(formData.items || []).map((item, idx) => (
                    <tr key={idx} className="group hover:bg-white transition-all duration-300">
                      <td className="py-5 px-8">
                        <select 
                          className="w-full text-xs font-bold text-indigo-600 bg-transparent outline-none appearance-none cursor-pointer hover:bg-indigo-50 rounded p-1 transition-colors"
                          value={item.account}
                          onChange={e => updateItem(idx, 'account', e.target.value)}
                        >
                          {state.accountCodes.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
                        </select>
                      </td>
                      <td className="py-5 px-8">
                        <input 
                          className="w-full font-bold text-slate-800 bg-transparent outline-none focus:bg-white focus:ring-4 focus:ring-indigo-500/10 rounded-xl p-3 transition-all"
                          placeholder="Project milestone or resource..."
                          value={item.desc}
                          onChange={e => updateItem(idx, 'desc', e.target.value)}
                        />
                      </td>
                      <td className="py-5 px-4 text-center">
                        <input 
                          type="number"
                          className="w-20 font-black text-slate-600 bg-transparent text-center outline-none focus:bg-white focus:ring-1 focus:ring-indigo-500/20 rounded-lg p-2 tabular-nums"
                          value={item.qty || ''}
                          onChange={e => updateItem(idx, 'qty', Number(e.target.value))}
                        />
                      </td>
                      <td className="py-5 px-4 text-right">
                        <input 
                          type="number"
                          className="w-32 font-black text-indigo-600 bg-transparent text-right outline-none focus:bg-white focus:ring-1 focus:ring-indigo-500/20 rounded-lg p-2 tabular-nums"
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
                        No scope items added. Define project milestones to estimate value.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-20 flex justify-end">
            <div className="w-full md:w-[420px] space-y-6 bg-indigo-900 text-white p-14 rounded-[60px] shadow-2xl shadow-indigo-200 relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-48 h-48 bg-sky-500/10 rounded-full -mr-24 -mt-24 blur-3xl pointer-events-none transition-all group-hover:bg-sky-500/20"></div>
               <div className="flex justify-between items-center text-[11px] opacity-40 font-black uppercase tracking-[0.2em]">
                 <span>MATERIALS ESTIMATE</span>
                 <span className="font-mono text-xs">{formatCurrency(materialBreakdown.total)}</span>
               </div>
               <div className="flex justify-between items-center text-[11px] opacity-40 font-black uppercase tracking-[0.2em]">
                 <span>SCOPE SUBTOTAL</span>
                 <span className="font-mono text-xs">{formatCurrency((formData.items || []).reduce((s,i) => s + (i.qty * i.price), 0))}</span>
               </div>
               <div className="h-px bg-white/10 my-8"></div>
               <div className="flex justify-between items-end relative z-10">
                 <span className="text-2xl font-black uppercase tracking-tighter italic leading-none">Draft Total</span>
                 <div className="text-right">
                   <p className="text-5xl font-black font-mono text-sky-400 drop-shadow-[0_0_20px_rgba(56,189,248,0.4)] leading-none">{formatCurrency(totals.total)}</p>
                   <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mt-3 opacity-60">Estimated Projection</p>
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

export default OrderManager;
