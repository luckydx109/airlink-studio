import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AppSettings, RememberedDevice } from '@shared/types';

interface SettingsContextType {
  settings: AppSettings | null;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  updateSettings: (updates: Partial<AppSettings>) => Promise<void>;
  removeRememberedDevice: (id: string) => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AppSettings | null>(null);

  useEffect(() => {
    const load = async () => {
      if (window.airlinkAPI) {
        const data = await window.airlinkAPI.getSettings();
        setSettings(data);
        if (data.theme === 'light') {
          document.documentElement.classList.remove('dark');
        } else {
          document.documentElement.classList.add('dark');
        }
      }
    };
    load();
  }, []);

  const toggleTheme = useCallback(async () => {
    if (!settings) return;
    const newTheme = settings.theme === 'dark' ? 'light' : 'dark';
    if (newTheme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
    }
    const updated = await window.airlinkAPI.updateSettings({ theme: newTheme });
    setSettings(updated);
  }, [settings]);

  const updateSettings = useCallback(async (updates: Partial<AppSettings>) => {
    if (!window.airlinkAPI) return;
    const updated = await window.airlinkAPI.updateSettings(updates);
    setSettings(updated);
  }, []);

  const removeRememberedDevice = useCallback(async (id: string) => {
    if (!window.airlinkAPI) return;
    await window.airlinkAPI.removeRememberedDevice(id);
    const updated = await window.airlinkAPI.getSettings();
    setSettings(updated);
  }, []);

  return (
    <SettingsContext.Provider
      value={{
        settings,
        theme: settings?.theme || 'dark',
        toggleTheme,
        updateSettings,
        removeRememberedDevice,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
