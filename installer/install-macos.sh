#!/usr/bin/env bash
# ============================================================================
#  Delta Dashboard — macOS Bootstrapper
#
#  Downloads and installs the latest Delta Dashboard release from GitHub.
#  Re-run at any time to update to the newest version.
#
#  Usage:
#    curl -fsSL https://raw.githubusercontent.com/Tri-Lumen/F1/main/installer/install-macos.sh | bash
# ============================================================================
set -e

REPO="Tri-Lumen/F1"
API_URL="https://api.github.com/repos/${REPO}/releases/latest"
APP_NAME="Delta Dashboard"

# ---- Colours ----------------------------------------------------------------
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

info()  { printf "${CYAN}[INFO]${NC}  %s\n" "$*"; }
ok()    { printf "${GREEN}[OK]${NC}    %s\n" "$*"; }
warn()  { printf "${YELLOW}[WARN]${NC}  %s\n" "$*"; }
error() { printf "${RED}[ERROR]${NC} %s\n" "$*"; exit 1; }

# ---- Detect architecture ---------------------------------------------------
detect_arch() {
    local arch
    arch=$(uname -m)
    case "$arch" in
        x86_64)  echo "x64" ;;
        arm64)   echo "arm64" ;;
        *)       error "Unsupported architecture: $arch" ;;
    esac
}

echo ""
printf "${BOLD}========================================${NC}\n"
printf "${BOLD}  Delta Dashboard — macOS Installer${NC}\n"
printf "${BOLD}========================================${NC}\n"
echo ""

# ---- Check prerequisites ---------------------------------------------------
if ! command -v curl &>/dev/null; then
    error "curl is required but not found"
fi

# ---- Fetch latest release info ---------------------------------------------
info "Fetching latest release info..."
RELEASE_JSON=$(curl -fsSL -H "User-Agent: Delta-Dashboard-Installer" "$API_URL") \
    || error "Failed to reach GitHub API. Check your internet connection."

VERSION=$(echo "$RELEASE_JSON" | grep -o '"tag_name":"[^"]*"' | head -1 | sed 's/"tag_name":"\([^"]*\)"/\1/')
info "Latest version: $VERSION"

ARCH=$(detect_arch)
info "Detected architecture: $ARCH"

# ---- Find the DMG asset -----------------------------------------------------
# Prefer arch-specific DMG, fall back to universal/generic DMG
# Note: grep -o is required because the GitHub API returns minified single-line
# JSON — a plain grep would match the entire blob and sed would extract the
# wrong (last) URL on the line.
DMG_URL=$(echo "$RELEASE_JSON" | grep -o '"browser_download_url":"[^"]*"' | grep '\.dmg"' | grep -i "$ARCH" | head -1 | sed 's/"browser_download_url":"\([^"]*\)"/\1/')

if [ -z "$DMG_URL" ]; then
    DMG_URL=$(echo "$RELEASE_JSON" | grep -o '"browser_download_url":"[^"]*"' | grep '\.dmg"' | head -1 | sed 's/"browser_download_url":"\([^"]*\)"/\1/')
fi

if [ -z "$DMG_URL" ]; then
    error "No macOS DMG found in release $VERSION. Check https://github.com/${REPO}/releases"
fi

DMG_NAME=$(basename "$DMG_URL")
info "Downloading $DMG_NAME..."

# ---- Download ---------------------------------------------------------------
TEMP_DIR=$(mktemp -d)
trap 'rm -rf "$TEMP_DIR"' EXIT

curl -fSL --progress-bar -o "$TEMP_DIR/$DMG_NAME" "$DMG_URL" \
    || error "Download failed"

ok "Download complete"

# ---- Mount and install ------------------------------------------------------
info "Mounting disk image..."
# hdiutil outputs tab-separated columns; the mount path is the last field on
# the line(s) that contain /Volumes/.  Using awk -F'\t' correctly handles
# volume names that contain spaces (e.g. "Delta Dashboard").  The previous
# awk '{print $NF}' split on whitespace and silently returned only the last
# word, making the subsequent find/copy steps operate on a non-existent path.
MOUNT_OUTPUT=$(hdiutil attach "$TEMP_DIR/$DMG_NAME" -nobrowse 2>&1) \
    || error "Failed to mount DMG. Try opening $TEMP_DIR/$DMG_NAME manually."

MOUNT_DIR=$(echo "$MOUNT_OUTPUT" | grep '/Volumes/' | awk -F'\t' '{print $NF}' | tail -1 | sed 's/[[:space:]]*$//')

if [ -z "$MOUNT_DIR" ] || [ ! -d "$MOUNT_DIR" ]; then
    error "Failed to determine DMG mount point. Try opening $TEMP_DIR/$DMG_NAME manually."
fi

APP_PATH=$(find "$MOUNT_DIR" -maxdepth 1 -name "*.app" | head -1)
if [ -z "$APP_PATH" ]; then
    hdiutil detach "$MOUNT_DIR" -quiet 2>/dev/null || true
    error "No .app bundle found in DMG"
fi

APP_BASENAME=$(basename "$APP_PATH")
DEST="/Applications/$APP_BASENAME"

info "Installing to /Applications..."
if [ -d "$DEST" ]; then
    warn "Removing previous installation..."
    rm -rf "$DEST"
fi

cp -R "$APP_PATH" /Applications/ \
    || error "Failed to copy to /Applications. Try running with sudo."

ok "Installed to $DEST"

# ---- Cleanup ----------------------------------------------------------------
info "Cleaning up..."
hdiutil detach "$MOUNT_DIR" -quiet 2>/dev/null || true

echo ""
printf "${GREEN}${BOLD}========================================${NC}\n"
printf "${GREEN}${BOLD}  Installation complete!${NC}\n"
printf "${GREEN}${BOLD}========================================${NC}\n"
echo ""
info "Launch ${BOLD}${APP_NAME}${NC} from your Applications folder or Spotlight."
info "Future updates will be applied automatically via the app."
echo ""

# ---- Optionally launch ------------------------------------------------------
if [ "${DELTA_LAUNCH:-}" = "1" ] || [ "${1:-}" = "--launch" ]; then
    info "Launching $APP_NAME..."
    open "$DEST"
fi
