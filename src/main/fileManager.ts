import { spawn } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import { EventEmitter } from 'node:events';
import { app, dialog, BrowserWindow } from 'electron';
import { AndroidFile, StorageInfo, FileTransferItem } from '../shared/types';
import { AdbManager } from './adbManager';

export class FileManager extends EventEmitter {
  private adbManager: AdbManager;
  private activeTransfers: Map<string, FileTransferItem> = new Map();
  private thumbnailCacheDir: string;

  constructor(adbManager: AdbManager) {
    super();
    this.adbManager = adbManager;
    this.thumbnailCacheDir = path.join(app.getPath('temp'), 'airlink_thumbnails');
    if (!fs.existsSync(this.thumbnailCacheDir)) {
      try {
        fs.mkdirSync(this.thumbnailCacheDir, { recursive: true });
      } catch {
        // ignore
      }
    }
  }

  // Get storage info
  public async getStorageInfo(serial: string): Promise<StorageInfo> {
    try {
      // Run df -k on /sdcard or /storage/emulated/0
      const { stdout } = await this.adbManager.execAdb(['-s', serial, 'shell', 'df -k /sdcard || df -k /storage/emulated/0'], 5000);
      const lines = stdout.split('\n').filter(l => l.trim().length > 0);
      
      // Look for data row
      if (lines.length >= 2) {
        const lastLine = lines[lines.length - 1];
        const parts = lastLine.trim().split(/\s+/);
        
        // Typical df output: Filesystem 1K-blocks Used Available Use% Mounted on
        if (parts.length >= 5) {
          const totalKb = parseInt(parts[1], 10) || 0;
          const usedKb = parseInt(parts[2], 10) || 0;
          const freeKb = parseInt(parts[3], 10) || 0;
          const totalBytes = totalKb * 1024;
          const usedBytes = usedKb * 1024;
          const freeBytes = freeKb * 1024;
          const usedPercentage = totalBytes > 0 ? Math.round((usedBytes / totalBytes) * 100) : 0;

          return {
            totalBytes,
            usedBytes,
            freeBytes,
            usedPercentage,
            path: '/sdcard',
          };
        }
      }
    } catch (e) {
      console.warn('Failed to get storage via df:', e);
    }

    return {
      totalBytes: 128 * 1024 * 1024 * 1024, // default 128GB
      usedBytes: 64 * 1024 * 1024 * 1024,
      freeBytes: 64 * 1024 * 1024 * 1024,
      usedPercentage: 50,
      path: '/sdcard',
    };
  }

  // List files in an Android directory
  public async listFiles(serial: string, dirPath = '/sdcard'): Promise<AndroidFile[]> {
    const cleanPath = dirPath.trim().replace(/\/+$/, '') || '/sdcard';
    
    try {
      // Use ls -lLa to follow symlinks like /sdcard -> /storage/emulated/0
      const { stdout } = await this.adbManager.execAdb([
        '-s', serial, 'shell',
        `ls -la "${cleanPath}"`
      ], 10000);

      const lines = stdout.split('\n');
      const files: AndroidFile[] = [];

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('total ') || trimmed.startsWith('total:')) continue;

        // Parse ls -la line
        // Example: -rw-rw---- 1 root sdcard_rw 12345 2024-05-10 12:30 filename.ext
        // or: drwxrwx--x 2 root sdcard_rw 4096 2024-05-10 12:30 Folder
        const match = trimmed.match(/^([drwxls\-]{10})\s+(\d+)\s+([^\s]+)\s+([^\s]+)\s+(\d+)\s+(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}|\w{3}\s+\d+\s+[\d:]+)\s+(.+)$/);
        
        let permissions = '';
        let size = 0;
        let modified = '';
        let name = '';
        let isDirectory = false;
        let isLink = false;

