# BrightSky Dashboard Fix Plan
## Status: [IN PROGRESS] 🚧

### 1. ✅ Fix PNPM Workspace & UI Build
   - ✅ Edit `pnpm-workspace.yaml`: Added @brightsky/ui  
   - ✅ Edit `ui/package.json`: name="@brightsky/ui"  
   - ✅ Update `render.yaml`: --filter @brightsky/ui

### 2. ✅ Theme & Styling
   - ✅ `ui/tailwind.config.js`: Glassmorphism + electric colors  
   - ✅ `ui/src/index.css`: Enhanced glass + electric theme

### 3. ✅ Layout & Router
   - ✅ `ui/src/App.tsx`: Full Router + pages (exists & working)  
   - ✅ Dashboard already at `ui/src/pages/Dashboard.tsx`  
   - ✅ `ui/src/main.tsx`: Providers OK  
   - ✅ Layout/Toaster/Tooltip: Dependencies present

### 4. ✅ Vite Config
   - ✅ `ui/vite.config.ts`: Correct base/outDir for Render

### 5. ✅ API: Auto-Start Engine + Mock Metrics
   - ✅ `api/src/routes/engine.ts`: Auto-start SHADOW + scanner interval  
   - ✅ `mockRustBridge.ts`: Live IPC simulation  
   - ✅ Scanner gate 0.015% → dashboard opps

### 6. [ ] Health Relax + Deploy
   - `api/src/routes/health.ts`: Shadow fallback
   - pnpm build && deploy Render
   - Test: Styled dashboard + metrics >0

**Grafana**: Custom Recharts (confirmed). Metrics live post-engine-start.

**Next Manual**: Set Render env vars for LIVE mode.

