$url = 'http://localhost:3000/api/engine/status'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

while ($true) {
  try {
    $res = Invoke-RestMethod -Uri $url -Method Get -TimeoutSec 5
    $profit = [math]::Round($res.opportunitiesExecuted * 0.1, 6)  # Estimate profit based on trades
    $status = if ($res.shadowModeActive) { "[SHADOW]" } else { "[LIVE]" }
    $color = if ($res.shadowModeActive) { "Yellow" } else { "Green" }

    Clear-Host
    Write-Host "══════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "   BRIGHTSKY ELITE - ARCHITECT MONITOR (PORT 3000)" -ForegroundColor Cyan
    Write-Host "══════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host " Status:    $status" -ForegroundColor $color
    Write-Host " Profit:    $profit ETH (est)" -ForegroundColor Green
    Write-Host " Trades:    $($res.opportunitiesExecuted)"
    Write-Host " Opps:      $($res.opportunitiesDetected) (Detected)"
    Write-Host " Mode:      $($res.mode)"
    Write-Host " Live Cap:  $($res.liveCapable)"
    Write-Host " Scanner:   $(if ($res.scannerActive) { 'Active' } else { 'Inactive' })" -ForegroundColor (if ($res.scannerActive) {"Green"} else {"Red"})
    Write-Host " Circuit:   $(if ($res.circuitBreakerOpen) { 'OPEN' } else { 'CLOSED' })" -ForegroundColor (if ($res.circuitBreakerOpen) {"Red"} else {"Green"})
    Write-Host "══════════════════════════════════════════════════"
  } catch {
    Write-Host "Monitor error: Solver unreachable on $url. Retrying..." -ForegroundColor Red
  }
  Start-Sleep 2
}
