# BrightSky Local Deployment - Simple Version

Write-Host "Starting BrightSky Local Deployment..." -ForegroundColor Cyan

# Load .env
$envContent = Get-Content ".env"
foreach ($line in $envContent) {
    if ($line -match '^([^#=]+)=(.*)$') {
        $key = $matches[1].Trim()
        $value = $matches[2].Trim()
        [System.Environment]::SetEnvironmentVariable($key, $value, 'Process')
        Write-Host "  Set: $key" -ForegroundColor Green
    }
}

# Build Rust
Write-Host "`nBuilding Rust solver..." -ForegroundColor Yellow
Set-Location solver
cargo build --release
if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed!" -ForegroundColor Red
    Set-Location ..
    exit 1
}
Write-Host "Rust solver built!" -ForegroundColor Green
Set-Location ..

# Create logs dir
New-Item -ItemType Directory -Force -Path logs | Out-Null

# Start Rust Solver
Write-Host "`nStarting Rust Solver on port 4001..." -ForegroundColor Yellow
$env:RUST_LOG = "info"
$env:INTERNAL_BRIDGE_PORT = "4001"
Start-Job -Name "RustSolver" -ScriptBlock {
    Set-Location $args[0]
    & ".\solver\target\release\brightsky.exe"
} -ArgumentList $PWD.Path

Start-Sleep -Seconds 3

# Start API Server
Write-Host "Starting API Server on port 3000..." -ForegroundColor Yellow
$env:PORT = "3000"
Start-Job -Name "ApiServer" -ScriptBlock {
    Set-Location $args[0]
    pnpm --filter @workspace/api-server run start
} -ArgumentList $PWD.Path

Start-Sleep -Seconds 3

# Start UI
Write-Host "Starting UI Dashboard on port 5173..." -ForegroundColor Yellow
Start-Job -Name "UI" -ScriptBlock {
    Set-Location $args[0]
    Set-Location ui
    pnpm run dev -- --port 5173
} -ArgumentList $PWD.Path

Write-Host "`nAll services started!" -ForegroundColor Green
Write-Host "`nService URLs:"
Write-Host "  Rust Solver: http://localhost:4001"
Write-Host "  API Server: http://localhost:3000"
Write-Host "  UI Dashboard: http://localhost:5173"
Write-Host "`nUse 'Get-Job' to check status"
Write-Host "Use '.\monitor.ps1' to monitor profit"
