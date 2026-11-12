import React, { useState } from 'react';
import { GlassModal } from '../common/GlassModal';
import { GlassButton } from '../common/GlassButton';
import { Camera, Download, Copy, Check, ExternalLink } from 'lucide-react';

interface ScreenshotViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  imagePath: string | null;
}

export const ScreenshotViewerModal: React.FC<ScreenshotViewerModalProps> = ({
  isOpen,
  onClose,
  imagePath,
}) => {
  const [copied, setCopied] = useState(false);

  if (!imagePath) return null;

  // Convert local Windows file path to file:/// URL for safe rendering
  const imageUrl = `file:///${imagePath.replace(/\\/g, '/')}`;

  const handleOpenFolder = () => {
    window.airlinkAPI.openPath(imagePath);
  };

  return (
    <GlassModal
      isOpen={isOpen}
      onClose={onClose}
      title="Captured Screenshot"
      subtitle="Full resolution Android display capture"
      maxWidth="lg"
    >
      <div className="space-y-4">
        <div className="relative rounded-xl overflow-hidden border border-white/10 bg-black/40 flex items-center justify-center max-h-[60vh]">
          <img
            src={imageUrl}
            alt="Android Screenshot"
            className="max-h-[58vh] w-auto object-contain rounded-lg"
          />
        </div>

        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-slate-400 font-mono truncate max-w-xs">
            {imagePath}
          </span>

          <div className="flex items-center gap-2">
            <GlassButton
              variant="secondary"
              size="sm"
              onClick={handleOpenFolder}
              leftIcon={<ExternalLink className="w-3.5 h-3.5" />}
            >
              Open in Explorer
            </GlassButton>
            <GlassButton
              variant="primary"
              size="sm"
              onClick={onClose}
            >
              Done
            </GlassButton>
          </div>
        </div>
      </div>
    </GlassModal>
  );
};

