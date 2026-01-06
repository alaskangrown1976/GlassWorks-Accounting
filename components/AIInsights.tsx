
import React, { useState, useEffect } from 'react';
import { AppState } from '../types';
import { getBusinessInsights } from '../services/geminiService';

interface AIInsightsProps {
  state: AppState;
}

const AIInsights: React.FC<AIInsightsProps> = ({ state }) => {
  const [insight, setInsight] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchInsight = async () => {
    setLoading(true);
    const text = await getBusinessInsights(state);
    setInsight(text);
    setLoading(false);
  };

  useEffect(() => {
    if (state.invoices.length > 0 || state.expenses.length > 0) {
      fetchInsight();
    }
  }, []);

  return (
    <div className="glass p-8 rounded-3xl border border-sky-100 shadow-xl overflow-hidden relative">
      <div className="absolute top-0 right-0 p-4 opacity-10">
        <span className="text-8xl">✨</span>
      </div>

      <div className="relative z-10 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-sky-500 flex items-center justify-center text-white shadow-lg shadow-sky-200">
            <span className="text-xl">🤖</span>
          </div>
          <div>
            <h3 className="font-black text-slate-800 text-xl tracking-tight">AI Business Advisor</h3>
            <p className="text-sm text-sky-600 font-bold uppercase tracking-widest">Powered by Gemini 3</p>
          </div>
        </div>

        <div className="min-h-[100px] bg-sky-50/50 rounded-2xl p-6 border border-sky-100 text-slate-700 leading-relaxed italic">
          {loading ? (
            <div className="flex items-center gap-3 animate-pulse">
              <div className="w-4 h-4 rounded-full bg-sky-400"></div>
              <p className="text-sky-600 font-bold">Analyzing your business trajectory...</p>
            </div>
          ) : (
            insight || "Record some transactions to get AI-powered business growth advice."
          )}
        </div>

        <button 
          onClick={fetchInsight}
          disabled={loading}
          className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold shadow-lg hover:bg-slate-800 transition-all disabled:opacity-50"
        >
          {loading ? 'Thinking...' : 'Refresh AI Analysis'}
        </button>
      </div>
    </div>
  );
};

export default AIInsights;
