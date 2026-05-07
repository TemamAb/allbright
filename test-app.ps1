$exePath = "C:\Users\op\Desktop\allbright\tauri\src-tauri\target\release\allbright-desktop.exe"
$appName = "allbright-desktop"
$wait = 5
$start = Get-Date
$fail = $false
$errLog = "$env:TEMP\tauri_err_$PID.log"

$env:WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS = "--remote-debugging-port=9222"
$env:RUST_BACKTRACE = "1"

$proc = Start-Process $exePath -PassThru -RedirectStandardError $errLog
Start-Sleep 3

# Only match FATAL errors that cause app crash, not non-fatal init warnings
$errContent = Get-Content $errLog -Raw -EA SilentlyContinue
if ($errContent -and ($errContent -match "fatal|aborted|segmentation|SIGSEGV")) {
    Write-Host "[RUST ERROR]"
    Get-Content $errLog | Select -First 5
    $fail = $true
}

if ($proc.HasExited) {
    Write-Host "[CRASH] Exit code: $($proc.ExitCode)"
    $fail = $true
} else {
    Write-Host "[OK] App running with PID: $($proc.Id)"
    Start-Sleep $wait
    Stop-Process $proc.Id -Force -EA SilentlyContinue
}

Remove-Item $errLog -EA SilentlyContinue
exit [int]$fail
