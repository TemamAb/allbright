param (
    [Parameter(Mandatory=$true)]
    [string]$BitmapPath,
    [Parameter(Mandatory=$true)]
    [int]$ExpectedWidth,
    [Parameter(Mandatory=$true)]
    [int]$ExpectedHeight
)

Add-Type -AssemblyName System.Drawing

if (-not (Test-Path $BitmapPath)) {
    Write-Error "Bitmap file not found at $BitmapPath"
    exit 1
}

try {
    $bitmap = New-Object System.Drawing.Bitmap($BitmapPath)
    # WiX requires 24-bit BMPs for the Installer UI. 32-bit with Alpha will cause fallback to default Ash theme.
    if ($bitmap.PixelFormat -ne "Format24bppRgb") {
        Write-Error "[FAILURE] Bitmap '$BitmapPath' is not a 24-bit BMP (Format24bppRgb). WiX will ignore this and use the default theme. Current format: $($bitmap.PixelFormat)"
        exit 1
    }

    if ($bitmap.Width -ne $ExpectedWidth -or $bitmap.Height -ne $ExpectedHeight) {
        Write-Error "[FAILURE] Bitmap '$BitmapPath' has incorrect dimensions: $($bitmap.Width)x$($bitmap.Height). Expected: ${ExpectedWidth}x${ExpectedHeight}."
        exit 1
    } else {
        Write-Host "[SUCCESS] Bitmap '$BitmapPath' dimensions verified: $($bitmap.Width)x$($bitmap.Height)."
    }
} catch {
    Write-Error "Failed to read bitmap dimensions for '$BitmapPath': $($_.Exception.Message)"
    exit 1
} finally {
    if ($bitmap) { $bitmap.Dispose() }
}