# Check ports 3001-3010 for availability
$ports = 3001..3010
foreach ($p in $ports) {
    $connections = Get-NetTCPConnection -LocalPort $p -ErrorAction SilentlyContinue
    if ($connections.Count -eq 0) {
        Write-Host "Port $p is FREE"
    } else {
        Write-Host "Port $p is IN USE"
    }
}
