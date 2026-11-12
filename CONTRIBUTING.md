# Contributing to AirLink Studio

Thank you for your interest in contributing to **AirLink Studio**! We welcome bug fixes, documentation improvements, UI refinements, and new features.

---

## 🛠️ Development Setup

### Prerequisites
- **Node.js**: v18.0.0 or later (v20+ recommended)
- **npm**: v9.0.0 or later
- **OS**: Windows 10/11 (64-bit)

### Getting Started

1. **Fork and Clone** the repository:
   ```bash
   git clone https://github.com/luckydx109/airlink-studio.git
   cd airlink-studio
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```
   *(The postinstall script automatically downloads compatible standalone ADB and scrcpy binaries into `bin/scrcpy/`)*

3. **Run in Development Mode**:
   ```bash
   npm run dev
   ```

4. **Verify TypeScript & Build**:
   ```bash
   npm run build
   ```

---

## 📐 Project Structure

```
airlinkstudio/
├── bin/scrcpy/          # Standalone bundled ADB & scrcpy binaries
├── scripts/             # Automated setup scripts
├── src/
│   ├── main/            # Electron Main process (AdbManager, ScrcpyManager, FileManager)
│   ├── renderer/        # React 18 + Vite frontend
│   │   └── src/
│   │       ├── components/  # Glass UI components (Dashboard, Workspace, Files, Settings)
│   │       ├── context/     # DeviceContext, TransferContext, SettingsContext
│   │       └── index.css    # Tailwind & Liquid Glass styling
│   └── shared/          # Shared TypeScript interfaces & types
└── docs/                # Architecture and user documentation
```

---

## 🤝 Submitting Pull Requests

1. Create a feature branch: `git checkout -b feature/my-new-feature`
2. Follow strict TypeScript type checking (`npx tsc --noEmit` must pass with 0 errors).
3. Ensure no unnecessary large binaries or temporary caches are committed.
4. Commit your changes with clear messages.
5. Push to your branch and open a PR against the `main` branch.
