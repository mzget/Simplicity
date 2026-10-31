import React from 'react';
import { usePwaStore } from '../store/usePwaStore';
import { WifiOff, RefreshCw, AlertTriangle, CheckCircle2, X } from 'lucide-react';

interface PwaStatusBannerProps {
  onSyncComplete?: () => Promise<void>;
}

export const PwaStatusBanner: React.FC<PwaStatusBannerProps> = ({ onSyncComplete }) => {
  const {
    isOnline,
    isSyncing,
    pendingCount,
    dlqItems,
    syncMessage,
    triggerSync,
    dismissDlqItem,
  } = usePwaStore();

  const hasIssues = dlqItems.length > 0;
  const showBanner = !isOnline || isSyncing || pendingCount > 0 || hasIssues || !!syncMessage;

  if (!showBanner) {
    return null;
  }

  return (
    <div className="w-full space-y-2 mb-4 animate-in fade-in duration-200">
      {/* 1. Offline Mode Banner */}
      {!isOnline && (
        <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-500 dark:text-amber-400 text-xs font-semibold shadow-sm">
          <div className="flex items-center gap-2">
            <WifiOff size={16} className="shrink-0 text-amber-500" />
            <span>
              <strong>Offline Mode:</strong> Working from local cache. Changes will sync automatically when reconnected.
            </span>
          </div>
          {pendingCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-300 font-mono text-[11px]">
              {pendingCount} pending
            </span>
          )}
        </div>
      )}

      {/* 2. Syncing in Progress / Pending Sync Banner */}
      {isOnline && (isSyncing || pendingCount > 0) && (
        <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-semibold shadow-sm">
          <div className="flex items-center gap-2">
            <RefreshCw
              size={15}
              className={`shrink-0 text-emerald-500 ${isSyncing ? 'animate-spin' : ''}`}
            />
            <span>
              {isSyncing
                ? 'Syncing offline mutations with Cloudflare D1...'
                : `${pendingCount} offline change(s) waiting to sync.`}
            </span>
          </div>
          <button
            type="button"
            onClick={() => triggerSync(onSyncComplete)}
            disabled={isSyncing}
            className="px-3 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 font-bold text-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
          </button>
        </div>
      )}

      {/* 3. Dead Letter Queue Alert Banner */}
      {hasIssues && (
        <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs space-y-2">
          <div className="flex items-center justify-between font-bold">
            <div className="flex items-center gap-1.5">
              <AlertTriangle size={15} className="text-rose-500" />
              <span>{dlqItems.length} Sync Issue(s) detected:</span>
            </div>
          </div>
          <div className="space-y-1.5">
            {dlqItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-2 rounded-lg bg-white/40 dark:bg-slate-900/40 border border-rose-500/20 font-mono text-[11px]"
              >
                <div className="truncate mr-2">
                  <span className="font-bold">{item.label}</span>
                  <span className="text-slate-500 dark:text-slate-400 block text-[10px] truncate">
                    {item.errorMessage}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => dismissDlqItem(item.id)}
                  title="Dismiss issue"
                  className="p-1 rounded hover:bg-rose-500/20 text-rose-500 shrink-0"
                >
                  <X size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

