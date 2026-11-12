import React, { useState } from 'react';
import { GlassCard } from '../common/GlassCard';
import { GlassButton } from '../common/GlassButton';
import { GlassBadge } from '../common/GlassBadge';
import { useDevice } from '../../context/DeviceContext';
import {
  Wifi,
  QrCode,
  ArrowRight,
  Radio,
  CheckCircle2,
  AlertCircle,
  Play,
  KeyRound,
} from 'lucide-react';

interface WifiConnectionCardProps {
  onOpenPairing: () => void;
  onStartWorkspace: () => void;
}

export const WifiConnectionCard: React.FC<WifiConnectionCardProps> = ({
  onOpenPairing,
  onStartWorkspace,
}) => {
  const { devices, connectWireless, startMirroring, setSelectedDevice } = useDevice();
  const [ipInput, setIpInput] = useState('');
  const [portInput, setPortInput] = useState('5555');
  const [isConnecting, setIsConnecting] = useState(false);
  const [feedback, setFeedback] = useState<{ success: boolean; message: string } | null>(null);

  // Check if any wireless device is already connected
  const wifiDevices = devices.filter((d) => d.type === 'wifi');
  const activeWifi = wifiDevices.find((d) => d.state === 'device') || wifiDevices[0];

  const handleDirectConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ipInput.trim()) return;

    setIsConnecting(true);
    setFeedback(null);

    try {
      const port = parseInt(portInput, 10) || 5555;
      const res = await connectWireless(ipInput.trim(), port);
      setFeedback({ success: res.success, message: res.message });
      if (res.success && res.serial) {
        // Clear input
        setIpInput('');
      }
    } catch (err: any) {
      setFeedback({ success: false, message: err.message || 'Connection error' });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleLaunchMirror = async () => {
    if (!activeWifi) return;
    setSelectedDevice(activeWifi);
    await startMirroring(activeWifi.serial);
    onStartWorkspace();
  };

  return (
    <GlassCard className="flex flex-col justify-between h-full bg-gradient-to-br from-[#121c2c]/80 to-[#0e1624]/90 border-white/[0.08]">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-cyan-500/15 border border-cyan-400/25 text-cyan-400 shadow-sm">
              <Wifi className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide">Wireless Wi-Fi Link</h3>
              <p className="text-xs text-slate-400">High-speed wire-free streaming & control</p>
            </div>
          </div>

          <GlassBadge variant="wifi" dot>
            {activeWifi ? 'Connected' : 'Wi-Fi / Hotspot'}
          </GlassBadge>
        </div>

        {/* If a wireless device is already active */}
        {activeWifi && (
          <div className="p-3.5 rounded-xl bg-cyan-500/[0.08] border border-cyan-400/20 mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
              <div>
                <span className="text-xs font-semibold text-white block">
                  {activeWifi.brand} {activeWifi.model}
                </span>
                <span className="text-[11px] text-cyan-300 font-mono">{activeWifi.id}</span>
              </div>
            </div>
            <GlassButton
              variant="primary"
              size="sm"
              onClick={handleLaunchMirror}
              leftIcon={<Play className="w-3.5 h-3.5 fill-current" />}
            >
              Mirror Now
            </GlassButton>
          </div>
        )}

        {/* Direct Connect Form */}
        <form onSubmit={handleDirectConnect} className="space-y-3">
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-[11px] font-medium text-slate-300 mb-1">
                Phone IP Address
              </label>
              <input
                type="text"
                placeholder="192.168.1.xxx"
                value={ipInput}
                onChange={(e) => setIpInput(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl bg-white/[0.05] border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-400"
              />
            </div>
            <div className="w-24">
              <label className="block text-[11px] font-medium text-slate-300 mb-1">Port</label>
              <input
                type="number"
                placeholder="5555"
                value={portInput}
                onChange={(e) => setPortInput(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl bg-white/[0.05] border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-400"
              />
            </div>
            <div className="flex items-end">
              <GlassButton
                type="submit"
                variant="primary"
                size="sm"
                isLoading={isConnecting}
                disabled={!ipInput.trim()}
                className="h-[34px]"
              >
                Connect
              </GlassButton>
            </div>
          </div>

          {feedback && (
            <div
              className={`p-2 rounded-lg text-xs flex items-center gap-2 ${
                feedback.success
                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                  : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
              }`}
            >
              {feedback.success ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span className="truncate">{feedback.message}</span>
            </div>
          )}
        </form>
      </div>

      {/* Footer / Pairing Assistant Action */}
      <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between gap-2 mt-4">
        <div className="text-[11px] text-slate-400">
          First time? Android 11+ pairing
        </div>
        <GlassButton
          variant="secondary"
          size="sm"
          onClick={onOpenPairing}
          leftIcon={<KeyRound className="w-3.5 h-3.5 text-brand-300" />}
        >
          Pair with 6-Digit Code
        </GlassButton>
      </div>
    </GlassCard>
  );
};

