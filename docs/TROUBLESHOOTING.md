# Troubleshooting & OEM Guide | समस्या निवारण और OEM गाइड

[English](#english) | [Hinglish (Roman Hindi)](#hinglish-roman-hindi)

---

## English

### 1. Phone Not Detected Over USB
- **Solution 1**: Ensure **USB Debugging** is turned ON in Developer Options.
- **Solution 2**: Change USB mode in your phone's notification panel from "Charging only" to **"File Transfer (MTP)"**.
- **Solution 3**: Check Windows Device Manager under "Universal Serial Bus devices" or "Android Device". If there is an exclamation mark, install the Google USB Driver or your OEM's USB driver.

### 2. Device Shows as "Unauthorized"
- Unlock your phone's lockscreen.
- Look for the dialog titled **"Allow USB Debugging?"**.
- Check the box **"Always allow from this computer"** and tap **Allow**.

### 3. Xiaomi / HyperOS / MIUI Specific Fixes
On Xiaomi, Redmi, and POCO devices, security settings block remote touch input by default:
1. Open **Settings &rarr; Additional Settings &rarr; Developer Options**.
2. Turn ON **"USB debugging (Security settings)"** *(Allow granting permissions and simulating input)*.
3. Turn ON **"Install via USB"**.

### 4. Wireless Connection Disconnects
- Keep phone and laptop on the same 5GHz Wi-Fi network for optimal latency.
- In your phone's Wi-Fi settings, set Wi-Fi sleep policy to "Always keep on".
- In Developer Options, enable **"Always keep mobile data active"** if using mobile hotspot.

---

## Hinglish (Roman Hindi)

### 1. USB Lagane Par Phone Detect Nahi Ho Raha
- **Upay 1**: Check karein ki Developer Options mein **USB Debugging** ON hai ya nahi.
- **Upay 2**: Phone ke notification bar mein USB settings ko "Charging only" se badalkar **"File Transfer (MTP)"** karein.
- **Upay 3**: Windows Device Manager check karein, agar driver issue hai toh OEM USB driver install karein.

### 2. Status "Unauthorized" Dikh Raha Hai
- Apne phone ka lock kholein.
- Screen par ek pop-up aayega: **"Allow USB Debugging?"**.
- **"Always allow from this computer"** par tick karein aur **Allow** dabayein.

### 3. Xiaomi / Redmi / POCO (HyperOS / MIUI) Touch Issue
Xiaomi phones mein remote touch chalane ke liye ek extra setting zaroori hoti hai:
1. **Settings &rarr; Additional Settings &rarr; Developer Options** mein jayein.
2. **"USB debugging (Security settings)"** ko ON karein.
3. **"Install via USB"** ko bhi ON karein.

### 4. Wi-Fi Mirroring Mein Lag Ya Disconnect Hona
- Behtar speed aur low latency ke liye phone aur laptop ko **5GHz Wi-Fi** se connect karein.
- Dono devices ke beech zyada doori na rakhein.
