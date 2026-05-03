$env:RUST_LOG = 'info'
$env:PORT = '4003'
$env:INTERNAL_BRIDGE_PORT = '4003'
Set-Location -Path "$PSScriptRoot\solver"

if (!(Test-Path '.\target\release\allbright.exe')) {
    Write-Host "Error: Binary not found. Run 'cargo build --release' first." -ForegroundColor Red
    exit
}

Start-Process -FilePath '.\target\release\allbright.exe' `
    -ArgumentList "--release" `
    -RedirectStandardOutput "$PSScriptRoot\logs\rust-solver.log" `
    -RedirectStandardError "$PSScriptRoot\logs\rust-solver-error.log" `
    -WorkingDirectory "$PSScriptRoot\solver"

Write-Host 'Rust Solver started on port 4003. Monitoring logs/rust-solver.log...' -ForegroundColor Cyan
Start-Sleep 5
Invoke-RestMethod -Uri http://localhost:4003/health
