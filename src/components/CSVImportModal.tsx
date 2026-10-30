import React, { useState } from 'react';
import { useFinanceStore } from '../store/useFinanceStore';
import { simplicityFetch } from '../api/client';
import { Wallet, Category } from '../types';
import Papa from 'papaparse';
import { X, Upload, FileSpreadsheet, Check, AlertCircle } from 'lucide-react';

interface CSVImportModalProps {
  wallets: Wallet[];
  categories: Category[];
  onImportComplete: () => Promise<void>;
}

export const CSVImportModal: React.FC<CSVImportModalProps> = ({
  wallets,
  categories,
  onImportComplete,
}) => {
  const { isImportOpen, setIsImportOpen } = useFinanceStore();

  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [selectedWalletId, setSelectedWalletId] = useState<string>(wallets[0]?.id || '');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  if (!isImportOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg('');
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.data.length === 0) {
          setErrorMsg('CSV file is empty');
          return;
        }
        setParsedRows(results.data);
      },
      error: (err) => {
        setErrorMsg(`Failed to parse CSV: ${err.message}`);
      },
    });
  };

  const handleImport = async () => {
    if (parsedRows.length === 0 || !selectedWalletId) return;

    setIsProcessing(true);
    try {
      const formatted = parsedRows.map((row) => {
        // Detect amount column
        const rawAmt = row.Amount || row.amount || row['จำนวนเงิน'] || '0';
        const numAmt = parseFloat(String(rawAmt).replace(/,/g, ''));

        // Detect note
        const note = row.Note || row.note || row.Description || row.description || row['รายละเอียด'] || '';

        // Detect date
        const rawDate = row.Date || row.date || row['วันที่'] || new Date().toISOString();

        // Match category or default
        const rawCat = (row.Category || row.category || row['หมวดหมู่'] || '').toLowerCase();
        const matchedCat = categories.find((c) => c.name.toLowerCase().includes(rawCat)) || categories[0];

        return {
          walletId: selectedWalletId,
          categoryId: matchedCat?.id || 'cat_other_exp',
          amount: isNaN(numAmt) ? 0 : numAmt,
          currency: 'THB',
          startDate: new Date(rawDate).toISOString(),
          note: note,
          hashtags: ['#imported'],
        };
      });

      // Submit via API
      await simplicityFetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactions: formatted }),
      });

      await onImportComplete();
      setIsImportOpen(false);
      setParsedRows([]);
    } catch (err: any) {
      setErrorMsg(err.message || 'Import failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-simplicity-modal border border-simplicity-border w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 bg-simplicity-canvas border-b border-simplicity-border/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-simplicity-text flex items-center justify-center text-white">
              <FileSpreadsheet size={16} />
            </div>
            <h3 className="text-sm font-bold text-simplicity-text">Import CSV Transactions</h3>
          </div>
          <button
            onClick={() => setIsImportOpen(false)}
            className="p-1.5 rounded-lg text-simplicity-muted hover:text-simplicity-text hover:bg-slate-200/60"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-simplicity-red/10 text-simplicity-red text-xs flex items-center gap-2">
              <AlertCircle size={15} /> {errorMsg}
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-simplicity-muted block mb-1">Target Wallet</label>
            <select
              value={selectedWalletId}
              onChange={(e) => setSelectedWalletId(e.target.value)}
              className="w-full text-xs font-semibold p-2.5 bg-white rounded-xl border border-simplicity-border text-simplicity-text"
            >
              {wallets.map((w) => (
                <option key={w.id} value={w.id}>{w.name} ({w.currency})</option>
              ))}
            </select>
          </div>

          {/* Upload Area */}
          <div className="border-2 border-dashed border-simplicity-border rounded-2xl p-6 text-center hover:border-simplicity-teal/60 transition-colors bg-simplicity-canvas/40">
            <Upload size={28} className="mx-auto text-simplicity-muted mb-2" />
            <div className="text-xs font-bold text-simplicity-text">
              Upload Simplicity, Bank or Excel CSV file
            </div>
            <p className="text-[11px] text-simplicity-muted mt-1">
              Supports columns: Date, Amount, Category, Note
            </p>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="mt-3 text-xs text-simplicity-muted file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-simplicity-teal file:text-white hover:file:bg-simplicity-teal-hover cursor-pointer"
            />
          </div>

          {/* Preview */}
          {parsedRows.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-simplicity-text">
                  Preview ({parsedRows.length} rows found)
                </span>
                <span className="text-xs text-simplicity-teal font-semibold flex items-center gap-1">
                  <Check size={14} /> Ready to import
                </span>
              </div>
              <div className="border border-simplicity-border rounded-xl overflow-hidden max-h-44 overflow-y-auto">
                <table className="w-full text-[11px] text-left">
                  <thead className="bg-simplicity-canvas text-simplicity-muted">
                    <tr>
                      <th className="p-2">Row</th>
                      <th className="p-2">Data Summary</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedRows.slice(0, 5).map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-2 font-mono text-simplicity-muted">{idx + 1}</td>
                        <td className="p-2 truncate font-mono text-simplicity-text">
                          {JSON.stringify(row)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-simplicity-canvas border-t border-simplicity-border/80 flex items-center justify-end gap-2">
          <button
            onClick={() => setIsImportOpen(false)}
            className="px-4 py-2 rounded-xl text-xs font-bold text-simplicity-muted hover:bg-slate-200/60"
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={parsedRows.length === 0 || isProcessing}
            className="px-5 py-2 rounded-xl bg-simplicity-teal text-white text-xs font-bold hover:bg-simplicity-teal-hover shadow-sm disabled:opacity-50"
          >
            {isProcessing ? 'Importing...' : `Import ${parsedRows.length} Rows`}
          </button>
        </div>
      </div>
    </div>
  );
};

