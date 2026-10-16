#!/bin/bash
# ==============================================================================
# T3 Code IDE - 1-Click macOS Installer & Gatekeeper Fix
# Installs T3 Code IDE into /Applications and removes Gatekeeper quarantine
# so you never see "Apple could not verify..." or malware warnings.
#
# Usage:
#   curl -fsSL https://raw.githubusercontent.com/ParasKoundal/t3code-ide/main/scripts/install-mac.sh | bash
# ==============================================================================
set -euo pipefail

APP_NAME="T3 Code IDE"
REPO="ParasKoundal/t3code-ide"
TARGET_DIR="/Applications"
APP_BUNDLE="${TARGET_DIR}/${APP_NAME}.app"

echo "=========================================================="
echo "  🚀 Installing ${APP_NAME} for macOS"
echo "=========================================================="

# 1. Verify macOS
if [[ "$(uname -s)" != "Darwin" ]]; then
  echo "❌ Error: This installer is designed for macOS only." >&2
  exit 1
fi

# 2. Detect processor architecture
ARCH="$(uname -m)"
if [[ "$ARCH" == "arm64" ]]; then
  DMG_ARCH="arm64"
  echo "✦ Detected Apple Silicon (M1/M2/M3/M4) architecture."
elif [[ "$ARCH" == "x86_64" ]]; then
  DMG_ARCH="x64"
  echo "✦ Detected Intel (x86_64) architecture."
else
  echo "❌ Error: Unsupported processor architecture: $ARCH" >&2
  exit 1
fi

TMP_DIR="$(mktemp -d -t t3code-install-XXXXXX)"
cleanup() {
  local exit_code=$?
  if [[ -n "${MOUNT_DIR:-}" ]] && mount | grep -q "$MOUNT_DIR"; then
    hdiutil detach "$MOUNT_DIR" -force -quiet || true
  fi
  if [[ -d "${TMP_DIR:-}" ]]; then
    rm -rf "$TMP_DIR"
  fi
  exit "$exit_code"
}
trap cleanup EXIT INT TERM

# 3. Resolve version
echo "✦ Resolving latest release..."
RELEASE_DATA="$(curl -sSL "https://api.github.com/repos/${REPO}/releases/latest" 2>/dev/null || true)"
VERSION=""
if [[ -n "$RELEASE_DATA" ]]; then
  VERSION="$(echo "$RELEASE_DATA" | grep '"tag_name":' | head -n 1 | sed -E 's/.*"([^"]+)".*/\1/' || true)"
fi
if [[ -z "$VERSION" ]]; then
  VERSION="v0.1.0"
fi
CLEAN_VERSION="${VERSION#v}"

DMG_NAME="T3-Code-IDE-${CLEAN_VERSION}-${DMG_ARCH}.dmg"
DOWNLOAD_URL="https://github.com/${REPO}/releases/download/${VERSION}/${DMG_NAME}"
DMG_PATH="${TMP_DIR}/${DMG_NAME}"

# 4. Download DMG
echo "✦ Downloading ${DMG_NAME} (${VERSION})..."
curl -fL --progress-bar "$DOWNLOAD_URL" -o "$DMG_PATH"

# 5. Mount DMG
echo "✦ Attaching installer disk image..."
MOUNT_DIR="${TMP_DIR}/mnt"
mkdir -p "$MOUNT_DIR"
hdiutil attach "$DMG_PATH" -nobrowse -readonly -mountpoint "$MOUNT_DIR" -quiet

MOUNTED_APP="${MOUNT_DIR}/${APP_NAME}.app"
if [[ ! -d "$MOUNTED_APP" ]]; then
  MOUNTED_APP="$(find "$MOUNT_DIR" -maxdepth 1 -name "*.app" | head -n 1)"
fi

if [[ -z "$MOUNTED_APP" || ! -d "$MOUNTED_APP" ]]; then
  echo "❌ Error: Could not find ${APP_NAME}.app inside the installer." >&2
  exit 1
fi

# 6. Copy to /Applications
echo "✦ Installing to ${TARGET_DIR}..."
if [[ -d "$APP_BUNDLE" ]]; then
  echo "  (Replacing existing installation at ${APP_BUNDLE})"
  rm -rf "$APP_BUNDLE"
fi

ditto "$MOUNTED_APP" "$APP_BUNDLE"

# 7. Unmount
echo "✦ Ejecting disk image..."
hdiutil detach "$MOUNT_DIR" -force -quiet || true
MOUNT_DIR=""

# 8. Clear Gatekeeper quarantine and sign ad-hoc to avoid malware dialogs
echo "✦ Stripping macOS Gatekeeper quarantine attributes..."
xattr -cr "$APP_BUNDLE" 2>/dev/null || true

if command -v codesign >/dev/null 2>&1; then
  codesign --force --deep --sign - "$APP_BUNDLE" 2>/dev/null || true
fi

echo ""
echo "=========================================================="
echo "  🎉 Installation Complete!"
echo "  Location: ${APP_BUNDLE}"
echo "  Gatekeeper: Cleared (no Apple malware warning)"
echo "=========================================================="
echo ""

if [[ -t 0 ]]; then
  read -p "Would you like to launch ${APP_NAME} now? [Y/n] " -n 1 -r || true
  echo ""
  if [[ -z "$REPLY" || "$REPLY" =~ ^[Yy]$ ]]; then
    open "$APP_BUNDLE"
  fi
fi
