import fs from 'fs';
import path from 'path';
import { AppState, Transaction, BotConfig, BudgetConfig } from '../types.js';

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
  }
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
      budgetConfig: { ...DEFAULT_STATE.budgetConfig, ...parsed.budgetConfig }
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
