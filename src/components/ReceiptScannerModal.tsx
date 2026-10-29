import React, { useState } from 'react';
import { useFinanceStore } from '../store/useFinanceStore';
import { api } from '../api/client';
import { X, Sparkles, Camera, Check, ArrowRight, Loader2 } from 'lucide-react';

interface ReceiptScannerModalProps {
  onApplyReceipt: (data: { merchant: string; amount: number; categoryId: string; date: string }) => void;
}

export const ReceiptScannerModal: React.FC<ReceiptScannerModalProps> = ({ onApplyReceipt }) => {
  const { isAiScanOpen, setIsAiScanOpen, setIsAddTxOpen } = useFinanceStore();

  const [ocrText, setOcrText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scannedResult, setScannedResult] = useState<any>(null);

  if (!isAiScanOpen) return null;

  const handleScan = async () => {
    setIsScanning(true);
    try {
      const result = await api.scanReceipt({
        ocrText,
        filename: selectedFile?.name,
      });
      setScannedResult(result);
    } finally {
      setIsScanning(false);
    }
  };

  const handleApply = () => {
    if (!scannedResult) return;
    onApplyReceipt({
      merchant: scannedResult.merchant,
      amount: scannedResult.amount,
      categoryId: scannedResult.suggestedCategoryId,
      date: scannedResult.date,
    });
    setIsAiScanOpen(false);
    setIsAddTxOpen(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-simplicity-modal border border-simplicity-border w-full max-w-md overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 bg-simplicity-purple/10 border-b border-simplicity-purple/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-simplicity-purple flex items-center justify-center text-white">
              <Sparkles size={16} />
            </div>
            <h3 className="text-sm font-bold text-simplicity-text">AI Receipt & Slip Scanner</h3>
          </div>
          <button
            onClick={() => setIsAiScanOpen(false)}
            className="p-1.5 rounded-lg text-simplicity-muted hover:text-simplicity-text hover:bg-slate-200/60"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="border-2 border-dashed border-simplicity-purple/40 rounded-2xl p-5 text-center bg-simplicity-purple/5">
            <Camera size={26} className="mx-auto text-simplicity-purple mb-2" />
            <div className="text-xs font-bold text-simplicity-text">
              Select receipt image or bank transfer slip
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              className="mt-2 text-xs text-simplicity-muted file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-simplicity-purple file:text-white cursor-pointer"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-simplicity-muted block mb-1">
              Or paste receipt text / SMS transaction
            </label>
            <textarea
              rows={3}
              placeholder="e.g. 7-Eleven Bangkapi Total: 185.00 THB Date: 2026-10-29..."
              value={ocrText}
              onChange={(e) => setOcrText(e.target.value)}
              className="w-full text-xs font-medium p-2.5 bg-simplicity-canvas rounded-xl border border-simplicity-border text-simplicity-text focus:outline-none focus:ring-1 focus:ring-simplicity-purple"
            />
          </div>

          <button
            onClick={handleScan}
            disabled={isScanning || (!selectedFile && !ocrText)}
            className="w-full py-2.5 rounded-xl bg-simplicity-purple hover:bg-purple-700 text-white font-bold text-xs shadow-md shadow-simplicity-purple/20 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            {isScanning ? (
              <>
                <Loader2 size={15} className="animate-spin" /> Scanning with AI...
              </>
            ) : (
              <>
                <Sparkles size={15} /> Analyze Receipt
              </>
            )}
          </button>

          {/* Result Card */}
          {scannedResult && (
            <div className="p-4 rounded-2xl bg-simplicity-teal/10 border border-simplicity-teal/30 space-y-2 animate-in fade-in">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-simplicity-teal flex items-center gap-1">
                  <Check size={14} /> Extraction Complete
                </span>
                <span className="text-[10px] text-simplicity-muted">
                  Confidence: {Math.round(scannedResult.confidence * 100)}%
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                <div>
                  <span className="text-simplicity-muted block text-[10px]">Merchant</span>
                  <span className="font-bold text-simplicity-text">{scannedResult.merchant}</span>
                </div>
                <div>
                  <span className="text-simplicity-muted block text-[10px]">Total Amount</span>
                  <span className="font-bold font-mono text-simplicity-red">
                    {scannedResult.amount} THB
                  </span>
                </div>
              </div>

              <button
                onClick={handleApply}
                className="w-full mt-2 py-2 rounded-xl bg-simplicity-teal hover:bg-simplicity-teal-hover text-white font-bold text-xs flex items-center justify-center gap-1 shadow-xs"
              >
                Use in Transaction Form <ArrowRight size={14} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

