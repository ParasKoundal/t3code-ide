<p align="center">
  <img src="assets/prod/logo.svg" width="108" height="108" alt="T3 Code IDE Logo" />
</p>

<h1 align="center">T3 Code IDE</h1>

<p align="center">
  <strong>The AI-native development environment and multi-agent harness.</strong><br>
  Unified Monaco editor, multi-root workspaces, Open VSX extensions, and docked agent orchestration across Claude Code, Codex, Cursor, Grok Build, OpenCode, and Antigravity.
</p>

<p align="center">
  <a href="https://github.com/ParasKoundal/t3code-ide/releases/latest"><img src="https://img.shields.io/badge/Download-Latest_Release-38bdf8?style=for-the-badge&logo=github" alt="Download Latest Release" /></a>
  <a href="https://github.com/ParasKoundal/t3code-ide/blob/main/LICENSE"><img src="https://img.shields.io/badge/License-MIT-818cf8?style=for-the-badge" alt="License" /></a>
</p>

---

## 🚀 1-Click Direct Downloads

Pre-built binaries are available for desktop and mobile companion devices. **No Node.js, Git, or terminal setup required.**

| Platform    | Download Link                                                                                                                       | Architecture / Format              | Notes                                  |
| :---------- | :---------------------------------------------------------------------------------------------------------------------------------- | :--------------------------------- | :------------------------------------- |
| **macOS**   | [**Download .DMG**](https://github.com/ParasKoundal/t3code-ide/releases/latest)                                                     | Apple Silicon (`arm64`, M1–M4)     | Drag to `/Applications`                |
| **macOS**   | [**Download .DMG**](https://github.com/ParasKoundal/t3code-ide/releases/latest)                                                     | Intel (`x64`)                      | Drag to `/Applications`                |
| **Windows** | [**Download .EXE**](https://github.com/ParasKoundal/t3code-ide/releases/latest)                                                     | Windows 10 / 11 (`x64` NSIS Setup) | 1-Click Installer with WSL support     |
| **Linux**   | [**Download .AppImage**](https://github.com/ParasKoundal/t3code-ide/releases/latest)                                                | Linux (`x64` AppImage / `.deb`)    | Standalone portable executable         |
| **Android** | [**Download .APK**](https://github.com/ParasKoundal/t3code-ide/releases/latest)                                                     | Universal Android (`.apk`)         | Companion app for phone/tablet control |
| **iOS**     | [**App Store**](https://apps.apple.com/app/t3-code/id6739832262) \| [**TestFlight Beta**](https://testflight.apple.com/join/t3code) | iPhone & iPad                      | Official Apple mobile companion        |

> [!TIP]
> **View all releases and checksums**: Visit the [Releases Page](https://github.com/ParasKoundal/t3code-ide/releases).

---

## 📦 Platform Installation Guides

### macOS (.dmg)

1. Download `T3-Code-IDE-<version>-arm64.dmg` (for M-series Macs) or `-x64.dmg` (for Intel).
2. Open the `.dmg` file and drag **T3 Code IDE** into your **Applications** folder.
3. _First run note_: As an open-source community release, if macOS Gatekeeper displays _"App cannot be opened because Apple cannot check it for malicious software"_, simply right-click the app in Applications and click **Open**, or run this one-time command in Terminal:
   ```bash
   xattr -cr "/Applications/T3 Code IDE.app"
   ```

### Windows (.exe)

1. Download `T3-Code-IDE-Setup-<version>.exe`.
2. Double-click the installer to install T3 Code IDE.
3. _SmartScreen note_: If Windows SmartScreen shows _"Windows protected your PC"_, click **More info** → **Run anyway**.

### Android Companion (.apk)

1. Download `t3code-ide-<version>.apk` directly on your Android phone or tablet.
2. Tap the downloaded file and select **Install** (enable _"Allow from this source"_ if prompted by your browser).
3. Open **T3 Code IDE** on your desktop, navigate to **Settings → Connections**, and scan the QR code to pair your phone instantly over your local network.

---

## ✨ What Makes T3 Code IDE Different?

Unlike standalone chat wrappers or traditional code editors, **T3 Code IDE** merges agentic execution with full IDE capabilities:

- **Integrated IDE Layout**: Side-by-side docked AI chat, Monaco code editor, and persistent multi-root file explorer. Switch effortlessly between chat-first and IDE modes (`Ctrl+Shift+I`).
- **Inline Agent Edits**: Cursor-style inline diff previews and floating edit widgets directly within the editor buffer (`Ctrl+K` / `Cmd+K`).
- **Open VSX Extension Marketplace**: Search, install, toggle, and configure VS Code-compatible extensions and themes directly from [Open VSX](https://open-vsx.org).
- **Multi-Root Workspaces**: Group multiple repositories or project folders under unified workspace scopes with dedicated agent chat threads per workspace or sub-project.
- **Docked Terminal Drawer**: Integrated terminal docked beneath the editor (<code>Ctrl+`</code>) for running project commands without switching contexts.
- **Language Server Intelligence**: In-editor LSP diagnostics, error/warning underlines, hover tooltips, and Go to Definition navigation (`vtsls`, `pyright`, `gopls`, `rust-analyzer`).
- **Multi-Agent Harness**: Native support for Codex, Claude, Cursor CLI, Grok Build, OpenCode, and Antigravity with full local and remote control surfaces.

---

## 🔑 AI Providers Setup

Authenticate at least one supported agent provider to power your IDE:

- **Claude**: Install [Claude Code](https://claude.com/product/claude-code) and run `claude auth login`
- **Codex**: Install [Codex CLI](https://developers.openai.com/codex/cli) and run `codex login`
- **Cursor**: Install [Cursor CLI](https://cursor.com/cli) and run `agent login`
- **Grok Build**: Install [Grok Build CLI](https://x.ai/cli) and run `grok login`
- **OpenCode**: Install [OpenCode](https://opencode.ai) and run `opencode auth login`
- **Antigravity**: Enable in Settings, then click **Install Antigravity** and sign in with Google.

---

## 🛠️ Building from Source (Contributors)

If you are developing or contributing to T3 Code IDE, you can build from source using [Vite+](https://vite.plus):

### 1. Install Vite+ (`vp`)

```bash
# macOS / Linux
curl -fsSL https://vite.plus | bash

# Windows (PowerShell)
irm https://vite.plus/ps1 | iex
```

### 2. Install & Run

```bash
# Install all workspace dependencies
vp i

# Start local server and web client concurrently
npm run dev

# Or build the desktop DMG / EXE locally:
npm run dist:desktop:dmg       # macOS .dmg
npm run dist:desktop:win       # Windows .exe
```

Open `http://localhost:5733` to access the local web environment.

---

## 📚 Documentation & Guides

Comprehensive documentation is available in [`docs/`](./docs):

- [IDE Layout & Workspaces](./docs/user/ide-layout.md)
- [Installation Guide & Desktop Setup](./docs/user/install.md)
- [Keyboard Shortcuts](./docs/user/keybindings.md)
- [Permission Modes & Safety](./docs/user/permission-modes.md)
- [Remote Access from Phone/Laptop](./docs/user/remote-access.md)
- [Language Servers & Diagnostics](./docs/user/outside-agents.md)
- [Source Control Integrations](./docs/user/source-control.md)
- [Architecture & Internals](./docs/internals/overview.md)

---

## License

MIT © [Paras Koundal](https://github.com/ParasKoundal) & original contributors.
