# Start allbright Services Persistently
$root = $PWD.Path
Write-Host "Starting allbright Services in $root..." -ForegroundColor Cyan

# Solver
Write-Host "Starting Rust Solver..." -ForegroundColor Yellow
$solverExe = Join-Path $root "target\release\allbright.exe"
if (Test-Path $solverExe) {
    # Set env vars for the current process so they are inherited by the child
    $env:INTERNAL_BRIDGE_PORT = "4001"
    $env:RUST_LOG = "info"
    Start-Process -FilePath $solverExe -WorkingDirectory (Join-Path $root "solver") -WindowStyle Hidden
} else {
    Write-Host "Error: Solver exe not found at $solverExe" -ForegroundColor Red
}

# API
Write-Host "Starting API Server..." -ForegroundColor Yellow
Start-Process -FilePath "cmd.exe" -ArgumentList "/c pnpm run start" -WorkingDirectory (Join-Path $root "api") -WindowStyle Hidden

# UI
Write-Host "Starting UI Dashboard..." -ForegroundColor Yellow
Start-Process -FilePath "cmd.exe" -ArgumentList "/c pnpm run dev -- --port 5173" -WorkingDirectory (Join-Path $root "ui") -WindowStyle Hidden

Write-Host "Services started persistently in the background." -ForegroundColor Green
Write-Host "Solver: 4001, API: 3000, UI: 5173"
