@echo off
setlocal EnableDelayedExpansion

:: ============================================================
::  Allbright Desktop  -  Build Script
::  Builds the Tauri desktop app (Windows installer / NSIS)
:: ============================================================

echo.
echo ===================================================
echo   Allbright Desktop App - Build System
echo ===================================================
echo.

:: -------------------------------------------------------
:: 1. Check Node.js
:: -------------------------------------------------------
echo [1/5] Checking Node.js...
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo  [ERROR] Node.js is NOT installed or not in PATH.
    echo  Download it from: https://nodejs.org/en/download
    echo.
    pause
    exit /b 1
)
for /f "tokens=*" %%v in ('node --version') do set NODE_VER=%%v
echo        Node.js found: %NODE_VER%

:: -------------------------------------------------------
:: 2. Check pnpm
:: -------------------------------------------------------
echo [2/5] Checking pnpm...
where pnpm >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo  [ERROR] pnpm is NOT installed.
    echo  Install it with:  npm install -g pnpm
    echo.
    pause
    exit /b 1
)
for /f "tokens=*" %%v in ('pnpm --version') do set PNPM_VER=%%v
echo        pnpm found: %PNPM_VER%

:: -------------------------------------------------------
:: 3. Check Rust / cargo
:: -------------------------------------------------------
echo [3/5] Checking Rust toolchain...
where cargo >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo  [ERROR] Rust / cargo is NOT installed or not in PATH.
    echo  Install Rust from: https://rustup.rs/
    echo  After installing, restart this terminal and try again.
    echo.
    pause
    exit /b 1
)
for /f "tokens=*" %%v in ('cargo --version') do set CARGO_VER=%%v
echo        Cargo found: %CARGO_VER%

:: -------------------------------------------------------
:: 3.5 Check WebView2 (Required for Windows)
:: -------------------------------------------------------
echo [3.5/5] Checking WebView2 Runtime...
reg query "HKLM\SOFTWARE\Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}" /v pv >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo  [WARNING] WebView2 Runtime not detected in registry.
    echo  While not required to *build* the MSI, it is required to *run* the app.
    echo  Download it from: https://developer.microsoft.com/en-us/microsoft-edge/webview2/
    echo.
) else (
    for /f "tokens=2*" %%a in ('reg query "HKLM\SOFTWARE\Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}" /v pv') do echo        WebView2 found: %%b
)

:: -------------------------------------------------------
:: 3.6 Verify Tauri Build Configuration
:: -------------------------------------------------------
echo [3.6/5] Verifying webviewInstallMode in tauri.conf.json...
set CONF_PATH=%~dp0tauri\src-tauri\tauri.conf.json
if exist "%CONF_PATH%" (
    findstr /C:"\"type\": \"downloadBootstrapper\"" "%CONF_PATH%" >nul 2>&1
    if %ERRORLEVEL% NEQ 0 (
        echo.
        echo  [WARNING] "downloadBootstrapper" not found in tauri.conf.json.
        echo  If your build hangs or MSI fails to launch, ensure you've applied Phase 2:
        echo  "webviewInstallMode": { "type": "downloadBootstrapper" }
        echo.
    ) else (
        echo        Configuration verified: using downloadBootstrapper mode.
    )
)

:: -------------------------------------------------------
:: 4. Install / refresh JS dependencies
:: -------------------------------------------------------
echo [4/5] Installing Node.js dependencies (pnpm install)...
echo.
pushd "%~dp0tauri"
call pnpm install
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo  [ERROR] pnpm install failed. Check the output above for details.
    echo  Common causes:
    echo    - Network issues
    echo    - Mismatched pnpm / Node versions
    echo    - Corrupted node_modules (try: pnpm store prune)
    echo.
    popd
    pause
    exit /b 1
)
echo.
echo        Dependencies installed successfully.

:: -------------------------------------------------------
:: 5. Build the Tauri app
:: -------------------------------------------------------
echo [5/5] Building Tauri desktop app (pnpm tauri build)...
echo        This compiles the Rust backend + React frontend.
echo        First-time builds can take 10-20 minutes.
echo.
call pnpm tauri build
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo  =========================================================
    echo   [BUILD FAILED]
    echo  =========================================================
    echo.
    echo  Troubleshooting tips:
    echo.
    echo  1. Missing Rust target:
    echo       rustup target add x86_64-pc-windows-msvc
    echo.
    echo  2. Missing WebView2 (required on Windows):
    echo       Download from: https://developer.microsoft.com/en-us/microsoft-edge/webview2/
    echo.
    echo  3. Missing Visual C++ Build Tools:
    echo       Install from: https://visualstudio.microsoft.com/visual-cpp-build-tools/
    echo       Select "Desktop development with C++"
    echo.
    echo  4. Stale Rust build cache:
    echo       cd tauri\src-tauri ^&^& cargo clean
    echo.
    echo  5. Check full log above for the specific Rust / cargo error.
    echo.
    popd
    pause
    exit /b 1
)

popd

echo.
echo  =========================================================
echo   BUILD SUCCESSFUL
echo  =========================================================
echo.
echo  Installer location:
echo    tauri\src-tauri\target\release\bundle\
echo.
echo  Look for:
echo    - nsis\Allbright-Desktop_0.2.5_x64-setup.exe
echo    - msi\Allbright-Desktop_0.2.5_x64_en-US.msi
echo.
pause
