# AirLink Studio — Architecture & Technical Overview

AirLink Studio is engineered as an event-driven desktop application combining Electron's native process management with React's component model and scrcpy's hardware-accelerated video pipeline.

```
┌─────────────────────────────────────────────────────────────┐
│                    AirLink Studio Frontend                  │
│       React 18 + TypeScript + Tailwind CSS + Framer Motion  │
│  (DashboardView | WorkspaceView | FilesView | SettingsView) │
└──────────────────────────────┬──────────────────────────────┘
                               │ IPC via ContextBridge (airlinkAPI)
┌──────────────────────────────▼──────────────────────────────┐
│                    Electron Main Process                    │
│   ┌───────────────┐ ┌────────────────┐ ┌────────────────┐   │
│   │  AdbManager   │ │ ScrcpyManager  │ │  FileManager   │   │
│   │(Device & Auth)│ │ (Process Tree) │ │ (Push/Pull/Ls) │   │
│   └───────┬───────┘ └───────┬────────┘ └───────┬────────┘   │
│           │                 │                  │            │
│   ┌───────┴─────────────────┴──────────────────┴────────┐   │
│   │                 StoreManager                         │   │
│   │          (App Config & Remembered Devices)           │   │
│   └──────────────────────────────────────────────────────┘   │
└──────────────────────────────┬──────────────────────────────┘
                               │ Process Spawning & Streams
┌──────────────────────────────▼──────────────────────────────┐
│                  Bundled Standalone Binaries                │
│    adb.exe (1.0.41)   │   scrcpy.exe (3.1) + SDL2 + FFmpeg  │
└──────────────────────────────┬──────────────────────────────┘
                               │ USB / Wi-Fi TCP (Port 5555)
┌──────────────────────────────▼──────────────────────────────┐
│                  Target Android 11+ Device                  │
│   - adbd daemon                                             │
│   - scrcpy-server.jar (H.264/H.265/AV1 MediaCodec encoder)  │
└─────────────────────────────────────────────────────────────┘
```

---

## 1. Electron Main Process Subsystems

### `AdbManager` ([src/main/adbManager.ts](../src/main/adbManager.ts))
- **Binary Resolution**: Resolves bundled standalone `adb.exe` in development (`bin/scrcpy/adb.exe`) and production (`process.resourcesPath/bin/scrcpy/adb.exe`).
- **Server Lifecycle**: Initiates and manages the background ADB daemon on port 5037 (`startServer`, `killServer`).
- **Device Polling & Event Loop**: Continuously queries `adb devices -l` and extracts device model, brand, manufacturer, battery percentage, charging state, resolution, and Wi-Fi IP.
- **Orientation Engine**: Detects active screen dimensions in real-time using `dumpsys window displays | grep 'cur='`, emitting `device:orientation-changed` events.
- **Wireless Automation**: Handles Android 11+ pairing (`adb pair`), connection (`adb connect`), and 1-click TCP/IP conversion (`adb tcpip 5555`).

### `ScrcpyManager` ([src/main/scrcpyManager.ts](../src/main/scrcpyManager.ts))
- **Command Generation**: Dynamically constructs scrcpy CLI flags (`--max-size`, `--max-fps`, `--video-bit-rate`, `--video-codec`, `--audio`, `--stay-awake`, `--turn-screen-off`, `--keyboard=uhid`, `--mouse=uhid`).
- **Process Supervision**: Spawns and supervises the child process, monitoring exit codes, error streams, and session states.
- **Display Off Synchronization**: Coordinates with ADB to turn off the physical screen while maintaining active hardware mirroring.

### `FileManager` ([src/main/fileManager.ts](../src/main/fileManager.ts))
- **Filesystem Traversal**: Parses `ls -la` output across internal storage (`/sdcard`) into categorized metadata (images, videos, audio, documents, APKs, archives).
- **Two-Way Streaming**: Manages non-blocking `adb pull` and `adb push` streams with speed (MB/s), bytes transferred, and ETA calculations.
- **Conflict Handling**: Prevents destructive file overwrites by appending numbered suffixes to duplicate filenames.

---

## 2. Renderer & ContextBridge Security

AirLink Studio runs with **`contextIsolation: true`** and **`nodeIntegration: false`**. The renderer communicates solely through typed IPC channels exposed in `window.airlinkAPI` ([src/main/preload.ts](../src/main/preload.ts)).
