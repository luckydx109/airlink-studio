import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { DeviceInfo, ScrcpyConfig, ScrcpySession, PairingResult, OrientationInfo } from '@shared/types';

interface DeviceContextType {
  devices: DeviceInfo[];
  selectedDevice: DeviceInfo | null;
  activeSessions: ScrcpySession[];
  currentOrientation: OrientationInfo;
  isLoading: boolean;
  systemReady: boolean;
  setSelectedDevice: (device: DeviceInfo | null) => void;
  refreshDevices: () => Promise<void>;
  pairDevice: (ip: string, port: number, code: string) => Promise<PairingResult>;
  connectWireless: (ip: string, port?: number) => Promise<{ success: boolean; message: string; serial?: string }>;
  disconnectWireless: (target: string) => Promise<boolean>;
  switchUsbToWireless: (serial: string, port?: number) => Promise<{ success: boolean; message: string; wifiSerial?: string }>;
  startMirroring: (serial: string, configOverrides?: Partial<ScrcpyConfig>) => Promise<ScrcpySession>;
  stopMirroring: (serial: string) => Promise<boolean>;
  sendKey: (keycode: number) => Promise<boolean>;
  sendText: (text: string) => Promise<boolean>;
  wakeDevice: () => Promise<boolean>;
  sleepDevice: () => Promise<boolean>;
  rotateScreen: () => Promise<boolean>;
  captureScreenshot: () => Promise<string>;
}

const DeviceContext = createContext<DeviceContextType | undefined>(undefined);

