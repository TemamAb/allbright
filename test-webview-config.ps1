# Test webviewInstallMode configuration
$ErrorActionPreference = "Stop"
$confPath = "c:\Users\op\Desktop\allbright\tauri\src-tauri\tauri.conf.json"
Write-Host "Testing: $confPath"

try {
    $content = Get-Content -Raw -Path $confPath -Encoding UTF8
    $j = $content | ConvertFrom-Json
    
    # Check the full path bundle.windows.webviewInstallMode
    if ($j.bundle -and $j.bundle.windows -and $j.bundle.windows.webviewInstallMode) {
        $w = $j.bundle.windows.webviewInstallMode
        Write-Host "FOUND: webviewInstallMode exists"
        Write-Host "Type: $($w.type)"
        Write-Host "Silent: $($w.silent)"
        exit 0
    } else {
        Write-Host "ERROR: webviewInstallMode path not found in JSON"
        Write-Host "bundle exists: $($null -ne $j.bundle)"
        Write-Host "bundle.windows exists: $($null -ne $j.bundle.windows)"
        exit 1
    }
} catch {
    Write-Host "EXCEPTION: $($_.Exception.Message)"
    exit 1
}
