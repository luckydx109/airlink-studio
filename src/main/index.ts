import { app, BrowserWindow, ipcMain, shell } from 'electron';
import path from 'node:path';
import { AdbManager } from './adbManager';
import { ScrcpyManager } from './scrcpyManager';
import { FileManager } from './fileManager';
import { StoreManager } from './storeManager';
import { ScrcpyConfig, DeviceInfo, OrientationInfo } from '../shared/types';

// Enforce single instance
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
}

let mainWindow: BrowserWindow | null = null;
let adbManager: AdbManager;
let scrcpyManager: ScrcpyManager;
let fileManager: FileManager;
let storeManager: StoreManager;
let devicePollingTimer: NodeJS.Timeout | null = null;
let lastKnownDevicesJson = '';
const lastKnownOrientations = new Map<string, string>();

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 840,
    minWidth: 1024,
    minHeight: 700,
    frame: false, // Custom frameless window for liquid glass aesthetics
    titleBarStyle: 'hidden',
    backgroundColor: '#0a0d14',
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      sandbox: false,
      nodeIntegration: false,
      contextIsolation: true,
    },
    show: false,
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  // Handle external links safely
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:') || url.startsWith('http:')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  // Load URL or build file
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../dist/index.html'));
  }

  // Window control IPCs
  ipcMain.on('window:minimize', () => mainWindow?.minimize());
  ipcMain.on('window:maximize', () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow?.maximize();
    }
  });
  ipcMain.on('window:close', () => mainWindow?.close());
  ipcMain.on('window:set-fullscreen', (_event, flag: boolean) => {
    mainWindow?.setFullScreen(flag);
  });
  ipcMain.on('window:toggle-fullscreen', () => {
    if (mainWindow) {
      mainWindow.setFullScreen(!mainWindow.isFullScreen());
    }
  });
  ipcMain.handle('window:is-fullscreen', () => {
    return mainWindow?.isFullScreen() || false;
  });

  mainWindow.on('enter-full-screen', () => {
    mainWindow?.webContents.send('window:fullscreen-changed', true);
  });
  mainWindow.on('leave-full-screen', () => {
    mainWindow?.webContents.send('window:fullscreen-changed', false);
  });
}

async function startDevicePolling() {
  // Start ADB server once on startup
  await adbManager.startServer();

  const poll = async () => {
    try {
      const devices = await adbManager.getDevices();
      const currentJson = JSON.stringify(devices.map(d => ({ id: d.id, state: d.state, battery: d.batteryLevel })));

      if (currentJson !== lastKnownDevicesJson) {
        lastKnownDevicesJson = currentJson;
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('devices:updated', devices);
        }

        // Remember newly connected authorized devices
        for (const dev of devices) {
          if (dev.state === 'device') {
            storeManager.addRememberedDevice({
              id: dev.id,
              name: `${dev.brand} ${dev.model}`.trim() || dev.id,
              ip: dev.type === 'wifi' ? dev.id.split(':')[0] : (dev.wifiIp || ''),
              port: dev.type === 'wifi' ? (parseInt(dev.id.split(':')[1], 10) || 5555) : 5555,
              lastSeen: Date.now(),
              type: dev.type,
            });
          }
        }
      }
    } catch (e) {
      console.warn('Device polling warning:', e);
    }
  };

  await poll();
  devicePollingTimer = setInterval(poll, 2500);

  // Dedicated fast orientation detection loop (1000ms)
  setInterval(async () => {
    try {
      if (!mainWindow || mainWindow.isDestroyed()) return;
      const devices = await adbManager.getDevices();
      for (const dev of devices) {
        if (dev.state === 'device') {
          const orient = await adbManager.getDisplayOrientation(dev.serial);
          const key = JSON.stringify(orient);
          if (lastKnownOrientations.get(dev.serial) !== key) {
            lastKnownOrientations.set(dev.serial, key);
            mainWindow.webContents.send('device:orientation-changed', {
              serial: dev.serial,
              ...orient,
            });
          }
        }
      }
    } catch {
      // ignore
    }
  }, 1000);
}

