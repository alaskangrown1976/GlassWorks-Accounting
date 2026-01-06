
import React from 'react';
import { AppState, ViewType } from '../types';
import { calculateDocTotals, getInvoiceBalance, formatCurrency } from '../utils/calculations';

interface DashboardProps {
  state: AppState;
  setCurrentView: (view: ViewType) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ state, setCurrentView }) => {
  const receivedRevenue = state.payments.reduce((s, p) => s + p.amount, 0) + 
    state.invoices.flatMap(inv => inv.items)
      .filter(i => i.account.startsWith('30'))
      .reduce((s, i) => s + (i.qty * i.price), 0);

  const outstanding = state.invoices.reduce((s, inv) => s + getInvoiceBalance(inv, state.payments), 0);
  const projectedOrders = state.orders.filter(o => o.status !== 'Completed').reduce((s, o) => s + calculateDocTotals(o.items, o.meta).total, 0);
  const expenses = state.expenses.reduce((s, e) => s + e.amount, 0);

  const stats = [
    { label: 'Revenue Received', value: formatCurrency(receivedRevenue), sub: `${state.payments.length} Payments`, color: 'text-emerald-600' },
    { label: 'Outstanding Bal', value: formatCurrency(outstanding), sub: `${state.invoices.filter(i => getInvoiceBalance(i, state.payments) > 0).length} Open`, color: 'text-amber-600' },
    { label: 'Projected Sales', value: formatCurrency(projectedOrders), sub: `${state.orders.filter(o => o.status !== 'Completed').length} Orders`, color: 'text-sky-600' },
    { label: 'Total Expenses', value: formatCurrency(expenses), sub: `${state.expenses.length} Entries`, color: 'text-rose-600' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Business Overview</h2>
          <p className="text-slate-500">Live financial summary for GlassWorks</p>
        </div>
        <div className="flex gap-2 no-print">
          <button onClick={() => setCurrentView('invoices')} className="px-3 py-1.5 bg-sky-100 text-sky-700 rounded-lg text-xs font-bold">NEW INVOICE</button>
          <button onClick={() => setCurrentView('orders')} className="px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold">NEW ORDER</button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="glass p-6 rounded-2xl shadow-sm border border-slate-200">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{stat.label}</p>
            <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-slate-500 mt-2">{stat.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="glass p-6 rounded-2xl shadow-sm space-y-4">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            Critical Outstanding Invoices
          </h3>
          <div className="space-y-3">
            {state.invoices.filter(i => getInvoiceBalance(i, state.payments) > 0).slice(0, 5).map(inv => {
              const customer = state.customers.find(c => c.id === inv.customerId);
              return (
                <div key={inv.id} className="flex justify-between items-center p-3 bg-white/50 border border-slate-100 rounded-xl hover:border-slate-300 transition-colors cursor-pointer" onClick={() => setCurrentView('invoices')}>
                  <div>
                    <p className="font-bold text-sm text-slate-800">#{inv.id} — {customer?.name || 'Manual Customer'}</p>
                    <p className="text-xs text-slate-400">Due {inv.due}</p>
                  </div>
                  <p className="font-black text-amber-600">{formatCurrency(getInvoiceBalance(inv, state.payments))}</p>
                </div>
              );
            })}
            {state.invoices.filter(i => getInvoiceBalance(i, state.payments) > 0).length === 0 && (
              <p className="text-sm text-slate-400 py-4 text-center italic">All invoices are paid up. Great work!</p>
            )}
          </div>
        </div>

        <div className="glass p-6 rounded-2xl shadow-sm space-y-4">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-sky-500"></span>
            Active Sales Pipeline
          </h3>
          <div className="space-y-3">
            {state.orders.filter(o => o.status !== 'Completed').slice(0, 5).map(ord => {
              const customer = state.customers.find(c => c.id === ord.customerId);
              return (
                <div key={ord.id} className="flex justify-between items-center p-3 bg-white/50 border border-slate-100 rounded-xl hover:border-slate-300 transition-colors cursor-pointer" onClick={() => setCurrentView('orders')}>
                  <div>
                    <p className="font-bold text-sm text-slate-800">{ord.id} — {customer?.name || 'Manual Customer'}</p>
                    <p className="text-xs text-slate-400">{ord.status}</p>
                  </div>
                  <p className="font-black text-sky-600">{formatCurrency(calculateDocTotals(ord.items, ord.meta).total)}</p>
                </div>
              );
            })}
            {state.orders.filter(o => o.status !== 'Completed').length === 0 && (
              <p className="text-sm text-slate-400 py-4 text-center italic">No active orders in the pipeline.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
