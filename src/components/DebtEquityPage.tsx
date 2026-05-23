import React, { useState } from 'react';
import { Plus, Trash2, Calendar, ShieldAlert, Award, TrendingUp, DollarSign } from 'lucide-react';
import { Debt, Equity } from '../types';

interface DebtEquityPageProps {
  debts: Debt[];
  equities: Equity[];
  onAddDebt: (e: React.FormEvent, data: { creditorName: string; amount: number; dueDate: string; description: string; interestRate: number }) => Promise<void>;
  onToggleDebtStatus: (id: string, currentStatus: 'active' | 'settled') => Promise<void>;
  onDeleteDebt: (id: string) => Promise<void>;
  onAddEquity: (e: React.FormEvent, data: { investorName: string; capitalAmount: number; sharesPercentage: number; description: string }) => Promise<void>;
  onDeleteEquity: (id: string) => Promise<void>;
  formatMoney: (amount: number, currency?: string) => string;
}

export default function DebtEquityPage({
  debts,
  equities,
  onAddDebt,
  onToggleDebtStatus,
  onDeleteDebt,
  onAddEquity,
  onDeleteEquity,
  formatMoney
}: DebtEquityPageProps) {
  // Debt Form state
  const [creditorName, setCreditorName] = useState('');
  const [debtAmount, setDebtAmount] = useState('');
  const [debtDueDate, setDebtDueDate] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [interestRate, setInterestRate] = useState('');
  const [debtDesc, setDebtDesc] = useState('');
  const [isDebtSubmitting, setIsDebtSubmitting] = useState(false);

  // Equity Form state
  const [investorName, setInvestorName] = useState('');
  const [capitalAmount, setCapitalAmount] = useState('');
  const [sharesPercentage, setSharesPercentage] = useState('');
  const [equityDesc, setEquityDesc] = useState('');
  const [isEquitySubmitting, setIsEquitySubmitting] = useState(false);

  // Core metrics
  const activeDebtTotal = debts
    .filter(d => d.status === 'active')
    .reduce((sum, d) => sum + d.amount, 0);

  const equityCapitalTotal = equities
    .reduce((sum, e) => sum + e.capitalAmount, 0);

  const totalSharesOwnedPercentage = equities
    .reduce((sum, e) => sum + e.sharesPercentage, 0);

  const debtToEquityRatio = equityCapitalTotal > 0 
    ? ((activeDebtTotal / equityCapitalTotal) * 100).toFixed(1) 
    : 'N/A';

  const handleDebtSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!creditorName.trim() || !debtAmount || isNaN(parseFloat(debtAmount))) return;
    setIsDebtSubmitting(true);
    await onAddDebt(e, {
      creditorName: creditorName.trim(),
      amount: parseFloat(debtAmount),
      dueDate: debtDueDate,
      description: debtDesc.trim(),
      interestRate: parseFloat(interestRate) || 0
    });
    setCreditorName('');
    setDebtAmount('');
    setInterestRate('');
    setDebtDesc('');
    setIsDebtSubmitting(false);
  };

  const handleEquitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!investorName.trim() || !capitalAmount || isNaN(parseFloat(capitalAmount))) return;
    setIsEquitySubmitting(true);
    await onAddEquity(e, {
      investorName: investorName.trim(),
      capitalAmount: parseFloat(capitalAmount),
      sharesPercentage: parseFloat(sharesPercentage) || 0,
      description: equityDesc.trim()
    });
    setInvestorName('');
    setCapitalAmount('');
    setSharesPercentage('');
    setEquityDesc('');
    setIsEquitySubmitting(false);
  };

  return (
    <div className="space-y-8 animate-[fadeIn_0.3s_ease]">
      
      {/* KPI Stats Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Liabilities Debt */}
        <div className="glass-iphone rounded-3xl p-5 border-t-2 border-t-fuchsia-500/40 relative overflow-hidden group">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-fuchsia-500/10 text-fuchsia-400 rounded-xl border border-fuchsia-500/25">
              <ShieldAlert className="w-5 h-5 text-fuchsia-400" />
            </div>
            <div>
              <span className="block text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">ACTIVE_LIABILITIES_DEBT</span>
              <span className="text-lg font-extrabold font-mono tracking-tight text-fuchsia-400">
                {formatMoney(activeDebtTotal)}
              </span>
            </div>
          </div>
        </div>

        {/* Total Equity Seed Raised */}
        <div className="glass-iphone rounded-3xl p-5 border-t-2 border-t-cyan-500/40 relative overflow-hidden group">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-cyan-500/10 text-cyan-400 rounded-xl border border-cyan-500/25">
              <Award className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <span className="block text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">OWNER_EQUITY_RESERVES</span>
              <span className="text-lg font-extrabold font-mono tracking-tight text-cyan-400">
                {formatMoney(equityCapitalTotal)}
              </span>
            </div>
          </div>
          <div className="mt-2 text-[9px] font-mono text-slate-500">
            REGISTERED OWNERSHIP REPRESENTATION: {totalSharesOwnedPercentage}%
          </div>
        </div>

        {/* Leverage Ratio Indicator */}
        <div className="glass-iphone rounded-3xl p-5 border-t-2 border-t-purple-500/40 relative overflow-hidden group col-span-1">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/25">
              <TrendingUp className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <span className="block text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">DEBT_TO_EQUITY_RATIO</span>
              <span className={`text-lg font-extrabold font-mono tracking-tight ${
                debtToEquityRatio === 'N/A' || parseFloat(debtToEquityRatio) < 35 
                  ? 'text-emerald-400' 
                  : parseFloat(debtToEquityRatio) < 70 
                    ? 'text-amber-400' 
                    : 'text-rose-400'
              }`}>
                {debtToEquityRatio === 'N/A' ? '0.0%' : `${debtToEquityRatio}%`}
              </span>
            </div>
          </div>
          <div className="mt-2 text-[9px] font-mono text-slate-550 header-glow">
            LEVERAGE RISK: {debtToEquityRatio === 'N/A' ? 'NONE' : parseFloat(debtToEquityRatio) > 75 ? 'HIGH OBLIGATION RISK' : 'STABLE LEVERAGE'}
          </div>
        </div>
      </div>

      {/* Row Split sections */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        
        {/* ======================= LIABILITY PORTFOLIO ======================= */}
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center gap-2 px-1">
            <ShieldAlert className="w-5 h-5 text-fuchsia-400" />
            <div>
              <h2 className="text-sm font-extrabold font-mono uppercase text-white tracking-wider">LIABILITY DEBT CAPABILITY</h2>
              <p className="text-[10px] font-mono text-slate-500">MANAGE LIABILITIES, BANK LOANS & INTERESTS</p>
            </div>
          </div>

          {/* Form */}
          <div className="glass-iphone rounded-3xl p-5 border border-white/[0.08]" id="liability-debt-form">
            <form onSubmit={handleDebtSubmit} className="grid grid-cols-1 sm:grid-cols-12 gap-4">
              <div className="sm:col-span-6">
                <label className="block text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest mb-1">Creditor / Bank Name</label>
                <input 
                  type="text"
                  required
                  placeholder="Bank Mandiri / Diana"
                  value={creditorName}
                  onChange={(e) => setCreditorName(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-white/[0.08] focus:outline-hidden text-fuchsia-300 bg-slate-950 font-mono focus:border-fuchsia-500/50"
                />
              </div>

              <div className="sm:col-span-6">
                <label className="block text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest mb-1">Due Date</label>
                <input 
                  type="date"
                  required
                  value={debtDueDate}
                  onChange={(e) => setDebtDueDate(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-white/[0.08] focus:outline-hidden text-cyan-400 bg-slate-950 font-mono focus:border-fuchsia-500/50"
                />
              </div>

              <div className="sm:col-span-6">
                <label className="block text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest mb-1">Principal Amount IDR</label>
                <input 
                  type="number"
                  required
                  placeholder="Rp 25.000.000"
                  value={debtAmount}
                  onChange={(e) => setDebtAmount(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-white/[0.08] focus:outline-hidden text-fuchsia-300 bg-slate-950 font-mono focus:border-fuchsia-500/50"
                />
              </div>

              <div className="sm:col-span-6">
                <label className="block text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest mb-1">Interest Rate (% p.a.)</label>
                <input 
                  type="number"
                  step="0.1"
                  placeholder="6.0"
                  value={interestRate}
                  onChange={(e) => setInterestRate(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-white/[0.08] focus:outline-hidden text-fuchsia-400 bg-slate-950 font-mono focus:border-fuchsia-500/50"
                />
              </div>

              <div className="sm:col-span-12 flex gap-2">
                <div className="flex-1">
                  <label className="block text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest mb-1">Purpose / Description</label>
                  <input 
                    type="text"
                    required
                    placeholder="KUR Business investment funding"
                    value={debtDesc}
                    onChange={(e) => setDebtDesc(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-white/[0.08] focus:outline-hidden text-slate-200 bg-slate-950 focus:border-fuchsia-500/50"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isDebtSubmitting}
                  className="self-end h-9.5 px-5 bg-fuchsia-500 hover:bg-fuchsia-600 disabled:bg-slate-900 border border-fuchsia-400/20 text-slate-950 font-extrabold rounded-lg text-xs uppercase font-mono tracking-widest transition-all cursor-pointer shadow-[0_0_12px_rgba(217,70,239,0.25)] hover:shadow-[0_0_15px_rgba(217,70,239,0.4)]"
                >
                  ADD_DEBT
                </button>
              </div>
            </form>
          </div>

          {/* Table */}
          <div className="glass-iphone rounded-3xl border border-white/[0.08] overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-950/80 border-b border-white/[0.06] text-fuchsia-400 font-bold uppercase tracking-wider text-[9px] font-mono">
                    <th className="px-5 py-3.5 col-span-1">Creditor</th>
                    <th className="px-5 py-3.5">Due / Interest</th>
                    <th className="px-5 py-3.5 text-right">Owed Amount</th>
                    <th className="px-5 py-3.5 text-center">Receipt</th>
                    <th className="px-5 py-3.5 text-center">X</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.03] text-slate-300">
                  {debts.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-600 font-mono text-[10px]">
                        NO_REGISTERED_LIABILITIES
                      </td>
                    </tr>
                  ) : (
                    debts.map(debt => (
                      <tr key={debt.id} className="hover:bg-white/[0.01] transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="font-extrabold text-slate-100">{debt.creditorName}</div>
                          <div className="text-[9px] text-slate-500 font-mono max-w-[170px] truncate" title={debt.description}>{debt.description}</div>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="font-mono text-[9px] text-slate-400">{debt.dueDate}</div>
                          <div className="font-mono text-[9px] text-fuchsia-400 font-bold">{debt.interestRate}% interest</div>
                        </td>
                        <td className="px-5 py-3.5 text-right font-mono font-extrabold text-fuchsia-300 whitespace-nowrap">
                          {formatMoney(debt.amount)}
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <button
                            onClick={() => onToggleDebtStatus(debt.id, debt.status)}
                            className={`px-2 py-0.5 rounded text-[8px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer ${
                              debt.status === 'settled'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/35'
                                : 'bg-fuchsia-500/10 text-fuchsia-400 border border-fuchsia-500/35 hover:bg-fuchsia-500/20'
                            }`}
                          >
                            {debt.status === 'settled' ? 'SETTLED ✓' : 'ACTIVE'}
                          </button>
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <button 
                            onClick={() => onDeleteDebt(debt.id)}
                            className="p-1 text-rose-400 hover:text-white rounded hover:bg-rose-950/40"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ======================= OWNER EQUITY RESERVES ======================= */}
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center gap-2 px-1">
            <Award className="w-5 h-5 text-cyan-400" />
            <div>
              <h2 className="text-sm font-extrabold font-mono uppercase text-white tracking-wider">SHAREHOLDER EQUITY PORTFOLIO</h2>
              <p className="text-[10px] font-mono text-slate-500">TRACK CAPITAL CONTRIBUTIONS & SHARES REPRESENTATIONS</p>
            </div>
          </div>

          {/* Form */}
          <div className="glass-iphone rounded-3xl p-5 border border-white/[0.08]" id="shareholder-equity-form">
            <form onSubmit={handleEquitySubmit} className="grid grid-cols-1 sm:grid-cols-12 gap-4">
              <div className="sm:col-span-7">
                <label className="block text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest mb-1">Co-founder / Investor Name</label>
                <input 
                  type="text"
                  required
                  placeholder="Hendra Wijaya"
                  value={investorName}
                  onChange={(e) => setInvestorName(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-white/[0.08] focus:outline-hidden text-cyan-300 bg-slate-950 font-mono focus:border-cyan-500/50"
                />
              </div>

              <div className="sm:col-span-5">
                <label className="block text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest mb-1">Company Share %</label>
                <input 
                  type="number"
                  step="0.01"
                  max="100"
                  placeholder="35.0"
                  value={sharesPercentage}
                  onChange={(e) => setSharesPercentage(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-white/[0.08] focus:outline-hidden text-cyan-400 bg-slate-950 font-mono focus:border-cyan-500/50"
                />
              </div>

              <div className="sm:col-span-12 flex gap-2">
                <div className="flex-1">
                  <label className="block text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest mb-1">Capital Contributed (IDR)</label>
                  <input 
                    type="number"
                    required
                    placeholder="Rp 150.000.000"
                    value={capitalAmount}
                    onChange={(e) => setCapitalAmount(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-white/[0.08] focus:outline-hidden text-cyan-300 bg-slate-950 font-mono focus:border-cyan-500/50"
                  />
                </div>
              </div>

              <div className="sm:col-span-12 flex gap-2">
                <div className="flex-1">
                  <label className="block text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest mb-1">Milestone Description / Use of Funds</label>
                  <input 
                    type="text"
                    required
                    placeholder="E.g. Primary working capital seed rounded inject"
                    value={equityDesc}
                    onChange={(e) => setEquityDesc(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-white/[0.08] focus:outline-hidden text-slate-200 bg-slate-950 focus:border-cyan-500/50"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isEquitySubmitting}
                  className="self-end h-9.5 px-5 bg-cyan-500 hover:bg-cyan-600 disabled:bg-slate-900 border border-cyan-400/20 text-slate-950 font-extrabold rounded-lg text-xs uppercase font-mono tracking-widest transition-all cursor-pointer shadow-[0_0_12px_rgba(6,182,212,0.25)] hover:shadow-[0_0_15px_rgba(6,182,212,0.4)]"
                >
                  ADD_CAPITAL
                </button>
              </div>
            </form>
          </div>

          {/* Table */}
          <div className="glass-iphone rounded-3xl border border-white/[0.08] overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-950/80 border-b border-white/[0.06] text-cyan-400 font-bold uppercase tracking-wider text-[9px] font-mono">
                    <th className="px-5 py-3.5">Incorp Stakeholder</th>
                    <th className="px-5 py-3.5 text-center">Share Stake</th>
                    <th className="px-5 py-3.5 text-right">Contributed Capital</th>
                    <th className="px-5 py-3.5 text-center">X</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.03] text-slate-300">
                  {equities.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-12 text-center text-slate-600 font-mono text-[10px]">
                        NO_REGISTERED_EQUITY_HOLDERS
                      </td>
                    </tr>
                  ) : (
                    equities.map(eq => (
                      <tr key={eq.id} className="hover:bg-white/[0.01] transition-colors">
                        <td className="px-5 py-3.5 font-bold">
                          <div className="text-slate-100">{eq.investorName}</div>
                          <div className="text-[9px] text-slate-550 font-mono max-w-[190px] truncate" title={eq.description}>{eq.description}</div>
                        </td>
                        <td className="px-5 py-3.5 text-center font-mono text-[10px] font-extrabold text-cyan-400">
                          {eq.sharesPercentage}%
                        </td>
                        <td className="px-5 py-3.5 text-right font-mono font-extrabold text-emerald-400 whitespace-nowrap">
                          {formatMoney(eq.capitalAmount)}
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <button 
                            onClick={() => onDeleteEquity(eq.id)}
                            className="p-1 text-rose-400 hover:text-white rounded hover:bg-rose-950/40"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
