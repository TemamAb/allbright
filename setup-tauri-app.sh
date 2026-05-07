#!/usr/bin/env bash
set -e

echo "=== Installing system dependencies (Ubuntu/Debian) ==="
sudo apt update
sudo apt install -y \
  curl \
  build-essential \
  pkg-config \
  libwebkit2gtk-4.1-dev \
  libssl-dev \
  libgtk-3-dev \
  libayatana-appindicator3-dev \
  librsvg2-dev

echo "=== Installing Rust ==="
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
source "$HOME/.cargo/env"

echo "=== Installing Node.js (via NVM) ==="
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
export NVM_DIR="$HOME/.nvm"
source "$NVM_DIR/nvm.sh"
nvm install --lts
nvm use --lts

echo "=== Creating Tauri App ==="
npm create tauri-app@latest my-tauri-app -- --template vanilla

cd my-tauri-app

echo "=== Installing project dependencies ==="
npm install

echo "=== Running Tauri build ==="
npm run tauri build

echo "=== Done ==="
