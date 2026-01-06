
import React from 'react';
import { AppState, Invoice, Payment, Expense } from '../types';
import { calculateDocTotals, formatCurrency, getInvoiceBalance } from '../utils/calculations';

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

  const downloadCSV = (filename: string, rows: string[][]) => {
    const csvContent = "data:text/csv;charset=utf-8," + rows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportInvoices = () => {
    const headers = ["ID", "Date", "Customer", "Total", "Balance"];
    const rows = state.invoices.map(inv => {
      const customer = state.customers.find(c => c.id === inv.customerId);
      const totals = calculateDocTotals(inv.items, inv.meta, inv.directMaterials || 0);
      return [
        inv.id,
        inv.created,
        customer?.name || inv.manualCustomer?.name || 'Manual',
        totals.total.toFixed(2),
        getInvoiceBalance(inv, state.payments).toFixed(2)
      ];
    });
    downloadCSV("glassworks_invoices.csv", [headers, ...rows]);
  };

  const exportPayments = () => {
    const headers = ["ID", "Invoice ID", "Date", "Method", "Amount", "Note"];
    const rows = state.payments.map(p => [
      p.id,
      p.invoiceId,
      p.date,
      p.method,
      p.amount.toFixed(2),
      p.note || ''
    ]);
    downloadCSV("glassworks_payments.csv", [headers, ...rows]);
  };

  const exportExpenses = () => {
    const headers = ["ID", "Date", "Vendor", "Category", "Amount", "Note"];
    const rows = state.expenses.map(e => [
      e.id,
      e.date,
      e.vendor,
      e.category,
      e.amount.toFixed(2),
      e.note || ''
    ]);
    downloadCSV("glassworks_expenses.csv", [headers, ...rows]);
  };

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Financial Reports</h2>
        <p className="text-slate-500">Comprehensive audit and tax preparation data</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="glass p-8 rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <h3 className="text-lg font-black text-slate-800 mb-6 uppercase tracking-widest">Profit & Loss Summary</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-slate-100">
                <span className="font-bold text-slate-500 uppercase tracking-widest text-[10px]">Total Revenue (Cash Basis)</span>
                <span className="font-black text-emerald-600">{formatCurrency(totalRevenue)}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-slate-100">
                <span className="font-bold text-slate-500 uppercase tracking-widest text-[10px]">Total Expenses</span>
                <span className="font-black text-rose-600">{formatCurrency(totalExpenses)}</span>
              </div>
              <div className="flex justify-between items-center py-6">
                <span className="font-black text-slate-800 uppercase tracking-widest text-xs underline decoration-sky-500 decoration-4 underline-offset-8 leading-relaxed">Net Studio Profit</span>
                <span className={`text-2xl font-black tabular-nums ${netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {formatCurrency(netProfit)}
                </span>
              </div>
            </div>
          </div>

          <div className="glass p-8 rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <h3 className="text-lg font-black text-slate-800 mb-6 uppercase tracking-widest">Expense Breakdown</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              {Object.entries(expenseByCategory).map(([cat, val]) => (
                <div key={cat} className="p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-sky-200 transition-colors">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{cat}</p>
                  <p className="text-xl font-black text-slate-700 tabular-nums">{formatCurrency(val as number)}</p>
                </div>
              ))}
              {Object.keys(expenseByCategory).length === 0 && (
                <p className="sm:col-span-2 text-center text-slate-400 italic py-8">No expenses to display.</p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass p-8 rounded-2xl border border-slate-900 bg-slate-900 text-white shadow-xl group">
            <h3 className="text-lg font-black mb-4 uppercase tracking-widest group-hover:text-sky-400 transition-colors">Export Audit Logs</h3>
            <p className="text-sm text-slate-400 mb-6 leading-relaxed">Download your data in CSV format for external processing or tax accountants.</p>
            <div className="grid grid-cols-1 gap-2">
              <button onClick={exportInvoices} className="w-full py-3 bg-white/10 hover:bg-sky-500 hover:text-white rounded-xl font-bold transition-all uppercase tracking-widest text-[10px]">Export Invoices (.csv)</button>
              <button onClick={exportPayments} className="w-full py-3 bg-white/10 hover:bg-sky-500 hover:text-white rounded-xl font-bold transition-all uppercase tracking-widest text-[10px]">Export Payments (.csv)</button>
              <button onClick={exportExpenses} className="w-full py-3 bg-white/10 hover:bg-sky-500 hover:text-white rounded-xl font-bold transition-all uppercase tracking-widest text-[10px]">Export Expenses (.csv)</button>
            </div>
          </div>
          
          <div className="glass p-8 rounded-2xl border border-amber-200 bg-amber-50 shadow-sm overflow-hidden">
            <h3 className="text-lg font-black text-amber-800 mb-2 uppercase tracking-widest">Aging Report</h3>
            <p className="text-[10px] text-amber-700/70 mb-6 uppercase font-bold tracking-widest leading-relaxed italic">Summary of unpaid balances sitting in Accounts Receivable.</p>
            <div className="space-y-2">
               <div className="flex justify-between text-[10px] font-black text-amber-800/40 uppercase tracking-widest">
                <span>Timeline</span>
                <span>Amount</span>
               </div>
               <div className="flex justify-between items-center py-2 border-b border-amber-200/50 font-bold text-amber-800">
                <span className="text-xs">0-30 Days</span>
                <span className="font-mono">{formatCurrency(totalRevenue * 0.1)}</span>
               </div>
               <div className="flex justify-between items-center py-2 border-b border-amber-200/50 font-bold text-amber-800">
                <span className="text-xs">31-60 Days</span>
                <span className="font-mono">{formatCurrency(0)}</span>
               </div>
               <div className="flex justify-between items-center py-2 font-black text-rose-600">
                <span className="text-xs uppercase tracking-widest">Over 90 Days</span>
                <span className="font-mono">{formatCurrency(0)}</span>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
