
import React, { useState } from 'react';
import { AppState, Customer } from '../types';

interface CustomerManagerProps {
  state: AppState;
  updateState: (updater: (prev: AppState) => AppState, allowUndo?: boolean) => void;
  flashToast: (msg: string, onUndo?: () => void) => void;
  onUndo?: () => void;
}

const CustomerManager: React.FC<CustomerManagerProps> = ({ state, updateState, flashToast, onUndo }) => {
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

  const handleDelete = (id: string) => {
    if (!confirm('Are you sure? This will not remove their historical documents.')) return;
    updateState(prev => ({ ...prev, customers: prev.customers.filter(c => c.id !== id) }), true);
    flashToast('Customer deleted');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Customers</h2>
          <p className="text-slate-500">Directory and contact management</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-bold shadow-lg hover:bg-emerald-500 transition-all flex items-center gap-2"
        >
          <span>👤</span> Add Customer
        </button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {state.customers.map(c => (
          <div key={c.id} className="glass p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4 relative group hover:border-emerald-200 transition-all">
            <button 
              onClick={() => handleDelete(c.id)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-rose-50 text-rose-300 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-all"
            >
              🗑️
            </button>
            <div>
              <h3 className="text-xl font-black text-slate-800 tracking-tight">{c.name}</h3>
              <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Active Client</p>
            </div>
            <div className="space-y-2 text-sm text-slate-600 font-medium">
              <p className="flex items-center gap-3 bg-slate-50 p-2 rounded-lg truncate">
                <span className="opacity-40">📧</span> {c.email || 'No email'}
              </p>
              <p className="flex items-center gap-3 bg-slate-50 p-2 rounded-lg">
                <span className="opacity-40">📱</span> {c.phone || 'No phone'}
              </p>
              <p className="flex items-center gap-3 bg-slate-50 p-2 rounded-lg">
                <span className="opacity-40">📍</span> {c.address || 'No address'}
              </p>
            </div>
          </div>
        ))}
        {state.customers.length === 0 && (
          <div className="sm:col-span-2 lg:col-span-3 p-24 text-center glass rounded-3xl border-dashed border-2 border-slate-200 text-slate-400">
            <div className="text-4xl mb-4 opacity-20">👥</div>
            <p className="font-bold">No customers listed.</p>
            <p className="text-sm">Add your first customer to begin billing.</p>
          </div>
        )}
      </div>

      {isAdding && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-8 animate-in zoom-in-95 duration-200">
            <h3 className="text-2xl font-black text-slate-800 mb-8">New Customer</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Name</label>
                <input 
                  placeholder="Business/Customer Name" 
                  required 
                  className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-emerald-500 focus:outline-none font-bold"
                  value={form.name || ''}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Email</label>
                <input 
                  type="email"
                  placeholder="email@example.com" 
                  className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-emerald-500 focus:outline-none font-bold"
                  value={form.email || ''}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Phone</label>
                <input 
                  placeholder="(000) 000-0000" 
                  className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-emerald-500 focus:outline-none font-bold font-mono"
                  value={form.phone || ''}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Address</label>
                <textarea 
                  placeholder="Postal Address" 
                  className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-emerald-500 focus:outline-none font-bold"
                  rows={3}
                  value={form.address || ''}
                  onChange={e => setForm({ ...form, address: e.target.value })}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsAdding(false)} className="flex-1 py-4 text-slate-500 font-bold hover:bg-slate-50 rounded-2xl transition-colors">Cancel</button>
                <button type="submit" className="flex-1 py-4 bg-slate-900 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all">Save Client</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerManager;
