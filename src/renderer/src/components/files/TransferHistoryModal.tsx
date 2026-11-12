import React from 'react';
import { GlassModal } from '../common/GlassModal';
import { GlassButton } from '../common/GlassButton';
import { useTransfer } from '../../context/TransferContext';
import {
  ArrowDownCircle,
  ArrowUpCircle,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Trash2,
} from 'lucide-react';

interface TransferHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TransferHistoryModal: React.FC<TransferHistoryModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { transferHistory, clearHistory, openLocalFile } = useTransfer();

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <GlassModal
      isOpen={isOpen}
      onClose={onClose}
      title="Transfer History"
      subtitle="Log of Android & Windows file sync activity"
      maxWidth="lg"
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>{transferHistory.length} transfers recorded</span>
          {transferHistory.length > 0 && (
            <GlassButton
              variant="ghost"
              size="sm"
              onClick={clearHistory}
              leftIcon={<Trash2 className="w-3.5 h-3.5 text-rose-400" />}
            >
              Clear Log
            </GlassButton>
          )}
        </div>

        <div className="max-h-80 overflow-y-auto space-y-2">
          {transferHistory.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400">
              No transfers in history.
            </div>
          ) : (
            transferHistory.map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 truncate">
                  <div className="p-2 rounded-lg bg-white/[0.04]">
                    {item.direction === 'download' ? (
                      <ArrowDownCircle className="w-4 h-4 text-cyan-400" />
                    ) : (
                      <ArrowUpCircle className="w-4 h-4 text-indigo-400" />
                    )}
                  </div>
                  <div className="truncate">
                    <div className="text-xs font-semibold text-white truncate">
                      {item.fileName}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {formatSize(item.fileSize)} • {formatDate(item.startedAt)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {item.status === 'completed' ? (
                    <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Success
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[11px] text-rose-400 font-medium" title={item.error}>
                      <AlertCircle className="w-3.5 h-3.5" />
                      Failed
                    </span>
                  )}

                  {item.direction === 'download' && item.status === 'completed' && (
                    <GlassButton
                      variant="ghost"
                      size="icon"
                      onClick={() => openLocalFile(item.localPath)}
                      className="h-7 w-7 text-slate-400 hover:text-white"
                      title="Show in Windows Explorer"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </GlassButton>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="flex justify-end pt-2">
          <GlassButton variant="primary" size="sm" onClick={onClose}>
            Done
          </GlassButton>
        </div>
      </div>
    </GlassModal>
  );
};

