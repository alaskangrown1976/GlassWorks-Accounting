
import React, { useState, useMemo } from 'react';
import { AppState, LineItem } from '../types';
import { formatCurrency } from '../utils/calculations';

interface MaterialCalculatorProps {
  state?: AppState;
  updateState?: (updater: (prev: AppState) => AppState) => void;
  flashToast?: (msg: string) => void;
}

const MaterialCalculator: React.FC<MaterialCalculatorProps> = ({ state, updateState, flashToast }) => {
  const [length, setLength] = useState(0);
  const [width, setWidth] = useState(0);
  const [pieces, setPieces] = useState(0);
  const [selectedDocId, setSelectedDocId] = useState('');

  const area = useMemo(() => length * width * pieces, [length, width, pieces]);
  const linearInches = useMemo(() => pieces * 3.5, [pieces]);
  const solderCost = useMemo(() => linearInches * 0.12, [linearInches]);
  const foilCost = useMemo(() => linearInches * 2 * 0.013, [linearInches]);
  const totalMaterials = useMemo(() => solderCost + foilCost, [solderCost, foilCost]);

  const handlePushToDoc = () => {
    if (!selectedDocId || !updateState || !flashToast || totalMaterials <= 0) return;

    const [type, id] = selectedDocId.split(':');
    
    updateState(prev => {
      const newItem: LineItem = {
        account: '200', // Materials On Hand
        desc: `Consumables (Solder & Foil) - Calculated for ${pieces} pieces`,
        qty: 1,
        price: totalMaterials
      };

      if (type === 'invoice') {
        return {
          ...prev,
          invoices: prev.invoices.map(inv => 
            inv.id === id ? { ...inv, items: [...inv.items, newItem] } : inv
          )
        };
      } else {
        return {
          ...prev,
          orders: prev.orders.map(ord => 
            ord.id === id ? { ...ord, items: [...ord.items, newItem] } : ord
          )
        };
      }
    });

    flashToast(`Materials added to ${type === 'invoice' ? 'Invoice' : 'Order'} #${id}`);
    setSelectedDocId('');
  };

  const activeDocs = useMemo(() => {
    if (!state) return [];
    const invoices = state.invoices.filter(i => i.status === 'Unpaid').map(i => ({ id: `invoice:${i.id}`, label: `Invoice #${i.id}` }));
    const orders = state.orders.filter(o => o.status !== 'Completed').map(o => ({ id: `order:${o.id}`, label: `Order SO-${o.seq}` }));
    return [...invoices, ...orders];
  }, [state]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Materials Calculator</h2>
          <p className="text-slate-500">Industry standards for solder and copper foil usage</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="glass p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Input Dimensions</h3>
            <span className="text-[10px] bg-sky-100 text-sky-700 px-2 py-0.5 rounded-full font-black uppercase tracking-widest">Inches</span>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Length</label>
              <input 
                type="number" 
                min="0"
                value={length || ''} 
                onChange={(e) => setLength(Number(e.target.value))} 
                className="w-full p-4 bg-white border-2 border-slate-100 rounded-xl focus:border-sky-500 focus:outline-none font-black text-slate-700"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Width</label>
              <input 
                type="number" 
                min="0"
                value={width || ''} 
                onChange={(e) => setWidth(Number(e.target.value))} 
                className="w-full p-4 bg-white border-2 border-slate-100 rounded-xl focus:border-sky-500 focus:outline-none font-black text-slate-700"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Pieces (Quantities)</label>
              <input 
                type="number" 
                min="0"
                value={pieces || ''} 
                onChange={(e) => setPieces(Number(e.target.value))} 
                className="w-full p-4 bg-white border-2 border-slate-100 rounded-xl focus:border-sky-500 focus:outline-none font-black text-slate-700"
              />
            </div>
          </div>
        </div>

        <div className="md:col-span-2 grid sm:grid-cols-2 gap-6">
          <div className="glass p-8 rounded-2xl border border-sky-100 bg-sky-50/30 flex flex-col justify-between">
            <div>
              <p className="text-[10px] font-black text-sky-400 uppercase tracking-widest mb-1">Glass Area</p>
              <p className="text-4xl font-black text-sky-600 tabular-nums">{area.toFixed(2)} <span className="text-lg">SQ IN</span></p>
            </div>
            <p className="text-xs text-sky-700/50 mt-4 leading-relaxed font-medium italic">
              Area helps guide ordering for sheet glass inventory and determines waste percentages.
            </p>
          </div>

          <div className="glass p-8 rounded-2xl border border-emerald-100 bg-emerald-50/30 flex flex-col justify-between">
            <div>
              <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Linear Run</p>
              <p className="text-4xl font-black text-emerald-600 tabular-nums">{linearInches.toFixed(2)} <span className="text-lg">IN</span></p>
            </div>
            <p className="text-xs text-emerald-700/50 mt-4 leading-relaxed font-medium italic">
              Estimated by pieces (Pieces × 3.5). Basis for foil and solder calculation.
            </p>
          </div>

          <div className="glass p-8 rounded-3xl border border-slate-800 bg-slate-900 sm:col-span-2 text-white shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
            
            <div className="flex justify-between items-start mb-10 relative z-10">
              <div>
                <h3 className="text-xl font-black tracking-tight uppercase tracking-widest">Consumables Cost</h3>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Industry standard pricing</p>
              </div>
              <p className="text-4xl font-black text-sky-400 tracking-tighter tabular-nums">{formatCurrency(totalMaterials)}</p>
            </div>

            <div className="grid grid-cols-2 gap-10 relative z-10 mb-10">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Solder (0.12/in)</p>
                <p className="text-2xl font-black text-slate-200 tabular-nums">{formatCurrency(solderCost)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Foil (0.013/in)</p>
                <p className="text-2xl font-black text-slate-200 tabular-nums">{formatCurrency(foilCost)}</p>
              </div>
            </div>

            {state && updateState && (
              <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row gap-3 relative z-10">
                <div className="flex-1">
                  <select 
                    value={selectedDocId}
                    onChange={(e) => setSelectedDocId(e.target.value)}
                    className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="">Add to Active Document...</option>
                    {activeDocs.map(doc => <option key={doc.id} value={doc.id}>{doc.label}</option>)}
                  </select>
                </div>
                <button 
                  onClick={handlePushToDoc}
                  disabled={!selectedDocId || totalMaterials <= 0}
                  className="px-6 py-3 bg-sky-500 hover:bg-sky-400 disabled:bg-slate-700 disabled:text-slate-500 text-slate-900 rounded-xl font-black text-xs uppercase tracking-widest transition-all"
                >
                  Apply to Doc
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MaterialCalculator;
