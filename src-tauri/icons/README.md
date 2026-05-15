# Allbright Desktop Icons - Production Guide

This directory contains the application icons for the Allbright Tauri desktop application.

## IMPORTANT: Production Icon Requirements

The icons currently in this directory are **PLACEHOLDERS** copied from existing Tauri resources. 
For production use, you MUST replace them with proper conversions from the official Allbright SVG logo.

## Source Logo
The official Allbright logo SVG is located at:
`..\..\ui\src\assets\allbright_logo.svg`

## Required Icon Files
To build a production-ready application, you need to provide these three files:
1. `allbright_32x32.png` - 32x32 pixels (taskbar/title bar icon)
2. `allbright_128x128.png` - 128x128 pixels (installer/about dialogs)
3. `allbright_icon.ico` - Windows ICO file containing multiple sizes (16, 24, 32, 48, 64, 128, 256)

## Configuration Reference
The tauri.conf.json file is already configured to look for:
```json
"icon": [
  "icons/allbright_32x32.png",
  "icons/allbright_128x128.png",
  "icons/allbright_icon.ico"
]
```

## How to Generate Proper Icons

### Option 1: Using ImageMagick (Recommended)
1. Install ImageMagick from: https://imagemagick.org/script/download.php
2. Open a terminal/command prompt in this directory (`src-tauri/icons`)
3. Run these commands:
   ```powershell
   magick ..\..\ui\src\assets\allbright_logo.svg -resize 32x32 allbright_32x32.png
   magick ..\..\ui\src\assets\allbright_logo.svg -resize 128x128 allbright_128x128.png
   magick ..\..\ui\src\assets\allbright_logo.svg -define icon:auto-resize=256,128,64,48,32,16 allbright_icon.ico
   ```

### Option 2: Using Inkscape + ImageMagick
1. Install Inkscape from: https://inkscape.org/
2. Install ImageMagick
3. Run these commands:
   ```powershell
   # Export PNGs from Inkscape
   inkscape ..\..\ui\src\assets\allbright_logo.svg --export-type=png --export-filename=allbright_32x32.png --export-width=32 --export-height=32
   inkscape ..\..\ui\src\assets\allbright_logo.svg --export-type=png --export-filename=allbright_128x128.png --export-width=128 --export-height=128
   
   # Create ICO from PNGs using ImageMagick
   magick allbright_32x32.png allbright_128x128.png -define icon:auto-resize=256,128,64,48,32,16 allbright_icon.ico
   ```

### Option 3: Online Converters (Quick & Easy)
Use these free online services:
- ICO Convert: https://icoconvert.com/
- ConvertICO: https://convertico.com/
- Favicon Generator: https://www.favicon-generator.org/

Simply upload the SVG logo and download the generated ICO file, then extract or convert to the required PNG sizes.

## Verification
After generating your icons, verify:
1. The files are in the correct location: `src-tauri/icons/`
2. The files match the names expected in tauri.conf.json
3. The 32x32 and 128x128 icons are proper PNG files (not just renamed files)
4. The ICO file contains multiple resolutions when viewed with an icon editor

## Building the Application
Once you have replaced the placeholder icons with your generated icons:
1. Run `npm run build` in the ui directory
2. Run `cargo tauri build` or use the Tauri build scripts
3. The resulting installer and application will display your Allbright branding

## Troubleshooting
- If icons don't appear: Verify file names and paths exactly match tauri.conf.json
- If icons look corrupted: Verify you're using proper PNG/ICO format, not just renamed files
- If build fails: Check that all three icon files exist and are readable

---
**Remember**: Never ship the application with the placeholder icons. Always replace them with proper conversions from the official SVG logo for production use.