
import React, { useState, useEffect, useCallback } from 'react';
import { AppState, ViewType, Invoice, SalesOrder } from './types';
import { INITIAL_STATE, DEFAULT_ACCOUNT_CODES } from './constants';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import InvoiceManager from './components/InvoiceManager';
import OrderManager from './components/OrderManager';
import CustomerManager from './components/CustomerManager';
import PaymentManager from './components/PaymentManager';
import ExpenseManager from './components/ExpenseManager';
import MaterialCalculator from './components/MaterialCalculator';
import Reports from './components/Reports';
import PrintDocument from './components/PrintDocument';
import SettingsManager from './components/SettingsManager';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem('glassworks-data-v4');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          ...INITIAL_STATE,
          ...parsed,
          accountCodes: parsed.accountCodes?.length ? parsed.accountCodes : DEFAULT_ACCOUNT_CODES
        };
      } catch (e) {
        return INITIAL_STATE;
      }
    }
    return INITIAL_STATE;
  });

  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [toast, setToast] = useState<{ msg: string; onUndo?: () => void } | null>(null);
  const [undoStack, setUndoStack] = useState<AppState[]>([]);
  const [printTarget, setPrintTarget] = useState<{ type: 'invoice' | 'order', data: Invoice | SalesOrder } | null>(null);

  useEffect(() => {
    localStorage.setItem('glassworks-data-v4', JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    if (printTarget) {
      const timer = setTimeout(() => {
        window.print();
      }, 500);

      const handleAfterPrint = () => {
        setPrintTarget(null);
      };

      window.addEventListener('afterprint', handleAfterPrint);

      return () => {
        clearTimeout(timer);
        window.removeEventListener('afterprint', handleAfterPrint);
      };
    }
  }, [printTarget]);

  const flashToast = useCallback((msg: string, onUndo?: () => void) => {
    setToast({ msg, onUndo });
    const timer = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(timer);
  }, []);

  const updateState = useCallback((updater: (prev: AppState) => AppState, allowUndo = false) => {
    setState(prev => {
      if (allowUndo) {
        setUndoStack(oldStack => [...oldStack, prev].slice(-5)); // Keep last 5 states for undo
      }
      return updater(prev);
    });
  }, []);

  const handleUndo = () => {
    if (undoStack.length > 0) {
      const prevState = undoStack[undoStack.length - 1];
      setState(prevState);
      setUndoStack(undoStack.slice(0, -1));
      setToast(null);
    }
  };

  const handlePrintRequest = (type: 'invoice' | 'order', data: Invoice | SalesOrder) => {
    setPrintTarget({ type, data });
  };

  if (printTarget) {
    return (
      <PrintDocument 
        type={printTarget.type} 
        data={printTarget.data} 
        state={state} 
      />
    );
  }

  return (
    <div className="min-h-screen flex text-slate-900 bg-slate-900 font-sans antialiased">
      <Sidebar currentView={currentView} setView={setCurrentView} state={state} />
      
      <div className="flex-1 flex flex-col bg-slate-50 relative overflow-y-auto">
        <Header state={state} setState={setState} flashToast={flashToast} />
        
        <main className="flex-1 max-w-6xl mx-auto px-4 py-8 space-y-10 w-full no-print">
          {currentView === 'dashboard' && (
            <Dashboard state={state} setCurrentView={setCurrentView} />
          )}
          {currentView === 'invoices' && (
            <InvoiceManager 
              state={state} 
              updateState={updateState} 
              flashToast={flashToast} 
              onPrint={(inv) => handlePrintRequest('invoice', inv)} 
              onUndo={handleUndo}
            />
          )}
          {currentView === 'orders' && (
            <OrderManager 
              state={state} 
              updateState={updateState} 
              flashToast={flashToast} 
              onPrint={(ord) => handlePrintRequest('order', ord)} 
              onUndo={handleUndo}
            />
          )}
          {currentView === 'customers' && (
            <CustomerManager state={state} updateState={updateState} flashToast={flashToast} onUndo={handleUndo} />
          )}
          {currentView === 'payments' && (
            <PaymentManager state={state} updateState={updateState} flashToast={flashToast} onUndo={handleUndo} />
          )}
          {currentView === 'expenses' && (
            <ExpenseManager state={state} updateState={updateState} flashToast={flashToast} onUndo={handleUndo} />
          )}
          {currentView === 'materials' && (
            <MaterialCalculator state={state} updateState={updateState} flashToast={flashToast} />
          )}
          {currentView === 'reports' && <Reports state={state} />}
          {currentView === 'settings' && <SettingsManager state={state} updateState={updateState} flashToast={flashToast} />}
        </main>
      </div>

      {toast && (
        <div className="fixed bottom-6 right-6 z-[60] flex items-center gap-4 px-6 py-4 bg-slate-900 text-white rounded-2xl shadow-2xl animate-in slide-in-from-bottom-4 duration-300 no-print">
          <span className="font-bold text-sm tracking-tight">{toast.msg}</span>
          {(toast.onUndo || undoStack.length > 0) && (
            <button 
              onClick={toast.onUndo || handleUndo}
              className="px-3 py-1 bg-sky-500 hover:bg-sky-400 text-slate-900 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors"
            >
              REVERT
            </button>
          )}
          <button onClick={() => setToast(null)} className="ml-2 text-slate-500 hover:text-white font-black">×</button>
        </div>
      )}
    </div>
  );
};

export default App;
