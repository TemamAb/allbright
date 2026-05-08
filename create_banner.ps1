Add-Type -AssemblyName System.Drawing
$bitmap = New-Object System.Drawing.Bitmap(493,58, [System.Drawing.Imaging.PixelFormat]::Format24bppRgb)
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)
$graphics.Clear([System.Drawing.Color]::FromArgb(17,18,23))
$bitmap.Save('tauri\src-tauri\branding\msi-banner.bmp', [System.Drawing.Imaging.ImageFormat]::Bmp)