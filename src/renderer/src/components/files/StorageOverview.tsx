import React, { useEffect, useState } from 'react';
import { StorageInfo } from '@shared/types';
import { HardDrive, Smartphone, RefreshCw } from 'lucide-react';
import { GlassCard } from '../common/GlassCard';

interface StorageOverviewProps {
  serial: string;
}

export const StorageOverview: React.FC<StorageOverviewProps> = ({ serial }) => {
  const [storage, setStorage] = useState<StorageInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchStorage = async () => {
    if (!serial || !window.airlinkAPI) return;
    setIsLoading(true);
    try {
      const info = await window.airlinkAPI.getStorageInfo(serial);
      setStorage(info);
    } catch (e) {
      console.warn('Failed to fetch storage info:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStorage();
  }, [serial]);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  if (!storage) return null;

  return (
    <GlassCard className="p-4 bg-white/[0.03] border-white/[0.08]">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <HardDrive className="w-4 h-4 text-brand-400" />
          <span className="text-xs font-bold text-white tracking-wide">Device Storage</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span>
            <strong className="text-white">{formatBytes(storage.usedBytes)}</strong> used of{' '}
            {formatBytes(storage.totalBytes)}
          </span>
          <button
            onClick={fetchStorage}
            disabled={isLoading}
            className="p-1 rounded text-slate-500 hover:text-white transition-colors"
            title="Refresh storage"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden flex">
        <div
          style={{ width: `${storage.usedPercentage}%` }}
          className="h-full bg-gradient-to-r from-brand-500 via-cyan-400 to-indigo-500 rounded-full transition-all duration-500"
        />
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1.5 font-medium">
        <span>{storage.usedPercentage}% Full</span>
        <span className="text-emerald-400">{formatBytes(storage.freeBytes)} Free</span>
      </div>
    </GlassCard>
  );
};
