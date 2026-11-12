import React, { useEffect, useState } from 'react';
import { useSettings } from '../../context/SettingsContext';
import { GlassCard } from '../common/GlassCard';
import { GlassButton } from '../common/GlassButton';
import { GlassBadge } from '../common/GlassBadge';
import { SystemStatus, ScrcpyConfig } from '@shared/types';
import {
  Settings,
  Cpu,
  Monitor,
  Zap,
  Volume2,
  HardDrive,
  EyeOff,
  Keyboard,
  ShieldCheck,
  RotateCcw,
  Info,
  CheckCircle2,
  ExternalLink,
  FolderOpen,
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { settings, updateSettings } = useSettings();
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [isRestartingAdb, setIsRestartingAdb] = useState(false);
  const [savedToast, setSavedToast] = useState(false);

  useEffect(() => {
    const fetchStatus = async () => {
      if (window.airlinkAPI) {
        const s = await window.airlinkAPI.getSystemStatus();
        setSystemStatus(s);
      }
    };
    fetchStatus();
  }, []);

  const handleRestartAdb = async () => {
    setIsRestartingAdb(true);
    try {
      await window.airlinkAPI.killAdbServer();
      await window.airlinkAPI.startAdbServer();
      const s = await window.airlinkAPI.getSystemStatus();
      setSystemStatus(s);
    } finally {
      setIsRestartingAdb(false);
    }
  };

  const handleUpdateScrcpyConfig = async (partial: Partial<ScrcpyConfig>) => {
    if (!settings) return;
    await updateSettings({
      defaultScrcpyConfig: {
        ...settings.defaultScrcpyConfig,
        ...partial,
      },
    });
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2000);
  };

  const handleChangeDownloadDir = async () => {
    const dir = await window.airlinkAPI.selectDestinationFolder();
    if (dir) {
      await updateSettings({ downloadDirectory: dir });
    }
  };

  const scrcpyConfig = settings?.defaultScrcpyConfig;

  return (
    <div className="h-full overflow-y-auto px-8 py-6 space-y-6">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white tracking-wide">Settings & Engine Control</h1>
          <p className="text-xs text-slate-400">
            Configure scrcpy streaming parameters, ADB binaries, and connection preferences.
          </p>
        </div>

        {savedToast && (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-medium border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5" /> Settings Saved
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Mirroring Engine Preferences */}
        <GlassCard className="space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-white/[0.08]">
            <Monitor className="w-4 h-4 text-brand-400" />
            <h3 className="text-sm font-bold text-white">Stream & Display Quality</h3>
          </div>

          {/* Max Resolution */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300 block">
              Maximum Resolution
            </label>
            <select
              value={scrcpyConfig?.maxSize || 0}
              onChange={(e) => handleUpdateScrcpyConfig({ maxSize: parseInt(e.target.value, 10) })}
              className="w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-white text-xs focus:outline-none focus:border-brand-400"
            >
              <option value={0} className="bg-[#121726]">Original Native (No Downscaling)</option>
              <option value={2160} className="bg-[#121726]">4K Ultra HD (2160p)</option>
              <option value={1440} className="bg-[#121726]">2K Quad HD (1440p)</option>
              <option value={1080} className="bg-[#121726]">Full HD (1080p) - Recommended</option>
              <option value={720} className="bg-[#121726]">HD (720p) - High Performance</option>
            </select>
          </div>

          {/* Frame Rate FPS */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300 block">Max Frame Rate (FPS)</label>
            <div className="grid grid-cols-3 gap-2">
              {[30, 60, 120].map((fps) => (
                <button
                  key={fps}
                  onClick={() => handleUpdateScrcpyConfig({ maxFps: fps })}
                  className={`py-1.5 px-3 rounded-xl text-xs font-semibold border transition-all ${
                    scrcpyConfig?.maxFps === fps
                      ? 'bg-brand-500/25 border-brand-400/40 text-white'
                      : 'bg-white/[0.03] border-white/10 text-slate-400 hover:text-white'
                  }`}
                >
                  {fps} FPS
                </button>
              ))}
            </div>
          </div>

          {/* Bitrate */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <label className="font-medium text-slate-300">Video Bitrate</label>
              <span className="text-brand-300 font-mono">{scrcpyConfig?.bitRate || 12} Mbps</span>
            </div>
            <input
              type="range"
              min={4}
              max={32}
              step={2}
              value={scrcpyConfig?.bitRate || 12}
              onChange={(e) => handleUpdateScrcpyConfig({ bitRate: parseInt(e.target.value, 10) })}
              className="w-full accent-brand-500 cursor-pointer"
            />
          </div>

          {/* Codec */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300 block">Video Compression Codec</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'h264', label: 'H.264 (Universal)' },
                { id: 'h265', label: 'H.265 (HEVC)' },
                { id: 'av1', label: 'AV1 (Next-Gen)' },
              ].map((codec) => (
                <button
                  key={codec.id}
                  onClick={() => handleUpdateScrcpyConfig({ videoCodec: codec.id as any })}
                  className={`py-1.5 px-2 rounded-xl text-[11px] font-semibold border transition-all text-center ${
                    scrcpyConfig?.videoCodec === codec.id
                      ? 'bg-cyan-500/20 border-cyan-400/40 text-cyan-200'
                      : 'bg-white/[0.03] border-white/10 text-slate-400 hover:text-white'
                  }`}
                >
                  {codec.label}
                </button>
              ))}
            </div>
          </div>

          {/* Toggles */}
          <div className="space-y-2.5 pt-2 border-t border-white/[0.06]">
            <label className="flex items-center justify-between text-xs cursor-pointer select-none">
              <span className="text-slate-300">Forward Phone Audio to PC</span>
              <input
                type="checkbox"
                checked={scrcpyConfig?.audio ?? true}
                onChange={(e) => handleUpdateScrcpyConfig({ audio: e.target.checked })}
                className="w-4 h-4 accent-brand-500 rounded"
              />
            </label>

            <label className="flex items-center justify-between text-xs cursor-pointer select-none">
              <span className="text-slate-300">Keep Android Awake During Mirror</span>
              <input
                type="checkbox"
                checked={scrcpyConfig?.stayAwake ?? true}
                onChange={(e) => handleUpdateScrcpyConfig({ stayAwake: e.target.checked })}
                className="w-4 h-4 accent-brand-500 rounded"
              />
            </label>

            <label className="flex items-center justify-between text-xs cursor-pointer select-none">
              <span className="text-slate-300">Turn Off Phone Screen On Connect</span>
              <input
                type="checkbox"
                checked={scrcpyConfig?.turnScreenOff ?? false}
                onChange={(e) => handleUpdateScrcpyConfig({ turnScreenOff: e.target.checked })}
                className="w-4 h-4 accent-brand-500 rounded"
              />
            </label>

            <label className="flex items-center justify-between text-xs cursor-pointer select-none">
              <span className="text-slate-300">Mirror Window Always On Top</span>
              <input
                type="checkbox"
                checked={scrcpyConfig?.alwaysOnTop ?? false}
                onChange={(e) => handleUpdateScrcpyConfig({ alwaysOnTop: e.target.checked })}
                className="w-4 h-4 accent-brand-500 rounded"
              />
            </label>
          </div>
        </GlassCard>

        {/* System & Engine Status */}
        <div className="space-y-5">
          <GlassCard className="space-y-4">
            <div className="flex items-center gap-2.5 pb-2 border-b border-white/[0.08]">
              <Cpu className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-white">Bundled Engine & Core Binaries</h3>
            </div>

            {systemStatus ? (
              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-white block">Android Debug Bridge (ADB)</span>
                    <span className="text-[11px] text-slate-400 font-mono truncate max-w-xs block">
                      {systemStatus.adbPath}
                    </span>
                  </div>
                  <GlassBadge variant="success">v{systemStatus.adbVersion}</GlassBadge>
                </div>

                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-white block">scrcpy Engine</span>
                    <span className="text-[11px] text-slate-400 font-mono truncate max-w-xs block">
                      {systemStatus.scrcpyPath}
                    </span>
                  </div>
                  <GlassBadge variant="brand">{systemStatus.scrcpyVersion}</GlassBadge>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-slate-400">
                    Self-contained Windows 64-bit binaries
                  </span>
                  <GlassButton
                    variant="secondary"
                    size="sm"
                    isLoading={isRestartingAdb}
                    onClick={handleRestartAdb}
                    leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                  >
                    Restart ADB Server
                  </GlassButton>
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-400">Detecting engine status...</div>
            )}
          </GlassCard>

          {/* File Transfer Destination */}
          <GlassCard className="space-y-3">
            <div className="flex items-center gap-2.5 pb-2 border-b border-white/[0.08]">
              <HardDrive className="w-4 h-4 text-indigo-400" />
              <h3 className="text-sm font-bold text-white">File Transfer Location</h3>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300 block">
                Windows Download Directory
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={settings?.downloadDirectory || 'Downloads'}
                  className="flex-1 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-slate-300 font-mono"
                />
                <GlassButton
                  variant="secondary"
                  size="sm"
                  onClick={handleChangeDownloadDir}
                  leftIcon={<FolderOpen className="w-3.5 h-3.5" />}
                >
                  Change
                </GlassButton>
              </div>
            </div>
          </GlassCard>

          {/* Android Setup Guide */}
          <GlassCard className="p-4 bg-gradient-to-br from-indigo-950/20 to-brand-950/20 border-white/[0.08] space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-bold text-brand-300">
              <Info className="w-4 h-4" />
              <span>Android Setup Quick Guide</span>
            </div>
            <ol className="text-[11px] text-slate-300 space-y-1.5 list-decimal list-inside leading-relaxed pl-1">
              <li>
                Go to <strong className="text-white">Settings &rarr; About Phone</strong> and tap <strong className="text-brand-300">Build Number</strong> 7 times to enable Developer Options.
              </li>
              <li>
                In <strong className="text-white">Settings &rarr; System &rarr; Developer Options</strong>, turn ON <strong className="text-white">USB Debugging</strong>.
              </li>
              <li>
                For Wireless mode, turn ON <strong className="text-white">Wireless Debugging</strong> while connected to Wi-Fi.
              </li>
            </ol>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};
