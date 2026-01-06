
import React, { useState, useEffect } from 'react';
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
  const [toast, setToast] = useState<string | null>(null);
  const [printTarget, setPrintTarget] = useState<{ type: 'invoice' | 'order', data: Invoice | SalesOrder } | null>(null);

  useEffect(() => {
    localStorage.setItem('glassworks-data-v4', JSON.stringify(state));
  }, [state]);

  // Robust Print Lifecycle Management
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

  const flashToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const updateState = (updater: (prev: AppState) => AppState) => {
    setState(prev => updater(prev));
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
    <div className="min-h-screen flex text-slate-900 bg-slate-900">
      <Sidebar currentView={currentView} setView={setCurrentView} />
      
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
            />
          )}
          {currentView === 'orders' && (
            <OrderManager 
              state={state} 
              updateState={updateState} 
              flashToast={flashToast} 
              onPrint={(ord) => handlePrintRequest('order', ord)} 
            />
          )}
          {currentView === 'customers' && <CustomerManager state={state} updateState={updateState} flashToast={flashToast} />}
          {currentView === 'payments' && <PaymentManager state={state} updateState={updateState} flashToast={flashToast} />}
          {currentView === 'expenses' && <ExpenseManager state={state} updateState={updateState} flashToast={flashToast} />}
          {currentView === 'materials' && <MaterialCalculator />}
          {currentView === 'reports' && <Reports state={state} />}
          {currentView === 'settings' && <SettingsManager state={state} updateState={updateState} flashToast={flashToast} />}
        </main>
      </div>

      {toast && (
        <div className="fixed bottom-4 right-4 z-50 px-6 py-3 bg-slate-900 text-white rounded-xl shadow-2xl animate-bounce no-print">
          {toast}
        </div>
      )}
    </div>
  );
};

export default App;
