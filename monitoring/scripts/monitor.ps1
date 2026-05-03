# allbright Profit Monitor (Simple)

Write-Host "allbright Profit Monitor" -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop`n" -ForegroundColor Yellow

while ($true) {
    $time = Get-Date -Format "HH:mm:ss"
    
    # Check API Health
    try {
        $health = Invoke-RestMethod -Uri "http://localhost:3000/api/health" -TimeoutSec 2
        $apiStatus = "OK"
    } catch {
        $apiStatus = "Down"
    }
    
    # Check Rust Health
    try {
        $rustHealth = Invoke-RestMethod -Uri "http://localhost:4001/health" -TimeoutSec 2
        $rustStatus = "OK"
    } catch {
        $rustStatus = "Down"
    }
    
    # Get Stats
    try {
        $stats = Invoke-RestMethod -Uri "http://localhost:3000/api/stats" -TimeoutSec 2
        $profit = $stats.total_profit
        $trades = $stats.trades_count
        $rate = $stats.success_rate
        $statsLine = "Profit: $profit ETH | Trades: $trades | Success: $rate%"
    } catch {
        $statsLine = "Stats not available yet"
    }
    
    # Clear and display
    Clear-Host
    Write-Host "═════════════════════════════════" -ForegroundColor Cyan
    Write-Host "  allbright Monitor - $time" -ForegroundColor Cyan
    Write-Host "═════════════════════════════════" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "API Server (3000): $apiStatus"
    Write-Host "Rust Solver (4001): $rustStatus"
    Write-Host ""
    Write-Host $statsLine -ForegroundColor Green
    Write-Host ""
    Write-Host "Checking again in 30s... (Ctrl+C to stop)"
    
    Start-Sleep -Seconds 30
}
