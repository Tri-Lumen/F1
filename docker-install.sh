#!/usr/bin/env bash
# ============================================================================
#  Delta Dashboard — Docker Install Script
#
#  Authenticates with GitHub Container Registry and starts the stack.
#
#  Usage:
#    curl -fsSL https://raw.githubusercontent.com/Tri-Lumen/F1/main/docker-install.sh | bash
#
#  Or clone & run:
#    git clone https://github.com/Tri-Lumen/F1.git && cd F1 && ./docker-install.sh
# ============================================================================
set -e

GHCR_IMAGE="ghcr.io/tri-lumen/f1:latest"
REPO="Tri-Lumen/F1"
REPO_URL="https://github.com/${REPO}.git"
INSTALL_DIR="${DELTA_INSTALL_DIR:-$HOME/Delta-Dashboard}"

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
printf "${BOLD}  Delta Dashboard — Docker Installer${NC}\n"
printf "${BOLD}========================================${NC}\n"
echo ""

# ---- Check prerequisites ----------------------------------------------------
info "Checking prerequisites..."

if ! command -v docker &>/dev/null; then
  error "Docker is not installed. Install it from https://docs.docker.com/get-docker/"
fi
ok "Docker $(docker --version | awk '{print $3}' | tr -d ',') detected"

# Detect docker compose (v2 plugin or legacy v1)
if docker compose version &>/dev/null 2>&1; then
  COMPOSE="docker compose"
elif command -v docker-compose &>/dev/null; then
  COMPOSE="docker-compose"
else
  error "Docker Compose is not installed. Install it from https://docs.docker.com/compose/install/"
fi
ok "Docker Compose detected ($COMPOSE)"

# ---- Ensure we have a docker-compose.yml ------------------------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}" 2>/dev/null)" && pwd 2>/dev/null || true)"

if [ -f "$SCRIPT_DIR/docker-compose.yml" ]; then
  COMPOSE_DIR="$SCRIPT_DIR"
elif [ -f "$INSTALL_DIR/docker-compose.yml" ]; then
  COMPOSE_DIR="$INSTALL_DIR"
else
  info "No docker-compose.yml found locally — cloning repository..."
  if [ -d "$INSTALL_DIR/.git" ]; then
    cd "$INSTALL_DIR"
    git pull --ff-only origin main 2>/dev/null || git pull origin main
  else
    git clone "$REPO_URL" "$INSTALL_DIR"
  fi
  COMPOSE_DIR="$INSTALL_DIR"
fi

cd "$COMPOSE_DIR"

# ---- Authenticate with GitHub Container Registry ----------------------------
ghcr_login() {
  local user="$1"
  local token="$2"
  echo "$token" | docker login ghcr.io -u "$user" --password-stdin
}

check_ghcr_auth() {
  # Try a lightweight manifest check without pulling
  docker manifest inspect "$GHCR_IMAGE" &>/dev/null 2>&1
}

info "Checking GitHub Container Registry authentication..."

if check_ghcr_auth; then
  ok "Already authenticated with ghcr.io"
else
  warn "Not authenticated with ghcr.io (or image is private)."
  echo ""
  printf "  You need a GitHub Personal Access Token (PAT) with ${BOLD}read:packages${NC} scope.\n"
  printf "  Create one at: ${CYAN}https://github.com/settings/tokens${NC}\n"
  echo ""

  # Allow non-interactive mode via environment variables
  if [ -n "${GHCR_USER:-}" ] && [ -n "${GHCR_TOKEN:-}" ]; then
    info "Using GHCR_USER / GHCR_TOKEN environment variables..."
    if ghcr_login "$GHCR_USER" "$GHCR_TOKEN"; then
      ok "Authenticated with ghcr.io as $GHCR_USER"
    else
      error "Login failed. Check your GHCR_USER and GHCR_TOKEN values."
    fi
  else
    # Interactive login
    printf "  GitHub username: "
    read -r GH_USER
    printf "  GitHub PAT (read:packages): "
    read -rs GH_TOKEN
    echo ""

    if [ -z "$GH_USER" ] || [ -z "$GH_TOKEN" ]; then
      error "Username and token are required."
    fi

    if ghcr_login "$GH_USER" "$GH_TOKEN"; then
      ok "Authenticated with ghcr.io as $GH_USER"
    else
      error "Login failed. Verify your username and token, then try again."
    fi
  fi
fi

# ---- Pull the latest image --------------------------------------------------
info "Pulling latest Delta Dashboard image..."
$COMPOSE pull
ok "Image pulled"

# ---- Start the stack --------------------------------------------------------
info "Starting Delta Dashboard stack..."
$COMPOSE up -d
ok "Stack started"

# ---- Done -------------------------------------------------------------------
echo ""
printf "${GREEN}${BOLD}========================================${NC}\n"
printf "${GREEN}${BOLD}  Delta Dashboard is running!${NC}\n"
printf "${GREEN}${BOLD}========================================${NC}\n"
echo ""
info "Dashboard: ${BOLD}http://localhost:3000${NC}"
echo ""
info "To view logs:    $COMPOSE logs -f delta-dashboard"
info "To stop:         $COMPOSE down"
info "To update:       $COMPOSE pull && $COMPOSE up -d"
echo ""
