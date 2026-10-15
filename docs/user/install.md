# Install T3 Code IDE

**T3 Code IDE** runs coding agents on your computer and lets you control them from its desktop, web, or mobile app.

---

## 🚀 1-Click Pre-Built Binaries (Recommended)

Download the pre-compiled installer for your operating system from [GitHub Releases](https://github.com/ParasKoundal/t3code-ide/releases):

| Platform                  | Download                                                                                                               | Format                     | Description                         |
| :------------------------ | :--------------------------------------------------------------------------------------------------------------------- | :------------------------- | :---------------------------------- |
| **macOS (Apple Silicon)** | [Download `.dmg`](https://github.com/ParasKoundal/t3code-ide/releases/latest)                                          | Apple Silicon (`arm64`)    | For M1, M2, M3, M4 Macs             |
| **macOS (Intel)**         | [Download `.dmg`](https://github.com/ParasKoundal/t3code-ide/releases/latest)                                          | Intel (`x64`)              | For Intel-based Macs                |
| **Windows**               | [Download `.exe`](https://github.com/ParasKoundal/t3code-ide/releases/latest)                                          | NSIS Setup (`x64`)         | Windows 10 / 11 with WSL support    |
| **Linux**                 | [Download `.AppImage`](https://github.com/ParasKoundal/t3code-ide/releases/latest)                                     | Standalone (`x64`)         | Portable Linux executable           |
| **Android Companion**     | [Download `.apk`](https://github.com/ParasKoundal/t3code-ide/releases/latest)                                          | Universal Android (`.apk`) | Mobile app for phone/tablet control |
| **iOS Companion**         | [App Store](https://apps.apple.com/app/t3-code/id6739832262) \| [TestFlight](https://testflight.apple.com/join/t3code) | iOS / iPadOS               | Official Apple mobile companion     |

---

## 🍎 macOS Installation Notes

1. Download the `.dmg` corresponding to your processor (`arm64` for Apple Silicon, `x64` for Intel).
2. Open the disk image and drag **T3 Code IDE** into `/Applications`.
3. **Gatekeeper Notice**: Unsigned community open-source builds may prompt:

   > _"T3 Code IDE can’t be opened because Apple cannot check it for malicious software."_

   To open:
   - Right-click **T3 Code IDE.app** in Finder and choose **Open**, then click **Open** in the dialog.
   - Or run this command once in Terminal:
     ```bash
     xattr -cr "/Applications/T3 Code IDE.app"
     ```

---

## ⚡ Running Alongside Upstream T3 Code

T3 Code IDE is fully decoupled from upstream T3 Code, allowing both applications to run concurrently on the same computer:

- **Isolated Home & State Directory**: T3 Code IDE uses `~/.t3code-ide/` (upstream T3 Code uses `~/.t3/`).
- **Independent SQLite Ownership**: Prevents database locking conflicts (`server-owner.sqlite`).
- **Separate Electron User Profiles**: Stored under `~/Library/Application Support/t3code-ide`.
- **Dedicated Custom URL Schemes**: `t3code-ide://` and `t3code-ide-dev://`.
- **Dynamic Port Allocation**: Starts searching at 3773; if upstream T3 Code is actively using port 3773, T3 Code IDE automatically binds to 3774.

---

## 🪟 Windows Installation Notes

1. Download `T3-Code-IDE-Setup-<version>.exe`.
2. Double-click the installer to install the desktop application.
3. **SmartScreen Notice**: If Windows Defender SmartScreen warns _"Windows protected your PC"_:
   - Click **More info**.
   - Click **Run anyway**.

---

## 📱 Mobile Companion Setup

T3 Code IDE includes a native companion application for Android and iOS that lets you monitor running agent tasks, approve file modifications, and prompt agents from anywhere.

1. Install the mobile app:
   - **Android**: Download and tap the `.apk` file (enable _"Install unknown apps"_ for your browser).
   - **iOS**: Join via the TestFlight beta link or download from the App Store.
2. Launch **T3 Code IDE** on your computer.
3. In the desktop app, go to **Settings → Connections** to display your local connection QR code.
4. Open the mobile app and scan the QR code to pair immediately over your local WiFi or Tailscale mesh.

---

## 💻 Building from Source (Developers)

To run or build from source:

```bash
# 1. Install Vite+
curl -fsSL https://vite.plus | bash

# 2. Clone repository & install dependencies
git clone https://github.com/ParasKoundal/t3code-ide.git
cd t3code-ide
vp i

# 3. Start development server
npm run dev

# 4. Or build standalone desktop installer
npm run dist:desktop:dmg   # macOS
npm run dist:desktop:win   # Windows
```
