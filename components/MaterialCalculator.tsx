
import React, { useState, useMemo } from 'react';
import { formatCurrency } from '../utils/calculations';

const MaterialCalculator: React.FC = () => {
  const [length, setLength] = useState(0);
  const [width, setWidth] = useState(0);
  const [pieces, setPieces] = useState(0);

  const area = useMemo(() => length * width * pieces, [length, width, pieces]);
  const linearInches = useMemo(() => pieces * 3.5, [pieces]);
  const solderCost = useMemo(() => linearInches * 0.12, [linearInches]);
  const foilCost = useMemo(() => linearInches * 2 * 0.013, [linearInches]);
  const totalMaterials = useMemo(() => solderCost + foilCost, [solderCost, foilCost]);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Materials Calculator</h2>
        <p className="text-slate-500">Industry standards for solder and copper foil usage</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="glass p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-800">Dimensions</h3>
            <span className="text-xs bg-slate-100 px-2 py-1 rounded-full font-bold">INCHES</span>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Length</label>
              <input 
                type="number" 
                value={length || ''} 
                onChange={(e) => setLength(Number(e.target.value))} 
                className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Width</label>
              <input 
                type="number" 
                value={width || ''} 
                onChange={(e) => setWidth(Number(e.target.value))} 
                className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Quantity (Pieces)</label>
              <input 
                type="number" 
                value={pieces || ''} 
                onChange={(e) => setPieces(Number(e.target.value))} 
                className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none font-mono"
              />
            </div>
          </div>
        </div>

        <div className="md:col-span-2 grid sm:grid-cols-2 gap-6">
          <div className="glass p-8 rounded-2xl border border-sky-100 bg-sky-50/30 flex flex-col justify-between">
            <div>
              <p className="text-xs font-bold text-sky-400 uppercase tracking-widest mb-1">Total Glass Area</p>
              <p className="text-4xl font-black text-sky-600">{area.toFixed(2)} <span className="text-lg">SQ IN</span></p>
            </div>
            <p className="text-xs text-sky-700/50 mt-4 leading-relaxed font-medium italic">
              Area helps guide ordering for sheet glass inventory and helps determine waste percentages.
            </p>
          </div>

          <div className="glass p-8 rounded-2xl border border-emerald-100 bg-emerald-50/30 flex flex-col justify-between">
            <div>
              <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-1">Estimated Linear Inches</p>
              <p className="text-4xl font-black text-emerald-600">{linearInches.toFixed(2)} <span className="text-lg">IN</span></p>
            </div>
            <p className="text-xs text-emerald-700/50 mt-4 leading-relaxed font-medium italic">
              Estimated by pieces count (Pieces × 3.5). Useful for foil and solder calculation.
            </p>
          </div>

          <div className="glass p-8 rounded-2xl border border-slate-800 bg-slate-900 sm:col-span-2 text-white">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h3 className="text-xl font-bold">Consumables Cost</h3>
                <p className="text-slate-500 text-sm">Automated quote based on linear inches</p>
              </div>
              <p className="text-3xl font-black text-sky-400 tracking-tighter">{formatCurrency(totalMaterials)}</p>
            </div>

            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-500 uppercase">Solder (0.12/in)</p>
                <p className="text-xl font-bold">{formatCurrency(solderCost)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-500 uppercase">Copper Foil (0.013/in)</p>
                <p className="text-xl font-bold">{formatCurrency(foilCost)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MaterialCalculator;
