@echo off
cd /d %%~dp0
pnpm run build-desktop
explorer dist-electron
