# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |

---

## Security Model & Principles

AirLink Studio is built with strict privacy and security principles:
1. **No Root Required**: Operates completely within Android's documented, sanctioned userland debugging and media APIs.
2. **Official ADB Authorization**: Never bypasses Android's RSA public key authentication prompt. Every connection requires explicit physical authorization on the device.
3. **Localhost & LAN Only**: Communication takes place strictly between your PC and Android device over USB or your local network / hotspot. No phone data, telemetry, or screenshots are ever transmitted to any external server or cloud service.
4. **Scoped Storage Compliance**: File manager strictly respects Android's scoped storage and standard permission boundaries. Private app sandboxes are never accessed.

---

## Reporting a Vulnerability

If you discover a security vulnerability within AirLink Studio, please follow responsible disclosure guidelines:

- **Do NOT** open a public issue on GitHub.
- Submit a detailed report via GitHub Private Vulnerability Reporting or email the maintainer at `luckydx109@users.noreply.github.com`.
- Include a step-by-step description and reproduction steps.
- We will acknowledge receipt within 48 hours and work on a fix promptly.
