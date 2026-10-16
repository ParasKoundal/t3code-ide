#!/bin/bash
# ==============================================================================
# T3 Code IDE - Gatekeeper Quarantine Remover
# Resolves "Apple could not verify T3 Code IDE is free of malware..."
#
# Usage:
#   ./scripts/fix-gatekeeper.sh
#   or
#   ./scripts/fix-gatekeeper.sh "/path/to/T3 Code IDE.app"
# ==============================================================================
set -euo pipefail

TARGET="${1:-/Applications/T3 Code IDE.app}"

if [[ ! -d "$TARGET" ]]; then
  echo "❌ Error: App not found at: $TARGET"
  echo "Usage: $0 [/path/to/T3 Code IDE.app]"
  exit 1
fi

echo "✦ Removing quarantine attributes from $TARGET..."
xattr -cr "$TARGET"

if command -v codesign >/dev/null 2>&1; then
  echo "✦ Re-sealing ad-hoc signature..."
  codesign --force --deep --sign - "$TARGET" 2>/dev/null || true
fi

echo "✅ Done! Gatekeeper restrictions removed. You can now launch $TARGET directly."
