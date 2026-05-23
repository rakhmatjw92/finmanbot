export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  telegramUserId?: string;
  telegramUsername?: string;
  rawMessage?: string;
  type: TransactionType;
  amount: number;
  category: string;
  description: string;
  currency: string;
  date: string; // ISO date string
}

export interface BotConfig {
  telegramBotToken: string;
  botUsername: string;
  webhookUrl: string;
  webhookRegistered: boolean;
  isActive: boolean;
}

export interface BudgetConfig {
  monthlyLimit: number;
  currency: string;
}

export interface AppState {
  transactions: Transaction[];
  botConfig: BotConfig;
  budgetConfig: BudgetConfig;
}

export interface FinancialSummary {
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
  budgetProgress: number; // percentage (0-100+)
  categoryBreakdown: {
    category: string;
    amount: number;
    percentage: number;
    count: number;
  }[];
  recentActivity: Transaction[];
  dailyBreakdown: {
    date: string; // YYYY-MM-DD
    income: number;
    expense: number;
  }[];
}
