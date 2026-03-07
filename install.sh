#!/usr/bin/env bash
# ============================================================================
#  F1 Dashboard — Auto-Install & Update Script
#
#  This script automatically fetches the latest version from GitHub and
#  runs it. Re-run at any time to update to the newest version.
#
#  Usage:
#    curl -fsSL https://raw.githubusercontent.com/Tri-Lumen/F1/main/install.sh | bash
#
#  Or clone & run:
#    git clone https://github.com/Tri-Lumen/F1.git && cd F1 && ./install.sh
# ============================================================================
set -e

REPO="Tri-Lumen/F1"
REPO_URL="https://github.com/${REPO}.git"
INSTALL_DIR="${F1_INSTALL_DIR:-$HOME/F1-Dashboard}"

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

# ---- Detect whether we're running from inside the repo ----------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}" 2>/dev/null)" && pwd 2>/dev/null || true)"
if [ -f "$SCRIPT_DIR/package.json" ] && grep -q '"name": "f1"' "$SCRIPT_DIR/package.json" 2>/dev/null; then
  INSTALL_DIR="$SCRIPT_DIR"
fi

echo ""
printf "${BOLD}========================================${NC}\n"
printf "${BOLD}  F1 Dashboard — Auto-Installer${NC}\n"
printf "${BOLD}========================================${NC}\n"
echo ""

# ---- Check prerequisites ----------------------------------------------------
info "Checking prerequisites..."

if ! command -v node &>/dev/null; then
  error "Node.js is not installed. Install it from https://nodejs.org (v18+ required)"
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
  error "Node.js v18+ required (found v$NODE_VERSION). Update from https://nodejs.org"
fi
ok "Node.js $(node -v) detected"

if ! command -v git &>/dev/null; then
  error "git is not installed. Install it from https://git-scm.com"
fi
ok "git detected"

# ---- Clone or update --------------------------------------------------------
if [ -d "$INSTALL_DIR/.git" ]; then
  info "Existing installation found at $INSTALL_DIR"
  info "Pulling latest changes..."
  cd "$INSTALL_DIR"

  # Stash any local changes to avoid conflicts
  if ! git diff --quiet 2>/dev/null; then
    warn "Local changes detected — stashing before update"
    git stash -q
  fi

  BEFORE=$(git rev-parse HEAD)
  git pull --ff-only origin main 2>/dev/null || git pull origin main
  AFTER=$(git rev-parse HEAD)

  if [ "$BEFORE" = "$AFTER" ]; then
    ok "Already up to date"
  else
    ok "Updated to $(git log --oneline -1)"
  fi
else
  info "Installing to $INSTALL_DIR ..."
  git clone "$REPO_URL" "$INSTALL_DIR"
  cd "$INSTALL_DIR"
  ok "Repository cloned"
fi

# ---- Install dependencies ---------------------------------------------------
info "Installing dependencies..."
npm ci --silent 2>/dev/null || npm install --silent
ok "Dependencies installed"

# ---- Build -------------------------------------------------------------------
info "Building the application..."
npm run build
ok "Build complete"

# ---- Done --------------------------------------------------------------------
echo ""
printf "${GREEN}${BOLD}========================================${NC}\n"
printf "${GREEN}${BOLD}  Installation complete!${NC}\n"
printf "${GREEN}${BOLD}========================================${NC}\n"
echo ""
info "To start the dashboard:"
echo ""
echo "    cd $INSTALL_DIR"
echo "    npm start"
echo ""
info "Then open ${BOLD}http://localhost:3000${NC} in your browser"
echo ""
info "To update later, simply re-run this script or:"
echo "    cd $INSTALL_DIR && git pull && npm ci && npm run build"
echo ""

# ---- Optionally start immediately -------------------------------------------
if [ "${F1_AUTOSTART:-}" = "1" ] || [ "${1:-}" = "--start" ]; then
  info "Starting F1 Dashboard..."
  npm start
fi
