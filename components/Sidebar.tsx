
import React from 'react';
import { ViewType } from '../types';

interface SidebarProps {
  currentView: ViewType;
  setView: (view: ViewType) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setView }) => {
  const links: { id: ViewType; label: string; icon: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'invoices', label: 'Invoices', icon: '📄' },
    { id: 'orders', label: 'Sales Orders', icon: '🛒' },
    { id: 'customers', label: 'Customers', icon: '👥' },
    { id: 'payments', label: 'Payments', icon: '💰' },
    { id: 'expenses', label: 'Expenses', icon: '📉' },
    { id: 'materials', label: 'Materials Calc', icon: '📐' },
    { id: 'reports', label: 'Reports', icon: '📁' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 min-h-screen text-white bg-slate-950/70 backdrop-blur border-r border-slate-800/70 p-4 gap-6 no-print">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-sky-500 to-slate-700 shadow-lg flex items-center justify-center text-white font-bold text-lg">GW</div>
        <div>
          <p className="text-lg font-semibold">GlassWorks</p>
          <p className="text-xs text-slate-300">Stained Glass Books</p>
        </div>
      </div>
      
      <nav className="flex flex-col gap-2 text-sm">
        {links.map(link => (
          <button
            key={link.id}
            onClick={() => setView(link.id)}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
              currentView === link.id
                ? 'bg-sky-600/20 text-sky-400 border border-sky-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <span className="text-lg">{link.icon}</span>
            <span className="font-medium">{link.label}</span>
          </button>
        ))}
      </nav>

      <div className="mt-auto space-y-3">
        <div className="bg-slate-900/50 rounded-xl p-3 border border-slate-800/50">
          <p className="text-xs text-slate-500">Suite Version</p>
          <p className="text-sm font-semibold text-slate-300">v4.0 React Pro</p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
