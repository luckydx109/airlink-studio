import React, { useState, useEffect } from 'react';
import { PhonePreviewContainer } from './PhonePreviewContainer';
import { FloatingGlassToolbar } from './FloatingGlassToolbar';
import { RemoteInputModal } from './RemoteInputModal';
import { ScreenshotViewerModal } from './ScreenshotViewerModal';
import { DisplayOffModal } from './DisplayOffModal';
import { useDevice } from '../../context/DeviceContext';

interface WorkspaceViewProps {
  onOpenSettings: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}

export const WorkspaceView: React.FC<WorkspaceViewProps> = ({
  onOpenSettings,
  isFullscreen,
  onToggleFullscreen,
}) => {
  const { selectedDevice, captureScreenshot } = useDevice();
  const [isInputModalOpen, setIsInputModalOpen] = useState(false);
  const [isDisplayOffModalOpen, setIsDisplayOffModalOpen] = useState(false);
  const [isDisplayOff, setIsDisplayOff] = useState(false);
  const [screenshotPath, setScreenshotPath] = useState<string | null>(null);
  const [isScreenshotModalOpen, setIsScreenshotModalOpen] = useState(false);

  // Keyboard shortcut listener: F11 or Esc for fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F11') {
        e.preventDefault();
        onToggleFullscreen();
      } else if (e.key === 'Escape' && isFullscreen) {
        e.preventDefault();
        onToggleFullscreen();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen, onToggleFullscreen]);

  const handleTakeScreenshot = async () => {
    try {
      const p = await captureScreenshot();
      setScreenshotPath(p);
      setIsScreenshotModalOpen(true);
    } catch (e) {
      console.error('Screenshot failed:', e);
    }
  };

  const handleToggleDisplayOff = async () => {
    if (!selectedDevice) return;
    const nextState = !isDisplayOff;
    setIsDisplayOff(nextState);
    if (nextState) {
      await window.airlinkAPI.sleepDevice(selectedDevice.serial);
    } else {
      await window.airlinkAPI.wakeDevice(selectedDevice.serial);
    }
  };

  return (
    <div className={`relative h-full w-full flex flex-col items-center justify-center overflow-hidden transition-all duration-300 ${
      isFullscreen ? 'bg-black' : ''
    }`}>
      {/* Central Adaptive Phone Screen Preview */}
      <PhonePreviewContainer
        isDisplayOff={isDisplayOff}
        isFullscreen={isFullscreen}
        onOpenSettings={onOpenSettings}
        onOpenDisplayOffModal={() => setIsDisplayOffModalOpen(true)}
        onToggleFullscreen={onToggleFullscreen}
      />

      {/* Floating Control Toolbar */}
      <FloatingGlassToolbar
        onOpenInputModal={() => setIsInputModalOpen(true)}
        onOpenDisplayOffModal={() => setIsDisplayOffModalOpen(true)}
        onTakeScreenshot={handleTakeScreenshot}
        isDisplayOff={isDisplayOff}
        isFullscreen={isFullscreen}
        onToggleFullscreen={onToggleFullscreen}
      />

      {/* Modals */}
      <RemoteInputModal
        isOpen={isInputModalOpen}
        onClose={() => setIsInputModalOpen(false)}
      />

      <DisplayOffModal
        isOpen={isDisplayOffModalOpen}
        onClose={() => setIsDisplayOffModalOpen(false)}
        isDisplayOff={isDisplayOff}
        onToggleDisplayOff={handleToggleDisplayOff}
      />

      <ScreenshotViewerModal
        isOpen={isScreenshotModalOpen}
        onClose={() => setIsScreenshotModalOpen(false)}
        imagePath={screenshotPath}
      />
    </div>
  );
};
