import React, { useState } from 'react';
import { Send, CheckCircle, HelpCircle, Sliders, Play, Terminal } from 'lucide-react';

interface BotConfig {
  telegramBotToken: string;
  botUsername: string;
  webhookUrl: string;
  webhookRegistered: boolean;
  isActive: boolean;
  appUrl: string;
}

interface IntegrationsPageProps {
  botConfig: BotConfig;
  onSaveConfig: (token: string) => Promise<void>;
  onRegisterWebhook: () => Promise<void>;
  onSimulateMessage: (text: string) => Promise<{ success: boolean; data?: any; rawText?: string; error?: string }>;
}

export default function IntegrationsPage({
  botConfig,
  onSaveConfig,
  onRegisterWebhook,
  onSimulateMessage
}: IntegrationsPageProps) {
  const [tokenInput, setTokenInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  // Simulator state
  const [simulationText, setSimulationText] = useState('');
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationLog, setSimulationLog] = useState<any[]>([]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenInput.trim()) return;
    setIsSaving(true);
    await onSaveConfig(tokenInput.trim());
    setIsSaving(false);
  };

  const handleRegister = async () => {
    setIsRegistering(true);
    await onRegisterWebhook();
    setIsRegistering(false);
  };

  const handleSimulation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!simulationText.trim()) return;
    setIsSimulating(true);
    const result = await onSimulateMessage(simulationText);
    setIsSimulating(false);

    setSimulationLog(prev => [
      {
        timestamp: new Date().toLocaleTimeString(),
        input: simulationText,
        ...result
      },
      ...prev
    ]);
    setSimulationText('');
  };

  return (
    <div className="space-y-8 animate-[fadeIn_0.3s_ease]">
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left column: Instructions and configurations */}
        <div className="lg:col-span-6 space-y-6">
          
          {/* Telegram Credentials configuration */}
          <div className="glass-iphone rounded-3xl p-6 border border-white/[0.08] shadow-xl">
            <div className="flex items-center gap-2 mb-4">
              <Sliders className="w-5 h-5 text-cyan-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-white font-mono">Core Bot Setup</h2>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                  Telegram Bot Token (from @BotFather)
                </label>
                <div className="flex gap-2">
                  <input 
                    type="password"
                    placeholder="E.g. 123456:ABC-DEF1234ghIkl-zyx"
                    value={tokenInput}
                    onChange={(e) => setTokenInput(e.target.value)}
                    className="flex-1 text-xs px-3.5 py-2.5 rounded-xl border border-white/[0.08] focus:outline-hidden text-cyan-400 bg-slate-950 font-mono tracking-widest focus:border-cyan-500/50"
                  />
                  <button
                    type="submit"
                    disabled={isSaving || !tokenInput}
                    className="bg-cyan-500 hover:bg-cyan-600 disabled:bg-slate-900 border border-cyan-400/20 text-slate-950 font-extrabold px-5 rounded-xl text-xs uppercase font-mono tracking-wider transition-all cursor-pointer shadow-[0_0_12px_rgba(6,182,212,0.25)]"
                  >
                    {isSaving ? 'UPLOADING...' : 'SAVE_TOKEN'}
                  </button>
                </div>
                {botConfig.telegramBotToken && (
                  <div className="mt-2 text-[9px] text-emerald-400 font-mono font-bold flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                    BOT_TOKEN_LOADED (Active: {botConfig.isActive ? 'TRUE' : 'FALSE'})
                  </div>
                )}
              </div>
            </form>

            <div className="mt-6 pt-6 border-t border-white/[0.04] space-y-4">
              <div className="flex justify-between items-center bg-slate-950/40 p-3 rounded-xl border border-white/[0.04]">
                <div>
                  <span className="block text-[10px] font-mono text-slate-500 uppercase font-bold">Bot Registered User</span>
                  <span className="text-xs font-mono font-extrabold text-cyan-300">
                    {botConfig.botUsername ? `@${botConfig.botUsername}` : 'UNCONFIGURED'}
                  </span>
                </div>
                <div className="text-right">
                  <span className="block text-[10px] font-mono text-slate-500 uppercase font-bold">Webhook Registered</span>
                  <span className={`text-xs font-mono font-bold uppercase ${botConfig.webhookRegistered ? 'text-emerald-400' : 'text-amber-500'}`}>
                    {botConfig.webhookRegistered ? 'ACTIVE ✓' : 'OFFLINE'}
                  </span>
                </div>
              </div>

              {botConfig.telegramBotToken && (
                <div className="space-y-2">
                  <span className="block text-[9px] font-mono text-slate-500 uppercase font-bold">App Server Ingress Redirect IP</span>
                  <div className="text-[10px] font-mono text-slate-400 select-all border border-white/[0.04] bg-slate-950 p-2.5 rounded-lg truncate text-center">
                    {botConfig.appUrl || 'N/A'}
                  </div>
                  <button
                    onClick={handleRegister}
                    disabled={isRegistering}
                    className="w-full h-10 bg-slate-950 hover:bg-slate-900 border border-cyan-500/30 text-cyan-400 font-extrabold px-5 rounded-xl text-xs uppercase font-mono tracking-wider transition-all cursor-pointer shadow-[0_0_10px_rgba(6,182,212,0.1)] hover:border-cyan-400"
                  >
                    {isRegistering ? 'SYNCING WEBHOOK...' : 'ACTIVATE_TELEGRAM_WEBHOOK'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Setup Guide */}
          <div className="glass-iphone rounded-3xl p-6 border border-white/[0.08] shadow-xl space-y-4">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-purple-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-white font-mono">Telegram Connection Guide</h2>
            </div>
            <div className="text-[11px] font-mono text-slate-400 space-y-2.5 leading-relaxed">
              <p>1. Open Telegram application and message <a href="https://t.me/BotFather" target="_blank" rel="noreferrer" className="text-cyan-400 hover:underline">@BotFather</a></p>
              <p>2. Send <code className="bg-slate-950 px-1 py-0.5 border border-white/5 rounded text-fuchsia-400">/newbot</code> and follow instructions to get your HTTP Token.</p>
              <p>3. Copy the token and paste it into the <b>Core Bot Setup</b> form above.</p>
              <p>4. Click the <code className="bg-slate-950 px-1 py-0.5 border border-white/5 rounded text-cyan-400">ACTIVATE_TELEGRAM_WEBHOOK</code> button, allowing the server to hook updates instantly.</p>
              <p>5. Open your bot in Telegram and start typing transaction streams, such as:</p>
              <div className="bg-slate-950 p-2.5 rounded border border-white/5 font-mono text-[10px] space-y-1 text-slate-350 italic">
                <p>• "Makan nasi goreng Rp 20.000"</p>
                <p>• "Gaji projek Tokopedia Rp 15.000.000"</p>
                <p>• "Beli kopi starbucks 50 ribu"</p>
              </div>
            </div>
          </div>

        </div>

        {/* Right column: Developer's Simulator Playground */}
        <div className="lg:col-span-6 glass-iphone rounded-3xl p-6 border border-white/[0.08] shadow-xl space-y-6">
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-indigo-400" />
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-white font-mono">Developer Proxy Simulation</h2>
              <p className="text-[10px] text-slate-500 font-mono">SIMULATE CHAT TEXT WITHOUT LEAVING THE DASHBOARD</p>
            </div>
          </div>

          <form onSubmit={handleSimulation} className="space-y-3">
            <label className="block text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest">
              Natural Language Statement (Indonesian)
            </label>
            <div className="flex gap-2">
              <input 
                type="text"
                placeholder="E.g. Makan malam di warteg 35000 rupiah"
                value={simulationText}
                onChange={(e) => setSimulationText(e.target.value)}
                className="flex-1 text-xs px-3.5 py-2.5 rounded-xl border border-white/[0.08] focus:outline-hidden text-cyan-300 bg-slate-950 font-mono placeholder:text-slate-700 focus:border-cyan-500/50"
              />
              <button
                type="submit"
                disabled={isSimulating || !simulationText}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-900 text-white font-bold px-4 rounded-xl text-xs uppercase font-mono tracking-wider transition-all cursor-pointer flex items-center gap-1 border border-indigo-500/20"
              >
                <Send className="w-3.5 h-3.5" />
                SIM
              </button>
            </div>
          </form>

          {/* Simulation outputs */}
          <div className="space-y-3">
            <span className="block text-[9px] font-mono font-bold text-slate-500 uppercase tracking-widest">Simulation Logs & Telemetry</span>
            <div className="bg-slate-950 border border-white/[0.06] rounded-2xl h-[280px] overflow-y-auto p-4 font-mono text-[10px] space-y-3.5 no-scrollbar">
              {simulationLog.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-600 text-center uppercase tracking-widest text-[9px]">
                  <span>AWAITING_LOCAL_TEST_TRANSMISSIONS</span>
                  <span className="text-[8px] mt-1 text-slate-700 normal-case">Write Indonesian statements above to test the Gemini parser model.</span>
                </div>
              ) : (
                simulationLog.map((log, index) => (
                  <div key={index} className="border-b border-white/[0.04] pb-3 last:border-0 last:pb-0">
                    <div className="flex justify-between text-[9px] text-slate-500 mb-1">
                      <span>[{log.timestamp}] INCOMING_PROXY</span>
                      <span className={log.success ? 'text-emerald-400' : 'text-rose-400'}>
                        {log.success ? 'PARSE_SUCCESS ✓' : 'PARSE_FAILED ✗'}
                      </span>
                    </div>
                    <div className="text-cyan-300 bg-slate-900/40 p-1.5 rounded border border-white/[0.03] select-all mb-2">
                      "{log.input}"
                    </div>
                    {log.success && log.data ? (
                      <div className="space-y-1 text-slate-400 pl-2 border-l border-emerald-500/40">
                        <p>• Action: <span className="text-emerald-400 uppercase font-bold">{log.data.type}</span></p>
                        <p>• Amount: <span className="text-white font-bold">{log.data.amount?.toLocaleString('id-ID')} {log.data.currency}</span></p>
                        <p>• Category: <span className="text-cyan-400">{log.data.category}</span></p>
                        <p>• Description: <span className="text-yellow-200">"{log.data.description}"</span></p>
                      </div>
                    ) : (
                      <div className="text-rose-400 text-[9px] italic pl-2 border-l border-rose-500/40">
                        Error: {log.error || 'Failed to detect financial parameters.'}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
