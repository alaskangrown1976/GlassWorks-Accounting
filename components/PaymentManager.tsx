
import React, { useState } from 'react';
import { AppState, Payment } from '../types';
import { formatCurrency, getInvoiceBalance } from '../utils/calculations';

interface PaymentManagerProps {
  state: AppState;
  // Added allowUndo parameter
  updateState: (updater: (prev: AppState) => AppState, allowUndo?: boolean) => void;
  // Added onUndo parameter and updated return type
  flashToast: (msg: string, onUndo?: () => void) => void;
  // Added onUndo prop
  onUndo?: () => void;
}

const PaymentManager: React.FC<PaymentManagerProps> = ({ state, updateState, flashToast, onUndo }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState<Partial<Payment>>({
    date: new Date().toISOString().split('T')[0],
    method: 'Check',
    amount: 0,
    invoiceId: ''
  });

  // Combine manual payments and debit line payments for a full audit trail
  const allPayments = [
    ...state.payments.map(p => ({ ...p, type: 'Manual' })),
    ...state.invoices.flatMap(inv => inv.items
      .filter(i => i.account.startsWith('30'))
      .map((item, idx) => ({
        id: `${inv.id}-debit-${idx}`,
        invoiceId: inv.id,
        amount: Math.abs(item.qty * item.price),
        method: state.accountCodes.find(c => c.code === item.account)?.name || item.account,
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

    flashToast(`Payment of ${formatCurrency(Number(form.amount))} recorded for Invoice #${form.invoiceId}`);
    setIsAdding(false);
    setForm({
      date: new Date().toISOString().split('T')[0],
      method: 'Check',
      amount: 0,
      invoiceId: ''
    });
  };

  const handleDelete = (id: string, type: string) => {
    if (type !== 'Manual') return;
    if (!confirm('Are you sure you want to delete this recorded payment? This will increase the outstanding balance of the linked invoice.')) return;
    // Enabled undo for deletion
    updateState(prev => ({
      ...prev,
      payments: prev.payments.filter(p => p.id !== id)
    }), true);
    flashToast('Payment record removed', onUndo);
  };

  const unpaidInvoices = state.invoices.filter(i => getInvoiceBalance(i, state.payments) > 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Payment Ledger</h2>
          <p className="text-slate-500">Manual reconciliations and automated line-item credits</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="px-6 py-2.5 bg-teal-600 text-white rounded-xl font-bold shadow-lg hover:bg-teal-500 transition-all flex items-center gap-2"
        >
          <span>💰</span> Record Manual Payment
        </button>
      </div>

      <div className="glass overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-black text-slate-400 uppercase tracking-widest">
                <th className="px-6 py-4">Invoice / Customer</th>
                <th className="px-6 py-4">Method & Details</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4 text-right">Source</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {allPayments.map(p => {
                const inv = state.invoices.find(i => i.id === p.invoiceId);
                const customer = state.customers.find(c => c.id === inv?.customerId) || inv?.manualCustomer;
                return (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-mono text-sm font-bold text-sky-700">#{p.invoiceId}</p>
                      <p className="text-xs text-slate-500 font-medium">{customer?.name || 'Manual Customer'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-800">{p.method}</p>
                      {p.note && <p className="text-xs text-slate-400 italic mt-0.5 max-w-[200px] truncate">{p.note}</p>}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500 font-medium">{p.date}</td>
                    <td className="px-6 py-4 font-black text-emerald-600">{formatCurrency(p.amount)}</td>
                    <td className="px-6 py-4 text-right">
                      <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-md ${
                        p.type === 'Manual' ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' : 'bg-amber-50 text-amber-600 border border-amber-100'
                      }`}>
                        {p.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {p.type === 'Manual' && (
                        <button 
                          onClick={() => handleDelete(p.id, p.type)}
                          className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete Payment"
                        >
                          🗑️
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {allPayments.length === 0 && (
          <div className="p-16 text-center">
            <div className="text-4xl mb-4">📂</div>
            <p className="text-slate-400 italic">No payments recorded. Link payments to invoices to track business health.</p>
          </div>
        )}
      </div>

      {isAdding && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-2xl font-black text-slate-800">Record Manual Payment</h3>
                <p className="text-sm text-slate-500 font-medium">Link cash, check, or digital payments to invoices</p>
              </div>
              <button onClick={() => setIsAdding(false)} className="text-slate-300 hover:text-slate-500 text-2xl font-black">×</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Select Target Invoice</label>
                <select 
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-teal-500 font-bold appearance-none"
                  value={form.invoiceId}
                  onChange={e => {
                    const inv = state.invoices.find(i => i.id === e.target.value);
                    const bal = inv ? getInvoiceBalance(inv, state.payments) : 0;
                    setForm({ ...form, invoiceId: e.target.value, amount: bal });
                  }}
                  required
                >
                  <option value="">Choose an outstanding invoice...</option>
                  {unpaidInvoices.map(inv => {
                    const cust = state.customers.find(c => c.id === inv.customerId) || inv.manualCustomer;
                    return (
                      <option key={inv.id} value={inv.id}>
                        #{inv.id} - {cust?.name} (Owes {formatCurrency(getInvoiceBalance(inv, state.payments))})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Payment Amount</label>
                  <div className="relative">
                    <span className="absolute left-4 top-4 text-slate-400 font-bold">$</span>
                    <input 
                      type="number"
                      step="0.01"
                      placeholder="0.00" 
                      required 
                      className="w-full p-4 pl-8 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-teal-500 font-black text-emerald-600"
                      value={form.amount || ''}
                      onChange={e => setForm({ ...form, amount: Number(e.target.value) })}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Date Received</label>
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
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Payment Method</label>
                <div className="grid grid-cols-3 gap-2">
                  {['Check', 'Cash', 'Venmo', 'PayPal', 'Wire', 'Other'].map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setForm({ ...form, method: m })}
                      className={`py-3 rounded-xl text-xs font-black uppercase tracking-widest border transition-all ${
                        form.method === m 
                        ? 'bg-slate-900 text-white border-slate-900 shadow-lg scale-105' 
                        : 'bg-white text-slate-400 border-slate-200 hover:border-slate-400'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Memo / Notes</label>
                <textarea 
                  placeholder="Check number, transaction ID, or general note..." 
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-teal-500"
                  rows={2}
                  value={form.note || ''}
                  onChange={e => setForm({ ...form, note: e.target.value })}
                />
              </div>

              <div className="flex gap-3 pt-6">
                <button type="button" onClick={() => setIsAdding(false)} className="flex-1 py-4 text-slate-500 font-bold hover:bg-slate-50 rounded-2xl transition-colors">Cancel</button>
                <button type="submit" className="flex-1 py-4 bg-teal-600 text-white font-bold rounded-2xl shadow-xl shadow-teal-100 hover:bg-teal-700 transition-all">Apply to Invoice</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentManager;
