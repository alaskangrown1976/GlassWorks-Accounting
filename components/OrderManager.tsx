
import React from 'react';
import { AppState, SalesOrder } from '../types';
import { calculateDocTotals, formatCurrency } from '../utils/calculations';

interface OrderManagerProps {
  state: AppState;
  updateState: (updater: (prev: AppState) => AppState) => void;
  flashToast: (msg: string) => void;
  onPrint: (order: SalesOrder) => void;
}

const OrderManager: React.FC<OrderManagerProps> = ({ state, updateState, flashToast, onPrint }) => {
  const handleDelete = (id: string) => {
    if (!confirm('Delete this order?')) return;
    updateState(prev => ({ ...prev, orders: prev.orders.filter(o => o.id !== id) }));
    flashToast('Order deleted');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Sales Orders</h2>
          <p className="text-slate-500">Pipeline and confirmed project tracking</p>
        </div>
        <button 
          className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold shadow-lg hover:bg-indigo-500 transition-all"
        >
          New Sales Order
        </button>
      </div>

      <div className="glass overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-xs font-black text-slate-400 uppercase tracking-widest">
              <th className="px-6 py-4">ID</th>
              <th className="px-6 py-4">Customer</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Total</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {state.orders.map(ord => {
              const customer = state.customers.find(c => c.id === ord.customerId);
              return (
                <tr key={ord.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-mono text-sm">{ord.id}</td>
                  <td className="px-6 py-4 font-bold text-slate-800">{customer?.name || ord.manualCustomer?.name || 'Manual'}</td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 bg-sky-100 text-sky-700 rounded-full text-[10px] font-black uppercase">
                      {ord.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-bold">{formatCurrency(calculateDocTotals(ord.items, ord.meta).total)}</td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button 
                      onClick={() => onPrint(ord)}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
                    >
                      Print
                    </button>
                    <button onClick={() => handleDelete(ord.id)} className="text-xs font-bold text-rose-600 hover:text-rose-800">Delete</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {state.orders.length === 0 && (
          <div className="p-12 text-center text-slate-400 italic">No orders found. Add one to track your potential revenue.</div>
        )}
      </div>
    </div>
  );
};

export default OrderManager;
