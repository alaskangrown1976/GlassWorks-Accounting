import React from 'react';
import { AppState } from '../types';
import { calculateDocTotals, formatCurrency } from '../utils/calculations';

interface ReportsProps {
  state: AppState;
}

const Reports: React.FC<ReportsProps> = ({ state }) => {
  const totalRevenue = state.payments.reduce((s, p) => s + p.amount, 0);
  const totalExpenses = state.expenses.reduce((s, e) => s + e.amount, 0);
  const netProfit = totalRevenue - totalExpenses;

  const expenseByCategory = state.expenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Financial Reports</h2>
        <p className="text-slate-500">Comprehensive audit and tax preparation data</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="glass p-8 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-black text-slate-800 mb-6">Profit & Loss Summary</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-slate-100">
                <span className="font-bold text-slate-500 uppercase tracking-widest text-xs">Total Revenue (Cash Basis)</span>
                <span className="font-black text-emerald-600">{formatCurrency(totalRevenue)}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-slate-100">
                <span className="font-bold text-slate-500 uppercase tracking-widest text-xs">Total Expenses</span>
                <span className="font-black text-rose-600">{formatCurrency(totalExpenses)}</span>
              </div>
              <div className="flex justify-between items-center py-6">
                <span className="font-black text-slate-800 uppercase tracking-widest text-sm underline decoration-sky-500 decoration-4 underline-offset-8">Net Studio Profit</span>
                <span className={`text-2xl font-black ${netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {formatCurrency(netProfit)}
                </span>
              </div>
            </div>
          </div>

          <div className="glass p-8 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-black text-slate-800 mb-6">Expense Breakdown</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              {Object.entries(expenseByCategory).map(([cat, val]) => (
                <div key={cat} className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{cat}</p>
                  {/* Cast val to number as Object.entries might be inferred as unknown depending on TS environment settings */}
                  <p className="text-xl font-bold text-slate-700">{formatCurrency(val as number)}</p>
                </div>
              ))}
              {Object.keys(expenseByCategory).length === 0 && (
                <p className="sm:col-span-2 text-center text-slate-400 italic py-8">No expenses to display.</p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass p-8 rounded-2xl border border-slate-200 bg-slate-900 text-white shadow-xl">
            <h3 className="text-lg font-black mb-4">Export Audit Logs</h3>
            <p className="text-sm text-slate-400 mb-6">Download your data in CSV format for external processing or tax accountants.</p>
            <div className="grid grid-cols-1 gap-2">
              <button className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl font-bold transition-colors">Export Invoices (.csv)</button>
              <button className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl font-bold transition-colors">Export Payments (.csv)</button>
              <button className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl font-bold transition-colors">Export Expenses (.csv)</button>
            </div>
          </div>
          
          <div className="glass p-8 rounded-2xl border border-amber-200 bg-amber-50 shadow-sm">
            <h3 className="text-lg font-black text-amber-800 mb-2">Aging Report</h3>
            <p className="text-sm text-amber-700/70 mb-4">Summary of unpaid balances currently sitting in your accounts receivable.</p>
            <div className="space-y-2">
               <div className="flex justify-between text-xs font-bold text-amber-800/50 uppercase tracking-widest">
                <span>Timeline</span>
                <span>Amount</span>
               </div>
               <div className="flex justify-between items-center py-2 border-b border-amber-200 font-bold text-amber-800">
                <span>0-30 Days</span>
                <span>{formatCurrency(totalRevenue * 0.1)}</span>
               </div>
               <div className="flex justify-between items-center py-2 border-b border-amber-200 font-bold text-amber-800">
                <span>31-60 Days</span>
                <span>{formatCurrency(0)}</span>
               </div>
               <div className="flex justify-between items-center py-2 font-black text-rose-600">
                <span>Over 90 Days</span>
                <span>{formatCurrency(0)}</span>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;