# Allbright Icon Generation Script

Write-Host "Allbright Icon Generation Helper" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan

$svgPath = "C:\Users\op\Desktop\allbright\ui\src\assets\allbright_logo.svg"
$iconsDir = "C:\Users\op\Desktop\allbright\src-tauri\icons"

if (-not (Test-Path $svgPath)) {
    Write-Host "ERROR: SVG logo not found at $svgPath" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $iconsDir)) {
    New-Item -ItemType Directory -Path $iconsDir | Out-Null
    Write-Host "Created icons directory: $iconsDir"
}

Write-Host "Checking for ImageMagick..." -ForegroundColor Yellow
$magick = Get-Command magick -ErrorAction SilentlyContinue
$convert = Get-Command convert -ErrorAction SilentlyContinue

if ($magick) {
    $tool = "magick"
    Write-Host "Using ImageMagick" -ForegroundColor Green
} elseif ($convert) {
    $tool = "convert"
    Write-Host "Using ImageMagick convert" -ForegroundColor Green
} else {
    Write-Host "ImageMagick not found." -ForegroundColor Yellow
    Write-Host "Please install ImageMagick for SVG to icon conversion" -ForegroundColor Yellow
    Write-Host "Visit: https://imagemagick.org/script/download.php" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Creating placeholder icons from existing resources..." -ForegroundColor Yellow
    
    # Copy existing icons as placeholders
    Copy-Item "$iconsDir\32x32.png" "$iconsDir\allbright_32x32.png" -Force
    Copy-Item "$iconsDir\128x128.png" "$iconsDir\allbright_128x128.png" -Force
    Copy-Item "$iconsDir\icon.ico" "$iconsDir\allbright_icon.ico" -Force
    
    Write-Host "Placeholder icons created." -ForegroundColor DarkGray
    exit 0
}

# Generate icons with ImageMagick
Write-Host "Generating icons from SVG..." -ForegroundColor Green

& $tool $svgPath -resize 32x32 "$iconsDir\allbright_32x32.png"
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ 32x32 icon created" -ForegroundColor Green
} else {
    Write-Host "Failed to create 32x32 icon" -ForegroundColor Red
}

& $tool $svgPath -resize 128x128 "$iconsDir\allbright_128x128.png"
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ 128x128 icon created" -ForegroundColor Green
} else {
    Write-Host "Failed to create 128x128 icon" -ForegroundColor Red
}

& $tool $svgPath -define icon:auto-resize=256,128,64,48,32,16 "$iconsDir\allbright_icon.ico"
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Multi-size ICO icon created" -ForegroundColor Green
} else {
    Write-Host "Failed to create ICO icon" -ForegroundColor Red
}

Write-Host ""
Write-Host "Icon generation completed!" -ForegroundColor Green
Write-Host "Location: $iconsDir" -ForegroundColor Green