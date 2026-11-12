# Changelog

All notable changes to **AirLink Studio** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2026-11-12

### Initial Stable Release — Connect Everything. Control Everything.

#### 🚀 Core Engine & Mirroring
- **scrcpy 3.1 & ADB Integration**: Bundled standalone, self-contained Windows 64-bit binaries with zero external prerequisites.
- **Adaptive Landscape Fullscreen**:
  - Real-time orientation tracking via `dumpsys window displays`.
  - Automatic workspace expansion in Landscape mode with aspect-ratio preservation.
  - Borderless true fullscreen toggle (`F11` / `Escape`) utilizing 100% of the display for widescreen video playback and landscape gaming.
- **Configurable Streaming**:
  - Resolution selector (Native, 4K, 2K, 1080p, 720p).
  - Framerate presets (30 FPS, 60 FPS, 120 FPS).
  - Video bitrate controls (4 Mbps to 32 Mbps).
  - Audio forwarding directly to Windows speakers.

#### 🎮 Full Remote Control
- **Interactive Touch & Mouse Mapping**:
  - Mouse Click = Touch / Tap (dynamically calibrated in portrait & landscape).
  - Mouse Drag = Swipe / Gesture flick.
  - Mouse Scroll Wheel = Vertical scrolling.
- **Floating Glass HUD Toolbar**:
  - Soft navigation buttons: Back (`KEYCODE_BACK`), Home (`KEYCODE_HOME`), Recents (`KEYCODE_APP_SWITCH`).
  - Hardware buttons: Volume Up, Volume Down, Power (`KEYCODE_POWER`).
  - Remote Keyboard Text Input modal.
  - Screenshot capture with instant preview and folder access.
- **Display Off Mode**:
  - Turns off physical phone screen and backlight while streaming and remote controls stay active.
  - Prevents OLED burn-in and conserves phone battery during long sessions.

#### ⚡ Connectivity Hub
- **Direct USB Link**: Automatic device detection, authorization monitoring, and one-click connection.
- **1-Click Convert to Wireless**: Automatically switches active USB devices to Wi-Fi TCP mode and connects wirelessly.
- **Wireless Wi-Fi / Hotspot Link**: Android 11+ pairing assistant with 6-digit code and pairing port.
- **Remembered Devices**: Secure storage of previously paired devices with quick reconnect.

#### 📁 Advanced File Manager & 2-Way Transfers
- **Android Storage Browser**: Browse internal storage, Camera/DCIM, Pictures, Downloads, Documents, Movies, and Music.
- **Two-Way Transfers**:
  - Phone to Windows download with directory picker and real-time progress.
  - Windows to Phone upload with Drag & Drop onto the application window.
  - Non-destructive transfer (avoids silent file overwrites).
  - Transfer queue drawer and persistent history log.
  - In-app media lightbox preview for photos, audio playback, and documents.
  - Storage usage visualization bar.

#### 🎨 Liquid Glass Design System
- macOS / iOS inspired frosted glass panels with specular highlight borders and soft blurs.
- Light and Dark theme toggle.
- Frameless custom window with native window controls.