export const DeviceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [devices, setDevices] = useState<DeviceInfo[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<DeviceInfo | null>(null);
  const [activeSessions, setActiveSessions] = useState<ScrcpySession[]>([]);
  const [currentOrientation, setCurrentOrientation] = useState<OrientationInfo>({
    orientation: 'portrait',
    rotation: 0,
    width: 1080,
    height: 2400,
    aspectRatio: 1080 / 2400,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [systemReady, setSystemReady] = useState(false);

  // Initialize and listen for device updates from electron main
  useEffect(() => {
    let unsubscribeDevices: (() => void) | undefined;
    let unsubscribeStarted: (() => void) | undefined;
    let unsubscribeEnded: (() => void) | undefined;
    let unsubscribeOrient: (() => void) | undefined;

    const init = async () => {
      try {
        if (window.airlinkAPI) {
          const devs = await window.airlinkAPI.getDevices();
          setDevices(devs);
          if (devs.length > 0 && !selectedDevice) {
            const initialDev = devs.find(d => d.state === 'device') || devs[0];
            setSelectedDevice(initialDev);
            if (initialDev?.serial) {
              window.airlinkAPI.getDeviceOrientation(initialDev.serial).then((o) => {
                if (o) setCurrentOrientation(o);
              }).catch(() => {});
            }
          }

          const sessions = await window.airlinkAPI.getAllScrcpySessions();
          setActiveSessions(sessions);

          unsubscribeDevices = window.airlinkAPI.onDevicesUpdated((updated) => {
            setDevices(updated);
            setSelectedDevice((prev) => {
              if (!prev) return updated.find(d => d.state === 'device') || updated[0] || null;
              const found = updated.find(d => d.id === prev.id);
              return found || updated.find(d => d.state === 'device') || updated[0] || null;
            });
          });

          unsubscribeStarted = window.airlinkAPI.onSessionStarted((session) => {
            setActiveSessions((prev) => [...prev.filter(s => s.deviceId !== session.deviceId), session]);
          });

          unsubscribeEnded = window.airlinkAPI.onSessionEnded((session) => {
            setActiveSessions((prev) => prev.filter(s => s.deviceId !== session.deviceId));
          });

          unsubscribeOrient = window.airlinkAPI.onOrientationChanged((data) => {
            setSelectedDevice((currentDev) => {
              if (currentDev && currentDev.serial === data.serial) {
                setCurrentOrientation({
                  orientation: data.orientation,
                  rotation: data.rotation,
                  width: data.width,
                  height: data.height,
                  aspectRatio: data.aspectRatio,
                });
              }
              return currentDev;
            });
          });

          setSystemReady(true);
        }
      } catch (err) {
        console.error('Initialization error in DeviceContext:', err);
      } finally {
        setIsLoading(false);
      }
    };

    init();

    return () => {
      if (unsubscribeDevices) unsubscribeDevices();
      if (unsubscribeStarted) unsubscribeStarted();
      if (unsubscribeEnded) unsubscribeEnded();
      if (unsubscribeOrient) unsubscribeOrient();
    };
  }, []);

  const refreshDevices = useCallback(async () => {
    if (!window.airlinkAPI) return;
    setIsLoading(true);
    try {
      const devs = await window.airlinkAPI.getDevices();
      setDevices(devs);
    } catch (e) {
      console.error('Failed to refresh devices:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const pairDevice = useCallback(async (ip: string, port: number, code: string) => {
    return window.airlinkAPI.pairDevice(ip, port, code);
  }, []);

  const connectWireless = useCallback(async (ip: string, port = 5555) => {
    const res = await window.airlinkAPI.connectWireless(ip, port);
    if (res.success) {
      await refreshDevices();
    }
    return res;
  }, [refreshDevices]);

  const disconnectWireless = useCallback(async (target: string) => {
    const ok = await window.airlinkAPI.disconnectWireless(target);
    if (ok) {
      await refreshDevices();
    }
    return ok;
  }, [refreshDevices]);

  const switchUsbToWireless = useCallback(async (serial: string, port = 5555) => {
    const res = await window.airlinkAPI.switchUsbToWireless(serial, port);
    if (res.success) {
      await refreshDevices();
    }
    return res;
  }, [refreshDevices]);

  const startMirroring = useCallback(async (serial: string, configOverrides?: Partial<ScrcpyConfig>) => {
    const dev = devices.find(d => d.serial === serial) || selectedDevice;
    const settings = await window.airlinkAPI.getSettings();
    const config: ScrcpyConfig = {
      ...settings.defaultScrcpyConfig,
      ...(configOverrides || {}),
    };

    const session = await window.airlinkAPI.startMirroring(
      serial,
      dev ? `${dev.brand} ${dev.model}`.trim() : serial,
      config
    );
    return session;
  }, [devices, selectedDevice]);

  const stopMirroring = useCallback(async (serial: string) => {
    return window.airlinkAPI.stopMirroring(serial);
  }, []);

  const sendKey = useCallback(async (keycode: number) => {
    if (!selectedDevice) return false;
    return window.airlinkAPI.sendKey(selectedDevice.serial, keycode);
  }, [selectedDevice]);

  const sendText = useCallback(async (text: string) => {
    if (!selectedDevice) return false;
    return window.airlinkAPI.sendText(selectedDevice.serial, text);
  }, [selectedDevice]);

  const wakeDevice = useCallback(async () => {
    if (!selectedDevice) return false;
    return window.airlinkAPI.wakeDevice(selectedDevice.serial);
  }, [selectedDevice]);

  const sleepDevice = useCallback(async () => {
    if (!selectedDevice) return false;
    return window.airlinkAPI.sleepDevice(selectedDevice.serial);
  }, [selectedDevice]);

  const rotateScreen = useCallback(async () => {
    if (!selectedDevice) return false;
    return window.airlinkAPI.rotateScreen(selectedDevice.serial);
  }, [selectedDevice]);

  const captureScreenshot = useCallback(async () => {
    if (!selectedDevice) throw new Error('No device selected');
    return window.airlinkAPI.captureScreenshot(selectedDevice.serial);
  }, [selectedDevice]);

  return (
    <DeviceContext.Provider
      value={{
        devices,
        selectedDevice,
        activeSessions,
        currentOrientation,
        isLoading,
        systemReady,
        setSelectedDevice,
        refreshDevices,
        pairDevice,
        connectWireless,
        disconnectWireless,
        switchUsbToWireless,
        startMirroring,
        stopMirroring,
        sendKey,
        sendText,
        wakeDevice,
        sleepDevice,
        rotateScreen,
        captureScreenshot,
      }}
    >
      {children}
    </DeviceContext.Provider>
  );
};

export const useDevice = () => {
  const context = useContext(DeviceContext);
  if (!context) {
    throw new Error('useDevice must be used within a DeviceProvider');
  }
  return context;
};
