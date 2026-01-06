
import React, { useState } from 'react';
import { AppState, Payment, Invoice } from '../types';
import { formatCurrency, getInvoiceBalance } from '../utils/calculations';

interface PaymentManagerProps {
  state: AppState;
  updateState: (updater: (prev: AppState) => AppState) => void;
  flashToast: (msg: string) => void;
}

const PaymentManager: React.FC<PaymentManagerProps> = ({ state, updateState, flashToast }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState<Partial<Payment>>({
    date: new Date().toISOString().split('T')[0],
    method: 'Cash',
    amount: 0,
    invoiceId: ''
  });

  // Combine manual payments and debit line payments
  const allPayments = [
    ...state.payments.map(p => ({ ...p, type: 'Manual' })),
    ...state.invoices.flatMap(inv => inv.items
      .filter(i => i.account.startsWith('30'))
      .map((item, idx) => ({
        id: `${inv.id}-debit-${idx}`,
        invoiceId: inv.id,
        amount: Math.abs(item.qty * item.price),
        method: item.account,
        date: inv.created,
        note: item.desc,
        type: 'Line'
      }))
    )
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.invoiceId || !form.amount) return;

    const newPayment: Payment = {
      id: crypto.randomUUID(),
      invoiceId: form.invoiceId,
      amount: Number(form.amount),
      method: form.method || 'Other',
      date: form.date || new Date().toISOString().split('T')[0],
      note: form.note || ''
    };

    updateState(prev => ({
      ...prev,
      payments: [...prev.payments, newPayment]
    }));

    flashToast('Payment recorded and linked to invoice');
    setIsAdding(false);
    setForm({
      date: new Date().toISOString().split('T')[0],
      method: 'Cash',
      amount: 0,
      invoiceId: ''
    });
  };

  const handleDelete = (id: string, type: string) => {
    if (type !== 'Manual') return;
    if (!confirm('Are you sure you want to delete this recorded payment?')) return;
    updateState(prev => ({
      ...prev,
      payments: prev.payments.filter(p => p.id !== id)
    }));
    flashToast('Payment record removed');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Payments</h2>
          <p className="text-slate-500">Complete transaction history and reconciliations</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="px-6 py-2.5 bg-teal-600 text-white rounded-xl font-bold shadow-lg hover:bg-teal-500 transition-all"
        >
          Record Payment
        </button>
      </div>

      <div className="glass overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-xs font-black text-slate-400 uppercase tracking-widest">
              <th className="px-6 py-4">Invoice</th>
              <th className="px-6 py-4">Method</th>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Amount</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {allPayments.map(p => {
              const customer = state.customers.find(c => {
                 const inv = state.invoices.find(i => i.id === p.invoiceId);
                 return c.id === inv?.customerId;
              });
              return (
                <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-mono text-sm">#{p.invoiceId}</p>
                    <p className="text-xs text-slate-400">{customer?.name || 'Customer'}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-slate-800">{p.method}</p>
                    <p className="text-xs text-slate-400 italic">{p.note}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500 font-medium">{p.date}</td>
                  <td className="px-6 py-4 font-black text-emerald-600">{formatCurrency(p.amount)}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-md ${
                        p.type === 'Manual' ? 'bg-indigo-50 text-indigo-600' : 'bg-amber-50 text-amber-600'
                      }`}>
                        {p.type}
                      </span>
                      {p.type === 'Manual' && (
                        <button 
                          onClick={() => handleDelete(p.id, p.type)}
                          className="text-rose-400 hover:text-rose-600 transition-colors"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {allPayments.length === 0 && (
          <div className="p-12 text-center text-slate-400 italic">No payments recorded yet.</div>
        )}
      </div>

      {isAdding && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-8 max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-black text-slate-800 mb-8">Record Manual Payment</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Target Invoice</label>
                <select 
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-teal-500 font-bold"
                  value={form.invoiceId}
                  onChange={e => {
                    const inv = state.invoices.find(i => i.id === e.target.value);
                    const bal = inv ? getInvoiceBalance(inv, state.payments) : 0;
                    setForm({ ...form, invoiceId: e.target.value, amount: bal });
                  }}
                  required
                >
                  <option value="">Select Invoice</option>
                  {state.invoices.filter(i => getInvoiceBalance(i, state.payments) > 0).map(inv => {
                    const cust = state.customers.find(c => c.id === inv.customerId);
                    return <option key={inv.id} value={inv.id}>#{inv.id} - {cust?.name} ({formatCurrency(getInvoiceBalance(inv, state.payments))})</option>;
                  })}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Amount</label>
                  <input 
                    type="number"
                    step="0.01"
                    placeholder="0.00" 
                    required 
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-teal-500 font-black text-emerald-600"
                    value={form.amount || ''}
                    onChange={e => setForm({ ...form, amount: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Date</label>
                  <input 
                    type="date" 
                    required 
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-teal-500"
                    value={form.date}
                    onChange={e => setForm({ ...form, date: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Method</label>
                <select 
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold"
                  value={form.method}
                  onChange={e => setForm({ ...form, method: e.target.value })}
                >
                  <option>Cash</option>
                  <option>Check</option>
                  <option>Venmo</option>
                  <option>PayPal</option>
                  <option>Bank Transfer</option>
                  <option>Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Note (Optional)</label>
                <textarea 
                  placeholder="Check number, reference info..." 
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-teal-500"
                  rows={2}
                  value={form.note || ''}
                  onChange={e => setForm({ ...form, note: e.target.value })}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsAdding(false)} className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-2xl">Cancel</button>
                <button type="submit" className="flex-1 py-3 bg-teal-600 text-white font-bold rounded-2xl shadow-xl">Apply Payment</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentManager;
