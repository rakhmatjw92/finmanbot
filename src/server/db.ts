import fs from 'fs';
import path from 'path';
import { AppState, Transaction, BotConfig, BudgetConfig, Receivable, Debt, Equity } from '../types.js';

const DB_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'finance_db.json');

const DEFAULT_STATE: AppState = {
  transactions: [
    {
      id: 'tx_init_1',
      type: 'expense',
      amount: 50000.00,
      category: 'Food & Dining',
      description: 'Nasi goreng lunch entry (Example)',
      currency: 'IDR',
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      rawMessage: 'makan siang nasi goreng 50000'
    },
    {
      id: 'tx_init_2',
      type: 'income',
      amount: 7500000.00,
      category: 'Freelance',
      description: 'Web design freelance gig (Example)',
      currency: 'IDR',
      date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      rawMessage: 'freelance gig +7500000'
    },
    {
      id: 'tx_init_3',
      type: 'expense',
      amount: 350000.00,
      category: 'Utilities',
      description: 'Monthly internet bill (Example)',
      currency: 'IDR',
      date: new Date().toISOString(),
      rawMessage: 'internet 350000 idr'
    }
  ],
  botConfig: {
    telegramBotToken: '',
    botUsername: '',
    webhookUrl: '',
    webhookRegistered: false,
    isActive: false
  },
  budgetConfig: {
    monthlyLimit: 5000000,
    currency: 'IDR'
  },
  receivables: [
    {
      id: "rcv_1",
      customerName: "Ahmad Kuncoro",
      amount: 4500000,
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      description: "Custom UI Design and wireframing services",
      status: "unpaid",
      dateAdded: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: "rcv_2",
      customerName: "PT Sinergi Sukses",
      amount: 12000000,
      dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      description: "E-Commerce backend API setup milestone",
      status: "unpaid",
      dateAdded: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: "rcv_3",
      customerName: "Jane Doe (Design Lead)",
      amount: 1500000,
      dueDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      description: "Consultancy hours payout",
      status: "paid",
      dateAdded: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
    }
  ],
  debts: [
    {
      id: "debt_1",
      creditorName: "Bank Mandiri Mandiri",
      amount: 25000000,
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      description: "Kredit Usaha Rakyat (KUR) microfinance loan",
      interestRate: 6,
      status: "active",
      dateAdded: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: "debt_2",
      creditorName: "Diana Wijaya (Angel Loan)",
      amount: 50000000,
      dueDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      description: "Zero interest working capital advance",
      interestRate: 0,
      status: "active",
      dateAdded: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString()
    }
  ],
  equities: [
    {
      id: "eq_1",
      investorName: "Hendra Wijaya (Co-Founder)",
      capitalAmount: 150000000,
      sharesPercentage: 35,
      description: "Initial Seed Round Working Capital Injection",
      dateAdded: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: "eq_2",
      investorName: "Lidya Salim",
      capitalAmount: 85000000,
      sharesPercentage: 15,
      description: "Pre-seed angel capital commitment for operations",
      dateAdded: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString()
    }
  ]
};

export function initDb(): AppState {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(DEFAULT_STATE, null, 2), 'utf-8');
    return DEFAULT_STATE;
  }

  try {
    const rawData = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(rawData);
    // Ensure all critical root keys exist
    return {
      transactions: parsed.transactions || [],
      botConfig: { ...DEFAULT_STATE.botConfig, ...parsed.botConfig },
      budgetConfig: { ...DEFAULT_STATE.budgetConfig, ...parsed.budgetConfig },
      receivables: parsed.receivables || DEFAULT_STATE.receivables,
      debts: parsed.debts || DEFAULT_STATE.debts,
      equities: parsed.equities || DEFAULT_STATE.equities
    };
  } catch (error) {
    console.error('Error reading DB, resetting to defaults:', error);
    fs.writeFileSync(DB_FILE, JSON.stringify(DEFAULT_STATE, null, 2), 'utf-8');
    return DEFAULT_STATE;
  }
}

export function saveDb(state: AppState): void {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }
  fs.writeFileSync(DB_FILE, JSON.stringify(state, null, 2), 'utf-8');
}

export function getTransactions(): Transaction[] {
  const state = initDb();
  return state.transactions;
}

export function addTransaction(tx: Omit<Transaction, 'id' | 'date'> & { id?: string; date?: string }): Transaction {
  const state = initDb();
  const newTx: Transaction = {
    id: tx.id || `tx_${Math.random().toString(36).substr(2, 9)}_${Date.now()}`,
    date: tx.date || new Date().toISOString(),
    ...tx
  };
  state.transactions.unshift(newTx);
  saveDb(state);
  return newTx;
}

export function deleteTransaction(id: string): boolean {
  const state = initDb();
  const originalLength = state.transactions.length;
  state.transactions = state.transactions.filter(tx => tx.id !== id);
  if (state.transactions.length !== originalLength) {
    saveDb(state);
    return true;
  }
  return false;
}

