export interface OrientationInfo {
  orientation: 'portrait' | 'landscape';
  rotation: number; // 0, 90, 180, 270
  width: number;
  height: number;
  aspectRatio: number;
}

export interface DeviceInfo {
  id: string; // serial number or IP:port
  serial: string;
  model: string;
  brand: string;
  manufacturer: string;
  androidVersion: string;
  sdkVersion: number;
  type: 'usb' | 'wifi';
  state: 'device' | 'unauthorized' | 'offline' | 'connecting' | 'authorizing';
  batteryLevel?: number;
  isCharging?: boolean;
  wifiIp?: string;
  resolution?: string;
  density?: number;
  orientation?: 'portrait' | 'landscape';
  lastConnected?: number;
  nickname?: string;
}

export interface ScrcpyConfig {
  maxSize: number; // 0 for native, 720, 1080, 1440, 2160
  maxFps: number; // 30, 60, 120
  bitRate: number; // in Mbps e.g. 8, 12, 16
  videoCodec: 'h264' | 'h265' | 'av1';
  audio: boolean;
  stayAwake: boolean;
  turnScreenOff: boolean;
  alwaysOnTop: boolean;
  borderless: boolean;
  keyboardMode: 'uhid' | 'aoa' | 'sdk';
  mouseMode: 'uhid' | 'aoa' | 'sdk';
}

export interface ScrcpySession {
  deviceId: string;
  isActive: boolean;
  pid?: number;
  startedAt?: number;
  displayOff: boolean;
  error?: string;
}

export type FileCategory = 'all' | 'images' | 'videos' | 'audio' | 'documents' | 'downloads' | 'apks';

export interface AndroidFile {
  name: string;
  path: string;
  isDirectory: boolean;
  isLink?: boolean;
  size: number;
  modified: string;
  permissions: string;
  category: 'image' | 'video' | 'audio' | 'document' | 'apk' | 'archive' | 'folder' | 'other';
  extension: string;
}

export interface StorageInfo {
  totalBytes: number;
  usedBytes: number;
  freeBytes: number;
  usedPercentage: number;
  path: string;
}

export interface FileTransferItem {
  id: string;
  direction: 'upload' | 'download';
  localPath: string;
  remotePath: string;
  fileName: string;
  fileSize: number;
  transferredBytes: number;
  progress: number; // 0 - 100
  speedBytesPerSec: number;
  remainingSeconds: number;
  status: 'queued' | 'transferring' | 'completed' | 'failed' | 'cancelled';
  startedAt: number;
  completedAt?: number;
  error?: string;
}

export interface PairingResult {
  success: boolean;
  message: string;
}

export interface RememberedDevice {
  id: string;
  name: string;
  ip: string;
  port: number;
  lastSeen: number;
  type: 'wifi' | 'usb';
}

export interface AppSettings {
  theme: 'dark' | 'light';
  autoConnectUsb: boolean;
  autoReconnect: boolean;
  defaultScrcpyConfig: ScrcpyConfig;
  rememberedDevices: RememberedDevice[];
  downloadDirectory: string;
}

export interface SystemStatus {
  adbPath: string;
  adbVersion: string;
  scrcpyPath: string;
  scrcpyVersion: string;
  isAdbRunning: boolean;
}

