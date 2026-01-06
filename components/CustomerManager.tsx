
import React, { useState } from 'react';
import { AppState, Customer } from '../types';

interface CustomerManagerProps {
  state: AppState;
  updateState: (updater: (prev: AppState) => AppState) => void;
  flashToast: (msg: string) => void;
}

const CustomerManager: React.FC<CustomerManagerProps> = ({ state, updateState, flashToast }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState<Partial<Customer>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newCust: Customer = {
      id: crypto.randomUUID(),
      name: form.name || '',
      email: form.email || '',
      phone: form.phone || '',
      address: form.address || ''
    };
    updateState(prev => ({ ...prev, customers: [...prev.customers, newCust] }));
    flashToast('Customer added');
    setIsAdding(false);
    setForm({});
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Customers</h2>
          <p className="text-slate-500">Directory and contact management</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-bold shadow-lg hover:bg-emerald-500 transition-all"
        >
          Add Customer
        </button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {state.customers.map(c => (
          <div key={c.id} className="glass p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3 relative group">
            <button 
              onClick={() => updateState(p => ({ ...p, customers: p.customers.filter(cust => cust.id !== c.id) }))}
              className="absolute top-4 right-4 text-rose-300 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              ×
            </button>
            <h3 className="text-xl font-black text-slate-800 tracking-tight">{c.name}</h3>
            <div className="space-y-1 text-sm text-slate-500 font-medium">
              <p className="flex items-center gap-2">📧 {c.email || 'No email'}</p>
              <p className="flex items-center gap-2">📱 {c.phone || 'No phone'}</p>
              <p className="flex items-center gap-2">📍 {c.address || 'No address'}</p>
            </div>
          </div>
        ))}
        {state.customers.length === 0 && (
          <div className="sm:col-span-2 lg:col-span-3 p-24 text-center glass rounded-2xl border-dashed border-2 border-slate-200 text-slate-400">
            No customers listed. Add your first customer to begin billing.
          </div>
        )}
      </div>

      {isAdding && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-8">
            <h3 className="text-2xl font-black text-slate-800 mb-8">New Customer</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input 
                placeholder="Business/Customer Name" 
                required 
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500"
                value={form.name || ''}
                onChange={e => setForm({ ...form, name: e.target.value })}
              />
              <input 
                placeholder="Email Address" 
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500"
                value={form.email || ''}
                onChange={e => setForm({ ...form, email: e.target.value })}
              />
              <input 
                placeholder="Phone Number" 
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500"
                value={form.phone || ''}
                onChange={e => setForm({ ...form, phone: e.target.value })}
              />
              <textarea 
                placeholder="Postal Address" 
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500"
                rows={3}
                value={form.address || ''}
                onChange={e => setForm({ ...form, address: e.target.value })}
              />
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsAdding(false)} className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-2xl">Cancel</button>
                <button type="submit" className="flex-1 py-3 bg-slate-900 text-white font-bold rounded-2xl shadow-xl">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerManager;
