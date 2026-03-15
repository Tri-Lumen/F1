#!/usr/bin/env bash
# ============================================================================
#  F1 Dashboard — Linux Bootstrapper
#
#  Downloads and installs the latest F1 Dashboard release from GitHub.
#  Re-run at any time to update to the newest version.
#
#  Usage:
#    curl -fsSL https://raw.githubusercontent.com/Tri-Lumen/F1/main/installer/install-linux.sh | bash
# ============================================================================
set -e

REPO="Tri-Lumen/F1"
API_URL="https://api.github.com/repos/${REPO}/releases/latest"
INSTALL_DIR="${F1_INSTALL_DIR:-$HOME/.local/bin}"
DESKTOP_DIR="${XDG_DATA_HOME:-$HOME/.local/share}/applications"
ICON_DIR="${XDG_DATA_HOME:-$HOME/.local/share}/icons"
APP_NAME="F1 Dashboard"

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

echo ""
printf "${BOLD}========================================${NC}\n"
printf "${BOLD}  F1 Dashboard — Linux Installer${NC}\n"
printf "${BOLD}========================================${NC}\n"
echo ""

# ---- Check prerequisites ---------------------------------------------------
info "Checking prerequisites..."

if ! command -v curl &>/dev/null && ! command -v wget &>/dev/null; then
    error "curl or wget is required but neither was found"
fi

# FUSE is required for AppImage
if ! command -v fusermount &>/dev/null && [ ! -f /usr/lib/libfuse.so.2 ]; then
    warn "FUSE not detected. AppImage may not run without it."
    warn "Install with: sudo apt install libfuse2  (Debian/Ubuntu)"
    warn "              sudo dnf install fuse-libs  (Fedora)"
fi

# ---- Fetch latest release info ---------------------------------------------
info "Fetching latest release info..."

if command -v curl &>/dev/null; then
    RELEASE_JSON=$(curl -fsSL -H "User-Agent: F1-Dashboard-Installer" "$API_URL") \
        || error "Failed to reach GitHub API. Check your internet connection."
else
    RELEASE_JSON=$(wget -qO- --header="User-Agent: F1-Dashboard-Installer" "$API_URL") \
        || error "Failed to reach GitHub API. Check your internet connection."
fi

VERSION=$(echo "$RELEASE_JSON" | grep -o '"tag_name":"[^"]*"' | head -1 | sed 's/"tag_name":"\([^"]*\)"/\1/')
info "Latest version: $VERSION"

# ---- Find AppImage asset ---------------------------------------------------
# Note: grep -o is required because the GitHub API returns minified single-line
# JSON — a plain grep would match the entire blob and sed would extract the
# wrong (last) URL on the line.
APPIMAGE_URL=$(echo "$RELEASE_JSON" | grep -o '"browser_download_url":"[^"]*"' | grep -i '\.appimage"' | head -1 | sed 's/"browser_download_url":"\([^"]*\)"/\1/')

if [ -z "$APPIMAGE_URL" ]; then
    # Fall back to .deb if no AppImage
    DEB_URL=$(echo "$RELEASE_JSON" | grep -o '"browser_download_url":"[^"]*"' | grep '\.deb"' | head -1 | sed 's/"browser_download_url":"\([^"]*\)"/\1/')
    if [ -n "$DEB_URL" ]; then
        info "No AppImage found, downloading .deb package instead..."
        ASSET_URL="$DEB_URL"
        ASSET_TYPE="deb"
    else
        error "No Linux release (AppImage or .deb) found in $VERSION. Check https://github.com/${REPO}/releases"
    fi
else
    ASSET_URL="$APPIMAGE_URL"
    ASSET_TYPE="appimage"
fi

ASSET_NAME=$(basename "$ASSET_URL")
info "Downloading $ASSET_NAME..."

# ---- Download ---------------------------------------------------------------
TEMP_DIR=$(mktemp -d)
trap 'rm -rf "$TEMP_DIR"' EXIT

if command -v curl &>/dev/null; then
    curl -fSL --progress-bar -o "$TEMP_DIR/$ASSET_NAME" "$ASSET_URL" \
        || error "Download failed"
else
    wget --show-progress -qO "$TEMP_DIR/$ASSET_NAME" "$ASSET_URL" \
        || error "Download failed"
fi

ok "Download complete"

# ---- Install ----------------------------------------------------------------
if [ "$ASSET_TYPE" = "deb" ]; then
    info "Installing .deb package (requires sudo)..."
    if ! sudo dpkg -i "$TEMP_DIR/$ASSET_NAME"; then
        warn "dpkg reported errors — attempting to satisfy missing dependencies..."
        sudo apt-get install -f -y || error "Failed to resolve dependencies for .deb package"
        # Retry the install now that dependencies are in place
        sudo dpkg -i "$TEMP_DIR/$ASSET_NAME" \
            || error "Failed to install .deb package. Check the output above for details."
    fi
    ok "Package installed"
else
    # AppImage installation
    mkdir -p "$INSTALL_DIR"

    DEST="$INSTALL_DIR/F1-Dashboard.AppImage"

    # Remove previous version if present
    if [ -f "$DEST" ]; then
        warn "Replacing previous installation..."
        rm -f "$DEST"
    fi

    mv "$TEMP_DIR/$ASSET_NAME" "$DEST"
    chmod +x "$DEST"
    ok "Installed to $DEST"

    # ---- Create desktop entry -----------------------------------------------
    mkdir -p "$DESKTOP_DIR" "$ICON_DIR"

    # Try to extract the icon from the AppImage
    ICON_PATH="$ICON_DIR/f1-dashboard.png"
    if [ ! -f "$ICON_PATH" ]; then
        # Download icon from repo
        ICON_URL="https://raw.githubusercontent.com/${REPO}/main/build/icon.png"
        if command -v curl &>/dev/null; then
            curl -fsSL -o "$ICON_PATH" "$ICON_URL" 2>/dev/null || true
        else
            wget -qO "$ICON_PATH" "$ICON_URL" 2>/dev/null || true
        fi
    fi

    cat > "$DESKTOP_DIR/f1-dashboard.desktop" <<DESKTOP
[Desktop Entry]
Name=$APP_NAME
Exec=$DEST
Icon=$ICON_PATH
Type=Application
Categories=Network;Sports;
Comment=Live F1 Dashboard with standings, results, and timing
Terminal=false
DESKTOP

    # Update desktop database if available
    if command -v update-desktop-database &>/dev/null; then
        update-desktop-database "$DESKTOP_DIR" 2>/dev/null || true
    fi

    ok "Desktop entry created"
fi

echo ""
printf "${GREEN}${BOLD}========================================${NC}\n"
printf "${GREEN}${BOLD}  Installation complete!${NC}\n"
printf "${GREEN}${BOLD}========================================${NC}\n"
echo ""

if [ "$ASSET_TYPE" = "appimage" ]; then
    info "Run the app with: $DEST"
    info "Or find ${BOLD}$APP_NAME${NC} in your application launcher."
else
    info "Find ${BOLD}$APP_NAME${NC} in your application launcher."
fi
info "Future updates will be applied automatically via the app."
echo ""

# ---- Optionally launch ------------------------------------------------------
if [ "${F1_LAUNCH:-}" = "1" ] || [ "${1:-}" = "--launch" ]; then
    info "Launching $APP_NAME..."
    if [ "$ASSET_TYPE" = "deb" ]; then
        nohup f1-dashboard &>/dev/null & 2>/dev/null || warn "Could not launch — open $APP_NAME from your application launcher."
    else
        nohup "$DEST" &>/dev/null &
    fi
fi
