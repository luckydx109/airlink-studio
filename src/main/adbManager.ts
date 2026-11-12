import { spawn, execFile } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import { app } from 'electron';
import { DeviceInfo, OrientationInfo } from '../shared/types';

export class AdbManager {
  private adbPath: string;

  constructor() {
    this.adbPath = this.resolveAdbPath();
  }

  public getPath(): string {
    return this.adbPath;
  }

  private resolveAdbPath(): string {
    // 1. Packaged extraResources
    if (app && app.isPackaged) {
      const prodPath = path.join(process.resourcesPath, 'bin', 'scrcpy', 'adb.exe');
      if (fs.existsSync(prodPath)) return prodPath;
    }

    // 2. Local development bin
    const devPath = path.join(process.cwd(), 'bin', 'scrcpy', 'adb.exe');
    if (fs.existsSync(devPath)) return devPath;

    // 3. Fallback to system PATH
    return 'adb';
  }

  public async execAdb(args: string[], timeoutMs = 15000): Promise<{ stdout: string; stderr: string }> {
    return new Promise((resolve, reject) => {
      const child = execFile(this.adbPath, args, { timeout: timeoutMs, windowsHide: true }, (error, stdout, stderr) => {
        if (error) {
          // If timeout or error, still provide stdout & stderr if available
          return reject(new Error(stderr || error.message || 'ADB execution failed'));
        }
        resolve({ stdout: stdout.trim(), stderr: stderr.trim() });
      });
    });
  }

  public async startServer(): Promise<boolean> {
    try {
      await this.execAdb(['start-server']);
      return true;
    } catch (e) {
      console.error('Failed to start ADB server:', e);
      return false;
    }
  }

  public async killServer(): Promise<boolean> {
    try {
      await this.execAdb(['kill-server']);
      return true;
    } catch (e) {
      console.error('Failed to kill ADB server:', e);
      return false;
    }
  }

  public async getVersion(): Promise<string> {
    try {
      const { stdout } = await this.execAdb(['version']);
      const match = stdout.match(/version ([^\r\n]+)/);
      return match ? match[1] : stdout.split('\n')[0];
    } catch {
      return 'Unknown';
    }
  }

  public async getDevices(): Promise<DeviceInfo[]> {
    try {
      const { stdout } = await this.execAdb(['devices', '-l']);
      const lines = stdout.split('\n').filter(line => line.trim().length > 0);
      
      const devices: DeviceInfo[] = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line || line.startsWith('*')) continue;

        const parts = line.split(/\s+/);
        if (parts.length < 2) continue;

        const serial = parts[0];
        const stateRaw = parts[1].toLowerCase();
        const isWifi = serial.includes(':') || /^\d+\.\d+\.\d+\.\d+/.test(serial);

        let state: DeviceInfo['state'] = 'offline';
        if (stateRaw === 'device') state = 'device';
        else if (stateRaw === 'unauthorized') state = 'unauthorized';
        else if (stateRaw === 'authorizing') state = 'authorizing';

        // Extract metadata from tags: model:Pixel_8_Pro device:husky product:husky
        let model = 'Android Device';
        for (const part of parts.slice(2)) {
          if (part.startsWith('model:')) {
            model = part.replace('model:', '').replace(/_/g, ' ');
          }
        }

        const device: DeviceInfo = {
          id: serial,
          serial,
          model,
          brand: 'Android',
          manufacturer: '',
          androidVersion: '',
          sdkVersion: 0,
          type: isWifi ? 'wifi' : 'usb',
          state,
        };

        // If device is fully authorized, fetch richer properties
        if (state === 'device') {
          try {
            await this.populateDeviceDetails(device);
          } catch (err) {
            console.warn(`Could not fetch extra details for ${serial}:`, err);
          }
        }

        devices.push(device);
      }

