
import React, { useState } from 'react';
import { AppState, Expense } from '../types';
import { formatCurrency } from '../utils/calculations';

interface ExpenseManagerProps {
  state: AppState;
  // Added allowUndo parameter
  updateState: (updater: (prev: AppState) => AppState, allowUndo?: boolean) => void;
  // Added onUndo parameter and updated return type
  flashToast: (msg: string, onUndo?: () => void) => void;
  // Added onUndo prop
  onUndo?: () => void;
}

const ExpenseManager: React.FC<ExpenseManagerProps> = ({ state, updateState, flashToast, onUndo }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState<Partial<Expense>>({
    date: new Date().toISOString().split('T')[0],
    category: 'Supplies'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.amount || !form.vendor) return;
    
    const newExp: Expense = {
      id: crypto.randomUUID(),
      vendor: form.vendor,
      amount: Number(form.amount),
      date: form.date || '',
      category: form.category || 'Misc',
      note: form.note || ''
    };

    updateState(prev => ({ ...prev, expenses: [...prev.expenses, newExp] }));
    flashToast('Expense logged');
    setIsAdding(false);
    setForm({ date: new Date().toISOString().split('T')[0], category: 'Supplies' });
  };

  const handleDelete = (id: string) => {
    // Enabled undo for deletion
    updateState(prev => ({ ...prev, expenses: prev.expenses.filter(ex => ex.id !== id) }), true);
    flashToast('Expense removed', onUndo);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Expenses</h2>
          <p className="text-slate-500">Track studio overhead and materials</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="px-6 py-2.5 bg-rose-600 text-white rounded-xl font-bold shadow-lg hover:bg-rose-500 transition-all"
        >
          Log Expense
        </button>
      </div>

      <div className="glass overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-xs font-black text-slate-400 uppercase tracking-widest">
              <th className="px-6 py-4">Vendor / Description</th>
              <th className="px-6 py-4">Category</th>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Amount</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {state.expenses.map(e => (
              <tr key={e.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4">
                  <p className="font-bold text-slate-800">{e.vendor}</p>
                  <p className="text-xs text-slate-400 italic">{e.note}</p>
                </td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-md text-[10px] font-black uppercase tracking-widest">
                    {e.category}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-slate-500 font-medium">{e.date}</td>
                <td className="px-6 py-4 font-black text-rose-600">{formatCurrency(e.amount)}</td>
                <td className="px-6 py-4 text-right">
                  <button 
                    onClick={() => handleDelete(e.id)}
                    className="text-xs font-bold text-rose-500 hover:text-rose-700"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isAdding && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-8">
            <h3 className="text-2xl font-black text-slate-800 mb-8">Log Expense</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input 
                  type="date" 
                  required 
                  className="p-4 bg-slate-50 border border-slate-200 rounded-2xl"
                  value={form.date}
                  onChange={e => setForm({ ...form, date: e.target.value })}
                />
                <select 
                  className="p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold"
                  value={form.category}
                  onChange={e => setForm({ ...form, category: e.target.value })}
                >
                  <option>Supplies</option>
                  <option>Rent</option>
                  <option>Utilities</option>
                  <option>Travel</option>
                  <option>Marketing</option>
                  <option>Misc</option>
                </select>
              </div>
              <input 
                placeholder="Vendor / Payee" 
                required 
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl"
                value={form.vendor || ''}
                onChange={e => setForm({ ...form, vendor: e.target.value })}
              />
              <input 
                placeholder="Amount (Numeric)" 
                type="number"
                required 
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-rose-600"
                value={form.amount || ''}
                onChange={e => setForm({ ...form, amount: Number(e.target.value) })}
              />
              <textarea 
                placeholder="Notes / Itemization" 
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl"
                rows={2}
                value={form.note || ''}
                onChange={e => setForm({ ...form, note: e.target.value })}
              />
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsAdding(false)} className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-2xl">Cancel</button>
                <button type="submit" className="flex-1 py-3 bg-rose-600 text-white font-bold rounded-2xl shadow-xl">Log Expense</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpenseManager;
