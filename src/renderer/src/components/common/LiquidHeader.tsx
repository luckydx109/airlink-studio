import React from 'react';
import {
  Smartphone,
  FolderOpen,
  Settings as SettingsIcon,
  LayoutDashboard,
  Minus,
  Square,
  X,
  Battery,
  BatteryCharging,
  Wifi,
  Usb,
  Sun,
  Moon,
  Radio,
  ChevronDown,
} from 'lucide-react';
import { useDevice } from '../../context/DeviceContext';
import { useSettings } from '../../context/SettingsContext';
import { GlassBadge } from './GlassBadge';

export type ActiveTab = 'dashboard' | 'workspace' | 'files' | 'settings';

interface LiquidHeaderProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
}

export const LiquidHeader: React.FC<LiquidHeaderProps> = ({ activeTab, onTabChange }) => {
  const { devices, selectedDevice, setSelectedDevice, activeSessions } = useDevice();
  const { theme, toggleTheme } = useSettings();

  const handleMinimize = () => window.airlinkAPI?.minimizeWindow();
  const handleMaximize = () => window.airlinkAPI?.maximizeWindow();
  const handleClose = () => window.airlinkAPI?.closeWindow();

  const isMirroring = selectedDevice
    ? activeSessions.some((s) => s.deviceId === selectedDevice.serial && s.isActive)
    : false;

  const tabs: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'workspace', label: 'Workspace', icon: <Smartphone className="w-4 h-4" /> },
    { id: 'files', label: 'Files', icon: <FolderOpen className="w-4 h-4" /> },
    { id: 'settings', label: 'Settings', icon: <SettingsIcon className="w-4 h-4" /> },
  ];

  return (
    <header className="titlebar-drag-region h-14 w-full bg-[#0d121e]/85 backdrop-blur-2xl border-b border-white/[0.08] flex items-center justify-between px-4 select-none z-40 relative">
      {/* Top subtle sheen */}
      <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-brand-500/20 via-cyan-400/20 to-indigo-500/20 pointer-events-none" />

      {/* Left: Logo & Branding */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5">
          <div className="relative flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-600 to-cyan-500 shadow-md shadow-brand-500/30 border border-white/20">
            <Radio className="w-4 h-4 text-white animate-pulse" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm tracking-tight text-white">AirLink</span>
              <span className="text-[11px] font-semibold text-brand-400 tracking-wider uppercase bg-brand-500/10 px-1.5 py-0.2 rounded border border-brand-500/20">Studio</span>
            </div>
          </div>
        </div>

        {/* Active Device Quick Badge */}
        {selectedDevice && (
          <div className="titlebar-no-drag ml-4 relative group">
            <button
              className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.05] hover:bg-white/[0.08] border border-white/10 text-xs font-medium text-slate-300 transition-all cursor-pointer"
            >
              {selectedDevice.type === 'wifi' ? (
                <Wifi className="w-3.5 h-3.5 text-cyan-400" />
              ) : (
                <Usb className="w-3.5 h-3.5 text-indigo-400" />
              )}
              <span className="truncate max-w-[140px] text-white">
                {selectedDevice.brand} {selectedDevice.model}
              </span>

              {/* Mirroring Live Indicator */}
              {isMirroring && (
                <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-semibold bg-emerald-500/15 px-1.5 py-0.5 rounded-full border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Live
                </span>
              )}

              {/* Battery indicator */}
              {selectedDevice.batteryLevel !== undefined && (
                <span className="flex items-center gap-0.5 text-[11px] text-slate-400">
                  {selectedDevice.isCharging ? (
                    <BatteryCharging className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <Battery className="w-3 h-3 text-slate-400" />
                  )}
                  {selectedDevice.batteryLevel}%
                </span>
              )}

              {devices.length > 1 && <ChevronDown className="w-3 h-3 text-slate-400" />}
            </button>

            {/* Dropdown if multiple devices */}
            {devices.length > 1 && (
              <div className="absolute top-full left-0 mt-1 w-64 bg-[#141b2d] border border-white/10 rounded-xl shadow-2xl py-1.5 hidden group-hover:block z-50 backdrop-blur-xl">
                <div className="px-3 py-1 text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
                  Switch Device
                </div>
                {devices.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => setSelectedDevice(d)}
                    className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between hover:bg-white/5 ${
                      d.id === selectedDevice.id ? 'text-brand-400 font-semibold bg-white/[0.04]' : 'text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      {d.type === 'wifi' ? <Wifi className="w-3 h-3" /> : <Usb className="w-3 h-3" />}
                      <span className="truncate">{d.brand} {d.model}</span>
                    </div>
                    {d.batteryLevel && <span className="text-[10px] text-slate-500">{d.batteryLevel}%</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Center: Navigation Pill Tabs */}
      <div className="titlebar-no-drag flex items-center p-1 rounded-2xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-md">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-brand-500/25 to-cyan-500/20 text-white shadow-sm border border-brand-400/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Right: Theme Toggle & Window Controls */}
      <div className="flex items-center gap-1 titlebar-no-drag">
        {/* Theme switch */}
        <button
          onClick={toggleTheme}
          title="Toggle Theme"
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-brand-300" />}
        </button>

        <div className="h-4 w-[1px] bg-white/10 mx-1" />

        {/* Windows Buttons */}
        <button
          onClick={handleMinimize}
          title="Minimize"
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={handleMaximize}
          title="Maximize"
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
        >
          <Square className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={handleClose}
          title="Close"
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-rose-600 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
};