export function getBotConfig(): BotConfig {
  const state = initDb();
  // Override from Env if defined and not already set in DB
  const envToken = process.env.TELEGRAM_BOT_TOKEN;
  if (envToken && !state.botConfig.telegramBotToken) {
    state.botConfig.telegramBotToken = envToken;
    state.botConfig.isActive = true;
    saveDb(state);
  }
  return state.botConfig;
}

export function updateBotConfig(token: string, botUsername: string, webhookUrl: string, webhookRegistered: boolean): BotConfig {
  const state = initDb();
  state.botConfig = {
    telegramBotToken: token,
    botUsername,
    webhookUrl,
    webhookRegistered,
    isActive: !!token
  };
  saveDb(state);
  return state.botConfig;
}

export function getBudgetConfig(): BudgetConfig {
  const state = initDb();
  return state.budgetConfig;
}

export function updateBudgetConfig(config: BudgetConfig): BudgetConfig {
  const state = initDb();
  state.budgetConfig = config;
  saveDb(state);
  return state.budgetConfig;
}

// -------------------------------------------------------------
// RECEIVABLES (ACCOUNT RECEIVABLE) DATABASE ACCESSORS
// -------------------------------------------------------------
export function getReceivables(): Receivable[] {
  const state = initDb();
  return state.receivables || [];
}

export function addReceivable(item: Omit<Receivable, 'id' | 'dateAdded'> & { id?: string; dateAdded?: string }): Receivable {
  const state = initDb();
  if (!state.receivables) state.receivables = [];
  const newItem: Receivable = {
    id: item.id || `rcv_${Math.random().toString(36).substr(2, 9)}_${Date.now()}`,
    dateAdded: item.dateAdded || new Date().toISOString(),
    ...item
  };
  state.receivables.unshift(newItem);
  saveDb(state);
  return newItem;
}

export function updateReceivableStatus(id: string, status: 'unpaid' | 'paid' | 'overdue'): boolean {
  const state = initDb();
  if (!state.receivables) return false;
  const item = state.receivables.find(r => r.id === id);
  if (item) {
    item.status = status;
    saveDb(state);
    return true;
  }
  return false;
}

export function deleteReceivable(id: string): boolean {
  const state = initDb();
  if (!state.receivables) return false;
  const originalLength = state.receivables.length;
  state.receivables = state.receivables.filter(r => r.id !== id);
  if (state.receivables.length !== originalLength) {
    saveDb(state);
    return true;
  }
  return false;
}

// -------------------------------------------------------------
// DEBTS DATABASE ACCESSORS
// -------------------------------------------------------------
export function getDebts(): Debt[] {
  const state = initDb();
  return state.debts || [];
}

export function addDebt(item: Omit<Debt, 'id' | 'dateAdded'> & { id?: string; dateAdded?: string }): Debt {
  const state = initDb();
  if (!state.debts) state.debts = [];
  const newItem: Debt = {
    id: item.id || `debt_${Math.random().toString(36).substr(2, 9)}_${Date.now()}`,
    dateAdded: item.dateAdded || new Date().toISOString(),
    ...item
  };
  state.debts.unshift(newItem);
  saveDb(state);
  return newItem;
}

export function updateDebtStatus(id: string, status: 'active' | 'settled'): boolean {
  const state = initDb();
  if (!state.debts) return false;
  const item = state.debts.find(d => d.id === id);
  if (item) {
    item.status = status;
    saveDb(state);
    return true;
  }
  return false;
}

export function deleteDebt(id: string): boolean {
  const state = initDb();
  if (!state.debts) return false;
  const originalLength = state.debts.length;
  state.debts = state.debts.filter(d => d.id !== id);
  if (state.debts.length !== originalLength) {
    saveDb(state);
    return true;
  }
  return false;
}

// -------------------------------------------------------------
// EQUITIES DATABASE ACCESSORS
// -------------------------------------------------------------
export function getEquities(): Equity[] {
  const state = initDb();
  return state.equities || [];
}

export function addEquity(item: Omit<Equity, 'id' | 'dateAdded'> & { id?: string; dateAdded?: string }): Equity {
  const state = initDb();
  if (!state.equities) state.equities = [];
  const newItem: Equity = {
    id: item.id || `eq_${Math.random().toString(36).substr(2, 9)}_${Date.now()}`,
    dateAdded: item.dateAdded || new Date().toISOString(),
    ...item
  };
  state.equities.unshift(newItem);
  saveDb(state);
  return newItem;
}

export function deleteEquity(id: string): boolean {
  const state = initDb();
  if (!state.equities) return false;
  const originalLength = state.equities.length;
  state.equities = state.equities.filter(e => e.id !== id);
  if (state.equities.length !== originalLength) {
    saveDb(state);
    return true;
  }
  return false;
}