function registerIpcHandlers() {
  // System status
  ipcMain.handle('system:status', async () => {
    const adbVer = await adbManager.getVersion();
    const scrcpyVer = await scrcpyManager.getVersion();
    return {
      adbPath: adbManager.getPath(),
      adbVersion: adbVer,
      scrcpyPath: scrcpyManager.getPath(),
      scrcpyVersion: scrcpyVer,
      isAdbRunning: true,
    };
  });

  // ADB Server
  ipcMain.handle('adb:start-server', async () => adbManager.startServer());
  ipcMain.handle('adb:kill-server', async () => adbManager.killServer());

  // Devices
  ipcMain.handle('devices:get', async () => adbManager.getDevices());
  ipcMain.handle('device:get-orientation', async (_event, serial: string) => {
    return adbManager.getDisplayOrientation(serial);
  });
  ipcMain.handle('device:rotate-screen', async (_event, serial: string) => {
    return adbManager.rotateScreen(serial);
  });

  // Wireless connection
  ipcMain.handle('wireless:pair', async (_event, { ip, port, code }: { ip: string; port: number; code: string }) => {
    return adbManager.pairDevice(ip, port, code);
  });

  ipcMain.handle('wireless:connect', async (_event, { ip, port }: { ip: string; port: number }) => {
    const res = await adbManager.connectWireless(ip, port);
    if (res.success && res.serial) {
      storeManager.addRememberedDevice({
        id: res.serial,
        name: `Wireless Device (${ip})`,
        ip,
        port,
        lastSeen: Date.now(),
        type: 'wifi',
      });
    }
    return res;
  });

  ipcMain.handle('wireless:disconnect', async (_event, target: string) => {
    return adbManager.disconnectWireless(target);
  });

  ipcMain.handle('wireless:switch-usb', async (_event, { serial, port }: { serial: string; port: number }) => {
    return adbManager.switchUsbToWireless(serial, port);
  });

  // Mirroring
  ipcMain.handle('scrcpy:start', async (_event, { serial, deviceName, config }: { serial: string; deviceName: string; config: ScrcpyConfig }) => {
    return scrcpyManager.startMirroring(serial, deviceName, config);
  });

  ipcMain.handle('scrcpy:stop', async (_event, serial: string) => {
    return scrcpyManager.stopMirroring(serial);
  });

  ipcMain.handle('scrcpy:get-session', async (_event, serial: string) => {
    return scrcpyManager.getSession(serial);
  });

  ipcMain.handle('scrcpy:get-all-sessions', async () => {
    return scrcpyManager.getAllSessions();
  });

  // Forward session lifecycle events to renderer
  scrcpyManager.on('session-started', (session) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('scrcpy:started', session);
    }
  });

  scrcpyManager.on('session-ended', (session) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('scrcpy:ended', session);
    }
  });

  // Remote Controls
  ipcMain.handle('control:send-key', async (_event, { serial, keycode }: { serial: string; keycode: number }) => {
    return adbManager.sendKey(serial, keycode);
  });

  ipcMain.handle('control:send-text', async (_event, { serial, text }: { serial: string; text: string }) => {
    return adbManager.sendText(serial, text);
  });

  ipcMain.handle('control:send-tap', async (_event, { serial, x, y }: { serial: string; x: number; y: number }) => {
    return adbManager.sendTap(serial, x, y);
  });

  ipcMain.handle('control:send-swipe', async (_event, { serial, x1, y1, x2, y2, durationMs }: { serial: string; x1: number; y1: number; x2: number; y2: number; durationMs: number }) => {
    return adbManager.sendSwipe(serial, x1, y1, x2, y2, durationMs);
  });

  ipcMain.handle('control:wake', async (_event, serial: string) => {
    return adbManager.wakeDevice(serial);
  });

  ipcMain.handle('control:sleep', async (_event, serial: string) => {
    return adbManager.sleepDevice(serial);
  });

  ipcMain.handle('control:screenshot', async (_event, serial: string) => {
    return adbManager.captureScreenshot(serial);
  });

  // File Manager
  ipcMain.handle('files:storage-info', async (_event, serial: string) => {
    return fileManager.getStorageInfo(serial);
  });

  ipcMain.handle('files:list', async (_event, { serial, path }: { serial: string; path?: string }) => {
    return fileManager.listFiles(serial, path);
  });

  ipcMain.handle('files:create-dir', async (_event, { serial, path }: { serial: string; path: string }) => {
    return fileManager.createDirectory(serial, path);
  });

  ipcMain.handle('files:delete', async (_event, { serial, path }: { serial: string; path: string }) => {
    return fileManager.deleteItem(serial, path);
  });

  ipcMain.handle('files:rename', async (_event, { serial, oldPath, newPath }: { serial: string; oldPath: string; newPath: string }) => {
    return fileManager.renameItem(serial, oldPath, newPath);
  });

  ipcMain.handle('files:thumbnail', async (_event, { serial, path }: { serial: string; path: string }) => {
    return fileManager.getThumbnail(serial, path);
  });

  ipcMain.handle('files:select-dest-folder', async () => {
    if (!mainWindow) return null;
    return fileManager.selectDestinationFolder(mainWindow);
  });

  ipcMain.handle('files:select-local-files', async () => {
    if (!mainWindow) return [];
    return fileManager.selectLocalFiles(mainWindow);
  });

  ipcMain.handle('files:download', async (_event, { serial, remotePaths, destinationDir }: { serial: string; remotePaths: string[]; destinationDir: string }) => {
    return fileManager.downloadFiles(serial, remotePaths, destinationDir, mainWindow || undefined);
  });

  ipcMain.handle('files:upload', async (_event, { serial, localPaths, destinationDir }: { serial: string; localPaths: string[]; destinationDir: string }) => {
    return fileManager.uploadFiles(serial, localPaths, destinationDir, mainWindow || undefined);
  });

  ipcMain.handle('system:open-path', async (_event, localPath: string) => {
    shell.showItemInFolder(localPath);
  });

  // Settings
  ipcMain.handle('settings:get', async () => storeManager.getSettings());
  ipcMain.handle('settings:update', async (_event, updates: any) => storeManager.updateSettings(updates));
  ipcMain.handle('settings:remove-device', async (_event, id: string) => storeManager.removeRememberedDevice(id));
}

app.whenReady().then(async () => {
  storeManager = new StoreManager();
  adbManager = new AdbManager();
  scrcpyManager = new ScrcpyManager();
  fileManager = new FileManager(adbManager);

  registerIpcHandlers();
  createWindow();
  await startDevicePolling();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

app.on('before-quit', () => {
  if (devicePollingTimer) {
    clearInterval(devicePollingTimer);
  }
  scrcpyManager.stopAll();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
