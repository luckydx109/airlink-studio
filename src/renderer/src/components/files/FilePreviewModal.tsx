import React, { useEffect, useState } from 'react';
import { GlassModal } from '../common/GlassModal';
import { GlassButton } from '../common/GlassButton';
import { AndroidFile } from '@shared/types';
import { Download, Loader2, FileText, Music, Image as ImageIcon, Video } from 'lucide-react';

interface FilePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: AndroidFile | null;
  serial: string;
  onDownload: (file: AndroidFile) => void;
}

export const FilePreviewModal: React.FC<FilePreviewModalProps> = ({
  isOpen,
  onClose,
  file,
  serial,
  onDownload,
}) => {
  const [cachedPath, setCachedPath] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !file || !serial) {
      setCachedPath(null);
      setError(null);
      return;
    }

    const loadPreview = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const local = await window.airlinkAPI.getThumbnail(serial, file.path);
        if (local) {
          setCachedPath(local);
        } else {
          setError('Preview unavailable for this file format or size exceeds limit.');
        }
      } catch (e: any) {
        setError(e.message || 'Failed to load preview');
      } finally {
        setIsLoading(false);
      }
    };

    loadPreview();
  }, [isOpen, file, serial]);

  if (!file) return null;

  const fileUrl = cachedPath ? `file:///${cachedPath.replace(/\\/g, '/')}` : '';

  return (
    <GlassModal
      isOpen={isOpen}
      onClose={onClose}
      title={file.name}
      subtitle={`${file.path} • ${(file.size / 1024 / 1024).toFixed(2)} MB`}
      maxWidth="lg"
    >
      <div className="space-y-4">
        <div className="min-h-[250px] max-h-[60vh] rounded-2xl bg-black/50 border border-white/10 flex items-center justify-center p-4 overflow-hidden relative">
          {isLoading ? (
            <div className="flex flex-col items-center gap-2 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-brand-400" />
              <span className="text-xs">Fetching file preview from phone...</span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center gap-2 text-slate-400 text-center p-6">
              <FileText className="w-10 h-10 text-slate-500" />
              <p className="text-xs text-slate-400">{error}</p>
            </div>
          ) : file.category === 'image' && cachedPath ? (
            <img
              src={fileUrl}
              alt={file.name}
              className="max-h-[55vh] max-w-full object-contain rounded-xl"
            />
          ) : file.category === 'audio' && cachedPath ? (
            <div className="w-full flex flex-col items-center gap-4 py-8">
              <div className="p-4 rounded-full bg-brand-500/20 text-brand-400">
                <Music className="w-10 h-10 animate-bounce" />
              </div>
              <audio controls src={fileUrl} className="w-full max-w-md" />
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 text-slate-400">
              <FileText className="w-12 h-12 text-slate-500" />
              <p className="text-xs">Download file to Windows to view in full application.</p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-slate-400 font-mono">Modified: {file.modified}</span>
          <div className="flex items-center gap-2">
            <GlassButton
              variant="primary"
              size="sm"
              onClick={() => onDownload(file)}
              leftIcon={<Download className="w-4 h-4" />}
            >
              Download to Windows
            </GlassButton>
          </div>
        </div>
      </div>
    </GlassModal>
  );
};