        if (match) {
          permissions = match[1];
          size = parseInt(match[5], 10) || 0;
          modified = match[6];
          name = match[7];
          isDirectory = permissions.startsWith('d');
          isLink = permissions.startsWith('l');
        } else {
          // Fallback simple space splitting
          const tokens = trimmed.split(/\s+/);
          if (tokens.length < 4) continue;
          permissions = tokens[0];
          isDirectory = permissions.startsWith('d');
          isLink = permissions.startsWith('l');
          
          // Last token is filename or contains spaces
          if (tokens.length >= 7) {
            size = parseInt(tokens[4], 10) || 0;
            modified = `${tokens[5]} ${tokens[6]}`;
            name = tokens.slice(7).join(' ');
          } else {
            name = tokens[tokens.length - 1];
          }
        }

        // Clean link arrows: e.g. "Download -> /storage/emulated/0/Download"
        if (name.includes(' -> ')) {
          name = name.split(' -> ')[0];
          isLink = true;
        }

        if (name === '.' || name === '..') continue;

        const ext = isDirectory ? '' : path.extname(name).toLowerCase().replace('.', '');
        const category = this.categorizeFile(name, isDirectory, ext);
        const fullFilePath = `${cleanPath}/${name}`.replace(/\/+/g, '/');

        files.push({
          name,
          path: fullFilePath,
          isDirectory,
          isLink,
          size,
          modified,
          permissions,
          category,
          extension: ext,
        });
      }

      // Sort: folders first, then alphabetical
      return files.sort((a, b) => {
        if (a.isDirectory && !b.isDirectory) return -1;
        if (!a.isDirectory && b.isDirectory) return 1;
        return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
      });
    } catch (err: any) {
      console.error(`Failed to list files in ${cleanPath}:`, err);
      throw new Error(`Failed to browse ${cleanPath}: ${err.message || 'Permission denied'}`);
    }
  }

  private categorizeFile(name: string, isDirectory: boolean, ext: string): AndroidFile['category'] {
    if (isDirectory) return 'folder';

    const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg', 'heic', 'heif', 'dng', 'raw'];
    const videoExts = ['mp4', 'mkv', 'webm', 'avi', 'mov', 'wmv', 'flv', '3gp', 'm4v', 'ts'];
    const audioExts = ['mp3', 'm4a', 'flac', 'wav', 'aac', 'ogg', 'wma', 'opus', 'mid'];
    const docExts = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'md', 'rtf', 'csv', 'epub', 'json', 'xml'];
    const apkExts = ['apk', 'apks', 'xapk', 'apkm'];
    const archiveExts = ['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz', 'iso'];

    if (imageExts.includes(ext)) return 'image';
    if (videoExts.includes(ext)) return 'video';
    if (audioExts.includes(ext)) return 'audio';
    if (docExts.includes(ext)) return 'document';
    if (apkExts.includes(ext)) return 'apk';
    if (archiveExts.includes(ext)) return 'archive';

    return 'other';
  }

  // Create folder
  public async createDirectory(serial: string, targetPath: string): Promise<boolean> {
    try {
      await this.adbManager.execAdb(['-s', serial, 'shell', 'mkdir', '-p', `"${targetPath}"`]);
      return true;
    } catch {
      return false;
    }
  }

  // Delete file or folder
  public async deleteItem(serial: string, targetPath: string): Promise<boolean> {
    try {
      await this.adbManager.execAdb(['-s', serial, 'shell', 'rm', '-rf', `"${targetPath}"`]);
      return true;
    } catch {
      return false;
    }
  }

  // Rename or move
  public async renameItem(serial: string, oldPath: string, newPath: string): Promise<boolean> {
    try {
      await this.adbManager.execAdb(['-s', serial, 'shell', 'mv', `"${oldPath}"`, `"${newPath}"`]);
      return true;
    } catch {
      return false;
    }
  }

  // Generate or fetch thumbnail / preview
  public async getThumbnail(serial: string, remotePath: string): Promise<string | null> {
    try {
      const hash = Buffer.from(remotePath).toString('base64').replace(/[/+=]/g, '_');
      const ext = path.extname(remotePath) || '.png';
      const localFile = path.join(this.thumbnailCacheDir, `${hash}${ext}`);

      // Return cached if exists and not 0 bytes
      if (fs.existsSync(localFile) && fs.statSync(localFile).size > 0) {
        return localFile;
      }

      // Check remote file size to avoid pulling huge files for thumbnail
      const { stdout: sizeOut } = await this.adbManager.execAdb(['-s', serial, 'shell', `stat -c %s "${remotePath}"`], 3000);
      const sizeBytes = parseInt(sizeOut.trim(), 10) || 0;
      if (sizeBytes > 15 * 1024 * 1024) {
        // Larger than 15MB, skip auto-thumbnail
        return null;
      }

      // Pull to local cache
      await this.adbManager.execAdb(['-s', serial, 'pull', remotePath, localFile], 10000);
      return localFile;
    } catch {
      return null;
    }
  }

  // Download files (Phone -> Windows)
  public async downloadFiles(
    serial: string,
    remoteFiles: string[],
    destinationDir: string,
    window?: BrowserWindow
  ): Promise<FileTransferItem[]> {
    const results: FileTransferItem[] = [];

    for (const remotePath of remoteFiles) {
      const fileName = path.basename(remotePath);
      let localDest = path.join(destinationDir, fileName);

      // Prevent silent overwrite: if file exists, add numbered suffix
      if (fs.existsSync(localDest)) {
        let counter = 1;
        const nameWithoutExt = path.parse(fileName).name;
        const ext = path.parse(fileName).ext;
        while (fs.existsSync(path.join(destinationDir, `${nameWithoutExt} (${counter})${ext}`))) {
          counter++;
        }
        localDest = path.join(destinationDir, `${nameWithoutExt} (${counter})${ext}`);
      }

      const transferId = `dl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const transferItem: FileTransferItem = {
        id: transferId,
        direction: 'download',
        localPath: localDest,
        remotePath,
        fileName,
        fileSize: 0,
        transferredBytes: 0,
        progress: 0,
        speedBytesPerSec: 0,
        remainingSeconds: 0,
        status: 'transferring',
        startedAt: Date.now(),
      };

      this.activeTransfers.set(transferId, transferItem);
      this.emitProgress(window, transferItem);

      try {
        // Fetch remote file size
        const { stdout: sizeOut } = await this.adbManager.execAdb(['-s', serial, 'shell', `stat -c %s "${remotePath}"`], 3000);
        transferItem.fileSize = parseInt(sizeOut.trim(), 10) || 1;

        // Perform adb pull
        await this.runAdbTransfer(['-s', serial, 'pull', remotePath, localDest], transferItem, window);
        transferItem.status = 'completed';
        transferItem.progress = 100;
        transferItem.completedAt = Date.now();
      } catch (err: any) {
        transferItem.status = 'failed';
        transferItem.error = err.message || 'Transfer failed';
      }

      this.emitProgress(window, transferItem);
      results.push({ ...transferItem });
    }

    return results;
  }

  // Upload files (Windows -> Phone)
  public async uploadFiles(
    serial: string,
    localPaths: string[],
    destinationDir: string,
    window?: BrowserWindow
  ): Promise<FileTransferItem[]> {
    const results: FileTransferItem[] = [];
    const cleanDest = destinationDir.trim().replace(/\/+$/, '') || '/sdcard/Download';

    for (const localPath of localPaths) {
      if (!fs.existsSync(localPath)) continue;

      const fileName = path.basename(localPath);
      const stat = fs.statSync(localPath);
      const remoteTarget = `${cleanDest}/${fileName}`;

      const transferId = `ul_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const transferItem: FileTransferItem = {
        id: transferId,
        direction: 'upload',
        localPath,
        remotePath: remoteTarget,
        fileName,
        fileSize: stat.size,
        transferredBytes: 0,
        progress: 0,
        speedBytesPerSec: 0,
        remainingSeconds: 0,
        status: 'transferring',
        startedAt: Date.now(),
      };

      this.activeTransfers.set(transferId, transferItem);
      this.emitProgress(window, transferItem);

      try {
        await this.runAdbTransfer(['-s', serial, 'push', localPath, remoteTarget], transferItem, window);
        transferItem.status = 'completed';
        transferItem.progress = 100;
        transferItem.completedAt = Date.now();
      } catch (err: any) {
        transferItem.status = 'failed';
        transferItem.error = err.message || 'Transfer failed';
      }

      this.emitProgress(window, transferItem);
      results.push({ ...transferItem });
    }

    return results;
  }

  private async runAdbTransfer(
    args: string[],
    item: FileTransferItem,
    window?: BrowserWindow
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const child = spawn(this.adbManager.getPath(), args, { windowsHide: true });
      let lastBytes = 0;
      let lastTime = Date.now();

      // Poll file progress if downloading
      const interval = setInterval(() => {
        if (item.direction === 'download' && fs.existsSync(item.localPath)) {
          try {
            const currentSize = fs.statSync(item.localPath).size;
            item.transferredBytes = currentSize;
            if (item.fileSize > 0) {
              item.progress = Math.min(99, Math.round((currentSize / item.fileSize) * 100));
              const now = Date.now();
              const dt = (now - lastTime) / 1000;
              if (dt > 0.5) {
                const db = currentSize - lastBytes;
                item.speedBytesPerSec = Math.max(0, Math.round(db / dt));
                if (item.speedBytesPerSec > 0) {
                  item.remainingSeconds = Math.round((item.fileSize - currentSize) / item.speedBytesPerSec);
                }
                lastBytes = currentSize;
                lastTime = now;
              }
            }
            this.emitProgress(window, item);
          } catch {
            // ignore
          }
        }
      }, 500);

      let errOutput = '';
      child.stderr.on('data', (d) => { errOutput += d.toString(); });
      child.stdout.on('data', (d) => {
        // e.g. [100%] /path: 100 KB in 0.01s (8.5 MB/s)
        const str = d.toString();
        const progressMatch = str.match(/\[\s*(\d+)%\]/);
        if (progressMatch) {
          item.progress = parseInt(progressMatch[1], 10);
          this.emitProgress(window, item);
        }
      });

      child.on('close', (code) => {
        clearInterval(interval);
        if (code === 0) {
          item.transferredBytes = item.fileSize;
          item.progress = 100;
          resolve();
        } else {
          reject(new Error(errOutput || `Transfer process exited with code ${code}`));
        }
      });

      child.on('error', (err) => {
        clearInterval(interval);
        reject(err);
      });
    });
  }

  private emitProgress(window?: BrowserWindow, item?: FileTransferItem): void {
    if (!item) return;
    this.emit('transfer-progress', item);
    if (window && !window.isDestroyed()) {
      window.webContents.send('transfer:update', item);
    }
  }

  // Open destination folder in Windows Explorer
  public async selectDestinationFolder(window: BrowserWindow): Promise<string | null> {
    const result = await dialog.showOpenDialog(window, {
      title: 'Select Destination Folder for Android Files',
      properties: ['openDirectory', 'createDirectory'],
      defaultPath: app.getPath('downloads'),
    });

    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }
    return result.filePaths[0];
  }

  // Select local files to send to Android
  public async selectLocalFiles(window: BrowserWindow): Promise<string[]> {
    const result = await dialog.showOpenDialog(window, {
      title: 'Select Files to Send to Android',
      properties: ['openFile', 'multiSelections'],
    });

    if (result.canceled || result.filePaths.length === 0) {
      return [];
    }
    return result.filePaths;
  }
}

