import { contextBridge, ipcRenderer } from 'electron';
import {
  DeviceInfo,
  OrientationInfo,
  ScrcpyConfig,
  ScrcpySession,
  AndroidFile,
  StorageInfo,
  FileTransferItem,
  PairingResult,
  AppSettings,
  SystemStatus,
} from '../shared/types';

export const api = {
  // System status
  getSystemStatus: (): Promise<SystemStatus> => ipcRenderer.invoke('system:status'),

  // Devices & ADB
  getDevices: (): Promise<DeviceInfo[]> => ipcRenderer.invoke('devices:get'),
  startAdbServer: (): Promise<boolean> => ipcRenderer.invoke('adb:start-server'),
  killAdbServer: (): Promise<boolean> => ipcRenderer.invoke('adb:kill-server'),
  onDevicesUpdated: (callback: (devices: DeviceInfo[]) => void) => {
    const handler = (_event: any, devices: DeviceInfo[]) => callback(devices);
    ipcRenderer.on('devices:updated', handler);
    return () => ipcRenderer.removeListener('devices:updated', handler);
  },

  // Wireless connection
  pairDevice: (ip: string, port: number, code: string): Promise<PairingResult> =>
    ipcRenderer.invoke('wireless:pair', { ip, port, code }),
  connectWireless: (ip: string, port = 5555): Promise<{ success: boolean; message: string; serial?: string }> =>
    ipcRenderer.invoke('wireless:connect', { ip, port }),
  disconnectWireless: (target: string): Promise<boolean> =>
    ipcRenderer.invoke('wireless:disconnect', target),
  switchUsbToWireless: (serial: string, port = 5555): Promise<{ success: boolean; message: string; wifiSerial?: string }> =>
    ipcRenderer.invoke('wireless:switch-usb', { serial, port }),

  // Mirroring (scrcpy)
  startMirroring: (serial: string, deviceName: string, config: ScrcpyConfig): Promise<ScrcpySession> =>
    ipcRenderer.invoke('scrcpy:start', { serial, deviceName, config }),
  stopMirroring: (serial: string): Promise<boolean> =>
    ipcRenderer.invoke('scrcpy:stop', serial),
  getScrcpySession: (serial: string): Promise<ScrcpySession | null> =>
    ipcRenderer.invoke('scrcpy:get-session', serial),
  getAllScrcpySessions: (): Promise<ScrcpySession[]> =>
    ipcRenderer.invoke('scrcpy:get-all-sessions'),
  onSessionStarted: (callback: (session: ScrcpySession) => void) => {
    const handler = (_e: any, session: ScrcpySession) => callback(session);
    ipcRenderer.on('scrcpy:started', handler);
    return () => ipcRenderer.removeListener('scrcpy:started', handler);
  },
  onSessionEnded: (callback: (session: ScrcpySession) => void) => {
    const handler = (_e: any, session: ScrcpySession) => callback(session);
    ipcRenderer.on('scrcpy:ended', handler);
    return () => ipcRenderer.removeListener('scrcpy:ended', handler);
  },

  // Remote Controls
  sendKey: (serial: string, keycode: number): Promise<boolean> =>
    ipcRenderer.invoke('control:send-key', { serial, keycode }),
  sendText: (serial: string, text: string): Promise<boolean> =>
    ipcRenderer.invoke('control:send-text', { serial, text }),
  sendTap: (serial: string, x: number, y: number): Promise<boolean> =>
    ipcRenderer.invoke('control:send-tap', { serial, x, y }),
  sendSwipe: (serial: string, x1: number, y1: number, x2: number, y2: number, durationMs = 300): Promise<boolean> =>
    ipcRenderer.invoke('control:send-swipe', { serial, x1, y1, x2, y2, durationMs }),
  wakeDevice: (serial: string): Promise<boolean> =>
    ipcRenderer.invoke('control:wake', serial),
  sleepDevice: (serial: string): Promise<boolean> =>
    ipcRenderer.invoke('control:sleep', serial),
  captureScreenshot: (serial: string): Promise<string> =>
    ipcRenderer.invoke('control:screenshot', serial),
  getDeviceOrientation: (serial: string): Promise<OrientationInfo> =>
    ipcRenderer.invoke('device:get-orientation', serial),
  rotateScreen: (serial: string): Promise<boolean> =>
    ipcRenderer.invoke('device:rotate-screen', serial),
  onOrientationChanged: (callback: (data: OrientationInfo & { serial: string }) => void) => {
    const handler = (_e: any, data: OrientationInfo & { serial: string }) => callback(data);
    ipcRenderer.on('device:orientation-changed', handler);
    return () => ipcRenderer.removeListener('device:orientation-changed', handler);
  },

  // File Manager
  getStorageInfo: (serial: string): Promise<StorageInfo> =>
    ipcRenderer.invoke('files:storage-info', serial),
  listFiles: (serial: string, path?: string): Promise<AndroidFile[]> =>
    ipcRenderer.invoke('files:list', { serial, path }),
  createDirectory: (serial: string, path: string): Promise<boolean> =>
    ipcRenderer.invoke('files:create-dir', { serial, path }),
  deleteItem: (serial: string, path: string): Promise<boolean> =>
    ipcRenderer.invoke('files:delete', { serial, path }),
  renameItem: (serial: string, oldPath: string, newPath: string): Promise<boolean> =>
    ipcRenderer.invoke('files:rename', { serial, oldPath, newPath }),
  getThumbnail: (serial: string, path: string): Promise<string | null> =>
    ipcRenderer.invoke('files:thumbnail', { serial, path }),
  selectDestinationFolder: (): Promise<string | null> =>
    ipcRenderer.invoke('files:select-dest-folder'),
  selectLocalFiles: (): Promise<string[]> =>
    ipcRenderer.invoke('files:select-local-files'),
  downloadFiles: (serial: string, remotePaths: string[], destinationDir: string): Promise<FileTransferItem[]> =>
    ipcRenderer.invoke('files:download', { serial, remotePaths, destinationDir }),
  uploadFiles: (serial: string, localPaths: string[], destinationDir: string): Promise<FileTransferItem[]> =>
    ipcRenderer.invoke('files:upload', { serial, localPaths, destinationDir }),
  onTransferUpdate: (callback: (item: FileTransferItem) => void) => {
    const handler = (_e: any, item: FileTransferItem) => callback(item);
    ipcRenderer.on('transfer:update', handler);
    return () => ipcRenderer.removeListener('transfer:update', handler);
  },
  openPath: (localPath: string): Promise<void> =>
    ipcRenderer.invoke('system:open-path', localPath),

  // Settings
  getSettings: (): Promise<AppSettings> =>
    ipcRenderer.invoke('settings:get'),
  updateSettings: (updates: Partial<AppSettings>): Promise<AppSettings> =>
    ipcRenderer.invoke('settings:update', updates),
  removeRememberedDevice: (id: string): Promise<void> =>
    ipcRenderer.invoke('settings:remove-device', id),

  // Window Controls
  minimizeWindow: () => ipcRenderer.send('window:minimize'),
  maximizeWindow: () => ipcRenderer.send('window:maximize'),
  closeWindow: () => ipcRenderer.send('window:close'),
  setFullscreen: (fullscreen: boolean) => ipcRenderer.send('window:set-fullscreen', fullscreen),
  toggleFullscreen: () => ipcRenderer.send('window:toggle-fullscreen'),
  isFullscreen: (): Promise<boolean> => ipcRenderer.invoke('window:is-fullscreen'),
  onFullscreenChanged: (callback: (isFullscreen: boolean) => void) => {
    const handler = (_e: any, isFs: boolean) => callback(isFs);
    ipcRenderer.on('window:fullscreen-changed', handler);
    return () => {
      ipcRenderer.removeListener('window:fullscreen-changed', handler);
    };
  },
};

contextBridge.exposeInMainWorld('airlinkAPI', api);

export type AirLinkAPI = typeof api;

