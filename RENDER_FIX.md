# RENDER "NOT FOUND" ROOT CAUSE - FINAL ANALYSIS & FIX

## 🔴 FINAL ROOT CAUSE

Looking at the evidence:
- **Log shows**: `Listening on 0.0.0.0:3000` 
- This is the **Node.js API**, NOT nginx
- The dashboard domain is showing "Not Found" because it's pointing to the **wrong service**

## THE PROBLEM

In Render's architecture, when you deploy multiple web services:
1. Each service gets its own subdomain: `allbright-solver.onrender.com`, `allbright-api.onrender.com`, `allbright-dashboard.onrender.com`
2. BUT - if one service fails to build/start, Render may serve a fallback (or show "Not Found")
3. The log `Listening on 0.0.0.0:3000` is from the **API container**, not dashboard

**The dashboard container is likely:**
- NOT building correctly 
- OR failing health check
- OR the ui/Dockerfile has issues

## THE FIX

### Fix 1: Update render.yaml

Change the dashboard service configuration in render.yaml:

```yaml
  - type: web
    name: allbright-dashboard
    env: docker
    plan: starter
    rootDir: ui                          # CHANGED: Build from ui/ directory
    dockerfilePath: Dockerfile       # CHANGED: Dockerfile at ui/Dockerfile
    healthCheckPath: /
    healthCheckTimeout: 60         # Increased timeout
    envVars:
      - key: VITE_API_BASE_URL
        value: https://allbright-api.onrender.com
      - key: NODE_ENV
        value: production
      - key: BASE_PATH
        value: ""                  # Explicit: no base path
```

### Fix 2: Ensure ui/Dockerfile copies correctly

Update `ui/Dockerfile`:

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy only what's needed for UI build
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY ui/package.json ./ui/

RUN pnpm install --frozen-lockfile

COPY ui/ ./ui/
RUN pnpm --filter @allbright/ui build

FROM nginx:stable-alpine
COPY ui/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/ui/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Fix 3: Verify deployment manually

1. Go to Render Dashboard
2. Check the "allbright-dashboard" service 
3. Look at "Deploy logs" tab
4. If you see errors, share them

## ALTERNATIVE WORKAROUND

If the Docker build is failing, you can also try deploying as a **static site** (if Render supports it as a simpler alternative):

1. Build locally: `pnpm --filter @allbright/ui build`
2. Upload the `ui/dist` folder to Render as a static site
3. Configure nginx within Render's static hosting

This bypasses the Docker build complexity entirely.
