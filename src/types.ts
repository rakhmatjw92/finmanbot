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

export interface Receivable {
  id: string;
  customerName: string;
  amount: number;
  dueDate: string;
  description: string;
  status: 'unpaid' | 'paid' | 'overdue';
  dateAdded: string;
}

export interface Debt {
  id: string;
  creditorName: string;
  amount: number;
  dueDate: string;
  description: string;
  interestRate: number; // percentage
  status: 'active' | 'settled';
  dateAdded: string;
}

export interface Equity {
  id: string;
  investorName: string;
  capitalAmount: number;
  sharesPercentage: number; // ownership percentage
  description: string;
  dateAdded: string;
}

export interface AppState {
  transactions: Transaction[];
  botConfig: BotConfig;
  budgetConfig: BudgetConfig;
  receivables?: Receivable[];
  debts?: Debt[];
  equities?: Equity[];
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
