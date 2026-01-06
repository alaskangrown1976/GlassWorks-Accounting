
import React, { useState } from 'react';
import { AppState, Invoice, LineItem } from '../types';
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
  const [isAdding, setIsAdding] = useState(false);

  const handleDelete = (id: string) => {
    if (!confirm('Are you sure you want to delete this invoice?')) return;
    updateState(prev => ({
      ...prev,
      invoices: prev.invoices.filter(i => i.id !== id),
      payments: prev.payments.filter(p => p.invoiceId !== id)
    }), true);
    flashToast('Invoice deleted');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Invoices</h2>
          <p className="text-slate-500">Billing and receivables management</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="px-6 py-2.5 bg-sky-600 text-white rounded-xl font-bold shadow-lg hover:bg-sky-500 transition-all flex items-center gap-2"
        >
          <span>📄</span> New Invoice
        </button>
      </div>

      <div className="glass overflow-hidden rounded-3xl border border-slate-200 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-black text-slate-400 uppercase tracking-widest">
                <th className="px-6 py-4">ID</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Total</th>
                <th className="px-6 py-4">Balance</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {state.invoices.map(inv => {
                const customer = state.customers.find(c => c.id === inv.customerId);
                const balance = getInvoiceBalance(inv, state.payments);
                return (
                  <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-sm text-slate-400 tracking-tighter">#{inv.id}</td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-800">{customer?.name || inv.manualCustomer?.name || 'Unknown'}</p>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{inv.created}</p>
                    </td>
                    <td className="px-6 py-4 font-black text-slate-900 tabular-nums">{formatCurrency(calculateDocTotals(inv.items, inv.meta).total)}</td>
                    <td className="px-6 py-4 font-black text-amber-600 tabular-nums">{formatCurrency(balance)}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                        balance === 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {balance === 0 ? 'Paid' : 'Pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-1">
                      <button 
                        onClick={() => onPrint(inv)}
                        className="p-2 text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
                        title="Print"
                      >
                        🖨️
                      </button>
                      <button 
                        onClick={() => handleDelete(inv.id)} 
                        className="p-2 text-rose-400 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {state.invoices.length === 0 && (
          <div className="p-16 text-center text-slate-400">
            <div className="text-4xl mb-4 opacity-20">📂</div>
            <p className="font-bold">No invoices found.</p>
            <p className="text-sm">Create your first one to get started.</p>
          </div>
        )}
      </div>

      {isAdding && (
        <InvoiceForm 
          onClose={() => setIsAdding(false)} 
          state={state} 
          updateState={updateState} 
          flashToast={flashToast}
        />
      )}
    </div>
  );
};

const InvoiceForm: React.FC<{ 
  onClose: () => void; 
  state: AppState; 
  updateState: (u: (p: AppState) => AppState) => void;
  flashToast: (m: string) => void;
}> = ({ onClose, state, updateState, flashToast }) => {
  const [customerId, setCustomerId] = useState('');
  const [items, setItems] = useState<LineItem[]>([{ account: state.accountCodes[0]?.code || '100', desc: '', qty: 1, price: 0 }]);
  const [due, setDue] = useState(new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId && !items.length) return;
    
    const seq = getNextInvoiceNumber(state.invoices);
    const newInvoice: Invoice = {
      id: String(seq),
      seq,
      customerId,
      status: 'Unpaid',
      created: new Date().toLocaleDateString(),
      due,
      items: items.filter(i => i.desc && i.qty > 0),
      meta: DOC_META_DEFAULTS
    };

    updateState(prev => ({ ...prev, invoices: [...prev.invoices, newInvoice] }));
    flashToast('Invoice created');
    onClose();
  };

  const addItem = () => {
    const defaultCode = state.accountCodes[0];
    setItems([...items, { account: defaultCode?.code || '100', desc: '', qty: 1, price: defaultCode?.rate || 0 }]);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl p-10 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h3 className="text-2xl font-black text-slate-800 tracking-tight uppercase tracking-widest">New Invoice</h3>
            <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">Billing Record #{getNextInvoiceNumber(state.invoices)}</p>
          </div>
          <button onClick={onClose} className="text-slate-300 hover:text-slate-500 text-3xl font-black transition-colors">×</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Bill To Client</label>
              <select 
                value={customerId} 
                onChange={(e) => setCustomerId(e.target.value)}
                className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-sky-500 focus:outline-none font-bold appearance-none"
                required
              >
                <option value="">Choose a client...</option>
                {state.customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Payment Due Date</label>
              <input 
                type="date" 
                value={due} 
                onChange={(e) => setDue(e.target.value)}
                className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-sky-500 focus:outline-none font-bold"
                required
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Line Item Breakdown</label>
              <button type="button" onClick={addItem} className="text-[10px] font-black text-sky-600 uppercase tracking-widest hover:text-sky-500">+ Add Line</button>
            </div>
            
            <div className="space-y-3">
              {items.map((item, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-3 items-center group animate-in fade-in slide-in-from-right-2 duration-300">
                  <div className="col-span-2">
                     <select 
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest"
                      value={item.account}
                      onChange={(e) => {
                        const code = state.accountCodes.find(c => c.code === e.target.value);
                        const next = [...items];
                        next[idx].account = e.target.value;
                        if (code?.rate) next[idx].price = code.rate;
                        setItems(next);
                      }}
                     >
                       {state.accountCodes.map(c => <option key={c.code} value={c.code}>{c.code} - {c.name}</option>)}
                     </select>
                  </div>
                  <input 
                    className="col-span-5 p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:border-sky-500 focus:outline-none"
                    placeholder="Description (e.g. Solder, Skilled Labor)"
                    value={item.desc}
                    onChange={(e) => {
                      const next = [...items];
                      next[idx].desc = e.target.value;
                      setItems(next);
                    }}
                    required
                  />
                  <input 
                    type="number"
                    min="1"
                    className="col-span-2 p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black tabular-nums focus:border-sky-500 focus:outline-none text-center"
                    placeholder="Qty"
                    value={item.qty || ''}
                    onChange={(e) => {
                      const next = [...items];
                      next[idx].qty = Number(e.target.value);
                      setItems(next);
                    }}
                  />
                  <input 
                    type="number"
                    min="0"
                    step="0.01"
                    className="col-span-2 p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black tabular-nums focus:border-sky-500 focus:outline-none text-right text-emerald-600"
                    placeholder="Price"
                    value={item.price || ''}
                    onChange={(e) => {
                      const next = [...items];
                      next[idx].price = Number(e.target.value);
                      setItems(next);
                    }}
                  />
                  <button 
                    type="button" 
                    onClick={() => setItems(items.filter((_, i) => i !== idx))}
                    className="col-span-1 text-rose-300 hover:text-rose-600 font-black text-2xl transition-colors"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-10 border-t border-slate-100 flex justify-end gap-4">
            <button type="button" onClick={onClose} className="px-8 py-4 text-slate-500 font-bold hover:bg-slate-50 rounded-2xl transition-colors">Cancel</button>
            <button type="submit" className="px-10 py-4 bg-slate-900 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all">Create Invoice</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InvoiceManager;
