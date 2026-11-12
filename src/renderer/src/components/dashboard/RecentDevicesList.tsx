import React from 'react';
import { GlassCard } from '../common/GlassCard';
import { GlassButton } from '../common/GlassButton';
import { useSettings } from '../../context/SettingsContext';
import { useDevice } from '../../context/DeviceContext';
import { History, Wifi, Usb, Trash2, ArrowRight } from 'lucide-react';

interface RecentDevicesListProps {
  onStartWorkspace: () => void;
}

export const RecentDevicesList: React.FC<RecentDevicesListProps> = ({ onStartWorkspace }) => {
  const { settings, removeRememberedDevice } = useSettings();
  const { connectWireless, startMirroring } = useDevice();

  const remembered = settings?.rememberedDevices || [];

  if (remembered.length === 0) return null;

  const handleReconnect = async (item: any) => {
    if (item.type === 'wifi' && item.ip) {
      const res = await connectWireless(item.ip, item.port || 5555);
      if (res.success && res.serial) {
        await startMirroring(res.serial);
        onStartWorkspace();
      }
    } else {
      await startMirroring(item.id);
      onStartWorkspace();
    }
  };

  const formatLastSeen = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const mins = Math.floor(diff / (1000 * 60));
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-2">
        <History className="w-4 h-4 text-slate-400" />
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Recently Paired Devices
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
        {remembered.map((device) => (
          <GlassCard
            key={device.id}
            className="p-3.5 flex items-center justify-between gap-3 bg-white/[0.02] hover:bg-white/[0.04]"
          >
            <div className="flex items-center gap-2.5 truncate">
              <div className="p-2 rounded-lg bg-white/[0.04] text-slate-300">
                {device.type === 'wifi' ? (
                  <Wifi className="w-4 h-4 text-cyan-400" />
                ) : (
                  <Usb className="w-4 h-4 text-indigo-400" />
                )}
              </div>
              <div className="truncate">
                <div className="text-xs font-semibold text-white truncate">{device.name}</div>
                <div className="text-[10px] text-slate-500 font-mono">
                  {device.ip ? `${device.ip}:${device.port}` : device.id} • {formatLastSeen(device.lastSeen)}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <GlassButton
                variant="ghost"
                size="icon"
                onClick={() => removeRememberedDevice(device.id)}
                className="h-7 w-7 text-slate-500 hover:text-rose-400"
                title="Forget device"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </GlassButton>
              <GlassButton
                variant="secondary"
                size="sm"
                onClick={() => handleReconnect(device)}
                className="text-xs py-1 px-2.5"
              >
                Connect
              </GlassButton>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
};

