import { spawn, ChildProcess } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import { app } from 'electron';
import { ScrcpyConfig, ScrcpySession } from '../shared/types';
import { EventEmitter } from 'node:events';

export class ScrcpyManager extends EventEmitter {
  private scrcpyPath: string;
  private runningProcesses: Map<string, { process: ChildProcess; session: ScrcpySession }> = new Map();

  constructor() {
    super();
    this.scrcpyPath = this.resolveScrcpyPath();
  }

  public getPath(): string {
    return this.scrcpyPath;
  }

  private resolveScrcpyPath(): string {
    if (app && app.isPackaged) {
      const prodPath = path.join(process.resourcesPath, 'bin', 'scrcpy', 'scrcpy.exe');
      if (fs.existsSync(prodPath)) return prodPath;
    }

    const devPath = path.join(process.cwd(), 'bin', 'scrcpy', 'scrcpy.exe');
    if (fs.existsSync(devPath)) return devPath;

    return 'scrcpy';
  }

  public async getVersion(): Promise<string> {
    return new Promise((resolve) => {
      try {
        const proc = spawn(this.scrcpyPath, ['--version'], { windowsHide: true });
        let out = '';
        proc.stdout.on('data', (d) => { out += d.toString(); });
        proc.on('close', () => {
          const match = out.match(/scrcpy\s+([^\s\r\n]+)/);
          resolve(match ? match[1] : 'v3.1');
        });
        proc.on('error', () => resolve('Not found'));
      } catch {
        resolve('Not found');
      }
    });
  }

  public startMirroring(serial: string, deviceName: string, config: ScrcpyConfig): ScrcpySession {
    // If already running for this device, return current session
    if (this.runningProcesses.has(serial)) {
      return this.runningProcesses.get(serial)!.session;
    }

    const args: string[] = ['-s', serial];

    // Window settings
    const title = `AirLink Studio - ${deviceName || serial}`;
    args.push(`--window-title=${title}`);

    if (config.alwaysOnTop) {
      args.push('--always-on-top');
    }

    if (config.borderless) {
      args.push('--window-borderless');
    }

    // Video settings
    if (config.maxSize && config.maxSize > 0) {
      args.push(`--max-size=${config.maxSize}`);
    }

    if (config.maxFps && config.maxFps > 0) {
      args.push(`--max-fps=${config.maxFps}`);
    }

    if (config.bitRate && config.bitRate > 0) {
      args.push(`--video-bit-rate=${config.bitRate}M`);
    }

    if (config.videoCodec) {
      args.push(`--video-codec=${config.videoCodec}`);
    }

    // Audio
    if (!config.audio) {
      args.push('--no-audio');
    }

    // Stay awake
    if (config.stayAwake) {
      args.push('--stay-awake');
    }

    // Turn screen off on connect
    if (config.turnScreenOff) {
      args.push('--turn-screen-off');
    }

    // Keyboard & Mouse mode
    if (config.keyboardMode) {
      args.push(`--keyboard=${config.keyboardMode}`);
    }

    if (config.mouseMode) {
      args.push(`--mouse=${config.mouseMode}`);
    }

    const workingDir = path.dirname(this.scrcpyPath);

    console.log(`Starting scrcpy: ${this.scrcpyPath} ${args.join(' ')}`);

    const proc = spawn(this.scrcpyPath, args, {
      cwd: workingDir,
      windowsHide: false,
      env: {
        ...process.env,
        ADB: path.join(workingDir, 'adb.exe'),
      },
    });

    const session: ScrcpySession = {
      deviceId: serial,
      isActive: true,
      pid: proc.pid,
      startedAt: Date.now(),
      displayOff: !!config.turnScreenOff,
    };

    this.runningProcesses.set(serial, { process: proc, session });
    this.emit('session-started', session);

    let errorLog = '';

    proc.stdout.on('data', (data) => {
      console.log(`[scrcpy ${serial}]`, data.toString().trim());
    });

    proc.stderr.on('data', (data) => {
      const msg = data.toString().trim();
      console.error(`[scrcpy error ${serial}]`, msg);
      errorLog += msg + '\n';
    });

    proc.on('close', (code) => {
      console.log(`[scrcpy ${serial}] exited with code: ${code}`);
      const info = this.runningProcesses.get(serial);
      if (info) {
        info.session.isActive = false;
        if (code !== 0 && errorLog) {
          info.session.error = errorLog.slice(0, 300);
        }
        this.emit('session-ended', { ...info.session, exitCode: code });
        this.runningProcesses.delete(serial);
      }
    });

    proc.on('error', (err) => {
      console.error(`Failed to launch scrcpy for ${serial}:`, err);
      const info = this.runningProcesses.get(serial);
      if (info) {
        info.session.isActive = false;
        info.session.error = err.message;
        this.emit('session-ended', info.session);
        this.runningProcesses.delete(serial);
      }
    });

    return session;
  }

  public stopMirroring(serial: string): boolean {
    const entry = this.runningProcesses.get(serial);
    if (!entry) return false;

    try {
      entry.process.kill('SIGINT');
      setTimeout(() => {
        if (this.runningProcesses.has(serial)) {
          try {
            entry.process.kill('SIGKILL');
          } catch {
            // ignore
          }
        }
      }, 1000);
      return true;
    } catch (e) {
      console.error('Error stopping scrcpy:', e);
      return false;
    }
  }

  public getSession(serial: string): ScrcpySession | null {
    const entry = this.runningProcesses.get(serial);
    return entry ? entry.session : null;
  }

  public getAllSessions(): ScrcpySession[] {
    return Array.from(this.runningProcesses.values()).map(e => e.session);
  }

  public stopAll(): void {
    for (const [serial, entry] of this.runningProcesses.entries()) {
      try {
        entry.process.kill('SIGKILL');
      } catch {
        // ignore
      }
    }
    this.runningProcesses.clear();
  }
}

