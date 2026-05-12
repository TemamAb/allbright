# Allbright Apex Mode - Render Deployment Monitoring Report

**Date:** 2026-05-13
**Role:** Successor Lead Architect  
**Status:** IN PROGRESS

---

## Current Issue: Dashboard "Not Found" on Render

### Deployment URLs Expected
| Service | URL |
|---------|-----|
| Dashboard | https://allbright-dashboard.onrender.com |
| API | https://allbright-api.onrender.com |
| Solver | https://allbright-solver.onrender.com |

### Issue Description
- Accessing `https://allbright-dashboard.onrender.com/` returns **404 Not Found**
- The UI build exists locally in `ui/dist/`
- Services appear to be deployed but returning errors

### Render.yaml Service Configuration
```yaml
# Dashboard Service
- type: web
  name: allbright-dashboard
  env: docker
  plan: starter
  rootDir: .
  dockerfilePath: ui/Dockerfile
  healthCheckPath: /
```

---

## Root Cause Analysis

### Confirmed Issue: Service Configuration Mismatch
Based on user feedback:
- Primary URL `https://allbright-i03f.onrender.com` redirects to dashboard → **Not Found**
- Dashboard service URL `https://allbright-dashboard.onrender.com` → **Not Found**

### Root Cause: render.yaml Service Name vs URL Mismatch
The render.yaml defines service name as `allbright-dashboard`, but Render URLs may differ from service names:
```yaml
- name: allbright-dashboard  # Service name in render.yaml
  # Expected URL: allbright-dashboard.onrender.com
```

### Potential Causes
1. **Service not deployed** - Dashboard service may not be deployed
2. **Build failure** - Docker build failing in Render
3. **Nginx config** - SPA fallback not configured properly
4. **Routing issue** - Custom domain vs auto-assigned subdomain mismatch

### Current nginx.conf (SPA Fallback)
```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

### UI Dockerfile
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@latest --activate

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY ui/package.json ./ui/
COPY lib/api-client-react/package.json ./lib/api-client-react/
COPY lib/db/package.json ./lib/db/

RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm --filter @allbright/ui build

FROM nginx:stable-alpine
COPY ui/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/ui/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

---

## Resolution Plan

### Step 1: Verify Local Build
- [x] UI dist folder exists: `c:/Users/op/Desktop/allbright/ui/dist`
- [x] Build output verified: index.html + assets/
- [x] nginx.conf has SPA fallback configured

### Step 2: Check Render Dashboard
Need to verify in Render dashboard:
1. Navigate to Render.com dashboard
2. Check `allbright-dashboard` service status
3. Check `allbright-api` service status  
4. Verify build completed successfully

### Step 3: Required Environment Variables
Ensure these are set in Render for dashboard service:
```
VITE_API_BASE_URL=https://allbright-api.onrender.com
NODE_ENV=production
```

### Step 4: Test Health Endpoint
After deployment, test:
- Dashboard: `curl https://allbright-dashboard.onrender.com/`
- API Health: `curl https://allbright-api.onrender.com/api/health`
- Solver Health: `curl https://allbright-solver.onrender.com/health`

---

## Apex Mode Monitoring Parameters

### Performance Benchmarks (from handoff.md)
| Metric | Target | Current |
|--------|--------|---------|
| NRP (ETH/day) | 100.5 | Locked |
| Reality Delta | 0.005% | Enforced |
| GES | >82.5% | Target |
| Security | BSS-63 | Active |

### System Components
1. **API Service** - allbright-api (Node.js)
2. **Solver Service** - allbright-solver (Rust)
3. **Dashboard** - allbright-dashboard (React/Vite)

---

## Next Actions

1. Check Render build logs for dashboard service
2. Verify Docker build completes in Render
3. Test nginx serving index.html
4. Monitor Apex mode performance after fix

---

**Status:** Awaiting build verification from Render dashboard
