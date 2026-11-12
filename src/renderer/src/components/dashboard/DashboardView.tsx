import React, { useState } from 'react';
import { UsbConnectionCard } from './UsbConnectionCard';
import { WifiConnectionCard } from './WifiConnectionCard';
import { DetectedDevicesList } from './DetectedDevicesList';
import { RecentDevicesList } from './RecentDevicesList';
import { PairingModal } from './PairingModal';
import { Radio, Sparkles } from 'lucide-react';

interface DashboardViewProps {
  onStartWorkspace: () => void;
  onBrowseFiles: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onStartWorkspace,
  onBrowseFiles,
}) => {
  const [isPairingOpen, setIsPairingOpen] = useState(false);

  return (
    <div className="h-full overflow-y-auto px-8 py-6 space-y-6">
      {/* Banner / Ambient Header */}
      <div className="relative p-6 rounded-3xl bg-gradient-to-r from-brand-600/20 via-cyan-500/10 to-indigo-600/20 border border-white/10 backdrop-blur-2xl overflow-hidden shadow-glass-subtle">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 rounded-full bg-brand-500/20 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-10 w-48 h-48 rounded-full bg-cyan-400/20 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-brand-500/20 text-brand-300 text-xs font-semibold border border-brand-400/30">
                <Sparkles className="w-3.5 h-3.5" />
                Next-Gen Android Studio Engine
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              Premium Wireless Android Control
            </h1>
            <p className="text-xs text-slate-300 max-w-xl">
              Mirror and control your phone with ultra-low latency mouse, keyboard, seamless file transfers, and Display Off mode.
            </p>
          </div>
        </div>
      </div>

      {/* Main Connection Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <UsbConnectionCard onStartWorkspace={onStartWorkspace} />
        <WifiConnectionCard
          onOpenPairing={() => setIsPairingOpen(true)}
          onStartWorkspace={onStartWorkspace}
        />
      </div>

      {/* Detected Devices Section */}
      <DetectedDevicesList
        onStartWorkspace={onStartWorkspace}
        onBrowseFiles={onBrowseFiles}
      />

      {/* Recent Devices */}
      <RecentDevicesList onStartWorkspace={onStartWorkspace} />

      {/* Pairing Modal */}
      <PairingModal
        isOpen={isPairingOpen}
        onClose={() => setIsPairingOpen(false)}
      />
    </div>
  );
};

