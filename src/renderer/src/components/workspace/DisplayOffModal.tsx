import React from 'react';
import { GlassModal } from '../common/GlassModal';
import { GlassButton } from '../common/GlassButton';
import { useDevice } from '../../context/DeviceContext';
import {
  EyeOff,
  Sun,
  Moon,
  Info,
  BatteryCharging,
  Cpu,
  ShieldAlert,
  Power,
} from 'lucide-react';

interface DisplayOffModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDisplayOff: boolean;
  onToggleDisplayOff: () => void;
}

export const DisplayOffModal: React.FC<DisplayOffModalProps> = ({
  isOpen,
  onClose,
  isDisplayOff,
  onToggleDisplayOff,
}) => {
  const { wakeDevice, sleepDevice } = useDevice();

  return (
    <GlassModal
      isOpen={isOpen}
      onClose={onClose}
      title="Display Off Mode"
      subtitle="Keep Android running with physical screen powered down"
      maxWidth="lg"
    >
      <div className="space-y-4">
        {/* Status card */}
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between ${
            isDisplayOff
              ? 'bg-amber-500/10 border-amber-400/30 text-amber-200'
              : 'bg-white/[0.04] border-white/10 text-slate-200'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`p-3 rounded-xl ${
                isDisplayOff ? 'bg-amber-500/20 text-amber-300' : 'bg-white/[0.08] text-slate-400'
              }`}
            >
              <EyeOff className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold">
                {isDisplayOff ? 'Display Off Active' : 'Normal Display Mode'}
              </div>
              <div className="text-xs text-slate-400">
                {isDisplayOff
                  ? 'Physical phone screen is turned off to save battery'
                  : 'Phone screen is currently lit and active'}
              </div>
            </div>
          </div>

          <GlassButton
            variant={isDisplayOff ? 'emerald' : 'primary'}
            size="sm"
            onClick={onToggleDisplayOff}
          >
            {isDisplayOff ? 'Restore Screen' : 'Turn Screen Off'}
          </GlassButton>
        </div>

        {/* Benefits */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-start gap-2.5">
            <BatteryCharging className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-white block">Battery Conservation</span>
              <span className="text-slate-400">
                Reduces device power consumption and heat output dramatically.
              </span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-start gap-2.5">
            <Cpu className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-white block">Burn-in Protection</span>
              <span className="text-slate-400">
                Protects OLED displays from static UI burn-in during long desktop sessions.
              </span>
            </div>
          </div>
        </div>

        {/* OEM Limitations Explanation */}
        <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 text-xs space-y-2">
          <div className="flex items-center gap-2 text-amber-400 font-semibold">
            <ShieldAlert className="w-4 h-4" />
            <span>Android & OEM Limitations</span>
          </div>
          <ul className="text-slate-300 space-y-1.5 list-disc list-inside pl-1 text-[11px] leading-relaxed">
            <li>
              <strong>Incoming calls & notifications:</strong> On customized ROMs (Samsung One UI, Xiaomi HyperOS/MIUI, ColorOS), incoming phone calls or high-priority notifications may temporarily illuminate the screen.
            </li>
            <li>
              <strong>Physical power button:</strong> Pressing the physical phone power button will wake the physical screen.
            </li>
            <li>
              <strong>Scrcpy Hotkey:</strong> You can also press <code className="bg-white/10 px-1 py-0.5 rounded text-white font-mono">MOD+o</code> inside the mirror window at any time to toggle display power immediately.
            </li>
          </ul>
        </div>

        {/* Remote Wake / Sleep controls */}
        <div className="pt-2 flex items-center justify-between border-t border-white/[0.08]">
          <div className="flex items-center gap-2">
            <GlassButton
              variant="secondary"
              size="sm"
              onClick={wakeDevice}
              leftIcon={<Sun className="w-3.5 h-3.5 text-amber-400" />}
            >
              Wake Phone
            </GlassButton>
            <GlassButton
              variant="secondary"
              size="sm"
              onClick={sleepDevice}
              leftIcon={<Moon className="w-3.5 h-3.5 text-indigo-400" />}
            >
              Sleep Phone
            </GlassButton>
          </div>

          <GlassButton variant="primary" size="sm" onClick={onClose}>
            Close
          </GlassButton>
        </div>
      </div>
    </GlassModal>
  );
};

