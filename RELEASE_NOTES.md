# AirLink Studio v1.0.0 — Initial Release 🚀
**Connect Everything. Control Everything.**

---

## 🌐 Quick Language Navigation / Bhasha Chuniye
- [English Notes](#english)
- [Hinglish Notes (Roman Hindi)](#hinglish-roman-hindi)

---

<a id="english"></a>
## 🇬🇧 English Release Notes

Welcome to the official **v1.0.0** public open-source release of **AirLink Studio**! AirLink Studio is a premium Windows desktop platform designed for seamless wireless & USB Android screen mirroring, real-time mouse & keyboard control, adaptive landscape fullscreen rendering, and a high-speed bidirectional file manager.

### ✨ Key Features in v1.0.0

- 📱 **Dual Connection Modes**:
  - **USB Connection**: Instant plug-and-play with automatic ADB authorization detection.
  - **Wireless Connection**: Wireless debugging pairing via IP:Port + 6-digit pairing code, or direct port 5555 connection over same Wi-Fi / mobile hotspot.
- 🔄 **Adaptive Landscape Fullscreen**:
  - Dynamically detects phone orientation switches (Portrait ↔ Landscape).
  - Automatically scales landscape games, videos, and apps to use the entire workspace while preserving the native aspect ratio.
  - Zero distortion, zero black bars cropping, and perfect touch/mouse coordinate translation in both modes.
- ⚡ **Real-Time Control Engine**:
  - Sub-30ms ultra-low latency mirroring powered by scrcpy 3.1 & ADB.
  - Mouse clicks = physical taps, click-and-drag = swipes/scrolls, keyboard = full text input.
  - Dedicated Back, Home, Recent Apps, and Android navigation gesture support.
- 📁 **2-Way Advanced File Manager**:
  - Direct phone storage explorer (`Internal Storage`, `DCIM`, `Pictures`, `Movies`, `Downloads`, `Documents`, `Music`).
  - Fast bidirectional transfers: Push files/folders from Windows to Android, and Pull phone files to PC.
  - Inline search, sorting, and directory navigation.
- 🌑 **Display Off Mode**:
  - Turn off your physical Android screen while keeping the mirroring and control stream running live on Windows, saving battery and preventing phone heating.
- 🎨 **Liquid Glass UI**:
  - macOS/iOS inspired glassmorphic aesthetic with dark and light themes, smooth Framer Motion animations, and translucent cards.

### 📦 Windows Binaries

| Asset | Description | Size | SHA-256 Checksum |
| :--- | :--- | :--- | :--- |
| **`AirLink-Studio-Setup.exe`** | Recommended Windows NSIS Installer (Desktop & Start Menu shortcuts, auto-updater ready) | ~81.2 MB | `73BE035D62D2CB442CBB292AF5592E16B5BE3BBB652A5416E595DCFF90A8DF9E` |
| **`AirLink-Studio.exe`** | Standalone Portable Windows Executable (No installation required) | ~81.0 MB | `AAFE84704ED300FDFA13F9FB014C3B0BD703F8F4C2EED2AF29D2E046D2ADF87C` |
| **`SHA256SUMS.txt`** | Checksum verification file | <1 KB | - |

### 📋 System Requirements
- **Host PC**: Windows 10 (1809+) or Windows 11 (64-bit).
- **Target Device**: Android 11, 12, 13, 14, 15+ (Android 5.0+ supported for USB ADB).
- **Network for Wireless**: Same Wi-Fi network or PC/Phone Mobile Hotspot.

---

<a id="hinglish-roman-hindi"></a>
## 🇮🇳 Hinglish Notes (Roman Hindi)

**AirLink Studio v1.0.0** ke official public open-source release mein aapka swagat hai! AirLink Studio ek premium Windows desktop software hai jisse aap apne Android phone ko bina kisi taar (Wi-Fi) ya USB ke through PC se mirror aur mouse-keyboard se fully control kar sakte hain.

### ✨ v1.0.0 ke Main Features

- 📱 **Do Connection Options**:
  - **USB Connection**: Phone ko data cable se lagao, "Allow USB Debugging" par tap karo aur ek click mein connect ho jao.
  - **Wireless Connection**: Bina taar ke connect karein. Wireless debugging pairing code (IP + Port + 6-digit code) ya standard port 5555 ke through same Wi-Fi ya mobile hotspot par connect karein.
- 🔄 **Adaptive Landscape Fullscreen**:
  - Jaise hi aap phone mein koi landscape game ya video (e.g., YouTube, BGMI) open karenge, AirLink Studio automatically screen ko maximize kar dega.
  - Native aspect ratio perfectly maintain rehta hai — na screen stretch hogi na hi crop hogi.
  - Mouse clicks aur touch coordinates orientation change hone ke baad bhi 100% accurate kaam karte hain.
- ⚡ **Super Fast & Low Latency**:
  - Scrcpy 3.1 aur ADB engine ki power se lag-free ultra low latency (<30ms) streaming.
  - Mouse click se phone touch hoga, mouse drag se swipe hoga, aur PC keyboard se phone mein typing hogi.
  - Navigation keys: Back, Home aur Recent Apps ke buttons screen par available hain.
- 📁 **2-Way File Manager**:
  - Phone ki internal memory, Photos (DCIM), Downloads, Documents aur Movies ko computer se seedhe browse karein.
  - PC se phone mein aur phone se PC mein files aur folders ko aasani se transfer karein.
- 🌑 **Display Off Mode**:
  - Phone ki physical screen band karke bhi computer par phone chalayein. Isse phone garam nahi hota aur battery bachti hai.
- 🎨 **Liquid Glass UI**:
  - Apple macOS jaisa premium glassmorphism design, translucent cards aur smooth animations.

### 📥 Download Kaise Karein
1. Setup Installer chahiye toh upar diye gaye Assets mein se **`AirLink-Studio-Setup.exe`** download karein.
2. Agar bina install kiye direct chalana hai toh **`AirLink-Studio.exe`** (Portable) download karein.

---

### 🔒 Verification
Windows PowerShell mein SHA-256 hash verify karne ke liye ye command chalayein:
```powershell
Get-FileHash .\AirLink-Studio-Setup.exe -Algorithm SHA256
```
Match with `SHA256SUMS.txt`.
