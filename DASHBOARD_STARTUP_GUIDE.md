# Allbright Dashboard Manual Startup Guide

## 🚀 Quick Start the Dashboard

### Option 1: Terminal/Command Prompt (Recommended)

1. **Open Terminal/PowerShell**
2. **Navigate to the ui folder:**
   ```
   cd C:\Users\op\Desktop\allbright\ui
   ```
3. **Start the development server:**
   ```
   npm run dev
   ```
4. **Wait for the message:**
   ```
   ✓ ready in XXXms
   ➜ Local: http://localhost:3000
   ```
5. **Open Firefox/Chrome to:** `http://localhost:3000`

### Option 2: VS Code Terminal

1. **Open VS Code**
2. **Open integrated terminal** (Ctrl+`)
3. **Navigate to ui folder:**
   ```
   cd ui
   ```
4. **Run:**
   ```
   npm run dev
   ```
5. **Access:** `http://localhost:3000`

## 🎯 What You'll See

- **Allbright Dashboard** with Ash.Black theme
- **LIVE_SIMULATION** mode indicator
- **Real-time KPI monitoring** (44 metrics)
- **Interactive features:**
  - Theme toggle (sun/moon)
  - Wallet connection (Zap icon)
  - Keyboard shortcuts (Ctrl+T, Ctrl+L, Escape)
  - Toast notifications
  - System logs viewer
  - Trade export to CSV

## 🔧 Troubleshooting

- **Port already in use:** Kill processes on port 3000 first
- **Build errors:** Run `npm install` first
- **Permission issues:** Run terminal as administrator

## ✅ Success Indicators

- Browser loads the dashboard
- Header shows "LIVE_SIMULATION" 
- Navigation menu works
- Real-time data updates every 5 seconds