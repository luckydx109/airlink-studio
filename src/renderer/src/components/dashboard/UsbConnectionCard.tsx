import React, { useState } from 'react';
import { GlassCard } from '../common/GlassCard';
import { GlassButton } from '../common/GlassButton';
import { GlassBadge } from '../common/GlassBadge';
import { useDevice } from '../../context/DeviceContext';
import {
  Usb,
  Smartphone,
  CheckCircle2,
  AlertTriangle,
  Play,
  Wifi,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

interface UsbConnectionCardProps {
  onStartWorkspace: () => void;
}

export const UsbConnectionCard: React.FC<UsbConnectionCardProps> = ({ onStartWorkspace }) => {
  const { devices, selectedDevice, setSelectedDevice, startMirroring, switchUsbToWireless } = useDevice();
  const [isSwitching, setIsSwitching] = useState(false);
  const [switchFeedback, setSwitchFeedback] = useState<string | null>(null);

  // Find USB devices
  const usbDevices = devices.filter((d) => d.type === 'usb');
  const activeUsb = usbDevices.find((d) => d.state === 'device') || usbDevices[0];

  const handleLaunchMirror = async () => {
    if (!activeUsb) return;
    setSelectedDevice(activeUsb);
    await startMirroring(activeUsb.serial);
    onStartWorkspace();
  };

  const handleConvertToWifi = async () => {
    if (!activeUsb) return;
    setIsSwitching(true);
    setSwitchFeedback(null);
    try {
      const res = await switchUsbToWireless(activeUsb.serial);
      setSwitchFeedback(res.message);
    } catch (e: any) {
      setSwitchFeedback(e.message || 'Failed to switch to Wi-Fi');
    } finally {
      setIsSwitching(false);
    }
  };

  return (
    <GlassCard className="flex flex-col justify-between h-full bg-gradient-to-br from-[#12192b]/80 to-[#0e1424]/90 border-white/[0.08]">
      <div>
        {/* Card Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-indigo-500/15 border border-indigo-400/25 text-indigo-400 shadow-sm">
              <Usb className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide">USB Cable Connection</h3>
              <p className="text-xs text-slate-400">Zero latency direct hardware link</p>
            </div>
          </div>

          {activeUsb ? (
            activeUsb.state === 'device' ? (
              <GlassBadge variant="success" dot>Authorized</GlassBadge>
            ) : activeUsb.state === 'unauthorized' ? (
              <GlassBadge variant="warning" dot>Auth Required</GlassBadge>
            ) : (
              <GlassBadge variant="neutral">Connecting</GlassBadge>
            )
          ) : (
            <GlassBadge variant="neutral">Auto-Detecting</GlassBadge>
          )}
        </div>

        {/* Dynamic Status Content */}
        {activeUsb ? (
          <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-3 my-2">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-white/[0.05] border border-white/10 text-brand-300">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-semibold text-sm text-white flex items-center gap-1.5">
                    {activeUsb.brand} {activeUsb.model}
                  </div>
                  <div className="text-xs text-slate-400 font-mono">
                    Serial: {activeUsb.serial}
                  </div>
                </div>
              </div>

              {activeUsb.androidVersion && (
                <div className="text-right">
                  <span className="text-[10px] font-semibold text-slate-400 block">Android</span>
                  <span className="text-xs font-bold text-brand-400">v{activeUsb.androidVersion}</span>
                </div>
              )}
            </div>

            {activeUsb.state === 'unauthorized' && (
              <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <strong>Authorization required:</strong> Please unlock your phone and tap <strong>"Always allow from this computer"</strong> in the prompt.
                </div>
              </div>
            )}

            {activeUsb.state === 'device' && (
              <div className="flex items-center gap-2 text-xs text-emerald-400/90 font-medium">
                <ShieldCheck className="w-4 h-4" />
                <span>Ready for high-speed mirroring and file transfer</span>
              </div>
            )}
          </div>
        ) : (
          <div className="p-6 rounded-xl border border-dashed border-white/10 text-center space-y-2 my-2">
            <div className="w-10 h-10 rounded-full bg-white/[0.03] border border-white/10 mx-auto flex items-center justify-center text-slate-500">
              <Usb className="w-5 h-5 animate-pulse" />
            </div>
            <p className="text-xs font-medium text-slate-300">Plug phone into USB port</p>
            <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
              Enable USB Debugging in Developer Options on your phone. It will be detected automatically.
            </p>
          </div>
        )}

        {switchFeedback && (
          <div className="p-2.5 rounded-lg bg-brand-500/15 border border-brand-500/30 text-xs text-brand-300 flex items-center gap-2 mt-2">
            <Sparkles className="w-4 h-4 shrink-0 text-brand-400" />
            <span>{switchFeedback}</span>
          </div>
        )}
      </div>

      {/* Card Actions */}
      <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between gap-3">
        {activeUsb && activeUsb.state === 'device' ? (
          <>
            <GlassButton
              variant="secondary"
              size="sm"
              isLoading={isSwitching}
              onClick={handleConvertToWifi}
              leftIcon={<Wifi className="w-3.5 h-3.5 text-cyan-400" />}
              title="Switch to Wireless mode on same Wi-Fi network"
            >
              Convert to Wireless
            </GlassButton>

            <GlassButton
              variant="primary"
              size="sm"
              onClick={handleLaunchMirror}
              leftIcon={<Play className="w-3.5 h-3.5 fill-current" />}
            >
              Start Mirroring
            </GlassButton>
          </>
        ) : (
          <div className="w-full flex items-center justify-between text-xs text-slate-500">
            <span>Status: Awaiting USB connection</span>
            <span className="flex items-center gap-1 text-brand-400">
              Auto-poll active <span className="w-2 h-2 rounded-full bg-brand-400 animate-ping" />
            </span>
          </div>
        )}
      </div>
    </GlassCard>
  );
};

