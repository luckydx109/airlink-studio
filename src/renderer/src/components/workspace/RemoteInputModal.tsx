import React, { useState } from 'react';
import { GlassModal } from '../common/GlassModal';
import { GlassButton } from '../common/GlassButton';
import { useDevice } from '../../context/DeviceContext';
import { Keyboard, Send, CornerDownLeft, Delete } from 'lucide-react';

interface RemoteInputModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RemoteInputModal: React.FC<RemoteInputModalProps> = ({ isOpen, onClose }) => {
  const { sendText, sendKey } = useDevice();
  const [text, setText] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!text.trim()) return;

    setIsSending(true);
    try {
      await sendText(text);
      setText('');
      onClose();
    } catch (err) {
      console.error('Failed to send text:', err);
    } finally {
      setIsSending(false);
    }
  };

  const handleSpecialKey = async (keycode: number) => {
    await sendKey(keycode);
  };

  return (
    <GlassModal
      isOpen={isOpen}
      onClose={onClose}
      title="Remote Keyboard Input"
      subtitle="Type or paste text directly into your Android phone's active input field"
      maxWidth="md"
    >
      <form onSubmit={handleSend} className="space-y-4">
        <div>
          <textarea
            rows={4}
            placeholder="Type text or paste clipboard content to send to phone..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400/40 resize-none font-sans"
            autoFocus
          />
        </div>

        {/* Quick action keys */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-400 font-medium">Quick Keys:</span>
          <GlassButton
            type="button"
            variant="glass"
            size="sm"
            onClick={() => handleSpecialKey(66)} // ENTER
            leftIcon={<CornerDownLeft className="w-3.5 h-3.5" />}
          >
            Enter
          </GlassButton>
          <GlassButton
            type="button"
            variant="glass"
            size="sm"
            onClick={() => handleSpecialKey(67)} // BACKSPACE
            leftIcon={<Delete className="w-3.5 h-3.5" />}
          >
            Backspace
          </GlassButton>
          <GlassButton
            type="button"
            variant="glass"
            size="sm"
            onClick={() => handleSpecialKey(62)} // SPACE
          >
            Space
          </GlassButton>
          <GlassButton
            type="button"
            variant="glass"
            size="sm"
            onClick={() => handleSpecialKey(61)} // TAB
          >
            Tab
          </GlassButton>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <GlassButton type="button" variant="ghost" onClick={onClose}>
            Cancel
          </GlassButton>
          <GlassButton
            type="submit"
            variant="primary"
            isLoading={isSending}
            disabled={!text.trim()}
            leftIcon={<Send className="w-4 h-4" />}
          >
            Send Text
          </GlassButton>
        </div>
      </form>
    </GlassModal>
  );
};

