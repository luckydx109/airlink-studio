import React from 'react';
import { GlassCard } from '../common/GlassCard';
import { GlassButton } from '../common/GlassButton';
import { GlassBadge } from '../common/GlassBadge';
import { useDevice } from '../../context/DeviceContext';
import {
  Smartphone,
  Play,
  FolderOpen,
  Wifi,
  Usb,
  Battery,
  BatteryCharging,
  Maximize2,
  PowerOff,
  Radio,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';

interface DetectedDevicesListProps {
  onStartWorkspace: () => void;
  onBrowseFiles: () => void;
}

export const DetectedDevicesList: React.FC<DetectedDevicesListProps> = ({
  onStartWorkspace,
  onBrowseFiles,
}) => {
  const {
    devices,
    selectedDevice,
    setSelectedDevice,
    activeSessions,
    startMirroring,
    stopMirroring,
    disconnectWireless,
    refreshDevices,
    isLoading,
  } = useDevice();

  const handleMirror = async (serial: string) => {
    const dev = devices.find((d) => d.serial === serial);
    if (dev) setSelectedDevice(dev);
    await startMirroring(serial);
    onStartWorkspace();
  };

  const handleStop = async (serial: string) => {
    await stopMirroring(serial);
  };

  const handleBrowse = (dev: any) => {
    setSelectedDevice(dev);
    onBrowseFiles();
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-bold text-white tracking-wide">Detected Devices</h2>
          <span className="px-2 py-0.5 rounded-full bg-white/[0.06] text-xs font-semibold text-slate-400">
            {devices.length}
          </span>
        </div>

        <GlassButton
          variant="ghost"
          size="sm"
          isLoading={isLoading}
          onClick={refreshDevices}
          leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
        >
          Refresh
        </GlassButton>
      </div>

      {devices.length === 0 ? (
        <GlassCard className="p-8 text-center border-dashed border-white/10">
          <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center mx-auto text-slate-500 mb-3">
            <Smartphone className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-semibold text-white">No Android Devices Found</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
            Connect your phone via USB cable or use the Wireless Wi-Fi section above. Make sure <strong>USB Debugging</strong> is enabled in Developer Options.
          </p>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {devices.map((device) => {
            const isSessionActive = activeSessions.some(
              (s) => s.deviceId === device.serial && s.isActive
            );
            const isSelected = selectedDevice?.serial === device.serial;

            return (
              <GlassCard
                key={device.id}
                glow={isSelected}
                className={`transition-all ${
                  isSelected ? 'border-brand-500/40 bg-brand-500/[0.04]' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="p-3 rounded-xl bg-gradient-to-tr from-brand-500/20 to-indigo-500/20 border border-brand-400/30 text-brand-300 shadow-sm mt-0.5">
                      <Smartphone className="w-5 h-5" />
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-white">
                          {device.brand} {device.model}
                        </span>
                        {isSessionActive && (
                          <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-semibold bg-emerald-500/15 px-2 py-0.5 rounded-full border border-emerald-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                            Live Mirroring
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                        <span>{device.serial}</span>
                      </div>

                      {/* Specs badges */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        {device.type === 'wifi' ? (
                          <GlassBadge variant="wifi" icon={<Wifi className="w-3 h-3" />}>
                            Wi-Fi
                          </GlassBadge>
                        ) : (
                          <GlassBadge variant="usb" icon={<Usb className="w-3 h-3" />}>
                            USB
                          </GlassBadge>
                        )}

                        {device.androidVersion && (
                          <GlassBadge variant="neutral">
                            Android {device.androidVersion}
                          </GlassBadge>
                        )}

                        {device.batteryLevel !== undefined && (
                          <GlassBadge
                            variant={device.isCharging ? 'success' : 'neutral'}
                            icon={
                              device.isCharging ? (
                                <BatteryCharging className="w-3 h-3" />
                              ) : (
                                <Battery className="w-3 h-3" />
                              )
                            }
                          >
                            {device.batteryLevel}%
                          </GlassBadge>
                        )}

                        {device.resolution && (
                          <GlassBadge variant="neutral">
                            {device.resolution}
                          </GlassBadge>
                        )}
                      </div>
                    </div>
                  </div>

                  {device.state === 'unauthorized' ? (
                    <GlassBadge variant="warning" dot>
                      Unauthorized
                    </GlassBadge>
                  ) : (
                    <GlassBadge variant="success" dot>
                      Ready
                    </GlassBadge>
                  )}
                </div>

                {/* Actions */}
                <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GlassButton
                      variant="glass"
                      size="sm"
                      onClick={() => handleBrowse(device)}
                      leftIcon={<FolderOpen className="w-3.5 h-3.5 text-brand-300" />}
                    >
                      Files
                    </GlassButton>

                    {device.type === 'wifi' && (
                      <GlassButton
                        variant="ghost"
                        size="sm"
                        onClick={() => disconnectWireless(device.id)}
                        className="text-slate-400 hover:text-rose-400"
                      >
                        Disconnect
                      </GlassButton>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {isSessionActive ? (
                      <>
                        <GlassButton
                          variant="danger"
                          size="sm"
                          onClick={() => handleStop(device.serial)}
                          leftIcon={<PowerOff className="w-3.5 h-3.5" />}
                        >
                          Stop
                        </GlassButton>
                        <GlassButton
                          variant="primary"
                          size="sm"
                          onClick={onStartWorkspace}
                          leftIcon={<Maximize2 className="w-3.5 h-3.5" />}
                        >
                          Workspace
                        </GlassButton>
                      </>
                    ) : (
                      <GlassButton
                        variant="primary"
                        size="sm"
                        disabled={device.state !== 'device'}
                        onClick={() => handleMirror(device.serial)}
                        leftIcon={<Play className="w-3.5 h-3.5 fill-current" />}
                      >
                        Connect & Mirror
                      </GlassButton>
                    )}
                  </div>
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}
    </div>
  );
};

