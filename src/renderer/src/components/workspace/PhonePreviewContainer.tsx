import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDevice } from '../../context/DeviceContext';
import { GlassButton } from '../common/GlassButton';
import { GlassBadge } from '../common/GlassBadge';
import {
  Smartphone,
  Play,
  Maximize2,
  Sparkles,
  Wifi,
  Usb,
  Battery,
  BatteryCharging,
  EyeOff,
  Radio,
  RotateCw,
  Tv,
} from 'lucide-react';

interface PhonePreviewContainerProps {
  isDisplayOff: boolean;
  isFullscreen: boolean;
  onOpenSettings: () => void;
  onOpenDisplayOffModal: () => void;
  onToggleFullscreen: () => void;
}

export const PhonePreviewContainer: React.FC<PhonePreviewContainerProps> = ({
  isDisplayOff,
  isFullscreen,
  onOpenSettings,
  onOpenDisplayOffModal,
  onToggleFullscreen,
}) => {
  const { selectedDevice, activeSessions, currentOrientation, rotateScreen, startMirroring } = useDevice();
  const [touchFeedback, setTouchFeedback] = useState<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

  if (!selectedDevice) {
    return (
      <div className="h-full flex items-center justify-center p-8 text-center">
        <div className="space-y-3 max-w-sm">
          <div className="w-16 h-16 rounded-3xl bg-white/[0.04] border border-white/10 flex items-center justify-center mx-auto text-slate-500">
            <Smartphone className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-white">No Device Selected</h3>
          <p className="text-xs text-slate-400">
            Please connect or select an Android device in the Dashboard to begin screen mirroring.
          </p>
        </div>
      </div>
    );
  }

  const isSessionActive = activeSessions.some(
    (s) => s.deviceId === selectedDevice.serial && s.isActive
  );

  // Dynamic orientation parameters
  const isLandscape = currentOrientation.orientation === 'landscape';
  const activeWidth = currentOrientation.width || (isLandscape ? 2374 : 1080);
  const activeHeight = currentOrientation.height || (isLandscape ? 1080 : 2374);
  const aspectRatio = activeWidth / activeHeight;

  // Handle direct mouse touch interactions onto phone screen surface
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const y = Math.max(0, Math.min(rect.height, e.clientY - rect.top));

    dragStartRef.current = { x, y, time: Date.now() };

    // Visual ripple feedback
    setTouchFeedback({ x, y });
    setTimeout(() => setTouchFeedback(null), 350);
  };

  const handleMouseUp = async (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || !dragStartRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x2 = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const y2 = Math.max(0, Math.min(rect.height, e.clientY - rect.top));

    const dx = x2 - dragStartRef.current.x;
    const dy = y2 - dragStartRef.current.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const duration = Math.max(80, Date.now() - dragStartRef.current.time);

    // Map screen container coordinates accurately to Android physical screen coordinates
    const normX1 = (dragStartRef.current.x / rect.width) * activeWidth;
    const normY1 = (dragStartRef.current.y / rect.height) * activeHeight;
    const normX2 = (x2 / rect.width) * activeWidth;
    const normY2 = (y2 / rect.height) * activeHeight;

    if (dist > 15) {
      // Swipe / Drag gesture
      await window.airlinkAPI.sendSwipe(selectedDevice.serial, normX1, normY1, normX2, normY2, duration);
    } else {
      // Tap gesture
      await window.airlinkAPI.sendTap(selectedDevice.serial, normX1, normY1);
    }

    dragStartRef.current = null;
  };

  // Mouse wheel scroll = vertical swipe along center
  const handleWheel = async (e: React.WheelEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const midX = activeWidth / 2;
    const startY = activeHeight * 0.65;
    const endY = e.deltaY > 0 ? activeHeight * 0.35 : activeHeight * 0.85;
    await window.airlinkAPI.sendSwipe(selectedDevice.serial, midX, startY, midX, endY, 180);
  };

  return (
    <div className={`relative h-full w-full flex items-center justify-center overflow-hidden transition-all duration-300 ${
      isFullscreen ? 'p-0 bg-black' : isLandscape ? 'p-3' : 'p-4'
    }`}>
      {/* Background ambient glow - expands in landscape */}
      {!isFullscreen && (
        <>
          <div className={`absolute rounded-full bg-brand-500/10 blur-[130px] pointer-events-none transition-all duration-500 ${
            isLandscape ? 'w-[750px] h-[400px]' : 'w-[500px] h-[500px]'
          }`} />
          <div className={`absolute rounded-full bg-cyan-500/10 blur-[110px] pointer-events-none transition-all duration-500 ${
            isLandscape ? 'w-[650px] h-[350px]' : 'w-[400px] h-[400px]'
          }`} />
        </>
      )}

      {/* Adaptive Screen Chassis Container */}
      <motion.div
        layout
        transition={{ type: 'spring', damping: 25, stiffness: 220 }}
        style={{
          aspectRatio: `${aspectRatio}`,
          maxHeight: isFullscreen
            ? '100vh'
            : isLandscape
            ? 'calc(100vh - 84px)'
            : 'calc(100vh - 160px)',
          maxWidth: isFullscreen
            ? '100vw'
            : isLandscape
            ? 'calc(100vw - 40px)'
            : '85vw',
        }}
        className={`relative flex flex-col items-center justify-center bg-black transition-all duration-300 ${
          isFullscreen
            ? 'rounded-none border-0 p-0 shadow-none'
            : isLandscape
            ? 'rounded-[32px] p-2.5 shadow-2xl ring-1 ring-white/15 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.85)] border-4 border-[#1f2638]'
            : 'rounded-[44px] p-3.5 shadow-2xl ring-1 ring-white/20 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] border-4 border-[#22283a]'
        }`}
      >
        {/* Chassis Speaker Slit (Repositioned in Landscape) */}
        {!isFullscreen && (
          <div
            className={`absolute rounded-full bg-[#353d52] z-20 pointer-events-none transition-all duration-300 ${
              isLandscape
                ? 'left-2.5 top-1/2 -translate-y-1/2 w-1 h-14'
                : 'top-2 left-1/2 -translate-x-1/2 w-16 h-1'
            }`}
          />
        )}

        {/* OLED Screen Surface */}
        <div
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onWheel={handleWheel}
          className={`relative flex-1 w-full overflow-hidden bg-[#070a12] flex flex-col justify-between select-none cursor-pointer group transition-all duration-300 ${
            isFullscreen
              ? 'rounded-none'
              : isLandscape
              ? 'rounded-[24px]'
              : 'rounded-[32px]'
          }`}
        >
          {/* Top Status Bar */}
          <div className={`relative z-20 w-full flex items-center justify-between text-[11px] font-medium text-slate-300 pointer-events-none bg-gradient-to-b from-black/60 to-transparent transition-all ${
            isLandscape ? 'px-6 py-1.5' : 'px-5 py-2'
          }`}>
            {/* Clock & Status */}
            <div className="flex items-center gap-2">
              <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              <span className="hidden sm:inline-block px-1.5 py-0.2 rounded bg-white/10 text-[10px] font-mono text-cyan-300">
                {isLandscape ? 'LANDSCAPE' : 'PORTRAIT'} • {activeWidth}×{activeHeight}
              </span>
            </div>

            {/* Front Camera Cutout (adapts to orientation) */}
            {!isFullscreen && (
              <div
                className={`w-3.5 h-3.5 rounded-full bg-black ring-1 ring-white/10 shadow-inner flex items-center justify-center transition-all ${
                  isLandscape ? 'ml-2' : ''
                }`}
              >
                <div className="w-1.5 h-1.5 rounded-full bg-[#111c38]" />
              </div>
            )}

            {/* Connection & Battery Icons */}
            <div className="flex items-center gap-2">
              {selectedDevice.type === 'wifi' ? (
                <Wifi className="w-3 h-3 text-cyan-400" />
              ) : (
                <Usb className="w-3 h-3 text-indigo-400" />
              )}
              {selectedDevice.batteryLevel !== undefined && (
                <div className="flex items-center gap-0.5">
                  {selectedDevice.isCharging ? (
                    <BatteryCharging className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <Battery className="w-3 h-3 text-slate-300" />
                  )}
                  <span>{selectedDevice.batteryLevel}%</span>
                </div>
              )}
            </div>
          </div>

          {/* Interactive Screen Display Content */}
          <div className="flex-1 w-full flex flex-col items-center justify-center p-6 text-center z-10">
            {isSessionActive ? (
              <div className="space-y-3">
                <div className="relative mx-auto w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-500/20 to-cyan-500/20 border border-brand-400/40 flex items-center justify-center text-brand-300 shadow-glass-glow">
                  {isLandscape ? (
                    <Tv className="w-7 h-7 text-cyan-400 animate-pulse" />
                  ) : (
                    <Radio className="w-7 h-7 text-cyan-400 animate-pulse" />
                  )}
                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-400 ring-2 ring-black animate-ping" />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-center gap-2">
                    <h4 className="text-sm font-bold text-white tracking-wide">
                      {selectedDevice.brand} {selectedDevice.model}
                    </h4>
                  </div>
                  <p className="text-xs text-brand-300 font-medium">
                    {isLandscape ? 'Adaptive Landscape Fullscreen Feed Active' : 'scrcpy 3.1 Streaming Engine Active'}
                  </p>
                  <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                    {isLandscape
                      ? 'Display automatically expanded to maximum laptop workspace. Mouse & touch coordinates calibrated.'
                      : 'Interactive touch surface active. Click to tap, drag to swipe, or use keyboard typing.'}
                  </p>
                </div>

                <div className="flex items-center justify-center gap-2 pt-1">
                  {isDisplayOff && (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-400/30 text-amber-300 text-xs font-semibold">
                      <EyeOff className="w-3 h-3" />
                      <span>Display Off Mode</span>
                    </div>
                  )}

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      rotateScreen();
                    }}
                    title="Rotate Screen Orientation"
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/10 hover:bg-white/15 text-slate-300 hover:text-white text-xs border border-white/15 transition-colors cursor-pointer"
                  >
                    <RotateCw className="w-3 h-3 text-cyan-300" />
                    <span>Rotate</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center mx-auto text-slate-400">
                  <Smartphone className="w-8 h-8" />
                </div>

                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-white">
                    {selectedDevice.brand} {selectedDevice.model}
                  </h4>
                  <p className="text-xs text-slate-400">
                    Resolution: {activeWidth}×{activeHeight} ({isLandscape ? 'Landscape' : 'Portrait'})
                  </p>
                </div>

                <GlassButton
                  variant="primary"
                  size="md"
                  onClick={() => startMirroring(selectedDevice.serial)}
                  leftIcon={<Play className="w-4 h-4 fill-current" />}
                >
                  Start Mirroring
                </GlassButton>
              </div>
            )}
          </div>

          {/* Touch visual ripple feedback */}
          {touchFeedback && (
            <div
              style={{
                left: `${touchFeedback.x}px`,
                top: `${touchFeedback.y}px`,
              }}
              className="absolute w-8 h-8 -ml-4 -mt-4 rounded-full bg-cyan-400/50 border border-cyan-300 animate-ping pointer-events-none z-30"
            />
          )}

          {/* Bottom Gestural Pill Indicator */}
          <div className="relative z-20 w-full py-2 flex items-center justify-center pointer-events-none bg-gradient-to-t from-black/60 to-transparent">
            <div className={`h-1 rounded-full bg-white/40 transition-all ${
              isLandscape ? 'w-44' : 'w-28'
            }`} />
          </div>
        </div>
      </motion.div>
    </div>
  );
};
