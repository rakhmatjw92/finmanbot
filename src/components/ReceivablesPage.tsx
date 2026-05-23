import React, { useState } from 'react';
import { Plus, Users, Calendar, Trash2, CheckCircle, Clock } from 'lucide-react';
import { Receivable } from '../types';

interface ReceivablesPageProps {
  receivables: Receivable[];
  onAddReceivable: (e: React.FormEvent, data: { customerName: string; amount: number; dueDate: string; description: string }) => Promise<void>;
  onToggleStatus: (id: string, currentStatus: 'unpaid' | 'paid' | 'overdue') => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  formatMoney: (amount: number, currency?: string) => string;
}

export default function ReceivablesPage({
  receivables,
  onAddReceivable,
  onToggleStatus,
  onDelete,
  formatMoney
}: ReceivablesPageProps) {
  // Form states
  const [customerName, setCustomerName] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter states
  const [filterStatus, setFilterStatus] = useState<'all' | 'unpaid' | 'paid'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Calculations
  const totalOutstanding = receivables
    .filter(r => r.status === 'unpaid' || r.status === 'overdue')
    .reduce((sum, r) => sum + r.amount, 0);

  const totalCollected = receivables
    .filter(r => r.status === 'paid')
    .reduce((sum, r) => sum + r.amount, 0);

  const overdueCount = receivables.filter(r => {
    const isPastDue = new Date(r.dueDate).getTime() < Date.now();
    return r.status === 'unpaid' && isPastDue;
  }).length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !amount || isNaN(parseFloat(amount))) {
      return;
    }
    setIsSubmitting(true);
    await onAddReceivable(e, {
      customerName: customerName.trim(),
      amount: parseFloat(amount),
      dueDate,
      description: description.trim()
    });
    setCustomerName('');
    setAmount('');
    setDescription('');
    setIsSubmitting(false);
  };

  const filteredItems = receivables.filter(r => {
    const matchesSearch = r.customerName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          r.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (filterStatus === 'all') return matchesSearch;
    return r.status === filterStatus && matchesSearch;
  });

  return (
    <div className="space-y-8 animate-[fadeIn_0.3s_ease]">
      {/* Visual KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Outstanding */}
        <div className="glass-iphone rounded-3xl p-5 border-t-2 border-t-amber-500/40 relative overflow-hidden group">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/25">
              <Clock className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <span className="block text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">OUTSTANDING_RECEIVABLES</span>
              <span className="text-lg font-extrabold font-mono tracking-tight text-amber-400">
                {formatMoney(totalOutstanding)}
              </span>
            </div>
          </div>
          {overdueCount > 0 && (
            <div className="mt-2 text-[9px] font-mono text-rose-400 font-extrabold tracking-wider uppercase animate-pulse">
              ⚠️ {overdueCount} CLIENT INVOICES ARE OVERDUE!
            </div>
          )}
        </div>

        {/* Total Collected */}
        <div className="glass-iphone rounded-3xl p-5 border-t-2 border-t-emerald-500/40 relative overflow-hidden group">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/25">
              <CheckCircle className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <span className="block text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">COLLECTED_RECEIVABLES</span>
              <span className="text-lg font-extrabold font-mono tracking-tight text-emerald-400">
                {formatMoney(totalCollected)}
              </span>
            </div>
          </div>
        </div>

        {/* Total Ledger Assets */}
        <div className="glass-iphone rounded-3xl p-5 border-t-2 border-t-cyan-500/40 relative overflow-hidden group">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-cyan-500/10 text-cyan-400 rounded-xl border border-cyan-500/25">
              <Users className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <span className="block text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">TOTAL_ACTIVE_CLIENTS</span>
              <span className="text-lg font-extrabold font-mono tracking-tight text-cyan-400">
                {receivables.length} Transactions
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main split grid layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Create form */}
        <div className="lg:col-span-4 glass-iphone rounded-3xl p-6 border border-white/[0.08] shadow-xl">
          <div className="flex items-center gap-2 mb-4">
            <Plus className="w-4 h-4 text-cyan-400" />
            <h2 className="text-xs font-mono font-extrabold uppercase tracking-wider text-white">Log Customer Receivable</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest mb-1">Customer / Client Name</label>
              <input 
                type="text"
                required
                placeholder="E.g. Tokopedia Corp"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-white/[0.08] focus:outline-hidden text-cyan-300 placeholder:text-slate-700 bg-slate-950 font-mono focus:border-cyan-500/50"
              />
            </div>

            <div>
              <label className="block text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest mb-1">Amount IDR (Piutang)</label>
              <input 
                type="number"
                required
                min="1"
                placeholder="RP 10000000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-white/[0.08] focus:outline-hidden text-cyan-300 placeholder:text-slate-700 bg-slate-950 font-mono focus:border-cyan-500/50"
              />
            </div>

            <div>
              <label className="block text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest mb-1">Due Date</label>
              <input 
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-white/[0.08] focus:outline-hidden text-cyan-400 bg-slate-950 font-mono focus:border-cyan-500/50"
              />
            </div>

            <div>
              <label className="block text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest mb-1">Project Milestone Description</label>
              <textarea 
                rows={3}
                placeholder="E.g. Phase 2 frontend deliverables..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-white/[0.08] focus:outline-hidden text-slate-200 placeholder:text-slate-700 bg-slate-950 focus:border-cyan-500/50 leading-relaxed"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-cyan-500 hover:bg-cyan-600 disabled:bg-slate-900 border border-cyan-400/20 text-slate-950 font-extrabold py-2.5 rounded-xl text-xs uppercase font-mono tracking-wider transition-all cursor-pointer shadow-[0_0_15px_rgba(6,182,212,0.25)] hover:shadow-[0_0_20px_rgba(6,182,212,0.4)]"
            >
              {isSubmitting ? 'SAVING...' : 'REGISTER_RECEIVABLE'}
            </button>
          </form>
        </div>

        {/* Right Side: Ledger Lists (Highly wide!) */}
        <div className="lg:col-span-8 glass-iphone rounded-3xl border border-white/[0.08] shadow-2xl overflow-hidden">
          <div className="p-6 border-b border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-white font-mono flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(6,182,212,0.6)]"></span>
                Accounts Receivable Ledger
              </h2>
              <p className="text-[10px] text-slate-500 font-mono mt-0.5">TRACKING CLIENT OBLIGATIONS & INVOICES</p>
            </div>

            {/* Inputs & Filters */}
            <div className="flex flex-wrap items-center gap-2">
              <input 
                type="text"
                placeholder="SEARCH INVOICES..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="px-3.5 py-1.5 bg-slate-950 border border-white/[0.08] text-xs rounded-lg focus:outline-hidden focus:border-cyan-500/80 text-cyan-300 font-mono placeholder:text-slate-700"
              />

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="px-3 py-1.5 bg-slate-950 border border-white/[0.08] text-xs rounded-lg focus:outline-hidden text-cyan-400 font-mono select-none"
              >
                <option value="all">ALL_STATUS</option>
                <option value="unpaid">UNPAID_ONLY</option>
                <option value="paid">PAID_ONLY</option>
              </select>
            </div>
          </div>

          {filteredItems.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-500 font-mono">
              <Users className="w-8 h-8 text-slate-800 mb-2" />
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">NO_RECEIVABLES_FOUND</p>
              <p className="text-[10px] text-slate-600 mt-0.5">Log an customer account statement on the left panel to begin.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-950/85 border-b border-white/[0.06] text-cyan-400 font-bold uppercase tracking-wider text-[10px] font-mono">
                    <th className="px-6 py-4">Customer & Milestone</th>
                    <th className="px-6 py-4">Due Date</th>
                    <th className="px-6 py-4 text-right">Amount IDR</th>
                    <th className="px-6 py-4 text-center">Status</th>
                    <th className="px-6 py-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04] text-slate-300">
                  {filteredItems.map(item => {
                    const isOverdue = new Date(item.dueDate).getTime() < Date.now() && item.status === 'unpaid';
                    return (
                      <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-extrabold text-slate-100">{item.customerName}</div>
                          {item.description && (
                            <div className="text-[10px] text-slate-500 mt-1 font-mono italic max-w-sm truncate">
                              "{item.description}"
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1 font-mono text-slate-400">
                            <Calendar className="w-3.5 h-3.5 text-cyan-500" />
                            <span className={isOverdue ? "text-rose-400 font-bold" : ""}>
                              {item.dueDate}
                            </span>
                            {isOverdue && (
                              <span className="text-[8px] bg-rose-950 text-rose-400 px-1 rounded font-bold uppercase ml-1 animate-pulse border border-rose-500/20">
                                Overdue
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right font-mono font-extrabold text-sm whitespace-nowrap text-cyan-300">
                          {formatMoney(item.amount)}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => onToggleStatus(item.id, item.status)}
                            className={`px-3 py-1 rounded-md text-[10px] font-mono font-bold uppercase transition-all cursor-pointer ${
                              item.status === 'paid'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                : 'bg-amber-500/10 text-amber-500 border border-amber-500/30 hover:bg-amber-500/20'
                            }`}
                            title="Click to toggle collected state"
                          >
                            {item.status === 'paid' ? '● COLLECTED ✓' : '○ PENDING'}
                          </button>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => onDelete(item.id)}
                            className="p-1 px-2.5 text-rose-400 hover:text-white bg-rose-950/30 hover:bg-rose-900 border border-rose-900/40 hover:border-rose-600 rounded-lg transition-all font-mono text-[9px] uppercase cursor-pointer flex items-center gap-0.5 mx-auto"
                          >
                            <Trash2 className="w-3 h-3" />
                            [Delete]
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
  );
}
