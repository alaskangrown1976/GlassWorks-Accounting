
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
    
    setState(prev => ({ ...prev, lastBackup: new Date().toISOString() }));
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

  const needsBackup = !state.lastBackup || 
    (Date.now() - new Date(state.lastBackup).getTime() > 1000 * 60 * 60 * 24 * 7);

  return (
    <header className="sticky top-0 z-30 bg-white/90 border-b border-slate-200 backdrop-blur no-print px-6 py-4">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 md:hidden rounded-xl bg-gradient-to-br from-sky-500 to-slate-700 shadow-lg flex items-center justify-center text-white font-bold">GW</div>
          <div className="hidden sm:block">
            <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none uppercase italic">
              {state.branding.header || 'GlassWorks'}
            </h1>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
              {needsBackup ? (
                <span className="text-rose-500 animate-pulse">⚠️ Needs Backup</span>
              ) : (
                'System Secure'
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-xl mr-2">
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Locale</span>
             <select 
              value={state.settings.currency}
              onChange={(e) => setState(prev => ({ ...prev, settings: { ...prev.settings, currency: e.target.value } }))}
              className="text-xs font-bold bg-transparent focus:outline-none"
            >
              <option value="USD">USD ($)</option>
              <option value="CAD">CAD ($)</option>
              <option value="GBP">GBP (£)</option>
              <option value="EUR">EUR (€)</option>
            </select>
          </div>

          <button
            onClick={handleExport}
            className={`px-4 py-2 rounded-xl text-sm font-black uppercase tracking-widest transition-all shadow-lg ${
              needsBackup 
                ? 'bg-rose-600 text-white hover:bg-rose-500 shadow-rose-200' 
                : 'bg-slate-900 text-white hover:bg-slate-800 shadow-slate-200'
            }`}
          >
            Export
          </button>
          
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 rounded-xl border-2 border-slate-200 bg-white text-slate-700 text-sm font-black uppercase tracking-widest hover:bg-slate-50 transition-all"
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
