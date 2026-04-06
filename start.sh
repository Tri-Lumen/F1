#!/usr/bin/env bash
set -e

echo "================================"
echo "  Delta Dashboard - 2026 Season"
echo "================================"
echo ""

# Check for Node.js
if ! command -v node &> /dev/null; then
  echo "Error: Node.js is not installed."
  echo "Install it from https://nodejs.org (v18+ required)"
  exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
  echo "Error: Node.js v18+ required (found v$NODE_VERSION)"
  exit 1
fi

# Auto-update from git if available
if [ -d ".git" ] && command -v git &> /dev/null; then
  echo "Checking for updates..."
  if git pull --ff-only origin main 2>/dev/null; then
    echo "Updated to latest version."
  else
    echo "Already up to date (or manual merge needed)."
  fi
  echo ""
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
  echo ""
fi

echo "Starting Delta Dashboard..."
echo "Open http://localhost:3000 in your browser"
echo ""

npm run dev
