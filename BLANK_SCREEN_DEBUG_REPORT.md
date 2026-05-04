# Blank White Screen Debug Report

**Production URL:** https://allbright-ez5o.onrender.com

## Root Cause Analysis

### Issues Identified

#### Issue 1: Missing Environment Variables (PRIMARY CAUSE)
- **Problem:** `VITE_API_BASE_URL` was NOT being injected at build time
- **Impact:** Frontend used fallback `http://localhost:3000` in production
- **Symptom:** API calls fail silently, causing render to appear stuck

#### Issue 2: Missing BASE_PATH Configuration
- **Problem:** Vite needs `base: "/"` for proper asset paths in production
- **Impact:** JavaScript/CSS paths could be incorrect after build
- **Symptom:** Assets fail to load, blank screen

#### Issue 3: Build Script Configuration (Already Fixed)
- **Problem:** Some configurations had `--base ./` which causes relative paths
- **Current Status:** Already fixed - build script is now `"vite build"`

### Code Flow Analysis

1. **Entry Point:** `ui/src/main.tsx` → renders `<App />`
2. **Routing:** `ui/src/App.tsx` → uses `wouter` for SPA routing
3. **Layout:** `ui/src/components/Layout.tsx` → calls `useGetEngineStatus()`
4. **API Call:** This triggers fetch to `VITE_API_BASE_URL` → `/api/engine/status`

### Why Blank Screen Occurs

1. User loads https://allbright-ez5o.onrender.com
2. `index.html` loads with script tags (verified working)
3. JavaScript tries to connect to API at `http://localhost:3000` (wrong!)
4. API calls fail → error boundary catches → blank screen
5. No error shown because error handling swallows the exception

## Fixes Applied

### 1. render.yaml - Environment Variables
```yaml
- type: web
  name: allbright-dashboard
  env: static
  rootDir: .
  buildCommand: pnpm install --frozen-lockfile && pnpm --filter ui build
  publishDirectory: ui/dist
  envVars:
    - key: VITE_API_BASE_URL
      value: https://allbright-api.onrender.com
    - key: NODE_ENV
      value: production
    - key: BASE_PATH
      value: /
```

### 2. ui/package.json - Build Script (Already Correct)
```json
"build": "vite build",
```

### 3. vite.config.ts - Base Path Logic (Already Correct)
```typescript
const basePath = process.env.BASE_PATH ?? "/";
export default defineConfig({
  base: basePath,
  // ...
});
```

## Verification Checklist

After redeploy, verify:

- [ ] Open https://allbright-ez5o.onrender.com in browser
- [ ] Open DevTools → Console tab
- [ ] No errors about "Failed to fetch" or connection refused
- [ ] Network tab shows successful API calls to allbright-api.onrender.com
- [ ] Dashboard components render (Mission Control, Telemetry, etc.)
- [ ] Socket connection established

## Additional Debugging Steps (If Still Failing)

1. **Check Network Tab:**
   - Look for failed requests to `http://localhost:3000` ( proves VITE_API_BASE_URL not set)

2. **Add Error Boundary:**
   - Wrap App with error boundary to see actual errors
   - ```tsx
     <ErrorBoundary fallback={<div>Error loading app</div>}>
       <App />
     </ErrorBoundary>
     ```

3. **Add Console Logs:**
   - In `ui/src/main.tsx`:
   - ```typescript
     console.log('API URL:', import.meta.env.VITE_API_BASE_URL);
     ```

## Deployment Action

1. Commit these changes to git
2. Push to main branch
3. Render will auto-deploy
4. Monitor deployment logs for success

---

**Report Generated:** 2024
**Status:** Fixes Applied
**Next Action:** Redeploy and verify
