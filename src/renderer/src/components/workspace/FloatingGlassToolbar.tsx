import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Circle,
  Square,
  Volume2,
  Volume1,
  Power,
  Keyboard,
  Camera,
  EyeOff,
  Maximize2,
  Minimize2,
  PowerOff,
  RotateCw,
  Tv,
  Smartphone,
} from 'lucide-react';
import { useDevice } from '../../context/DeviceContext';

interface FloatingGlassToolbarProps {
  onOpenInputModal: () => void;
  onOpenDisplayOffModal: () => void;
  onTakeScreenshot: () => void;
  isDisplayOff: boolean;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}

export const FloatingGlassToolbar: React.FC<FloatingGlassToolbarProps> = ({
  onOpenInputModal,
  onOpenDisplayOffModal,
  onTakeScreenshot,
  isDisplayOff,
  isFullscreen,
  onToggleFullscreen,
}) => {
  const { sendKey, selectedDevice, stopMirroring, currentOrientation, rotateScreen } = useDevice();
  const [isHovered, setIsHovered] = useState(false);

  if (!selectedDevice) return null;

  const handleBack = () => sendKey(4); // KEYCODE_BACK
  const handleHome = () => sendKey(3); // KEYCODE_HOME
  const handleRecents = () => sendKey(187); // KEYCODE_APP_SWITCH
  const handleVolumeUp = () => sendKey(24);
  const handleVolumeDown = () => sendKey(25);
  const handlePower = () => sendKey(26);

  const isLandscape = currentOrientation.orientation === 'landscape';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: isFullscreen && !isHovered ? 0.35 : 1, y: 0 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      transition={{ duration: 0.2 }}
      className={`absolute left-1/2 -translate-x-1/2 z-40 select-none transition-all ${
        isFullscreen ? 'bottom-4' : 'bottom-6'
      }`}
    >
      <div className="glass-panel rounded-2xl p-1.5 flex items-center gap-1.5 shadow-2xl border border-white/[0.14] backdrop-blur-2xl bg-[#0f1523]/85">
        {/* Android Navigation Cluster */}
        <div className="flex items-center gap-1 px-1 border-r border-white/10">
          <button
            onClick={handleBack}
            title="Back (Android)"
            className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <button
            onClick={handleHome}
            title="Home"
            className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <Circle className="w-4 h-4" />
          </button>
          <button
            onClick={handleRecents}
            title="Recent Apps"
            className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <Square className="w-4 h-4" />
          </button>
        </div>

        {/* Orientation Toggle Button */}
        <div className="flex items-center gap-1 px-1 border-r border-white/10">
          <button
            onClick={rotateScreen}
            title={`Current: ${isLandscape ? 'Landscape' : 'Portrait'} (Click to rotate)`}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              isLandscape
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/30'
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <RotateCw className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline text-[11px] font-mono">
              {isLandscape ? 'Landscape' : 'Portrait'}
            </span>
          </button>
        </div>

        {/* Remote Hardware Controls */}
        <div className="flex items-center gap-1 px-1 border-r border-white/10">
          <button
            onClick={handleVolumeDown}
            title="Volume Down"
            className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <Volume1 className="w-4 h-4" />
          </button>
          <button
            onClick={handleVolumeUp}
            title="Volume Up"
            className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <Volume2 className="w-4 h-4" />
          </button>
          <button
            onClick={handlePower}
            title="Power Button"
            className="p-2 rounded-xl text-slate-300 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
          >
            <Power className="w-4 h-4" />
          </button>
        </div>

        {/* Input & Capture */}
        <div className="flex items-center gap-1 px-1 border-r border-white/10">
          <button
            onClick={onOpenInputModal}
            title="Remote Text Input (Keyboard)"
            className="p-2 rounded-xl text-slate-300 hover:text-brand-300 hover:bg-brand-500/10 transition-colors"
          >
            <Keyboard className="w-4 h-4" />
          </button>

          <button
            onClick={onTakeScreenshot}
            title="Take Screenshot"
            className="p-2 rounded-xl text-slate-300 hover:text-cyan-300 hover:bg-cyan-500/10 transition-colors"
          >
            <Camera className="w-4 h-4" />
          </button>

          <button
            onClick={onOpenDisplayOffModal}
            title="Display Off Mode"
            className={`p-2 rounded-xl transition-colors ${
              isDisplayOff
                ? 'text-amber-400 bg-amber-500/20'
                : 'text-slate-300 hover:text-amber-300 hover:bg-amber-500/10'
            }`}
          >
            <EyeOff className="w-4 h-4" />
          </button>
        </div>

        {/* Window Fullscreen & Session */}
        <div className="flex items-center gap-1 pl-1">
          <button
            onClick={onToggleFullscreen}
            title={isFullscreen ? 'Exit Fullscreen (F11 / Esc)' : 'Adaptive Fullscreen Mode'}
            className={`p-2 rounded-xl transition-colors ${
              isFullscreen
                ? 'bg-brand-500/25 text-white border border-brand-400/40'
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          <button
            onClick={() => stopMirroring(selectedDevice.serial)}
            title="Stop Mirroring"
            className="p-2 rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-500/20 transition-colors"
          >
            <PowerOff className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};
