import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTransfer } from '../../context/TransferContext';
import {
  ArrowDownCircle,
  ArrowUpCircle,
  CheckCircle2,
  AlertCircle,
  X,
  History,
  ExternalLink,
} from 'lucide-react';
import { GlassButton } from '../common/GlassButton';

interface TransferDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenHistory: () => void;
}

export const TransferDrawer: React.FC<TransferDrawerProps> = ({
  isOpen,
  onClose,
  onOpenHistory,
}) => {
  const { activeTransfers, openLocalFile } = useTransfer();

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  const formatSpeed = (bytesPerSec: number) => {
    if (bytesPerSec <= 0) return '';
    return `${formatSize(bytesPerSec)}/s`;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.95 }}
          className="fixed bottom-6 right-6 z-40 w-96 rounded-2xl bg-[#111728]/95 border border-white/10 shadow-2xl backdrop-blur-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.08] bg-white/[0.02]">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white tracking-wide">File Transfers</span>
              {activeTransfers.length > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-300 text-[10px] font-bold">
                  {activeTransfers.length} active
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={onOpenHistory}
                title="Transfer History"
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                <History className="w-4 h-4" />
              </button>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Transfers list */}
          <div className="p-4 max-h-72 overflow-y-auto space-y-3">
            {activeTransfers.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-400">
                No transfers currently running.
              </div>
            ) : (
              activeTransfers.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 truncate">
                      {item.direction === 'download' ? (
                        <ArrowDownCircle className="w-4 h-4 text-cyan-400 shrink-0" />
                      ) : (
                        <ArrowUpCircle className="w-4 h-4 text-indigo-400 shrink-0" />
                      )}
                      <span className="text-xs font-semibold text-white truncate">
                        {item.fileName}
                      </span>
                    </div>

                    <span className="text-[11px] font-mono font-medium text-slate-400 shrink-0">
                      {item.progress}%
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div
                      style={{ width: `${item.progress}%` }}
                      className={`h-full rounded-full transition-all duration-300 ${
                        item.status === 'completed'
                          ? 'bg-emerald-400'
                          : item.status === 'failed'
                          ? 'bg-rose-500'
                          : 'bg-gradient-to-r from-brand-500 to-cyan-400'
                      }`}
                    />
                  </div>

                  {/* Meta stats */}
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span>
                      {formatSize(item.transferredBytes)} of {formatSize(item.fileSize)}
                    </span>
                    <div className="flex items-center gap-2">
                      {item.speedBytesPerSec > 0 && <span>{formatSpeed(item.speedBytesPerSec)}</span>}
                      {item.remainingSeconds > 0 && <span>ETA {item.remainingSeconds}s</span>}
                      {item.status === 'completed' && (
                        <button
                          onClick={() => openLocalFile(item.localPath)}
                          className="text-brand-300 hover:underline flex items-center gap-1"
                        >
                          <ExternalLink className="w-3 h-3" /> Show
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

