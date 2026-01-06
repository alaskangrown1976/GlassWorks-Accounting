
import React, { useState } from 'react';
import { AppState, Invoice, LineItem } from '../types';
import { calculateDocTotals, formatCurrency, getInvoiceBalance, getNextInvoiceNumber } from '../utils/calculations';
import { DOC_META_DEFAULTS } from '../constants';

interface InvoiceManagerProps {
  state: AppState;
  updateState: (updater: (prev: AppState) => AppState) => void;
  flashToast: (msg: string) => void;
  onPrint: (invoice: Invoice) => void;
}

const InvoiceManager: React.FC<InvoiceManagerProps> = ({ state, updateState, flashToast, onPrint }) => {
  const [isAdding, setIsAdding] = useState(false);

  const handleDelete = (id: string) => {
    if (!confirm('Are you sure you want to delete this invoice?')) return;
    updateState(prev => ({
      ...prev,
      invoices: prev.invoices.filter(i => i.id !== id),
      payments: prev.payments.filter(p => p.invoiceId !== id)
    }));
    flashToast('Invoice deleted');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Invoices</h2>
          <p className="text-slate-500">Billing and receivables management</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="px-6 py-2.5 bg-sky-600 text-white rounded-xl font-bold shadow-lg hover:bg-sky-500 transition-all"
        >
          Create New Invoice
        </button>
      </div>

      <div className="glass overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
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
                  <td className="px-6 py-4 font-mono text-sm">#{inv.id}</td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-slate-800">{customer?.name || inv.manualCustomer?.name || 'Unknown'}</p>
                    <p className="text-xs text-slate-400">{inv.created}</p>
                  </td>
                  <td className="px-6 py-4 font-bold">{formatCurrency(calculateDocTotals(inv.items, inv.meta).total)}</td>
                  <td className="px-6 py-4 font-bold text-amber-600">{formatCurrency(balance)}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      balance === 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {balance === 0 ? 'Paid' : 'Pending'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button 
                      onClick={() => onPrint(inv)}
                      className="text-xs font-bold text-sky-600 hover:text-sky-800"
                    >
                      Print
                    </button>
                    <button onClick={() => handleDelete(inv.id)} className="text-xs font-bold text-rose-600 hover:text-rose-800">Delete</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {state.invoices.length === 0 && (
          <div className="p-12 text-center text-slate-400 italic">No invoices found. Create your first one to get started.</div>
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
      <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl p-8 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-2xl font-black text-slate-800">New Invoice</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl font-black">×</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Customer</label>
              <select 
                value={customerId} 
                onChange={(e) => setCustomerId(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 font-bold"
                required
              >
                <option value="">Select Customer</option>
                {state.customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Due Date</label>
              <input 
                type="date" 
                value={due} 
                onChange={(e) => setDue(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 font-bold"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">Line Items</label>
              <button type="button" onClick={addItem} className="text-xs font-bold text-sky-600">+ Add Line</button>
            </div>
            {items.map((item, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                <div className="col-span-2">
                   <select 
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold"
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
                  className="col-span-5 p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                  placeholder="Description"
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
                  className="col-span-2 p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
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
                  className="col-span-2 p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
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
                  className="col-span-1 text-rose-500 font-black text-xl text-center"
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-6 py-2.5 text-slate-500 font-bold">Cancel</button>
            <button type="submit" className="px-8 py-2.5 bg-slate-900 text-white rounded-xl font-bold shadow-xl">Save Invoice</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InvoiceManager;
