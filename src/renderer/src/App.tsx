import React, { useState, useEffect, useCallback } from 'react';
import { SettingsProvider } from './context/SettingsContext';
import { DeviceProvider } from './context/DeviceContext';
import { TransferProvider } from './context/TransferContext';
import { LiquidHeader, ActiveTab } from './components/common/LiquidHeader';
import { DashboardView } from './components/dashboard/DashboardView';
import { WorkspaceView } from './components/workspace/WorkspaceView';
import { FilesView } from './components/files/FilesView';
import { SettingsView } from './components/settings/SettingsView';
import { motion, AnimatePresence } from 'framer-motion';

export const MainContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (window.airlinkAPI?.isFullscreen) {
      window.airlinkAPI.isFullscreen().then(setIsFullscreen).catch(() => {});
    }

    if (window.airlinkAPI?.onFullscreenChanged) {
      const unsub = window.airlinkAPI.onFullscreenChanged((fs) => {
        setIsFullscreen(fs);
      });
      return () => {
        if (unsub) unsub();
      };
    }
  }, []);

  const handleToggleFullscreen = useCallback(() => {
    if (window.airlinkAPI?.toggleFullscreen) {
      window.airlinkAPI.toggleFullscreen();
    }
  }, []);

  const showHeader = !(isFullscreen && activeTab === 'workspace');

  return (
    <div className={`flex flex-col h-screen w-screen overflow-hidden select-none text-slate-100 relative ${
      isFullscreen ? 'bg-black' : 'bg-[#070a13]'
    }`}>
      {/* Dynamic Ambient Background Glow Elements (only in windowed mode) */}
      {!isFullscreen && (
        <>
          <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-brand-600/15 blur-[120px] pointer-events-none" />
          <div className="absolute top-1/2 -right-32 w-96 h-96 rounded-full bg-cyan-500/10 blur-[130px] pointer-events-none" />
          <div className="absolute -bottom-32 left-1/3 w-96 h-96 rounded-full bg-indigo-600/10 blur-[140px] pointer-events-none" />
        </>
      )}

      {/* Liquid Header & Navigation (auto-hidden in full-screen landscape workspace) */}
      {showHeader && <LiquidHeader activeTab={activeTab} onTabChange={setActiveTab} />}

      {/* View Switcher with Smooth Slide & Fade Animation */}
      <main className="flex-1 w-full overflow-hidden relative z-10">
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="h-full w-full"
            >
              <DashboardView
                onStartWorkspace={() => setActiveTab('workspace')}
                onBrowseFiles={() => setActiveTab('files')}
              />
            </motion.div>
          )}

          {activeTab === 'workspace' && (
            <motion.div
              key="workspace"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="h-full w-full"
            >
              <WorkspaceView
                onOpenSettings={() => setActiveTab('settings')}
                isFullscreen={isFullscreen}
                onToggleFullscreen={handleToggleFullscreen}
              />
            </motion.div>
          )}

          {activeTab === 'files' && (
            <motion.div
              key="files"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="h-full w-full"
            >
              <FilesView />
            </motion.div>
          )}

          {activeTab === 'settings' && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="h-full w-full"
            >
              <SettingsView />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <SettingsProvider>
      <DeviceProvider>
        <TransferProvider>
          <MainContent />
        </TransferProvider>
      </DeviceProvider>
    </SettingsProvider>
  );
};

export default App;
