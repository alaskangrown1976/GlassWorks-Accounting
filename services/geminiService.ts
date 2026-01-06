import { GoogleGenAI } from '@google/genai';
import { AppState } from '../types';

export const getBusinessInsights = async (state: AppState) => {
  // Minimize the payload for privacy and token efficiency
  const summary = {
    revenue: state.payments.reduce((s, p) => s + p.amount, 0),
    outstanding: state.invoices.reduce((s, inv) => {
      const credits = inv.items.filter(i => !i.account.startsWith('30')).reduce((sum, i) => sum + (i.qty * i.price), 0);
      return s + credits;
    }, 0),
    expenses: state.expenses.reduce((s, e) => s + e.amount, 0),
    categories: [...new Set(state.expenses.map(e => e.category))],
    customerCount: state.customers.length,
    activeOrders: state.orders.filter(o => o.status !== 'Completed').length
  };

  try {
    // Initialize GoogleGenAI client with API key from environment variables
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analyze this financial summary for a Stained Glass business and provide 3-4 concise, actionable business insights: ${JSON.stringify(summary)}`,
      config: {
        systemInstruction: "You are a professional financial advisor for small craft businesses. Provide strategic advice based on financial data."
      }
    });

    return response.text || "No insights available at this time.";
  } catch (error) {
    console.error("Gemini Insight Error:", error);
    return "Failed to fetch AI insights. Check your internet connection.";
  }
};