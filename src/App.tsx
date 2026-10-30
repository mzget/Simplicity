import React from 'react';
import { ShieldAlert, ExternalLink, Lock } from 'lucide-react';

/**
 * Standalone entry is disabled for security.
 * Simplicity Finance operates exclusively as a Federated Micro-Frontend module
 * (`./FinanceApp` via `remoteEntry.js`) hosted inside Oaktree Agent.
 */
export const App: React.FC = () => {
  return (
    <div className="simplicity-scope dark min-h-screen bg-[#0f172a] text-slate-100 flex items-center justify-center p-6 font-sans">
      <div className="max-w-md w-full simplicity-glass-card rounded-3xl p-8 text-center space-y-5 border border-white/10">
        <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto text-emerald-400">
          <Lock size={28} />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-bold uppercase tracking-wider">
            <ShieldAlert size={13} /> Standalone Access Disabled
          </div>
          <h2 className="text-xl font-extrabold tracking-tight text-slate-100">
            SIMPLICITY FINANCE
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Direct standalone web access is disabled to protect financial data integrity.
            Simplicity Finance is available exclusively as an authenticated federated module
            inside <strong className="text-slate-200">Oaktree Agent</strong>.
          </p>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-white/5 text-left text-xs font-mono text-slate-400 space-y-1">
          <div className="text-slate-500 uppercase text-[10px] font-sans font-bold tracking-wider">
            Federation Endpoint Status
          </div>
          <div className="text-emerald-400 truncate">
            ● /assets/remoteEntry.js (./FinanceApp)
          </div>
        </div>

        <button
          type="button"
          onClick={() => window.location.assign('http://localhost:4321/finance')}
          className="w-full py-3 px-4 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs inline-flex items-center justify-center gap-2 transition-colors shadow-lg shadow-emerald-500/20 cursor-pointer"
        >
          <span>Open via Oaktree Agent Host</span>
          <ExternalLink size={14} />
        </button>
      </div>
    </div>
  );
};

export default App;
