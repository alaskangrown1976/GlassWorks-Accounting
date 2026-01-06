
import React, { useState } from 'react';
import { AppState, AccountCode } from '../types';

interface SettingsManagerProps {
  state: AppState;
  updateState: (updater: (prev: AppState) => AppState) => void;
  flashToast: (msg: string) => void;
}

const SettingsManager: React.FC<SettingsManagerProps> = ({ state, updateState, flashToast }) => {
  const [isAddingCode, setIsAddingCode] = useState(false);
  const [newCode, setNewCode] = useState<Partial<AccountCode>>({ type: 'credit' });

  const handleAddCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode.code || !newCode.name) return;

    const code: AccountCode = {
      code: newCode.code,
      name: newCode.name,
      rate: newCode.rate || null,
      type: newCode.type as 'credit' | 'debit'
    };

    updateState(prev => ({
      ...prev,
      accountCodes: [...prev.accountCodes, code]
    }));

    flashToast(`Accounting code ${code.code} added`);
    setIsAddingCode(false);
    setNewCode({ type: 'credit' });
  };

  const deleteCode = (code: string) => {
    if (!confirm('Are you sure you want to remove this accounting code? This may affect historical items using this code.')) return;
    updateState(prev => ({
      ...prev,
      accountCodes: prev.accountCodes.filter(c => c.code !== code)
    }));
    flashToast('Code removed');
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Studio Settings</h2>
        <p className="text-slate-500">Manage business details and accounting configurations</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Accounting Codes */}
          <div className="glass p-8 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-slate-800">Accounting Codes</h3>
              <button 
                onClick={() => setIsAddingCode(true)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
              >
                + ADD CODE
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                    <th className="pb-4">Code</th>
                    <th className="pb-4">Name</th>
                    <th className="pb-4">Type</th>
                    <th className="pb-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {state.accountCodes.map(c => (
                    <tr key={c.code} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 font-mono font-bold text-sm text-sky-600">{c.code}</td>
                      <td className="py-4">
                        <p className="font-bold text-slate-800">{c.name}</p>
                        {c.rate && <p className="text-[10px] text-slate-400">Default Rate: ${c.rate}/hr</p>}
                      </td>
                      <td className="py-4">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest ${
                          c.type === 'credit' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                        }`}>
                          {c.type}
                        </span>
                      </td>
                      <td className="py-4 text-right">
                        <button 
                          onClick={() => deleteCode(c.code)}
                          className="text-xs font-bold text-rose-400 hover:text-rose-600"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Branding */}
          <div className="glass p-8 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-xl font-black text-slate-800 mb-6">Branding & Layout</h3>
            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Studio Header Name</label>
                <input 
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-sky-500"
                  value={state.branding.header}
                  onChange={e => updateState(p => ({ ...p, branding: { ...p.branding, header: e.target.value }}))}
                  placeholder="GlassWorks Studio"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Payment Notes Template</label>
                <textarea 
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-sky-500"
                  rows={3}
                  value={state.branding.payment}
                  onChange={e => updateState(p => ({ ...p, branding: { ...p.branding, payment: e.target.value }}))}
                  placeholder="We accept Check, Venmo, or Bank Transfer..."
                />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="glass p-8 rounded-2xl border border-indigo-100 bg-indigo-50/30">
            <h3 className="text-lg font-black text-indigo-800 mb-2">System Info</h3>
            <div className="space-y-4 text-sm font-medium text-indigo-700/70">
              <p>Total Customers: {state.customers.length}</p>
              <p>Total Invoices: {state.invoices.length}</p>
              <p>Currency: {state.settings.currency}</p>
              <p>Storage: Local Browser</p>
            </div>
          </div>
        </div>
      </div>

      {isAddingCode && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-8">
            <h3 className="text-2xl font-black text-slate-800 mb-8">New Accounting Code</h3>
            <form onSubmit={handleAddCode} className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-1">
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Code ID</label>
                  <input 
                    placeholder="101" 
                    required 
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-mono text-sky-600"
                    value={newCode.code || ''}
                    onChange={e => setNewCode({ ...newCode, code: e.target.value })}
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Code Name</label>
                  <input 
                    placeholder="Custom Sandblasting" 
                    required 
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl"
                    value={newCode.name || ''}
                    onChange={e => setNewCode({ ...newCode, name: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Rate (Optional)</label>
                  <input 
                    type="number"
                    placeholder="0.00" 
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl"
                    value={newCode.rate || ''}
                    onChange={e => setNewCode({ ...newCode, rate: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Type</label>
                  <select 
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold"
                    value={newCode.type}
                    onChange={e => setNewCode({ ...newCode, type: e.target.value as 'credit' | 'debit' })}
                  >
                    <option value="credit">Revenue (Credit)</option>
                    <option value="debit">Payment (Debit)</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsAddingCode(false)} className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-2xl">Cancel</button>
                <button type="submit" className="flex-1 py-3 bg-slate-900 text-white font-bold rounded-2xl shadow-xl">Create Code</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsManager;
