@echo off
setlocal

echo ============================================
echo   CLEAN TAURI SETUP (WINDOWS + WSL SAFE)
echo ============================================
echo.

:: Check WSL
where wsl >nul 2>&1
if %errorlevel% neq 0 (
    echo Installing WSL...
    wsl --install -d Ubuntu
    echo.
    echo RESTART REQUIRED. Run again after reboot.
    pause
    exit /b 1
)

echo.
echo ============================================
echo STEP 1: Installing dependencies in WSL
echo ============================================

wsl bash -c "
set -e

echo '[1] System packages'
sudo apt update && sudo apt install -y \
curl build-essential pkg-config \
libwebkit2gtk-4.1-dev libssl-dev libgtk-3-dev \
libayatana-appindicator3-dev librsvg2-dev

echo '[2] Rust'
if ! command -v rustc >/dev/null; then
  curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
fi
source \$HOME/.cargo/env

echo '[3] Node.js'
if ! command -v node >/dev/null; then
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
  export NVM_DIR=\$HOME/.nvm
  [ -s \"\$NVM_DIR/nvm.sh\" ] && . \"\$NVM_DIR/nvm.sh\"
  nvm install --lts
fi

echo '=== DONE: ENV READY ==='
"

echo.
echo ============================================
echo STEP 2 (IMPORTANT)
echo ============================================
echo DO NOT build app here.
echo Now run manually:
echo.
echo cd C:\Users\op\Desktop\allbright
echo npm create tauri-app@latest my-tauri-app
echo cd my-tauri-app
echo npm install
echo npm run tauri dev
echo.

pause


