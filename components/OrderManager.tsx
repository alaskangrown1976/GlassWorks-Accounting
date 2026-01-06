
import React, { useState, useMemo, useEffect } from 'react';
import { AppState, SalesOrder, LineItem, Customer } from '../types';
import { calculateDocTotals, formatCurrency, getNextOrderNumber } from '../utils/calculations';
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

  const handleDelete = (id: string) => {
    if (!confirm('Delete this order?')) return;
    updateState(prev => ({ ...prev, orders: prev.orders.filter(o => o.id !== id) }), true);
    flashToast('Order deleted', onUndo);
    setSelectedOrder(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {!selectedOrder ? (
        <>
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Sales Orders</h2>
              <p className="text-slate-500">Pipeline and confirmed project tracking</p>
            </div>
            <button 
              onClick={() => setSelectedOrder('new')}
              className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold shadow-lg hover:bg-indigo-500 transition-all flex items-center gap-2"
            >
              <span>🛒</span> New Sales Order
            </button>
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
                  {state.orders.map(ord => {
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
                        <td className="px-6 py-4 text-right space-x-1">
                          <button 
                            onClick={(e) => { e.stopPropagation(); onPrint(ord); }}
                            className="p-2 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors"
                          >
                            🖨️
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <OrderEditor 
          order={selectedOrder === 'new' ? null : selectedOrder}
          onClose={() => setSelectedOrder(null)}
          state={state}
          updateState={updateState}
          flashToast={flashToast}
          onPrint={onPrint}
          onDelete={handleDelete}
        />
      )}
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
}> = ({ order, onClose, state, updateState, flashToast, onPrint, onDelete }) => {
  const [formData, setFormData] = useState<Partial<SalesOrder>>(order || {
    id: `SO-${getNextOrderNumber(state.orders)}`,
    seq: getNextOrderNumber(state.orders),
    customerId: '',
    status: 'Pending',
    created: new Date().toLocaleDateString(),
    items: [],
    meta: DOC_META_DEFAULTS,
    directMaterials: 0,
    matLength: 0,
    matWidth: 0,
    matPieces: 0
  });

  const [customerSearch, setCustomerSearch] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    if (formData.customerId) {
      const c = state.customers.find(x => x.id === formData.customerId);
      if (c) setCustomerSearch(c.name);
    }
  }, [formData.customerId, state.customers]);

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
      flashToast('Please select a customer first');
      return;
    }
    
    updateState(prev => {
      const isNew = !order;
      const finalOrder = { 
        ...formData, 
        directMaterials: materialBreakdown.total,
        items: (formData.items || []).filter(i => i.desc.trim() !== '')
      } as SalesOrder;
      
      if (isNew) {
        return { ...prev, orders: [...prev.orders, finalOrder] };
      } else {
        return { ...prev, orders: prev.orders.map(o => o.id === finalOrder.id ? finalOrder : o) };
      }
    });
    flashToast(order ? 'Order updated' : 'Order created');
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
    <div className="fixed inset-0 z-[100] bg-slate-100 flex flex-col md:flex-row h-screen animate-in fade-in duration-300">
      {/* Sidebar Actions */}
      <div className="w-full md:w-72 bg-indigo-950 text-white flex flex-col p-8 border-r border-indigo-900">
        <div className="mb-12">
          <p className="text-[10px] font-black text-sky-400 uppercase tracking-widest mb-2">Immersive Mode</p>
          <h2 className="text-2xl font-black tracking-tighter uppercase italic">Sales Editor</h2>
        </div>
        
        <div className="flex flex-col gap-3 mt-auto">
          <button 
            onClick={handleSave}
            className="w-full py-4 bg-sky-500 hover:bg-sky-400 text-slate-900 rounded-2xl font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2 shadow-xl shadow-indigo-900/40"
          >
            💾 Save Order
          </button>
          <button 
            onClick={() => order && onPrint(formData as SalesOrder)}
            disabled={!order}
            className="w-full py-4 bg-indigo-900 hover:bg-indigo-800 text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            🖨️ Print Preview
          </button>
          {order && (
            <button 
              onClick={() => onDelete(order.id)}
              className="w-full py-4 bg-rose-900/40 hover:bg-rose-900/60 text-rose-300 rounded-2xl font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2"
            >
              🗑️ Delete Order
            </button>
          )}
          <button 
            onClick={onClose}
            className="w-full py-4 text-indigo-400 hover:text-white font-bold text-xs uppercase tracking-widest transition-all"
          >
            Cancel & Close
          </button>
        </div>
      </div>

      {/* Interactive Order Canvas */}
      <div className="flex-1 overflow-y-auto bg-slate-50 p-4 md:p-12">
        <div className="max-w-[850px] mx-auto bg-white shadow-2xl rounded-[40px] border border-slate-200 p-8 md:p-16 min-h-[1000px] flex flex-col">
          {/* Order Header */}
          <div className="flex justify-between items-start mb-16 border-b-4 border-indigo-900 pb-10">
            <div>
              <h1 className="text-5xl font-black uppercase tracking-tighter text-slate-900 leading-none mb-4">{state.branding.header}</h1>
              <div className="text-xs font-bold text-slate-400 tracking-widest uppercase italic">Project Draft — Reference: {formData.id}</div>
            </div>
            <div className="text-right space-y-2">
              <div className="text-3xl font-black text-slate-200 uppercase tracking-[0.2em] mb-4">Sales Order</div>
              <div className="flex flex-col gap-2 items-end">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pipeline Status</label>
                <select 
                  className="p-2 bg-indigo-50 border border-indigo-100 rounded-xl text-xs font-black uppercase text-indigo-700 outline-none"
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

          {/* Client Selection */}
          <div className="grid md:grid-cols-2 gap-16 mb-16">
            <div className="relative">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6 border-b border-slate-100 pb-2">Client Contact</p>
              <input 
                placeholder="Search or select customer..."
                className="w-full text-2xl font-black text-slate-900 outline-none placeholder:text-slate-200"
                value={customerSearch}
                onChange={e => {
                  setCustomerSearch(e.target.value);
                  setShowSuggestions(true);
                  if (e.target.value === '') setFormData({ ...formData, customerId: '' });
                }}
                onFocus={() => setShowSuggestions(true)}
              />
              {showSuggestions && filteredCustomers.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-2 bg-white shadow-2xl rounded-2xl border border-slate-200 z-[110] overflow-hidden max-h-60 overflow-y-auto">
                  {filteredCustomers.map(c => (
                    <div 
                      key={c.id} 
                      onClick={() => {
                        setFormData({ ...formData, customerId: c.id });
                        setCustomerSearch(c.name);
                        setShowSuggestions(false);
                      }}
                      className="p-4 hover:bg-indigo-50 cursor-pointer border-b border-slate-50 flex flex-col"
                    >
                      <span className="font-bold text-slate-800">{c.name}</span>
                      <span className="text-xs text-slate-400">{c.email || 'No email contact'}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6 border-b border-slate-100 pb-2">Business Record</p>
              <div className="text-sm text-slate-600 space-y-1">
                <p className="font-black text-slate-900">{state.branding.header}</p>
                <p className="font-bold text-sky-600">{state.branding.email}</p>
                <p className="text-xs text-slate-400">Order Generated: {formData.created}</p>
              </div>
            </div>
          </div>

          {/* Detailed Materials Calculator */}
          <div className="bg-indigo-50/50 rounded-3xl p-8 border border-indigo-100 mb-12 shadow-sm relative overflow-hidden group hover:border-indigo-300 transition-all">
            <h3 className="text-xs font-black text-indigo-500 uppercase tracking-[0.2em] mb-8 border-b border-indigo-200 pb-4">Materials Calculator</h3>
            
            <div className="grid grid-cols-3 gap-8 mb-8">
              <div>
                <label className="block text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2">Length (In)</label>
                <input 
                  type="number"
                  className="w-full p-4 bg-white border border-indigo-100 rounded-2xl text-lg font-black outline-none focus:ring-2 focus:ring-indigo-500"
                  value={formData.matLength || ''}
                  onChange={e => setFormData({...formData, matLength: Number(e.target.value)})}
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2">Width (In)</label>
                <input 
                  type="number"
                  className="w-full p-4 bg-white border border-indigo-100 rounded-2xl text-lg font-black outline-none focus:ring-2 focus:ring-indigo-500"
                  value={formData.matWidth || ''}
                  onChange={e => setFormData({...formData, matWidth: Number(e.target.value)})}
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2">Pieces</label>
                <input 
                  type="number"
                  className="w-full p-4 bg-white border border-indigo-100 rounded-2xl text-lg font-black outline-none focus:ring-2 focus:ring-indigo-500"
                  value={formData.matPieces || ''}
                  onChange={e => setFormData({...formData, matPieces: Number(e.target.value)})}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8 py-6 border-t border-indigo-200/50">
               <div>
                 <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Estimated Solder</p>
                 <p className="text-xl font-black text-slate-700">{formatCurrency(materialBreakdown.solder)}</p>
               </div>
               <div>
                 <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Estimated Foil</p>
                 <p className="text-xl font-black text-slate-700">{formatCurrency(materialBreakdown.foil)}</p>
               </div>
            </div>

            <div className="flex justify-between items-center pt-8 border-t-2 border-indigo-200">
              <span className="text-sm font-black text-slate-900 uppercase tracking-[0.2em]">DIRECT MATERIALS SUBTOTAL</span>
              <span className="text-3xl font-black text-indigo-600 tabular-nums">{formatCurrency(materialBreakdown.total)}</span>
            </div>
          </div>

          {/* Line Items */}
          <div className="flex-1 space-y-4">
            <div className="flex justify-between items-center px-4 mb-4">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Project Line Items</h3>
              <button onClick={addItem} className="px-4 py-2 bg-indigo-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all">+ Add Entry</button>
            </div>

            <table className="w-full border-collapse">
              <thead>
                <tr className="text-left text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">
                  <th className="py-4 px-2 w-16">Acct</th>
                  <th className="py-4 px-4">Description</th>
                  <th className="py-4 px-4 w-24 text-center">Qty</th>
                  <th className="py-4 px-4 w-32 text-right">Price</th>
                  <th className="py-4 px-4 w-32 text-right">Total</th>
                  <th className="py-4 px-2 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {(formData.items || []).map((item, idx) => (
                  <tr key={idx} className="group">
                    <td className="py-4 px-2">
                      <select 
                        className="w-full text-xs font-bold text-slate-400 bg-transparent outline-none appearance-none"
                        value={item.account}
                        onChange={e => updateItem(idx, 'account', e.target.value)}
                      >
                        {state.accountCodes.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
                      </select>
                    </td>
                    <td className="py-4 px-4">
                      <input 
                        className="w-full font-bold text-slate-800 bg-transparent outline-none focus:bg-slate-50 rounded p-1"
                        placeholder="Project Details..."
                        value={item.desc}
                        onChange={e => updateItem(idx, 'desc', e.target.value)}
                      />
                    </td>
                    <td className="py-4 px-4 text-center">
                      <input 
                        type="number"
                        className="w-16 font-black text-slate-600 bg-transparent text-center outline-none focus:bg-slate-50 rounded p-1"
                        value={item.qty || ''}
                        onChange={e => updateItem(idx, 'qty', Number(e.target.value))}
                      />
                    </td>
                    <td className="py-4 px-4 text-right">
                      <input 
                        type="number"
                        className="w-24 font-black text-indigo-600 bg-transparent text-right outline-none focus:bg-slate-50 rounded p-1"
                        value={item.price || ''}
                        onChange={e => updateItem(idx, 'price', Number(e.target.value))}
                      />
                    </td>
                    <td className="py-4 px-4 text-right font-black tabular-nums">
                      {formatCurrency(item.qty * item.price)}
                    </td>
                    <td className="py-4 px-2 text-right">
                      <button onClick={() => removeItem(idx)} className="text-rose-200 hover:text-rose-600 font-black opacity-0 group-hover:opacity-100 transition-all">×</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals Section */}
          <div className="mt-12 flex justify-end">
            <div className="w-80 space-y-4 bg-indigo-900 text-white p-10 rounded-[40px] shadow-2xl shadow-indigo-200">
               <div className="flex justify-between items-center text-xs opacity-50 font-bold uppercase tracking-widest">
                 <span>Materials</span>
                 <span className="font-mono">{formatCurrency(materialBreakdown.total)}</span>
               </div>
               <div className="flex justify-between items-center text-xs opacity-50 font-bold uppercase tracking-widest">
                 <span>Items Subtotal</span>
                 <span className="font-mono">{formatCurrency((formData.items || []).reduce((s,i) => s + (i.qty * i.price), 0))}</span>
               </div>
               <div className="h-px bg-white/10 my-4"></div>
               <div className="flex justify-between items-center">
                 <span className="text-xl font-black uppercase tracking-tighter">Est. Total</span>
                 <span className="text-3xl font-black font-mono text-sky-400">{formatCurrency(totals.total)}</span>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderManager;
