import path from 'node:path';
import fs from 'node:fs';
import { app } from 'electron';
import { AppSettings, RememberedDevice } from '../shared/types';

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  autoConnectUsb: true,
  autoReconnect: true,
  defaultScrcpyConfig: {
    maxSize: 0,
    maxFps: 60,
    bitRate: 12,
    videoCodec: 'h264',
    audio: true,
    stayAwake: true,
    turnScreenOff: false,
    alwaysOnTop: false,
    borderless: false,
    keyboardMode: 'uhid',
    mouseMode: 'uhid',
  },
  rememberedDevices: [],
  downloadDirectory: '',
};

export class StoreManager {
  private configPath: string;
  private settings: AppSettings;

  constructor() {
    const userDataPath = app.getPath('userData');
    if (!fs.existsSync(userDataPath)) {
      fs.mkdirSync(userDataPath, { recursive: true });
    }
    this.configPath = path.join(userDataPath, 'airlink_config.json');
    this.settings = this.load();
  }

  private load(): AppSettings {
    try {
      if (fs.existsSync(this.configPath)) {
        const raw = fs.readFileSync(this.configPath, 'utf-8');
        const parsed = JSON.parse(raw);
        return {
          ...DEFAULT_SETTINGS,
          ...parsed,
          defaultScrcpyConfig: {
            ...DEFAULT_SETTINGS.defaultScrcpyConfig,
            ...(parsed.defaultScrcpyConfig || {}),
          },
        };
      }
    } catch (e) {
      console.warn('Failed to parse config file, using defaults:', e);
    }

    const initial = { ...DEFAULT_SETTINGS, downloadDirectory: app.getPath('downloads') };
    this.save(initial);
    return initial;
  }

  private save(data: AppSettings): void {
    try {
      fs.writeFileSync(this.configPath, JSON.stringify(data, null, 2), 'utf-8');
      this.settings = data;
    } catch (e) {
      console.error('Failed to write config file:', e);
    }
  }

  public getSettings(): AppSettings {
    return this.settings;
  }

  public updateSettings(updates: Partial<AppSettings>): AppSettings {
    const updated = {
      ...this.settings,
      ...updates,
      defaultScrcpyConfig: {
        ...this.settings.defaultScrcpyConfig,
        ...(updates.defaultScrcpyConfig || {}),
      },
    };
    this.save(updated);
    return this.settings;
  }

  public addRememberedDevice(device: RememberedDevice): void {
    const list = this.settings.rememberedDevices.filter(d => d.id !== device.id);
    list.unshift(device);
    // Keep max 20 remembered devices
    this.updateSettings({ rememberedDevices: list.slice(0, 20) });
  }

  public removeRememberedDevice(id: string): void {
    const list = this.settings.rememberedDevices.filter(d => d.id !== id);
    this.updateSettings({ rememberedDevices: list });
  }
}

