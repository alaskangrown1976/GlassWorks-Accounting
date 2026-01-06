
import React, { useRef } from 'react';
import { AppState } from '../types';

interface HeaderProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
  flashToast: (msg: string) => void;
}

const Header: React.FC<HeaderProps> = ({ state, setState, flashToast }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const dataStr = JSON.stringify(state, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `glassworks-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    flashToast('Backup exported successfully');
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        setState(prev => ({ ...prev, ...data }));
        flashToast('Backup restored successfully');
      } catch (err) {
        flashToast('Failed to restore backup');
      }
    };
    reader.readAsText(file);
  };

  return (
    <header className="sticky top-0 z-30 bg-white/90 border-b border-slate-200 backdrop-blur no-print px-4 py-3">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 md:hidden rounded-xl bg-gradient-to-br from-sky-500 to-slate-700 shadow-lg flex items-center justify-center text-white font-bold">GW</div>
          <div className="hidden sm:block">
            <p className="text-lg font-semibold text-slate-800">GlassWorks v4.0</p>
            <p className="text-xs text-slate-500">Financial Suite • Stable Desktop Experience</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <select 
            value={state.settings.currency}
            onChange={(e) => setState(prev => ({ ...prev, settings: { ...prev.settings, currency: e.target.value } }))}
            className="hidden sm:block text-xs border border-slate-200 rounded px-2 py-1 bg-white"
          >
            <option value="USD">USD ($)</option>
            <option value="CAD">CAD ($)</option>
            <option value="GBP">GBP (£)</option>
            <option value="EUR">EUR (€)</option>
          </select>

          <button
            onClick={handleExport}
            className="px-3 py-1.5 rounded-lg bg-sky-600 text-white text-sm font-semibold shadow hover:bg-sky-500 transition-colors"
          >
            Export
          </button>
          
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-sm font-semibold shadow-sm hover:bg-slate-50 transition-colors"
          >
            Import
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImport} 
            className="hidden" 
            accept="application/json"
          />
        </div>
      </div>
    </header>
  );
};

export default Header;
