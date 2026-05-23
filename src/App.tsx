import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Settings, 
  Info, 
  Calendar, 
  Filter,
  BarChart3,
  Users,
  ShieldAlert,
  Sliders,
  Sparkles,
  ArrowRightLeft
} from 'lucide-react';
import { Transaction, FinancialSummary, BotConfig, Receivable, Debt, Equity } from './types';

// Import subcomponents
import CyberGraph from './components/CyberGraph';
import ReceivablesPage from './components/ReceivablesPage';
import DebtEquityPage from './components/DebtEquityPage';
import IntegrationsPage from './components/IntegrationsPage';

export default function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState<'dashboard' | 'receivables' | 'debt_equity' | 'integrations'>('dashboard');

  // Application Datastores
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [receivables, setReceivables] = useState<Receivable[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [equities, setEquities] = useState<Equity[]>([]);
  const [botConfig, setBotConfig] = useState<BotConfig>({
    telegramBotToken: '',
    botUsername: '',
    webhookUrl: '',
    webhookRegistered: false,
    isActive: false,
    appUrl: ''
  });

  // Budget settings (Default to 5.000.000 IDR)
  const [monthlyLimit, setMonthlyLimit] = useState<number>(5000000);
  const [isUpdatingBudget, setIsUpdatingBudget] = useState<boolean>(false);
  const [newBudgetLimitInput, setNewBudgetLimitInput] = useState<string>('5000000');

  // Manual transaction inputs
  const [manualType, setManualType] = useState<'income' | 'expense'>('expense');
  const [manualAmount, setManualAmount] = useState<string>('');
  const [manualCategory, setManualCategory] = useState<string>('Food & Dining');
  const [manualDesc, setManualDesc] = useState<string>('');
  const [manualDate, setManualDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isFormSubmitting, setIsFormSubmitting] = useState<boolean>(false);

  // Search, indexing & filters for Dash table
  const [searchText, setSearchText] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [typeFilter, setTypeFilter] = useState<string>('All');

  // Loading indicator
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Success notifications
  const [statusMessage, setStatusMessage] = useState<{ text: string; isError: boolean } | null>(null);

  const standardCategories = [
    'Food & Dining', 'Groceries', 'Transport', 'Shopping',
    'Entertainment', 'Salary', 'Investment', 'Utilities',
    'Freelance', 'Other'
  ];

  // Currency utility for Indonesian Rupiah (Always show IDR as primary currency based on user requests)
  const formatMoney = (amount: number, currency: string = 'IDR') => {
    const cleanCurrency = currency ? currency.toUpperCase() : 'IDR';
    if (cleanCurrency === 'IDR') {
      return `Rp ${Math.round(amount).toLocaleString('id-ID')}`;
    }
    return `${cleanCurrency} ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const triggerToast = (text: string, isError: boolean = false) => {
    setStatusMessage({ text, isError });
    setTimeout(() => {
      setStatusMessage(null);
    }, 4000);
  };

  // Fetch all states initially
  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      const [summaryRes, transactionsRes, statusRes, budgetRes, rcvRes, debtsRes, eqRes] = await Promise.all([
        fetch('/api/summary'),
        fetch('/api/transactions'),
        fetch('/api/status'),
        fetch('/api/budget'),
        fetch('/api/receivables'),
        fetch('/api/debts'),
        fetch('/api/equities')
      ]);

      if (summaryRes.ok) setSummary(await summaryRes.json());
      if (transactionsRes.ok) setTransactions(await transactionsRes.json());
      if (statusRes.ok) {
        const statusData = await statusRes.json();
        setBotConfig(statusData);
      }
      if (budgetRes.ok) {
        const budgetData = await budgetRes.json();
        setMonthlyLimit(budgetData.monthlyLimit);
        setNewBudgetLimitInput(budgetData.monthlyLimit.toString());
      }
      if (rcvRes.ok) setReceivables(await rcvRes.json());
      if (debtsRes.ok) setDebts(await debtsRes.json());
      if (eqRes.ok) setEquities(await eqRes.json());
    } catch (e) {
      console.error('Failed to load initially:', e);
      triggerToast('Local server loading error.', true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  // Reload Metrics (Re-sync charts & tables smoothly)
  const reloadMetrics = async () => {
    try {
      const [summaryRes, transactionsRes, rcvRes, debtsRes, eqRes, statusRes] = await Promise.all([
        fetch('/api/summary'),
        fetch('/api/transactions'),
        fetch('/api/receivables'),
        fetch('/api/debts'),
        fetch('/api/equities'),
        fetch('/api/status')
      ]);
      if (summaryRes.ok) setSummary(await summaryRes.json());
      if (transactionsRes.ok) setTransactions(await transactionsRes.json());
      if (rcvRes.ok) setReceivables(await rcvRes.json());
      if (debtsRes.ok) setDebts(await debtsRes.json());
      if (eqRes.ok) setEquities(await eqRes.json());
      if (statusRes.ok) setBotConfig(await statusRes.json());
    } catch (e) {
      console.error('Metrics sync error:', e);
    }
  };

  // 1. Budget settings adjustments
  const handleUpdateBudgetLimit = async (e: React.FormEvent) => {
    e.preventDefault();
    const limit = parseInt(newBudgetLimitInput);
    if (!limit || isNaN(limit) || limit <= 0) {
      return triggerToast('Invalid budget input', true);
    }
    setIsUpdatingBudget(true);
    try {
      const res = await fetch('/api/budget', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ monthlyLimit: limit, currency: 'IDR' })
      });
      if (res.ok) {
        setMonthlyLimit(limit);
        triggerToast('Budget limit saved successfully! ✓');
        await reloadMetrics();
      }
    } catch (error) {
      triggerToast('Failed to save budget settings.', true);
    } finally {
      setIsUpdatingBudget(false);
    }
  };

  // 2. Direct manual log transaction override
  const handleAddManualTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualAmount || !manualDesc.trim()) {
      return triggerToast('Please complete all form inputs', true);
    }
    const parsedAmount = parseFloat(manualAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return triggerToast('Please insert a positive number', true);
    }

    setIsFormSubmitting(true);
    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: manualType,
          amount: parsedAmount,
          category: manualCategory,
          description: manualDesc.trim(),
          currency: 'IDR',
          date: manualDate ? new Date(manualDate).toISOString() : new Date().toISOString()
        })
      });

      if (res.ok) {
        setManualAmount('');
        setManualDesc('');
        setManualDate(new Date().toISOString().split('T')[0]);
        triggerToast('Transaction registered overrides! ✓');
        await reloadMetrics();
      } else {
        triggerToast('Database record registration failed.', true);
      }
    } catch (error) {
      triggerToast('Connection failure to API.', true);
    } finally {
      setIsFormSubmitting(false);
    }
  };

  // 3. Delete Transaction item
  const handleDeleteTransaction = async (id: string) => {
    try {
      const res = await fetch(`/api/transactions/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        triggerToast('Record wiped from database.');
        await reloadMetrics();
      } else {
        triggerToast('Wipe command failed.', true);
      }
    } catch (error) {
      triggerToast('Connection API error.', true);
    }
  };

  // 4. Accounts Receivable Actions
  const handleAddReceivable = async (e: React.FormEvent, data: { customerName: string; amount: number; dueDate: string; description: string }) => {
    try {
      const res = await fetch('/api/receivables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        triggerToast('Accounts receivable registered! ✓');
        await reloadMetrics();
      } else {
        triggerToast('Failed to save receivable record.', true);
      }
    } catch (err) {
      triggerToast('Server sync error.', true);
    }
  };

  const handleToggleReceivableStatus = async (id: string, currentStatus: 'unpaid' | 'paid' | 'overdue') => {
    const nextStatus = currentStatus === 'paid' ? 'unpaid' : 'paid';
    try {
      const res = await fetch(`/api/receivables/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus })
      });
      if (res.ok) {
        triggerToast('Outstanding receivable status updated!');
        await reloadMetrics();
      }
    } catch (err) {
      triggerToast('Fail to swap status.', true);
    }
  };

  const handleDeleteReceivable = async (id: string) => {
    try {
      const res = await fetch(`/api/receivables/${id}`, { method: 'DELETE' });
      if (res.ok) {
        triggerToast('Receivable ledger removed.');
        await reloadMetrics();
      }
    } catch (err) {
      triggerToast('Fail to delete object.', true);
    }
  };

  // 5. Debt Actions
  const handleAddDebt = async (e: React.FormEvent, data: { creditorName: string; amount: number; dueDate: string; description: string; interestRate: number }) => {
    try {
      const res = await fetch('/api/debts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        triggerToast('Debt liability registered successfully! ✓');
        await reloadMetrics();
      } else {
        triggerToast('Failed to write debt record.', true);
      }
    } catch (err) {
      triggerToast('Fail syncing db.', true);
    }
  };

  const handleToggleDebtStatus = async (id: string, currentStatus: 'active' | 'settled') => {
    const nextStatus = currentStatus === 'settled' ? 'active' : 'settled';
    try {
      const res = await fetch(`/api/debts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus })
      });
      if (res.ok) {
        triggerToast('Liability receipt updated!');
        await reloadMetrics();
      }
    } catch (err) {
      triggerToast('Error during action.', true);
    }
  };

  const handleDeleteDebt = async (id: string) => {
    try {
      const res = await fetch(`/api/debts/${id}`, { method: 'DELETE' });
      if (res.ok) {
        triggerToast('Debt obligation removed.');
        await reloadMetrics();
      }
    } catch (err) {
      triggerToast('Fail to remove debt.', true);
    }
  };

  // 6. Equity Actions
  const handleAddEquity = async (e: React.FormEvent, data: { investorName: string; capitalAmount: number; sharesPercentage: number; description: string }) => {
    try {
      const res = await fetch('/api/equities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        triggerToast('Shareholder capital injected! ✓');
        await reloadMetrics();
      } else {
        triggerToast('Failed to log capital contribution.', true);
      }
    } catch (err) {
      triggerToast('Error syncing investments.', true);
    }
  };

  const handleDeleteEquity = async (id: string) => {
    try {
      const res = await fetch(`/api/equities/${id}`, { method: 'DELETE' });
      if (res.ok) {
        triggerToast('Capital transaction wiped.');
        await reloadMetrics();
      }
    } catch (err) {
      triggerToast('Error wiping equity log.', true);
    }
  };

  // 7. Telegram setup settings API hooks
  const handleSaveBotConfig = async (token: string) => {
    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telegramBotToken: token })
      });
      if (res.ok) {
        triggerToast('Credential Token saved successfully.');
        await reloadMetrics();
      } else {
        const errorData = await res.json();
        triggerToast(errorData.error || 'Check core credentials error.', true);
      }
    } catch (err) {
      triggerToast('Credential connection API error.', true);
    }
  };

  const handleRegisterWebhook = async () => {
    try {
      const res = await fetch('/api/webhook/register', {
        method: 'POST'
      });
      if (res.ok) {
        triggerToast('App Webhook successfully hooked to BotFather! ✓');
        await reloadMetrics();
      } else {
        const errorData = await res.json();
        triggerToast(errorData.error || 'Webhook link sync failed.', true);
      }
    } catch (err) {
      triggerToast('Sync error webhook API.', true);
    }
  };

  const handleSimulateMessage = async (text: string) => {
    try {
      const res = await fetch('/api/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, username: 'cyber_tester_usr' })
      });
      if (res.ok) {
        const data = await res.json();
        await reloadMetrics();
        return { success: true, data: data.transaction, rawText: data.rawText };
      } else {
        const errorData = await res.json();
        return { success: false, error: errorData.error || 'Unknown parsing breakdown' };
      }
    } catch (err) {
      return { success: false, error: 'Local backend proxy offline' };
    }
  };

  // Transaction Lists Filters for the wide Dash table
  const filteredTransactions = transactions.filter((tx) => {
    const matchesSearch = tx.description.toLowerCase().includes(searchText.toLowerCase()) ||
                          tx.category.toLowerCase().includes(searchText.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || tx.category === categoryFilter;
    const matchesType = typeFilter === 'All' || tx.type === typeFilter;
    return matchesSearch && matchesCategory && matchesType;
  });

  // KPI Calculations
  const balance = summary ? summary.totalIncome - summary.totalExpense : 0;
  const expenseProgress = summary && monthlyLimit > 0 ? (summary.totalExpense / monthlyLimit) * 100 : 0;

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      
      {/* Background visual neon orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-950/20 blur-[130px]" />
        <div className="absolute bottom-[10%] right-[-10%] w-[45%] h-[45%] rounded-full bg-fuchsia-950/25 blur-[130px]" />
      </div>

      {/* Dynamic Toast Message Overlay */}
      {statusMessage && (
        <div className={`fixed top-6 right-6 p-4 px-6 rounded-2xl z-50 font-mono text-xs font-bold uppercase tracking-wider shadow-[0_0_24px_rgba(0,0,0,0.6)] flex items-center gap-2 border animate-[slideIn_0.2s_ease-out] ${
          statusMessage.isError 
            ? 'bg-rose-950/95 border-rose-500/40 text-rose-300' 
            : 'bg-slate-950/95 border-emerald-500/40 text-emerald-300'
        }`}>
          <span className={`w-2 h-2 rounded-full ${statusMessage.isError ? 'bg-rose-500' : 'bg-emerald-400'}`} />
          {statusMessage.text}
        </div>
      )}

      {/* Top Cyberpunk Header HUD */}
      <header className="sticky top-0 z-40 bg-[#020617]/70 backdrop-blur-xl border-b border-white/[0.06] shadow-xl py-4.5 px-6 xl:px-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Logo & IDR Status Indicator */}
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-tr from-cyan-600 via-cyan-400 to-indigo-500 text-slate-950 rounded-2xl shadow-[0_0_15px_rgba(6,182,212,0.4)] relative">
              <ArrowRightLeft className="w-5 h-5 font-bold" />
              <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-500 -z-10 blur-sm opacity-60" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-black tracking-widest uppercase font-mono bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                  FIN-CHROME
                </span>
                <span className="text-[10px] uppercase bg-cyan-950/40 border border-cyan-500/30 text-cyan-400 px-2.5 py-0.5 rounded-full font-bold font-mono tracking-wider shadow-[0_0_8px_rgba(6,182,212,0.25)]">
                  Rupiah HUD
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-mono tracking-tight uppercase">Cyberpunk personal ledger & bot synchronization</p>
            </div>
          </div>

          {/* Navigation HUD Selection controls */}
          <nav className="flex flex-wrap items-center gap-1 bg-slate-950/60 p-1 border border-white/[0.05] rounded-xl self-stretch md:self-auto select-none">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-4 py-2 text-[10px] font-mono font-extrabold tracking-wider uppercase rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'dashboard' 
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-[0_0_10px_rgba(6,182,212,0.3)]' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.02]'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              DASHBOARD
            </button>
            <button
              onClick={() => setActiveTab('receivables')}
              className={`px-4 py-2 text-[10px] font-mono font-extrabold tracking-wider uppercase rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'receivables' 
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-[0_0_10px_rgba(6,182,212,0.3)]' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.02]'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              RECEIVABLES (PIUTANG)
            </button>
            <button
              onClick={() => setActiveTab('debt_equity')}
              className={`px-4 py-2 text-[10px] font-mono font-extrabold tracking-wider uppercase rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'debt_equity' 
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-[0_0_10px_rgba(6,182,212,0.3)]' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.02]'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              DEBT & EQUITY
            </button>
            <button
              onClick={() => setActiveTab('integrations')}
              className={`px-4 py-2 text-[10px] font-mono font-extrabold tracking-wider uppercase rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'integrations' 
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-[0_0_10px_rgba(6,182,212,0.3)]' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.02]'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              TELEGRAM SYNC
            </button>
          </nav>

          {/* TELEGRAM STATUS HUD PILL */}
          <div className="flex items-center gap-2.5">
            <span className="text-[10px] text-slate-500 font-mono uppercase tracking-widest hidden xl:inline">BOT_STATUS:</span>
            <div className={`p-1 pl-2.5 pr-3.5 rounded-xl border flex items-center gap-1.5 ${
              botConfig.isActive 
                ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.1)]' 
                : 'bg-slate-950 border-white/[0.05] text-slate-500'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${botConfig.isActive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
              <span className="text-[10px] font-mono font-extrabold uppercase tracking-wide">
                {botConfig.isActive ? `@${botConfig.botUsername || 'ACTIVE_BOT'}` : 'DISCONNECTED'}
              </span>
            </div>
          </div>

        </div>
      </header>

      {/* Main Container HUD */}
      <main className="max-w-7xl mx-auto py-8 px-6 xl:px-12 z-10 relative">
        
        {isLoading ? (
          <div className="py-32 flex flex-col items-center justify-center space-y-4">
            <div className="relative">
              <div className="w-12 h-12 rounded-full border border-t-2 border-cyan-500 animate-spin" />
              <Sparkles className="w-5 h-5 text-cyan-400 absolute inset-0 m-auto animate-pulse" />
            </div>
            <p className="text-xs font-mono font-extrabold uppercase tracking-widest text-slate-400">INITIALIZING_SECURE_RECORDS_STREAMS...</p>
          </div>
        ) : (
          <div className="space-y-8">
            
            {/* 1. 📊 ======================= DASHBOARD TAB ======================= */}
            {activeTab === 'dashboard' && (
              <div className="space-y-8 animate-[fadeIn_0.3s_ease-out]">
                
                {/* Balance & Budget Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  {/* Ledger Balance Card */}
                  <div className="glass-iphone rounded-3xl p-6 border-t-2 border-t-cyan-500/40 relative overflow-hidden group">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">NET_REVENUE_BALANCE</span>
                      <Wallet className="w-4 h-4 text-cyan-400" />
                    </div>
                    <div className="space-y-2">
                      <h3 className={`text-2xl font-black font-mono tracking-tight leading-none ${balance >= 0 ? "text-emerald-400" : "text-rose-400 font-bold"}`}>
                        {formatMoney(balance)}
                      </h3>
                      <p className="text-[11px] font-mono text-slate-500">LIQUID AVAILABLE DISCRETIONARY FUNDS</p>
                    </div>
                  </div>

                  {/* Monthly Income Card */}
                  <div className="glass-iphone rounded-3xl p-6 border-t-2 border-t-emerald-500/40 relative overflow-hidden group">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">TOTAL_RECORDS_INCOME</span>
                      <TrendingUp className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-2xl font-black font-mono tracking-tight leading-none text-emerald-400">
                        {formatMoney(summary ? summary.totalIncome : 0)}
                      </h3>
                      <p className="text-[11px] font-mono text-slate-500">INBOUND TRANSACTION HISTORICS (IDR)</p>
                    </div>
                  </div>

                  {/* Monthly Expense Card */}
                  <div className="glass-iphone rounded-3xl p-6 border-t-2 border-t-fuchsia-500/40 relative overflow-hidden group">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">TOTAL_RECORDS_OUTGOINGS</span>
                      <TrendingDown className="w-4 h-4 text-fuchsia-400" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-2xl font-black font-mono tracking-tight leading-none text-fuchsia-400">
                        {formatMoney(summary ? summary.totalExpense : 0)}
                      </h3>
                      <p className="text-[11px] font-mono text-slate-500">OUTBOUND CONSUMPTION OUTGOINGS</p>
                    </div>
                  </div>

                </div>

                {/* Monthly Cyber Limit Indicator & HUD settings */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                  
                  {/* Live Budget limit view */}
                  <div className="lg:col-span-8 glass-iphone rounded-3xl p-5 border border-white/[0.08] shadow-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-6">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">MONTHLY_OBLIGATION_BUDGET: {formatMoney(monthlyLimit)}</span>
                        <span className="text-xs font-mono font-bold text-slate-300">{expenseProgress.toFixed(1)}% LIMIT</span>
                      </div>
                      
                      {/* Interactive sleek Progress limit line */}
                      <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-white/[0.05] p-[2px]">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${
                            expenseProgress >= 100 
                              ? 'bg-rose-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' 
                              : expenseProgress >= 75 
                                ? 'bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.5)]' 
                                : 'bg-gradient-to-r from-cyan-500 to-indigo-500 shadow-[0_0_8px_rgba(6,182,212,0.4)]'
                          }`}
                          style={{ width: `${Math.min(expenseProgress, 100)}%` }}
                        />
                      </div>
                      {expenseProgress >= 100 ? (
                        <p className="text-[10px] text-rose-400 font-bold font-mono uppercase tracking-wider animate-pulse pt-0.5">
                          ⚠️ warning: total expenditures exceeds authorized monthly budget thresholds!
                        </p>
                      ) : (
                        <p className="text-[10px] text-slate-500 font-mono">
                          Remaining authorized consumption cap: {formatMoney(Math.max(0, monthlyLimit - (summary ? summary.totalExpense : 0)))}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Mini-form budget settings adjuster */}
                  <div className="lg:col-span-4 glass-iphone rounded-3xl p-5 border border-white/[0.08] shadow-xl">
                    <form onSubmit={handleUpdateBudgetLimit} className="space-y-3">
                      <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">
                        Reconfigure Authorized Limit (IDR)
                      </label>
                      <div className="flex gap-2">
                        <input 
                          type="number"
                          value={newBudgetLimitInput}
                          onChange={(e) => setNewBudgetLimitInput(e.target.value)}
                          className="flex-1 text-xs px-3 py-2 bg-slate-950 border border-white/[0.08] rounded-xl text-cyan-300 font-mono focus:outline-hidden"
                          placeholder="5000000"
                        />
                        <button
                          type="submit"
                          disabled={isUpdatingBudget}
                          className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 disabled:bg-slate-900 border border-cyan-400/20 text-slate-950 font-extrabold text-xs uppercase font-mono tracking-wider transition-all cursor-pointer rounded-xl"
                        >
                          SET
                        </button>
                      </div>
                    </form>
                  </div>

                </div>

                {/* SVG Visual GIGANTIC Chart & Category Shares side-by-side */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                  
                  {/* Glowing line graphic */}
                  <div className="lg:col-span-8 glass-iphone rounded-3xl p-6 border border-white/[0.08] shadow-2xl flex flex-col justify-between">
                    <div>
                      <h2 className="text-sm font-bold uppercase tracking-wider text-white font-mono flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(6,182,212,0.6)]"></span>
                        Daily Cash Flow Trends
                      </h2>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">INBOUND VS OUTBOUND CYCLES (RP)</p>
                    </div>

                    <div className="mt-6">
                      <CyberGraph 
                        dailyBreakdown={summary ? summary.dailyBreakdown : []} 
                        formatMoney={formatMoney} 
                      />
                    </div>
                  </div>

                  {/* Category Breakdown list */}
                  <div className="lg:col-span-4 glass-iphone rounded-3xl p-6 border border-white/[0.08] shadow-2xl flex flex-col justify-between">
                    <div>
                      <h2 className="text-sm font-bold uppercase tracking-wider text-white font-mono flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 shadow-[0_0_6px_rgba(129,140,248,0.6)]"></span>
                        Category Allocation Shares
                      </h2>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">DASHBOARD SEGMENT PERCENTAGES</p>
                    </div>

                    <div className="space-y-4.5 mt-6 mb-1 flex-1 flex flex-col justify-center">
                      {!summary || !summary.categoryBreakdown || summary.categoryBreakdown.length === 0 ? (
                        <div className="py-12 text-center text-slate-600 font-mono text-[10px] uppercase tracking-widest">
                          AWAITING_ALLOCATION_METRICS
                        </div>
                      ) : (
                        summary.categoryBreakdown.slice(0, 6).map((cat) => {
                          const valStr = formatMoney(cat.amount);
                          return (
                            <div key={cat.category} className="space-y-1.5">
                              <div className="flex justify-between items-center text-[11px] font-mono leading-none">
                                <span className="text-slate-200 font-semibold">{cat.category}</span>
                                <span className="text-cyan-400 font-extrabold">{valStr} ({cat.percentage.toFixed(0)}%)</span>
                              </div>
                              <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-white/[0.03]">
                                <div 
                                  className="h-full bg-cyan-500 shadow-[0_0_6px_rgba(6,182,212,0.3)] transition-all" 
                                  style={{ width: `${Math.min(cat.percentage, 100)}%` }}
                                />
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                </div>

                {/* Direct Entry Manual form drawer overridden inside dashboard view */}
                <div className="glass-iphone rounded-3xl p-6 border border-white/[0.08]">
                  <div className="flex items-center gap-2 mb-4">
                    <Plus className="w-4 h-4 text-cyan-400" />
                    <h2 className="text-sm font-extrabold font-mono text-white uppercase tracking-wider">Direct Transaction Log Override</h2>
                  </div>

                  <form onSubmit={handleAddManualTransaction} className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    {/* Select manual Type */}
                    <div>
                      <label className="block text-[9px] font-mono font-bold text-slate-500 uppercase tracking-widest mb-1.5">Transaction Type</label>
                      <select 
                        value={manualType} 
                        onChange={(e) => setManualType(e.target.value as any)}
                        className="w-full text-xs px-2.5 py-2.5 rounded-lg border border-white/[0.08] focus:border-cyan-500/50 bg-slate-950 text-cyan-400 font-mono focus:outline-hidden"
                      >
                        <option value="expense">Expense 📉</option>
                        <option value="income">Income 📈</option>
                      </select>
                    </div>

                    {/* Numeric Value Amount */}
                    <div>
                      <label className="block text-[9px] font-mono font-bold text-slate-500 uppercase tracking-widest mb-1.5">Amount (IDR)</label>
                      <input 
                        type="number" 
                        placeholder="50000"
                        value={manualAmount}
                        onChange={(e) => setManualAmount(e.target.value)}
                        required
                        className="w-full text-xs px-3 py-2 text-cyan-300 rounded-lg border border-white/[0.08] focus:border-cyan-500/50 bg-slate-950 font-mono focus:outline-hidden"
                      />
                    </div>

                    {/* Choose category select line */}
                    <div>
                      <label className="block text-[9px] font-mono font-bold text-slate-500 uppercase tracking-widest mb-1.5">Budget Category</label>
                      <select 
                        value={manualCategory} 
                        onChange={(e) => setManualCategory(e.target.value)}
                        className="w-full text-xs px-2.5 py-2.5 rounded-lg border border-white/[0.08] focus:border-cyan-500/50 bg-slate-950 text-cyan-400 font-mono focus:outline-hidden"
                      >
                        {standardCategories.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>

                    {/* Write text descriptive log details */}
                    <div className="md:col-span-2 flex items-end gap-2">
                      <div className="flex-1">
                        <label className="block text-[9px] font-mono font-bold text-slate-500 uppercase tracking-widest mb-1.5">Descriptive Details</label>
                        <input 
                          type="text" 
                          placeholder="E.g. Warteg nasi lodeh campur"
                          value={manualDesc}
                          onChange={(e) => setManualDesc(e.target.value)}
                          required
                          className="w-full text-xs px-3 py-2 rounded-lg border border-white/[0.08] focus:border-cyan-500/50 bg-slate-950 text-slate-200 focus:outline-hidden placeholder:text-slate-700"
                        />
                      </div>
                      <button 
                        type="submit" 
                        disabled={isFormSubmitting}
                        className="bg-cyan-500 hover:bg-cyan-600 disabled:bg-slate-950 border border-cyan-450/20 text-slate-950 font-black p-2 px-5.5 h-[37px] rounded-lg text-xs uppercase font-mono tracking-wider transition-all cursor-pointer shadow-[0_0_12px_rgba(6,182,212,0.25)]"
                      >
                        {isFormSubmitting ? 'LOGGING...' : 'LOG'}
                      </button>
                    </div>
                  </form>
                </div>

                {/* GIGANTIC Full Width Transactions Ledger panel */}
                <div className="glass-iphone rounded-3xl border border-white/[0.08] shadow-2xl overflow-hidden" id="dashboard-ledger-table">
                  <div className="p-6 border-b border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-sm font-bold uppercase tracking-wider text-white font-mono flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(6,182,212,0.6)]"></span>
                        Cash Transactions Ledger
                      </h2>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">AUTHENTICATED DIGITAL HISTORIES</p>
                    </div>

                    {/* Inputs filters search bar */}
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Search Details input */}
                      <input 
                        type="text"
                        placeholder="SEARCH STATEMENTS..."
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        className="px-3.5 py-1.5 bg-slate-950 border border-white/[0.08] text-xs rounded-lg focus:outline-hidden focus:border-cyan-500/80 text-cyan-300 font-mono placeholder:text-slate-700"
                      />

                      {/* Select Inflow Outflow selection filter */}
                      <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        className="px-3 py-1.5 bg-slate-950 border border-white/[0.08] text-xs rounded-lg focus:outline-hidden text-cyan-400 font-mono select-none"
                      >
                        <option value="All">ALL_TYPES</option>
                        <option value="expense">ONLY_EXPENSES 📉</option>
                        <option value="income">ONLY_INCOME 📈</option>
                      </select>

                      {/* Select Category filter */}
                      <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="px-3 py-1.5 bg-slate-950 border border-white/[0.08] text-xs rounded-lg focus:outline-hidden text-cyan-400 font-mono select-none"
                      >
                        <option value="All">ALL_CATEGORIES</option>
                        {standardCategories.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {filteredTransactions.length === 0 ? (
                    <div className="py-24 flex flex-col items-center justify-center text-slate-500 font-mono">
                      <ArrowRightLeft className="w-8 h-8 text-slate-800 mb-2" />
                      <p className="text-xs font-bold uppercase tracking-widest text-slate-400">NO_RECORDS_PREFLIGHT</p>
                      <p className="text-[10px] text-slate-600 mt-0.5">No logged movements found matching filter configurations.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-950/85 border-b border-white/[0.06] text-cyan-400 font-bold uppercase tracking-wider text-[10px] font-mono">
                            <th className="px-6 py-4">Transaction Details</th>
                            <th className="px-6 py-4">Category</th>
                            <th className="px-6 py-4">Fulfillment Source</th>
                            <th className="px-6 py-4 text-right">Amount (IDR)</th>
                            <th className="px-6 py-4 text-center">Receipt</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.04] text-slate-300">
                          {filteredTransactions.map((tx) => {
                            const isExpense = tx.type === 'expense';
                            return (
                              <tr key={tx.id} className="hover:bg-white/[0.02] transition-colors">
                                <td className="px-6 py-4">
                                  <div className="font-bold text-slate-100">{tx.description}</div>
                                  <div className="text-[10px] text-slate-500 font-mono mt-1 flex items-center gap-1 leading-none">
                                    <Calendar className="w-3.5 h-3.5 text-cyan-500" />
                                    {new Date(tx.date).toLocaleDateString(undefined, {
                                      year: 'numeric',
                                      month: 'short',
                                      day: 'numeric'
                                    })}
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <span className="inline-block px-2 py-0.5 rounded bg-cyan-950/50 text-cyan-300 border border-cyan-500/10 text-[10px] font-mono">
                                    {tx.category}
                                  </span>
                                </td>
                                <td className="px-6 py-4">
                                  {tx.telegramUsername ? (
                                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-indigo-950/40 text-indigo-300 text-[10px] font-mono border border-indigo-500/10">
                                      💬 tg robot (@{tx.telegramUsername})
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-950/80 text-slate-400 text-[10px] font-mono border border-white/[0.05]">
                                      🖥️ dashboard admin
                                    </span>
                                  )}
                                  {tx.rawMessage && (
                                    <p className="text-[9px] italic text-slate-600 truncate max-w-[200px] mt-1 font-mono">
                                      "{tx.rawMessage}"
                                    </p>
                                  )}
                                </td>
                                <td className="px-6 py-4 text-right font-mono font-extrabold text-sm whitespace-nowrap">
                                  <span className={isExpense ? 'text-fuchsia-400' : 'text-emerald-400'}>
                                    {isExpense ? '-' : '+'}{formatMoney(tx.amount || 0, tx.currency)}
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-center">
                                  <button
                                    onClick={() => handleDeleteTransaction(tx.id)}
                                    className="p-1 px-2.5 text-rose-450 hover:text-white bg-rose-950/20 hover:bg-rose-900 border border-rose-900/40 hover:border-rose-600 rounded-lg transition-all font-mono text-[9px] uppercase cursor-pointer flex items-center gap-0.5 mx-auto"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                    [Wipe]
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* 2. 🤝 ======================= ACCOUNTS RECEIVABLE TAB ======================= */}
            {activeTab === 'receivables' && (
              <ReceivablesPage 
                receivables={receivables}
                onAddReceivable={handleAddReceivable}
                onToggleStatus={handleToggleReceivableStatus}
                onDelete={handleDeleteReceivable}
                formatMoney={formatMoney}
              />
            )}

            {/* 3. 💸 ======================= DEB_EQUITY TAB ======================= */}
            {activeTab === 'debt_equity' && (
              <DebtEquityPage 
                debts={debts}
                equities={equities}
                onAddDebt={handleAddDebt}
                onToggleDebtStatus={handleToggleDebtStatus}
                onDeleteDebt={handleDeleteDebt}
                onAddEquity={handleAddEquity}
                onDeleteEquity={handleDeleteEquity}
                formatMoney={formatMoney}
              />
            )}

            {/* 4. ⚙️ ======================= TELEGRAM WEBHOOK CONNECTIONS ======================= */}
            {activeTab === 'integrations' && (
              <IntegrationsPage 
                botConfig={botConfig}
                onSaveConfig={handleSaveBotConfig}
                onRegisterWebhook={handleRegisterWebhook}
                onSimulateMessage={handleSimulateMessage}
              />
            )}

          </div>
        )}
      </main>
    </div>
  );
}
