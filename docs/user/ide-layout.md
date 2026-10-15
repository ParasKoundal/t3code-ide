# IDE Layout & Workspaces

**T3 Code IDE** combines a full-featured code editor with an integrated multi-agent orchestration deck.

---

## The Three-Column Layout

```
+---------------+-----------------------------------------------+-------------------------------+
| ACTIVITY &    | MONACO CODE EDITOR                            | AGENT CONTROL HUB             |
| EXPLORER      |                                               |                               |
|               |  [App.tsx] [main.rs] [schema.prisma]          |  [Claude 3.7] [Codex] [Grok]  |
| - Workspaces  |  1 | import React from "react";               |                               |
|   * web       |  2 |                                          |  Turn 3 / 5:                  |
|   * server    |  3 | // Inline Edit [Cmd+K]                   |  "Implementing SQLite         |
|   * mobile    |  4 | export function App() { ... }            |   session compaction..."      |
|               |                                               |                               |
| - Git Changes |                                               |  [Diff Inspection: +42 -12]   |
|   * M App.tsx |                                               |  [Accept] [Reject] [Steer]    |
| - Extensions  +-----------------------------------------------+                               |
|   * Themes    | DOCKED TERMINAL DRAWER (Ctrl+`)               |  > Enter prompt or /command   |
|   * LSPs      | $ pnpm test --watch                           |  [Queue] [Steer]              |
+---------------+-----------------------------------------------+-------------------------------+
```

### 1. Left Column: Activity Bar & Multi-Root Explorer

- **Workspaces**: Add multiple local project folders into a single unified workspace. Each workspace root tracks its own Git branches, working trees, and dependencies.
- **Git Status Decorations**: Instant visual tracking of unstaged modifications, staged commits, and branch differences.
- **Open VSX Extension Hub**: Search and install VS Code-compatible plugins, syntax definitions, and color themes from [open-vsx.org](https://open-vsx.org).

### 2. Center Column: Monaco Code Editor & Docked Terminal

- **Monaco Engine**: Powered by the same core editor engine as VS Code, providing full syntax highlighting, bracket matching, code folding, and minimap navigation.
- **Cursor-Style Inline Edit (`Cmd+K` / `Ctrl+K`)**: Select any code segment and trigger the floating prompt bar to ask an agent for refactors, docstrings, or targeted edits with side-by-side diff review.
- **Language Server Intelligence (LSP)**: In-editor diagnostics, hover tooltips, and Go to Definition navigation for TypeScript (`vtsls`), Python (`pyright`), Go (`gopls`), and Rust (`rust-analyzer`).
- **Docked Terminal (<code>Ctrl+`</code>)**: Built-in terminal drawer docked beneath the editor to run project scripts, tests, and build tooling without switching windows.

### 3. Right Column: Multi-Agent Orchestration Hub

- **Switch Between Leading Models**: Toggle between Claude Code, OpenAI Codex, Cursor CLI, Grok Build, OpenCode, and Antigravity in the same thread.
- **Live Streamed Thoughts & Tool Calls**: Full transparency into agent reasoning, bash executions, and file inspection steps.
- **Granular Approval & Steering**: Review file diffs before they are saved to disk, approve bash commands, or steer agent execution while it is actively streaming.

---

## Keyboard Shortcuts Quick Reference

| Shortcut (macOS / Windows)     | Action                                  |
| :----------------------------- | :-------------------------------------- |
| `Cmd+Shift+I` / `Ctrl+Shift+I` | Toggle between IDE Mode and Chat Mode   |
| `Cmd+K` / `Ctrl+K`             | Open Inline Agent Edit in Monaco Editor |
| <code>Ctrl+`</code>            | Toggle Docked Terminal Drawer           |
| `Cmd+B` / `Ctrl+B`             | Toggle Explorer / Extensions Sidebar    |
| `Cmd+P` / `Ctrl+P`             | Quick Open File / Command Palette       |
| `Cmd+Shift+M` / `Ctrl+Shift+M` | Open Model & Agent Provider Switcher    |
| `Cmd+Shift+G` / `Ctrl+Shift+G` | Git Branch & Worktree Switcher          |
| `Cmd+Shift+X` / `Ctrl+Shift+X` | Switch Active Workspace Root            |
