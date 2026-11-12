import React, { useState } from 'react';
import { GlassModal } from '../common/GlassModal';
import { GlassButton } from '../common/GlassButton';
import { useDevice } from '../../context/DeviceContext';
import { Wifi, CheckCircle2, AlertCircle, Info, KeyRound } from 'lucide-react';

interface PairingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PairingModal: React.FC<PairingModalProps> = ({ isOpen, onClose }) => {
  const { pairDevice, connectWireless } = useDevice();
  const [ip, setIp] = useState('');
  const [port, setPort] = useState('');
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handlePair = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ip || !port || !code) return;

    setIsLoading(true);
    setResult(null);

    try {
      const portNum = parseInt(port, 10);
      const pairRes = await pairDevice(ip, portNum, code);

      if (pairRes.success) {
        setResult({ success: true, message: pairRes.message });
        // Attempt to connect immediately to the standard port or prompt
        setTimeout(async () => {
          // Often pairing port is different from connect port, but on many devices connect works on 5555
          await connectWireless(ip, 5555);
          onClose();
        }, 1500);
      } else {
        setResult({ success: false, message: pairRes.message });
      }
    } catch (err: any) {
      setResult({ success: false, message: err.message || 'Pairing error' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <GlassModal
      isOpen={isOpen}
      onClose={onClose}
      title="Wireless Debugging Pairing"
      subtitle="Android 11 and above wireless pairing workflow"
      maxWidth="lg"
    >
      <div className="space-y-5">
        {/* Step-by-step guidance */}
        <div className="p-4 rounded-xl bg-white/[0.04] border border-white/10 space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-brand-300">
            <Info className="w-4 h-4" />
            <span>How to pair on your phone:</span>
          </div>
          <ol className="text-xs text-slate-300 space-y-1.5 list-decimal list-inside pl-1">
            <li>Ensure both PC and Android phone are on the <span className="text-white font-medium">same Wi-Fi or Hotspot</span>.</li>
            <li>Open <span className="text-white font-medium">Settings &rarr; Developer Options</span>.</li>
            <li>Enable <span className="text-white font-medium">Wireless Debugging</span> and tap on it.</li>
            <li>Tap <span className="text-brand-300 font-medium">"Pair device with pairing code"</span>.</li>
            <li>Enter the IP address, Port, and 6-digit code shown in the phone dialog below.</li>
          </ol>
        </div>

        {/* Pairing Form */}
        <form onSubmit={handlePair} className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Phone Wi-Fi IP Address</label>
              <input
                type="text"
                placeholder="192.168.1.100"
                value={ip}
                onChange={(e) => setIp(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400/40"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Pairing Port</label>
              <input
                type="number"
                placeholder="37451"
                value={port}
                onChange={(e) => setPort(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400/40"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">6-Digit Pairing Code</label>
            <div className="relative">
              <input
                type="text"
                maxLength={6}
                placeholder="123456"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full tracking-widest font-mono text-center px-4 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-white placeholder-slate-500 text-lg font-semibold focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400/40"
                required
              />
              <KeyRound className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
            </div>
          </div>

          {result && (
            <div
              className={`p-3 rounded-xl flex items-start gap-2 text-xs ${
                result.success
                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                  : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
              }`}
            >
              {result.success ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              )}
              <span>{result.message}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <GlassButton type="button" variant="ghost" onClick={onClose}>
              Cancel
            </GlassButton>
            <GlassButton
              type="submit"
              variant="primary"
              isLoading={isLoading}
              leftIcon={<Wifi className="w-4 h-4" />}
            >
              Pair & Connect
            </GlassButton>
          </div>
        </form>
      </div>
    </GlassModal>
  );
};

