import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, 
  Plus, 
  Trash2, 
  Download, 
  Sliders, 
  HelpCircle, 
  Send, 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  CheckCircle, 
  X, 
  Settings, 
  Info, 
  LineChart, 
  AlertCircle,
  Sparkles,
  Calendar,
  Filter
} from 'lucide-react';
import { Transaction, FinancialSummary, BotConfig } from './types.js';

export default function App() {
  // Application State
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [botConfig, setBotConfig] = useState<any>({
    telegramBotToken: '',
    botUsername: '',
    webhookUrl: '',
    webhookRegistered: false,
    isActive: false,
    appUrl: ''
  });
  
  // Currency Utility for Indonesian Rupiah
  const formatMoney = (amount: number, currency: string = 'IDR') => {
    const cleanCurrency = currency ? currency.toUpperCase() : 'IDR';
    if (cleanCurrency === 'IDR') {
      return `Rp ${Math.round(amount).toLocaleString('id-ID')}`;
    }
    return `${cleanCurrency} ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };
  
  // Loading & UI States
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [tokenInput, setTokenInput] = useState<string>('');
  const [isConfiguringToken, setIsConfiguringToken] = useState<boolean>(false);
  const [configError, setConfigError] = useState<string>('');
  const [configSuccess, setConfigSuccess] = useState<boolean>(false);
  
  // Budget Form States (Default to 5,000,000 IDR)
  const [monthlyLimit, setMonthlyLimit] = useState<number>(5000000);
  const [isUpdatingBudget, setIsUpdatingBudget] = useState<boolean>(false);
  
  // Manual Transaction Form
  const [manualType, setManualType] = useState<'income' | 'expense'>('expense');
  const [manualAmount, setManualAmount] = useState<string>('');
  const [manualCategory, setManualCategory] = useState<string>('Food & Dining');
  const [manualDesc, setManualDesc] = useState<string>('');
  const [manualDate, setManualDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isFormSubmitting, setIsFormSubmitting] = useState<boolean>(false);
  
  // Simulated Bot Chat state
  const [simulatedChat, setSimulatedChat] = useState<Array<{ sender: 'user' | 'bot', text: string, date: string }>>([
    { 
      sender: 'bot', 
      text: '🤖 Welcome to your financial simulation assistant!\n\nType in a standard finance entry and send it to test the AI parser.', 
      date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
    }
  ]);
  const [simulatedInput, setSimulatedInput] = useState<string>('');
  const [isSimulatingResponse, setIsSimulatingResponse] = useState<boolean>(false);
  
  // Search & Filter state
  const [searchText, setSearchText] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [typeFilter, setTypeFilter] = useState<string>('All');
  
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Standard static lists
  const standardCategories = [
    'Food & Dining', 'Groceries', 'Transport', 'Shopping',
    'Entertainment', 'Salary', 'Investment', 'Utilities',
    'Freelance', 'Other'
  ];

  const simulationPresets = [
    "Makan siang prasmanan Rp35.000",
    "Gojek ke stasiun 15k",
    "Gaji bulanan freelance +5000000",
    "Bayar tagihan listrik 150000",
    "Belanja mingguan di Superindo 240k"
  ];

  // Fetch initial datasets
  useEffect(() => {
    fetchInitialData();
  }, []);

  // Scroll to bottom of simulation chat
  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [simulatedChat, isSimulatingResponse]);

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      const [summaryRes, transactionsRes, statusRes, budgetRes] = await Promise.all([
        fetch('/api/summary'),
        fetch('/api/transactions'),
        fetch('/api/status'),
        fetch('/api/budget')
      ]);

      if (summaryRes.ok) setSummary(await summaryRes.json());
      if (transactionsRes.ok) setTransactions(await transactionsRes.json());
      if (statusRes.ok) {
        const statusData = await statusRes.json();
        setBotConfig(statusData);
        setTokenInput(statusData.telegramBotToken ? 'Existing Bot Token Configured' : '');
      }
      if (budgetRes.ok) {
        const budgetData = await budgetRes.json();
        setMonthlyLimit(budgetData.monthlyLimit);
      }
    } catch (e) {
      console.error('Failed to load initial metrics:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const reloadMetrics = async () => {
    try {
      const [summaryRes, transactionsRes] = await Promise.all([
        fetch('/api/summary'),
        fetch('/api/transactions')
      ]);
      if (summaryRes.ok) setSummary(await summaryRes.json());
      if (transactionsRes.ok) setTransactions(await transactionsRes.json());
    } catch (e) {
      console.error('Metrics sync error:', e);
    }
  };

  // Configure Telegram Bot token
  const handleSaveToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenInput || tokenInput.trim() === '') {
      return;
    }
    
    setIsConfiguringToken(true);
    setConfigError('');
    setConfigSuccess(false);

    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: tokenInput.trim() })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to authorize this Bot Token with Telegram.');
      }
      
      setConfigSuccess(true);
      setBotConfig({
        ...botConfig,
        telegramBotToken: '••••••••' + tokenInput.trim().slice(-5),
        botUsername: data.botUsername,
        webhookUrl: data.webhookUrl,
        webhookRegistered: data.webhookRegistered,
        isActive: true
      });
    } catch (err: any) {
      setConfigError(err.message || 'Verification Error. Make sure token is valid from @BotFather.');
    } finally {
      setIsConfiguringToken(false);
    }
  };

  // Clear Token
  const handleRemoveToken = async () => {
    if (!window.confirm('Are you sure you want to stop the bot and disable the telegram webhook integration?')) return;
    
    setIsConfiguringToken(true);
    try {
      await fetch('/api/config', { method: 'DELETE' });
      setBotConfig({
        telegramBotToken: '',
        botUsername: '',
        webhookUrl: '',
        webhookRegistered: false,
        isActive: false
      });
      setTokenInput('');
      setConfigSuccess(false);
    } catch (err) {
      console.error('Removal failed:', err);
    } finally {
      setIsConfiguringToken(false);
    }
  };

  // Save manual Budget configuration
  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingBudget(true);
    try {
      const res = await fetch('/api/budget', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ monthlyLimit })
      });
      if (res.ok) {
        await reloadMetrics();
      }
    } catch (err) {
      console.error('Failed to configure budget limit:', err);
    } finally {
      setIsUpdatingBudget(false);
    }
  };

  // Perform Manual Transaction Submission
  const handleAddManualTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualAmount || isNaN(parseFloat(manualAmount)) || parseFloat(manualAmount) <= 0) {
      alert('Please enter a valid positive numeric amount');
      return;
    }
    if (!manualDesc.trim()) {
      alert('Please enter a clear description');
      return;
    }

    setIsFormSubmitting(true);
    try {
      const formattedDate = manualDate ? new Date(manualDate).toISOString() : new Date().toISOString();
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: manualType,
          amount: parseFloat(manualAmount),
          category: manualCategory,
          description: manualDesc.trim(),
          currency: 'IDR',
          date: formattedDate
        })
      });

      if (res.ok) {
        setManualAmount('');
        setManualDesc('');
        await reloadMetrics();
      }
    } catch (err) {
      console.error('Failed to save manual transaction:', err);
    } finally {
      setIsFormSubmitting(false);
    }
  };

  // Simulate Telegram Message Send (AI Parsing playground)
  const handleSendSimulatedMsg = async (textToSend?: string) => {
    const finalMsg = textToSend || simulatedInput;
    if (!finalMsg || finalMsg.trim() === '') return;

    if (!textToSend) setSimulatedInput('');

    // Append user bubble
    const userTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setSimulatedChat(prev => [...prev, {
      sender: 'user',
      text: finalMsg,
      date: userTime
    }]);

    setIsSimulatingResponse(true);

    try {
      const res = await fetch('/api/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: finalMsg })
      });
      const data = await res.json();
      
      const botTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      if (res.ok) {
        setSimulatedChat(prev => [...prev, {
          sender: 'bot',
          text: data.botReply,
          date: botTime
        }]);
        // Update charts synchronously
        await reloadMetrics();
      } else {
        setSimulatedChat(prev => [...prev, {
          sender: 'bot',
          text: `⚠️ Parse Error: ${data.error || 'Gemini processing failed.'}`,
          date: botTime
        }]);
      }
    } catch (err: any) {
      const botTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setSimulatedChat(prev => [...prev, {
        sender: 'bot',
        text: `⚠️ Connection failure. Is the server running?`,
        date: botTime
      }]);
    } finally {
      setIsSimulatingResponse(false);
    }
  };

  // Handle Transaction Removal
  const handleDeleteTransaction = async (id: string) => {
    if (!window.confirm('Delete this transaction?')) return;
    try {
      const res = await fetch(`/api/transactions/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        await reloadMetrics();
      }
    } catch (err) {
      console.error('Transaction deletion failed:', err);
    }
  };

  // Filter Transaction listing
  const filteredTransactions = transactions.filter(tx => {
    const matchSearch = tx.description.toLowerCase().includes(searchText.toLowerCase()) ||
                        tx.category.toLowerCase().includes(searchText.toLowerCase()) ||
                        (tx.rawMessage && tx.rawMessage.toLowerCase().includes(searchText.toLowerCase()));
    const matchCategory = categoryFilter === 'All' || tx.category === categoryFilter;
    const matchType = typeFilter === 'All' || tx.type === typeFilter;
    return matchSearch && matchCategory && matchType;
  });

  return (
    <div className="min-h-screen bg-[#f8fafc] text-gray-900 font-sans selection:bg-emerald-100 selection:text-emerald-900 antialiased">
      {/* Header Bar */}
      <header className="sticky top-0 z-30 bg-white border-b border-gray-100 shadow-xs">
        <div id="header_container" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500 rounded-xl text-white shadow-md shadow-emerald-500/20">
              <Bot className="w-6 h-6" id="header_logo" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-gray-900">Finance Bot Dashboard</h1>
              <p className="text-xs text-gray-500 font-medium">Ai-Generated Personal Finance Ledger</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {botConfig.isActive ? (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100 gap-1.5 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                Bot Live: @{botConfig.botUsername}
              </span>
            ) : (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-100 gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                Bot Pending Token
              </span>
            )}
            
            <a 
              href="/api/export" 
              className="text-gray-600 hover:text-emerald-600 bg-gray-50 hover:bg-emerald-50 p-2.5 rounded-xl border border-gray-200 transition-all flex items-center gap-2 text-sm font-semibold"
              title="Download transaction sheet"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export CSV</span>
            </a>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-emerald-500 border-t-transparent shadow-xs"></div>
            <p className="text-sm font-medium text-gray-500">Retrieving secure financial records...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left Hand: Config instructions and interactive simulation */}
            <div className="lg:col-span-5 flex flex-col gap-8">
              
              {/* Telegram Bot Father Activation Setup */}
              <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Settings className="w-5 h-5 text-gray-500" />
                  <h2 className="text-md font-bold text-gray-900">Telegram Bot Integration</h2>
                </div>
                
                {!botConfig.isActive ? (
                  <div id="bot_setup_unconfigured">
                    <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                      Follow these simple steps with BotFather to configure your real bot webhook instantly:
                    </p>
                    <ol className="text-xs text-slate-600 space-y-2.5 pl-4 list-decimal mb-5">
                      <li>Use Telegram app, search and chat with <a href="https://t.me/BotFather" target="_blank" rel="noreferrer" className="text-emerald-600 font-bold hover:underline">@BotFather</a></li>
                      <li>Send command <code className="px-1.5 py-0.5 rounded-sm bg-gray-100 font-mono text-[11px]">/newbot</code> and follow prompts to specify your Bot name and handle.</li>
                      <li>Copy the generated <b>HTTP API Token</b> (e.g., <code className="font-mono text-gray-600 font-medium">5813..:AAH..</code>).</li>
                      <li>Enter this token below to register the Live Webhook with this server.</li>
                    </ol>

                    <form onSubmit={handleSaveToken} className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Telegram Bot API Token</label>
                        <input 
                          type="password" 
                          placeholder="PASTE YOUR BOT_TOKEN HERE"
                          value={tokenInput} 
                          onChange={(e) => setTokenInput(e.target.value)}
                          className="w-full text-xs font-mono px-3.5 py-2.5 rounded-lg border border-gray-200 focus:outline-hidden focus:border-emerald-500 bg-slate-50 focus:bg-white transition-all text-gray-800"
                        />
                      </div>
                      <button 
                        type="submit" 
                        disabled={isConfiguringToken || !tokenInput}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white font-bold py-2.5 px-4 rounded-lg text-xs transition-colors shadow-sm cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        {isConfiguringToken ? 'Validating Token...' : 'Connect Telegram Bot'}
                      </button>
                    </form>

                    {configError && (
                      <div className="mt-3 p-3 bg-red-50 text-red-700 border border-red-100 rounded-lg text-xs flex gap-2 items-start leading-relaxed">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>{configError}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div id="bot_setup_configured" className="space-y-4">
                    <div className="p-4 bg-emerald-50/50 rounded-lg border border-emerald-100 text-xs">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-gray-900 flex items-center gap-1.5 text-emerald-800">
                          <CheckCircle className="w-4 h-4 text-emerald-600" />
                          INTEGRATION ACTIVE
                        </span>
                        <button 
                          onClick={handleRemoveToken}
                          className="text-red-600 hover:text-red-800 font-bold hover:underline bg-transparent border-none cursor-pointer"
                        >
                          Disconnect
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2 py-1 border-t border-emerald-100/50 mt-1 first-of-type:border-t-0">
                        <span className="text-gray-500 font-medium">Bot Account:</span>
                        <span className="col-span-2 text-gray-800 font-mono font-bold">
                          <a href={`https://t.me/${botConfig.botUsername}`} target="_blank" rel="noreferrer" className="text-emerald-600 hover:underline">
                            @{botConfig.botUsername}
                          </a>
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 py-1">
                        <span className="text-gray-500 font-medium">Token:</span>
                        <span className="col-span-2 text-gray-500 font-mono text-[10px] truncate">{botConfig.telegramBotToken}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 py-1">
                        <span className="text-gray-500 font-medium">Webhook URL:</span>
                        <span className="col-span-2 text-gray-500 font-mono text-[10px] truncate">{botConfig.webhookUrl || 'Not configured (check setup)'}</span>
                      </div>
                    </div>
                    
                    <div className="p-3.5 bg-gray-50 rounded-lg text-xs text-gray-600 border border-gray-100 leading-relaxed">
                      <div className="flex items-center gap-1.5 font-bold text-gray-700 mb-1">
                        <Info className="w-3.5 h-3.5 text-blue-500" />
                        Live Usage Instructions
                      </div>
                      Open your Telegram app, search for <a href={`https://t.me/${botConfig.botUsername}`} className="font-bold text-emerald-600 hover:underline">@{botConfig.botUsername}</a> and hit Start! Send any regular message like <code className="bg-white px-1 border border-gray-200 rounded font-mono text-[10px]">Warteg makan siang 25000</code> or <code className="bg-white px-1 border border-gray-200 rounded font-mono text-[10px]">+150k bonus salary</code>.
                    </div>
                  </div>
                )}
              </div>

              {/* Bot Interaction Parser Playground Simulator */}
              <div className="bg-gray-900 text-slate-100 rounded-2xl p-6 shadow-xl relative overflow-hidden h-[450px] flex flex-col">
                {/* Simulated Device Frame Top */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-700"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-700"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-700"></span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold tracking-tight uppercase">
                    <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                    AI Simulator Playground
                  </div>
                </div>

                {/* Simulated messages pane */}
                <div className="flex-1 overflow-y-auto space-y-3 pb-3 pr-1 text-xs">
                  {simulatedChat.map((chat, i) => (
                    <div key={i} className={`flex ${chat.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] rounded-xl px-3.5 py-2.5 shadow-sm leading-relaxed ${
                        chat.sender === 'user' 
                          ? 'bg-emerald-600 text-white rounded-br-none' 
                          : 'bg-slate-800 text-slate-100 rounded-bl-none whitespace-pre-wrap font-sans border border-slate-700'
                      }`}>
                        <div dangerouslySetInnerHTML={{ __html: chat.text.replace(/\n/g, '<br/>') }} />
                        <span className="block text-[9px] text-slate-400 mt-1 text-right text-opacity-85 font-mono">{chat.date}</span>
                      </div>
                    </div>
                  ))}
                  
                  {isSimulatingResponse && (
                    <div className="flex justify-start">
                      <div className="bg-slate-800 border border-slate-700 rounded-xl rounded-bl-none px-4 py-2 text-slate-400 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                        <span className="text-[10px] text-slate-400 ml-1.5 font-medium animate-pulse">Gemini parsing...</span>
                      </div>
                    </div>
                  )}
                  <div ref={chatBottomRef} />
                </div>

                {/* Preset helpers */}
                <div className="mb-3">
                  <p className="text-[10px] text-slate-400 mb-1.5 font-bold tracking-wider uppercase">Sample Commands (Click to test):</p>
                  <div className="flex flex-wrap gap-1.5">
                    {simulationPresets.map((preset, idx) => (
                      <button 
                        type="button"
                        key={idx}
                        disabled={isSimulatingResponse}
                        onClick={() => handleSendSimulatedMsg(preset)}
                        className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded-md border border-slate-700/60 transition-colors cursor-pointer text-left truncate max-w-[200px]"
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Form to submit chat */}
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="E.g. Beli kopi susu 15k atau gaji freelance +5000000" 
                    value={simulatedInput}
                    disabled={isSimulatingResponse}
                    onChange={(e) => setSimulatedInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSendSimulatedMsg();
                    }}
                    className="flex-1 bg-slate-800 hover:bg-slate-800/80 focus:bg-slate-800 border border-slate-700 focus:border-emerald-500 rounded-lg px-3.5 py-2.5 text-xs focus:outline-hidden text-slate-100 placeholder:text-slate-500"
                  />
                  <button 
                    onClick={() => handleSendSimulatedMsg()}
                    disabled={isSimulatingResponse || !simulatedInput.trim()}
                    className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-700 text-white p-2.5 rounded-lg transition-colors flex items-center justify-center shrink-0 cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>

            </div>

            {/* Right Hand: Dashboard Metrics and charts */}
            <div className="lg:col-span-7 flex flex-col gap-8">
              
              {/* Financial Dashboard Overview cards */}
              {summary && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  
                  {/* Account Net Balance */}
                  <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs flex items-center gap-4 relative overflow-hidden">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                      <Wallet className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="block text-xs font-semibold text-gray-400 uppercase tracking-wide">Net Balance</span>
                      <span className={`text-xl font-extrabold font-mono ${
                        summary.netBalance >= 0 ? 'text-emerald-600' : 'text-rose-600'
                      }`}>
                        {summary.netBalance < 0 ? '-' : ''}{formatMoney(Math.abs(summary.netBalance))}
                      </span>
                    </div>
                  </div>
                  
                  {/* Income Total */}
                  <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs flex items-center gap-4">
                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="block text-xs font-semibold text-gray-400 uppercase tracking-wide">Total Income</span>
                      <span className="text-xl font-extrabold font-mono text-emerald-600">
                        {formatMoney(summary.totalIncome)}
                      </span>
                    </div>
                  </div>

                  {/* Expense Total */}
                  <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs flex items-center gap-4">
                    <div className="p-3 bg-red-50 text-red-600 rounded-xl">
                      <TrendingDown className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="block text-xs font-semibold text-gray-400 uppercase tracking-wide">Total Expenses</span>
                      <span className="text-xl font-extrabold font-mono text-rose-600">
                        {formatMoney(summary.totalExpense)}
                      </span>
                    </div>
                  </div>

                </div>
              )}

              {/* Dynamic Budget Limit Progress Block */}
              <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-xs">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-5 h-5 text-gray-500" />
                    <h2 className="text-md font-bold text-gray-900">Monthly Budget Limits</h2>
                  </div>
                  
                  <form onSubmit={handleSaveBudget} className="flex gap-2 items-center w-full sm:w-auto">
                    <div className="relative">
                      <span className="absolute left-2 top-1.5 text-xs text-gray-400 font-mono font-bold">Rp</span>
                      <input 
                        type="number" 
                        value={monthlyLimit}
                        onChange={(e) => setMonthlyLimit(parseInt(e.target.value) || 0)}
                        className="w-28 pl-7 pr-2 py-1 bg-gray-50 border border-gray-200 text-xs rounded-md focus:outline-hidden focus:border-emerald-500 font-mono font-medium text-gray-800"
                        placeholder="Limit amount"
                      />
                    </div>
                    <button 
                      type="submit" 
                      disabled={isUpdatingBudget}
                      className="px-3 py-1 bg-gray-900 hover:bg-gray-800 transition-colors text-white font-bold text-xs rounded-md cursor-pointer"
                    >
                      {isUpdatingBudget ? 'Saving...' : 'Set Limit'}
                    </button>
                  </form>
                </div>

                {summary && (
                  <div className="space-y-3">
                    <div className="flex justify-between text-xs text-gray-600 font-semibold font-mono">
                      <span>Spent: {formatMoney(summary.totalExpense)}</span>
                      <span>Progress: {summary.budgetProgress}% of {formatMoney(monthlyLimit)}</span>
                    </div>
                    
                    {/* Visual Progress bar container */}
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden flex">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          summary.budgetProgress > 100 
                            ? 'bg-rose-500 animate-pulse' 
                            : summary.budgetProgress > 85 
                              ? 'bg-amber-500' 
                              : 'bg-emerald-500'
                        }`} 
                        style={{ width: `${Math.min(summary.budgetProgress, 100)}%` }}
                      ></div>
                    </div>

                    {/* Alert checks */}
                    {summary.budgetProgress > 100 ? (
                      <div className="p-3.5 bg-red-50 border border-red-100 text-red-700 rounded-lg text-xs flex gap-2 items-start mt-2">
                        <AlertCircle className="w-4.5 h-4.5 shrink-0 mt-0.5 text-red-600" />
                        <div>
                          <p className="font-bold">Overspend Alert!</p>
                          <p className="text-opacity-90 leading-relaxed text-[11px] mt-0.5">Your expenditures have exceeded your established budget limit of {formatMoney(monthlyLimit)} by {formatMoney(summary.totalExpense - monthlyLimit)}.</p>
                        </div>
                      </div>
                    ) : summary.budgetProgress > 85 ? (
                      <div className="p-3.5 bg-amber-50 border border-amber-100 text-amber-700 rounded-lg text-xs flex gap-2 items-start mt-2">
                        <AlertCircle className="w-4.5 h-4.5 shrink-0 mt-0.5 text-amber-500" />
                        <div>
                          <p className="font-bold">Budget Threshold Reached</p>
                          <p className="text-opacity-90 leading-relaxed text-[11px] mt-0.5">Warning: You have utilized over 85% of your available spend allowance.</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-[10px] text-gray-400 font-medium">✨ Keep tracking regularly! Daily entries sync immediately.</p>
                    )}
                  </div>
                )}
              </div>

              {/* Data visualizations (SVG based graphs) */}
              {summary && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Category Breakdown list & custom visual ring breakdown */}
                  <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs flex flex-col justify-between">
                    <div className="mb-4">
                      <h3 className="text-sm font-bold text-gray-900 mb-1 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                        Spend Category Share
                      </h3>
                      <p className="text-[11px] text-gray-400 font-medium">Proportional allocation of outgoings</p>
                    </div>

                    {summary.categoryBreakdown.length === 0 ? (
                      <div className="h-40 flex items-center justify-center border border-dashed border-gray-100 rounded-lg text-xs text-gray-400 font-medium bg-gray-50">
                        No category events logged yet
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {summary.categoryBreakdown.slice(0, 4).map((cat, i) => {
                          const COLORS = ['bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-purple-500', 'bg-rose-500'];
                          const color = COLORS[i % COLORS.length];

                          return (
                            <div key={cat.category} className="space-y-1">
                              <div className="flex justify-between text-xs text-gray-700">
                                <span className="font-medium flex items-center gap-1.5">
                                  <span className={`w-2 h-2 rounded-full ${color}`}></span>
                                  {cat.category}
                                </span>
                                <span className="font-mono font-bold">{formatMoney(cat.amount)} ({cat.percentage}%)</span>
                              </div>
                              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                <div className={`h-full ${color} rounded-full`} style={{ width: `${cat.percentage}%` }}></div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Daily breakdowns Bar chart visualization natively with custom SVGs */}
                  <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs flex flex-col justify-between">
                    <div className="mb-3">
                      <h3 className="text-sm font-bold text-gray-900 mb-1 flex items-center gap-1.5">
                        <LineChart className="w-4 h-4 text-emerald-500" />
                        Daily Trend Logs
                      </h3>
                      <p className="text-[11px] text-gray-400 font-medium">Activity breakdown of latest periods</p>
                    </div>

                    {summary.dailyBreakdown.length === 0 ? (
                      <div className="h-40 flex items-center justify-center border border-dashed border-gray-100 rounded-lg text-xs text-gray-400 font-medium bg-gray-50">
                        Awaiting transaction activity
                      </div>
                    ) : (
                      <div className="h-44 pt-4 flex items-end justify-between font-mono text-[10px] text-gray-400">
                        {summary.dailyBreakdown.map((day, idx) => {
                          const maxIncomeExpense = Math.max(...summary.dailyBreakdown.map(d => Math.max(d.income, d.expense, 10)));
                          const expensePct = (day.expense / maxIncomeExpense) * 100;
                          const incomePct = (day.income / maxIncomeExpense) * 100;
                          const shortDate = day.date.substring(5); // MM-DD

                          return (
                            <div key={idx} className="flex flex-col items-center flex-1 group relative">
                              {/* Hover details bubble */}
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-1.5 bg-slate-900 text-slate-100 text-[9px] rounded shadow-md hidden group-hover:block transition-all z-20 whitespace-nowrap leading-tight pointer-events-none">
                                <p className="font-bold">{day.date}</p>
                                <p className="text-emerald-400">Inc: {formatMoney(day.income)}</p>
                                <p className="text-rose-400">Exp: {formatMoney(day.expense)}</p>
                              </div>

                              <div className="w-full flex justify-center gap-0.5 h-28 items-end mb-1">
                                {day.income > 0 && (
                                  <div 
                                    className="w-1.5 rounded-t-xs bg-emerald-400 hover:bg-emerald-500 transition-colors"
                                    style={{ height: `${Math.max(incomePct, 4)}%` }}
                                  ></div>
                                )}
                                {day.expense > 0 && (
                                  <div 
                                    className="w-1.5 rounded-t-xs bg-rose-400 hover:bg-rose-500 transition-colors"
                                    style={{ height: `${Math.max(expensePct, 4)}%` }}
                                  ></div>
                                )}
                              </div>
                              <span className="text-[8px] transform -rotate-12 select-none shrink-0">{shortDate}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                </div>
              )}

              {/* Add Transaction manually Form inline drawer */}
              <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-xs">
                <div className="flex items-center gap-2 mb-4">
                  <Plus className="w-5 h-5 text-gray-500" />
                  <h2 className="text-md font-bold text-gray-900">Direct Entry Override</h2>
                </div>

                <form onSubmit={handleAddManualTransaction} className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  {/* Type */}
                  <div className="md:col-span-1">
                    <label className="block text-[10px] font-semibold text-gray-400 uppercase mb-1">Type</label>
                    <select 
                      value={manualType} 
                      onChange={(e) => setManualType(e.target.value as 'income' | 'expense')}
                      className="w-full text-xs px-2 py-2 rounded-lg border border-gray-200 focus:outline-hidden focus:border-emerald-500 bg-gray-50 text-gray-900 font-semibold"
                    >
                      <option value="expense">Expense 📉</option>
                      <option value="income">Income 📈</option>
                    </select>
                  </div>

                  {/* Value */}
                  <div className="md:col-span-1">
                    <label className="block text-[10px] font-semibold text-gray-400 uppercase mb-1">Amount (IDR)</label>
                    <input 
                      type="number" 
                      step="1" 
                      placeholder="50000"
                      value={manualAmount}
                      onChange={(e) => setManualAmount(e.target.value)}
                      required
                      className="w-full text-xs px-3 py-2 rounded-lg border border-gray-200 focus:outline-hidden focus:border-emerald-500 font-mono text-gray-900 bg-gray-50"
                    />
                  </div>

                  {/* Category */}
                  <div className="md:col-span-1">
                    <label className="block text-[10px] font-semibold text-gray-400 uppercase mb-1">Category</label>
                    <select 
                      value={manualCategory} 
                      onChange={(e) => setManualCategory(e.target.value)}
                      className="w-full text-xs px-2 py-2 rounded-lg border border-gray-200 focus:outline-hidden focus:border-emerald-500 bg-gray-50 text-gray-900"
                    >
                      {standardCategories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  {/* Description */}
                  <div className="md:col-span-2 flex items-end gap-2">
                    <div className="flex-1">
                      <label className="block text-[10px] font-semibold text-gray-400 uppercase mb-1">Item Description</label>
                      <input 
                        type="text" 
                        placeholder="E.g. Walmart grocery store"
                        value={manualDesc}
                        onChange={(e) => setManualDesc(e.target.value)}
                        required
                        className="w-full text-xs px-3 py-2 rounded-lg border border-gray-200 focus:outline-hidden focus:border-emerald-500 text-gray-900 signup_field bg-gray-50"
                      />
                    </div>
                    <button 
                      type="submit" 
                      disabled={isFormSubmitting}
                      className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white font-bold p-2 px-4 rounded-lg text-xs transition-colors shadow-xs h-9 cursor-pointer"
                    >
                      Log
                    </button>
                  </div>
                </form>
              </div>

              {/* Transactions Ledger Panel */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-md font-bold text-gray-900">Transaction Ledgers</h2>
                    <p className="text-xs text-gray-400 font-medium">A complete historical log of parsed transactions</p>
                  </div>
                  
                  {/* Search, filters */}
                  <div className="flex flex-wrap items-center gap-2">
                    <input 
                      type="text"
                      placeholder="Search items..."
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                      className="px-3 py-1.5 bg-gray-50 border border-gray-200 text-xs rounded-lg focus:outline-hidden focus:border-emerald-500 text-gray-800"
                    />

                    {/* Filter Type */}
                    <div className="relative">
                      <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        className="appearance-none pl-2.5 pr-6 py-1.5 bg-gray-50 border border-gray-200 text-xs rounded-lg focus:outline-hidden text-gray-700 font-medium"
                      >
                        <option value="All">All Types</option>
                        <option value="expense">Expense</option>
                        <option value="income">Income</option>
                      </select>
                      <Filter className="w-3.5 h-3.5 text-gray-400 absolute right-2 top-2 pointer-events-none" />
                    </div>

                    {/* Filter Category */}
                    <div className="relative">
                      <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="appearance-none pl-2.5 pr-6 py-1.5 bg-gray-50 border border-gray-200 text-xs rounded-lg focus:outline-hidden text-gray-700 font-medium"
                      >
                        <option value="All">All Categories</option>
                        {standardCategories.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                      <Filter className="w-3.5 h-3.5 text-gray-400 absolute right-2 top-2 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {filteredTransactions.length === 0 ? (
                  <div className="py-12 flex flex-col items-center justify-center text-gray-400">
                    <Info className="w-8 h-8 text-slate-300 mb-2" />
                    <p className="text-xs font-bold">No transactions found matching filters</p>
                    <p className="text-[11px]">Type in the AI playground above to log some entries!</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-gray-50/50 border-b border-gray-100 text-gray-500 font-bold uppercase tracking-wider text-[10px]">
                          <th className="px-6 py-3.5">Details</th>
                          <th className="px-6 py-3.5 font-mono">Category</th>
                          <th className="px-6 py-3.5">Medium / Source</th>
                          <th className="px-6 py-3.5 text-right font-mono">Amount</th>
                          <th className="px-6 py-3.5 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 text-gray-700">
                        {filteredTransactions.map((tx) => {
                          const isExpense = tx.type === 'expense';
                          return (
                            <tr key={tx.id} className="hover:bg-slate-50/70 transition-colors">
                              {/* Details */}
                              <td className="px-6 py-4">
                                <div className="font-bold text-gray-900">{tx.description}</div>
                                <div className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5">
                                  <Calendar className="w-3.5 h-3.5" />
                                  {new Date(tx.date).toLocaleDateString(undefined, { 
                                    year: 'numeric', 
                                    month: 'short', 
                                    day: 'numeric' 
                                  })}
                                </div>
                              </td>

                              {/* Category */}
                              <td className="px-6 py-4 font-semibold text-gray-600">
                                <span className="inline-flex px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 text-[10px] font-bold">
                                  {tx.category}
                                </span>
                              </td>

                              {/* Source */}
                              <td className="px-6 py-4">
                                {tx.telegramUsername ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-100">
                                    💬 Telegram (@{tx.telegramUsername})
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-50 text-gray-600 text-[10px] font-bold border border-gray-200">
                                    🖥️ Dashboard Entry
                                  </span>
                                )}
                                {tx.rawMessage && (
                                  <p className="text-[10px] italic text-gray-400 font-medium truncate max-w-[150px] mt-0.5">
                                    "{tx.rawMessage}"
                                  </p>
                                )}
                              </td>

                              {/* Amount */}
                              <td className="px-6 py-4 text-right font-mono font-extrabold text-sm whitespace-nowrap">
                                <span className={isExpense ? 'text-rose-500' : 'text-emerald-500'}>
                                  {isExpense ? '-' : '+'}{formatMoney(tx.amount, tx.currency)}
                                </span>
                              </td>

                              {/* Actions */}
                              <td className="px-6 py-4 text-center">
                                <button
                                  onClick={() => handleDeleteTransaction(tx.id)}
                                  className="p-1 px-2 text-rose-500 hover:text-rose-700 bg-rose-50/50 hover:bg-rose-50 border border-rose-100 rounded-md transition-colors font-medium text-[10px] cursor-pointer flex items-center gap-0.5 mx-auto"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  Remove
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

          </div>
        )}
      </main>
    </div>
  );
}
