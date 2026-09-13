#!/usr/bin/env bash
# ============================================================================
#  Delta Dashboard — Linux Bootstrapper
#
#  Downloads and installs the latest Delta Dashboard release from GitHub.
#  Re-run at any time to update to the newest version.
#
#  Usage:
#    curl -fsSL https://raw.githubusercontent.com/Tri-Lumen/F1/main/installer/install-linux.sh | bash
# ============================================================================
set -e

REPO="Tri-Lumen/F1"
API_URL="https://api.github.com/repos/${REPO}/releases/latest"
INSTALL_DIR="${DELTA_INSTALL_DIR:-$HOME/.local/bin}"
DESKTOP_DIR="${XDG_DATA_HOME:-$HOME/.local/share}/applications"
ICON_DIR="${XDG_DATA_HOME:-$HOME/.local/share}/icons"
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

# ---- Checksum verification helpers ------------------------------------------
# electron-builder publishes latest-linux.yml alongside every release,
# containing the base64-encoded SHA-512 of every Linux artifact. We verify
# the downloaded asset against it before installing anything.

# Compute the base64-encoded SHA-512 digest of a file (the same encoding
# electron-builder uses in latest*.yml — sha512sum/shasum report hex, so
# their output is converted rather than compared directly).
sha512_base64() {
    local file="$1"
    if command -v openssl &>/dev/null; then
        openssl dgst -sha512 -binary "$file" | openssl base64 -A
        return
    fi
    local hex=""
    if command -v sha512sum &>/dev/null; then
        hex=$(sha512sum "$file" | awk '{print $1}')
    elif command -v shasum &>/dev/null; then
        hex=$(shasum -a 512 "$file" | awk '{print $1}')
    else
        error "No SHA-512 tool found (openssl, sha512sum, or shasum required) — cannot verify download integrity."
    fi
    if command -v xxd &>/dev/null; then
        echo "$hex" | xxd -r -p | base64 | tr -d '\n'
    elif command -v python3 &>/dev/null; then
        python3 -c "import sys,binascii,base64;print(base64.b64encode(binascii.unhexlify(sys.argv[1].strip())).decode())" "$hex"
    else
        error "Cannot convert SHA-512 digest to base64 (need openssl, xxd, or python3) — cannot verify download integrity."
    fi
}

# Download the release's latest-linux.yml manifest and confirm asset_file's
# sha512 matches the entry for asset_name. Aborts the script on any mismatch
# or missing data — never install an unverified download.
verify_asset_checksum() {
    local asset_file="$1"
    local asset_name="$2"
    local manifest_name="latest-linux.yml"

    local manifest_url
    manifest_url=$(echo "$RELEASE_JSON" | grep -o '"browser_download_url":"[^"]*"' \
        | grep -i "/${manifest_name}\"" | head -1 \
        | sed 's/"browser_download_url":"\([^"]*\)"/\1/')

    if [ -z "$manifest_url" ]; then
        error "Release $VERSION has no $manifest_name manifest — cannot verify download integrity. Aborting."
    fi

    info "Verifying checksum against $manifest_name..."
    local manifest_file="$TEMP_DIR/$manifest_name"
    if command -v curl &>/dev/null; then
        curl -fsSL -o "$manifest_file" "$manifest_url" || error "Failed to download $manifest_name for checksum verification"
    else
        wget -qO "$manifest_file" "$manifest_url" || error "Failed to download $manifest_name for checksum verification"
    fi

    local expected_sha512
    expected_sha512=$(awk -v asset="$asset_name" '
        /^[[:space:]]*-?[[:space:]]*url:/ {
            u = $0
            sub(/^[[:space:]]*-?[[:space:]]*url:[[:space:]]*/, "", u)
            gsub(/^"|"$/, "", u)
            gsub(/^[ \t]+|[ \t]+$/, "", u)
        }
        /^[[:space:]]*sha512:/ {
            s = $0
            sub(/^[[:space:]]*sha512:[[:space:]]*/, "", s)
            gsub(/^"|"$/, "", s)
            gsub(/^[ \t]+|[ \t]+$/, "", s)
            if (u == asset) { print s; exit }
        }
    ' "$manifest_file")

    if [ -z "$expected_sha512" ]; then
        error "Could not find a sha512 entry for $asset_name in $manifest_name. Aborting — refusing to install an unverified download."
    fi

    local actual_sha512
    actual_sha512=$(sha512_base64 "$asset_file")

    if [ "$actual_sha512" != "$expected_sha512" ]; then
        error "Checksum verification FAILED for $asset_name.
        Expected: $expected_sha512
        Actual:   $actual_sha512
        The download may be corrupted or tampered with. Aborting."
    fi

    ok "Checksum verified ($asset_name matches $manifest_name)"
}

echo ""
printf "${BOLD}========================================${NC}\n"
printf "${BOLD}  Delta Dashboard — Linux Installer${NC}\n"
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
    RELEASE_JSON=$(curl -fsSL -H "User-Agent: Delta-Dashboard-Installer" "$API_URL") \
        || error "Failed to reach GitHub API. Check your internet connection."
else
    RELEASE_JSON=$(wget -qO- --header="User-Agent: Delta-Dashboard-Installer" "$API_URL") \
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

# ---- Verify checksum ---------------------------------------------------------
verify_asset_checksum "$TEMP_DIR/$ASSET_NAME" "$ASSET_NAME"

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

    DEST="$INSTALL_DIR/Delta-Dashboard.AppImage"

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
    ICON_PATH="$ICON_DIR/delta-dashboard.png"
    if [ ! -f "$ICON_PATH" ]; then
        # Download icon from repo
        ICON_URL="https://raw.githubusercontent.com/${REPO}/main/build/icon.png"
        if command -v curl &>/dev/null; then
            curl -fsSL -o "$ICON_PATH" "$ICON_URL" 2>/dev/null || true
        else
            wget -qO "$ICON_PATH" "$ICON_URL" 2>/dev/null || true
        fi
    fi

    cat > "$DESKTOP_DIR/delta-dashboard.desktop" <<DESKTOP
[Desktop Entry]
Name=$APP_NAME
Exec=$DEST
Icon=$ICON_PATH
Type=Application
Categories=Network;Sports;
Comment=Live Delta Dashboard with standings, results, and timing
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
if [ "${DELTA_LAUNCH:-}" = "1" ] || [ "${1:-}" = "--launch" ]; then
    info "Launching $APP_NAME..."
    if [ "$ASSET_TYPE" = "deb" ]; then
        nohup delta-dashboard &>/dev/null & 2>/dev/null || warn "Could not launch — open $APP_NAME from your application launcher."
    else
        nohup "$DEST" &>/dev/null &
    fi
fi
