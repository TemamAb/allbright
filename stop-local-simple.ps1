# Stop all BrightSky local services (Simple version)

Write-Host "════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Stopping BrightSky Local Services" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Stop PowerShell Jobs
$jobs = Get-Job -Name "RustSolver", "ApiServer", "UI" -ErrorAction SilentlyContinue
if ($jobs) {
    Write-Host "Stopping background jobs..." -ForegroundColor Yellow
    $jobs | Stop-Job -PassThru | Remove-Job
    Write-Host "✓ Jobs stopped" -ForegroundColor Green
}

# Also kill any remaining processes
Get-Process -Name "brightsky" -ErrorAction SilentlyContinue | Stop-Process -Force
Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like "*api-server*" -or $_.CommandLine -like "*vite*" } | Stop-Process -Force

Write-Host ""
Write-Host "All services stopped." -ForegroundColor Green
