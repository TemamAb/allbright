# 📦 Allbright Commercial Distribution Checklist

## 1. Installation Experience (Windows/macOS)
- [ ] **Branded Installer**: NSIS/MSI must use the High-Fidelity Pulse-Bolt icon.
- [ ] **WebView2 Bootstrapper**: Automated download included in installer.
- [ ] **License Agreement**: Professional EULA displayed during setup.

## 2. Panel & Operating Features
- [ ] **System Tray Integration**: App minimizes to tray with real-time status (Green/Red).
- [ ] **Single Instance Lock**: Prevents data corruption by blocking multiple app launches.
- [ ] **Auto-Start on Boot**: Configurable option for 24/7 arbitrage uptime.
- [ ] **Signed Binaries**: (Requirement for Windows SmartScreen bypass).

## 3. Running the App
The final execution file is generated at:
`tauri/src-tauri/target/release/bundle/msi/Allbright-Desktop_x64.msi`

### Operations Command:
```powershell
# To run the final production build immediately:
./tauri/src-tauri/target/release/allbright-desktop.exe
```

**Verified by:** Frontend Specialist Architect