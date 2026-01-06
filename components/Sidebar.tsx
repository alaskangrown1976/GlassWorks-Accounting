
import React from 'react';
import { ViewType, AppState } from '../types';

interface SidebarProps {
  currentView: ViewType;
  setView: (view: ViewType) => void;
  state: AppState;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setView, state }) => {
  const links: { id: ViewType; label: string; icon: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'invoices', label: 'Invoices', icon: '📄' },
    { id: 'orders', label: 'Sales Orders', icon: '🛒' },
    { id: 'customers', label: 'Customers', icon: '👥' },
    { id: 'payments', label: 'Payments', icon: '💰' },
    { id: 'expenses', label: 'Expenses', icon: '📉' },
    { id: 'reports', label: 'Reports', icon: '📁' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
  ];

  const needsBackup = !state.lastBackup || 
    (Date.now() - new Date(state.lastBackup).getTime() > 1000 * 60 * 60 * 24 * 7);

  return (
    <aside className="hidden md:flex flex-col w-64 min-h-screen text-white bg-slate-950/70 backdrop-blur border-r border-slate-800/70 p-4 gap-6 no-print">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-sky-500 to-slate-700 shadow-lg flex items-center justify-center text-white font-bold text-lg">GW</div>
        <div>
          <p className="text-lg font-semibold tracking-tight">GlassWorks</p>
          <p className="text-[10px] uppercase font-black tracking-widest text-slate-500 leading-none mt-1">Stained Glass</p>
        </div>
      </div>
      
      <nav className="flex flex-col gap-1 text-sm">
        {links.map(link => (
          <button
            key={link.id}
            onClick={() => setView(link.id)}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
              currentView === link.id
                ? 'bg-sky-600 text-white shadow-lg shadow-sky-900/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <span className="text-lg group-hover:scale-110 transition-transform">{link.icon}</span>
            <span className="font-bold tracking-tight">{link.label}</span>
          </button>
        ))}
      </nav>

      <div className="mt-auto space-y-3">
        {needsBackup && (
          <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 animate-pulse">
            <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-1">Warning</p>
            <p className="text-xs text-rose-200 font-bold leading-tight">Backup Required: Your data is at risk.</p>
          </div>
        )}
        <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800/50">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">System Status</p>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
            <p className="text-xs font-bold text-slate-300">Local DB Active</p>
          </div>
          <p className="text-[10px] text-slate-500 font-medium">v4.0.2 Stable Release</p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
