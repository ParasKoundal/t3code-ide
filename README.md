# T3 Code IDE

**T3 Code IDE** is an open-source, AI-native development environment and agent harness. It merges the multi-agent control surface of T3 Code with a full-fledged IDE experience inspired by Cursor and Google Antigravity.

Control agents on your machine (Claude Code, Codex, Cursor, Grok Build, OpenCode, and Antigravity) while enjoying a modern, unified IDE with multi-root workspaces, language servers, a docked terminal, and an Open VSX extension marketplace.

---

## What Makes T3 Code IDE Different?

Unlike standalone chat wrappers or traditional code editors, **T3 Code IDE** is designed from the ground up for agentic workflows with first-class editor integration:

- **Integrated IDE Layout**: Side-by-side docked AI chat, Monaco code editor, and persistent multi-root file explorer. Switch effortlessly between chat-first and IDE modes (`Ctrl+Shift+I`).
- **Open VSX Extension Marketplace**: Search, install, toggle, and configure VS Code-compatible extensions and themes directly from [Open VSX](https://open-vsx.org).
- **Multi-Root Workspaces**: Group multiple repositories or project folders under unified workspace scopes with dedicated agent chat threads per workspace or sub-project.
- **Docked Terminal Drawer**: Integrated terminal docked beneath the editor (`Ctrl+\``) for running project commands without switching contexts.
- **Language Server Intelligence**: In-editor LSP diagnostics, error/warning underlines, hover tooltips, and Go to Definition navigation (`vtsls`, `pyright`, `gopls`, `rust-analyzer`).
- **Full Agent Harness**: Native support for Codex, Claude, Cursor CLI, Grok Build, OpenCode, and Antigravity with full local and remote control surfaces.

---

## Installation & Providers

> [!WARNING]
> T3 Code IDE supports Codex, Claude, Cursor, Grok Build, OpenCode, and Antigravity. Install and authenticate at least one provider before use:
>
> - Codex: install [Codex CLI](https://developers.openai.com/codex/cli) and run `codex login`
> - Claude: install [Claude Code](https://claude.com/product/claude-code) and run `claude auth login`
> - Cursor: install [Cursor CLI](https://cursor.com/cli) and run `agent login`
> - Grok Build: install [Grok Build CLI](https://x.ai/cli) and run `grok login`
> - OpenCode: install [OpenCode](https://opencode.ai) and run `opencode auth login`
> - Antigravity: enable in Settings, then use **Install Antigravity** and **Sign in with Google**.

---

## Quick Start from Source

T3 Code IDE uses [Vite+](https://vite.plus) for ultra-fast builds and package management.

### 1. Install Vite+ (`vp`)

```bash
# macOS / Linux
curl -fsSL https://vite.plus | bash

# Windows (PowerShell)
irm https://vite.plus/ps1 | iex
```

### 2. Install Dependencies

```bash
vp i
```

### 3. Start Development Server

```bash
# Runs web client and local backend server concurrently
npm run dev
```

Visit `http://localhost:5733` to open the web IDE surface.

---

## Documentation & Guides

Comprehensive documentation is available in [`docs/`](./docs):

- [IDE Layout & Workspaces](./docs/user/ide-layout.md)
- [Install and First Run](./docs/user/install.md)
- [Keyboard Shortcuts](./docs/user/keybindings.md)
- [Permission Modes](./docs/user/permission-modes.md)
- [Remote Access from Phone/Laptop](./docs/user/remote-access.md)
- [Language Servers & Diagnostics](./docs/user/outside-agents.md)
- [Source Control Integrations](./docs/user/source-control.md)

Building from source or contributing? Read [`docs/internals/overview.md`](./docs/internals/overview.md).

---

## License

MIT © [Paras Koundal](https://github.com/ParasKoundal) & original contributors.