      return devices;
    } catch (err) {
      console.error('Failed to fetch devices:', err);
      return [];
    }
  }

  private async populateDeviceDetails(device: DeviceInfo): Promise<void> {
    const serial = device.serial;

    // Fetch build props in one shell command
    try {
      const { stdout: props } = await this.execAdb([
        '-s', serial, 'shell',
        'getprop ro.product.brand; getprop ro.product.model; getprop ro.product.manufacturer; getprop ro.build.version.release; getprop ro.build.version.sdk'
      ], 5000);

      const [brand, model, manufacturer, release, sdk] = props.split('\n').map(s => s.trim());
      if (brand) device.brand = brand;
      if (model) device.model = model;
      if (manufacturer) device.manufacturer = manufacturer;
      if (release) device.androidVersion = release;
      if (sdk) device.sdkVersion = parseInt(sdk, 10) || 0;
    } catch {
      // ignore
    }

    // Battery info
    try {
      const { stdout: batteryOut } = await this.execAdb(['-s', serial, 'shell', 'dumpsys', 'battery'], 4000);
      const levelMatch = batteryOut.match(/level:\s*(\d+)/i);
      const statusMatch = batteryOut.match(/status:\s*(\d+)/i); // 2 = charging
      if (levelMatch) device.batteryLevel = parseInt(levelMatch[1], 10);
      if (statusMatch) device.isCharging = parseInt(statusMatch[1], 10) === 2;
    } catch {
      // ignore
    }

    // Screen resolution
    try {
      const { stdout: wmOut } = await this.execAdb(['-s', serial, 'shell', 'wm', 'size'], 4000);
      const resMatch = wmOut.match(/Physical size:\s*(\d+x\d+)/i) || wmOut.match(/(\d+x\d+)/);
      if (resMatch) device.resolution = resMatch[1];
    } catch {
      // ignore
    }

    // Wi-Fi IP address
    try {
      const { stdout: ipOut } = await this.execAdb(['-s', serial, 'shell', 'ip', '-f', 'inet', 'addr', 'show', 'wlan0'], 4000);
      const ipMatch = ipOut.match(/inet\s+(\d+\.\d+\.\d+\.\d+)/);
      if (ipMatch) {
        device.wifiIp = ipMatch[1];
      }
    } catch {
      // fallback
    }
  }

  // Android 11+ Wireless Debugging Pairing
  public async pairDevice(ip: string, port: number, code: string): Promise<{ success: boolean; message: string }> {
    try {
      const target = `${ip.trim()}:${port}`;
      const { stdout, stderr } = await this.execAdb(['pair', target, code.trim()], 20000);
      const out = stdout + ' ' + stderr;
      if (out.toLowerCase().includes('successfully paired')) {
        return { success: true, message: `Successfully paired with ${target}` };
      }
      return { success: false, message: out || 'Pairing failed. Please verify the code and port.' };
    } catch (e: any) {
      return { success: false, message: e.message || 'Pairing error' };
    }
  }

  // Connect to wireless device
  public async connectWireless(ip: string, port = 5555): Promise<{ success: boolean; message: string; serial?: string }> {
    try {
      const target = `${ip.trim()}:${port}`;
      const { stdout, stderr } = await this.execAdb(['connect', target], 15000);
      const out = stdout + ' ' + stderr;
      if (out.toLowerCase().includes('connected to') || out.toLowerCase().includes('already connected to')) {
        return { success: true, message: `Connected to ${target}`, serial: target };
      }
      return { success: false, message: out || 'Connection refused or timed out' };
    } catch (e: any) {
      return { success: false, message: e.message || 'Wireless connect error' };
    }
  }

  // Disconnect wireless device
  public async disconnectWireless(target: string): Promise<boolean> {
    try {
      await this.execAdb(['disconnect', target]);
      return true;
    } catch {
      return false;
    }
  }

  // Switch USB-connected device to TCP/IP Wireless mode
  public async switchUsbToWireless(usbSerial: string, port = 5555): Promise<{ success: boolean; message: string; wifiSerial?: string }> {
    try {
      // 1. Get the device's Wi-Fi IP
      let ip = '';
      const { stdout: ipOut } = await this.execAdb(['-s', usbSerial, 'shell', 'ip', '-f', 'inet', 'addr', 'show', 'wlan0'], 6000);
      const ipMatch = ipOut.match(/inet\s+(\d+\.\d+\.\d+\.\d+)/);
      if (ipMatch) {
        ip = ipMatch[1];
      }

      if (!ip) {
        // Try route table
        const { stdout: routeOut } = await this.execAdb(['-s', usbSerial, 'shell', 'ip', 'route'], 4000);
        const routeMatch = routeOut.match(/src\s+(\d+\.\d+\.\d+\.\d+)/);
        if (routeMatch) {
          ip = routeMatch[1];
        }
      }

      if (!ip) {
        return {
          success: false,
          message: 'Could not detect Wi-Fi IP. Please ensure the phone is connected to the same Wi-Fi network.',
        };
      }

      // 2. Switch ADB to TCP/IP mode
      await this.execAdb(['-s', usbSerial, 'tcpip', port.toString()], 8000);

      // Wait 1.5s for adbd to restart in TCP mode
      await new Promise(r => setTimeout(r, 1500));

      // 3. Connect to IP
      const target = `${ip}:${port}`;
      const { stdout: connOut } = await this.execAdb(['connect', target], 10000);

      if (connOut.toLowerCase().includes('connected to')) {
        return {
          success: true,
          message: `Successfully enabled wireless mode on ${target}! You can now unplug the USB cable.`,
          wifiSerial: target
        };
      }

      return {
        success: false,
        message: `TCP mode started, but connection to ${target} failed: ${connOut}`,
        wifiSerial: target
      };
    } catch (e: any) {
      return { success: false, message: e.message || 'Failed to switch to wireless' };
    }
  }

  // Remote key inputs
  public async sendKey(serial: string, keycode: number): Promise<boolean> {
    try {
      await this.execAdb(['-s', serial, 'shell', 'input', 'keyevent', keycode.toString()]);
      return true;
    } catch {
      return false;
    }
  }

  // Remote text input
  public async sendText(serial: string, text: string): Promise<boolean> {
    try {
      // Escape spaces and special chars for shell input text
      const escaped = text.replace(/ /g, '%s').replace(/([&;`|<>$"'*\\])/g, '\\$1');
      await this.execAdb(['-s', serial, 'shell', 'input', 'text', escaped]);
      return true;
    } catch {
      return false;
    }
  }

  // Remote touch tap
  public async sendTap(serial: string, x: number, y: number): Promise<boolean> {
    try {
      await this.execAdb(['-s', serial, 'shell', 'input', 'tap', Math.round(x).toString(), Math.round(y).toString()]);
      return true;
    } catch {
      return false;
    }
  }

  // Remote swipe
  public async sendSwipe(serial: string, x1: number, y1: number, x2: number, y2: number, durationMs = 300): Promise<boolean> {
    try {
      await this.execAdb([
        '-s', serial, 'shell', 'input', 'swipe',
        Math.round(x1).toString(), Math.round(y1).toString(),
        Math.round(x2).toString(), Math.round(y2).toString(),
        durationMs.toString()
      ]);
      return true;
    } catch {
      return false;
    }
  }

  // Remote wake
  public async wakeDevice(serial: string): Promise<boolean> {
    return this.sendKey(serial, 224); // KEYCODE_WAKEUP
  }

  // Remote sleep
  public async sleepDevice(serial: string): Promise<boolean> {
    return this.sendKey(serial, 223); // KEYCODE_SLEEP
  }

  // Detect real-time display orientation and active dimensions
  public async getDisplayOrientation(serial: string): Promise<OrientationInfo> {
    try {
      // 1. Check window displays for active current resolution
      const { stdout } = await this.execAdb([
        '-s', serial, 'shell',
        "dumpsys window displays | grep 'cur='"
      ], 3000);

      const match = stdout.match(/cur=(\d+)x(\d+)/);
      if (match) {
        const w = parseInt(match[1], 10);
        const h = parseInt(match[2], 10);
        const isLandscape = w > h;

        let rotation = 0;
        if (stdout.includes('ROTATION_90')) rotation = 90;
        else if (stdout.includes('ROTATION_180')) rotation = 180;
        else if (stdout.includes('ROTATION_270')) rotation = 270;
        else if (isLandscape) rotation = 90;

        return {
          orientation: isLandscape ? 'landscape' : 'portrait',
          rotation,
          width: w,
          height: h,
          aspectRatio: w / h,
        };
      }
    } catch {
      // ignore
    }

    // 2. Fallback: check wm size
    try {
      const { stdout: wmOut } = await this.execAdb(['-s', serial, 'shell', 'wm', 'size'], 2500);
      const m = wmOut.match(/(\d+)x(\d+)/);
      if (m) {
        const w = parseInt(m[1], 10);
        const h = parseInt(m[2], 10);
        return {
          orientation: 'portrait',
          rotation: 0,
          width: Math.min(w, h),
          height: Math.max(w, h),
          aspectRatio: Math.min(w, h) / Math.max(w, h),
        };
      }
    } catch {
      // ignore
    }

    return {
      orientation: 'portrait',
      rotation: 0,
      width: 1080,
      height: 2400,
      aspectRatio: 1080 / 2400,
    };
  }

  // Toggle or rotate screen orientation
  public async rotateScreen(serial: string): Promise<boolean> {
    try {
      const current = await this.getDisplayOrientation(serial);
      const targetRotation = current.orientation === 'portrait' ? 1 : 0;
      await this.execAdb([
        '-s', serial, 'shell',
        `settings put system accelerometer_rotation 0; settings put system user_rotation ${targetRotation}`
      ], 4000);
      return true;
    } catch {
      return false;
    }
  }

  // Screenshot capture -> returns temporary file path
  public async captureScreenshot(serial: string): Promise<string> {
    const tempDir = app.getPath('temp');
    const filename = `airlink_screenshot_${Date.now()}.png`;
    const outputPath = path.join(tempDir, filename);

    return new Promise((resolve, reject) => {
      const child = spawn(this.adbPath, ['-s', serial, 'exec-out', 'screencap', '-p'], {
        windowsHide: true,
      });

      const writeStream = fs.createWriteStream(outputPath);
      child.stdout.pipe(writeStream);

      child.on('close', (code) => {
        if (code === 0) {
          resolve(outputPath);
        } else {
          reject(new Error(`Screenshot failed with code ${code}`));
        }
      });

      child.on('error', (err) => {
        reject(err);
      });
    });
  }
}

