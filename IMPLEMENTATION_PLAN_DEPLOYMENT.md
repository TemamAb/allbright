# Allbright Docker Deployment Implementation Plan

**Last Updated:** 2026-05-04
**Mode:** LIVE_SIMULATION (v0.2.6)

---

## 1. Live Simulation Context

From `Live-simulation-mode.md`:
- **System Status:** LIVE_SIMULATION mode (v0.2.6)
- **GES Score:** 98.8% (Elite Grade)
- **All Master Gates:** ✅ APPROVED
- **Primary Interface:** Ash.Black Dashboard (ui/src/components/Dashboard.tsx)
- **Purpose:** Monitoring Base Chain for flash-loan opportunities

---

## 2. Docker Deployment to Local Ports

**Available Free Ports (Verified):** 3001-3010

### Local Port Mapping

| Service | Docker Image | Local Port | Target |
|---------|------------|------------|--------|
| PostgreSQL | postgres:16-alpine | 5432 | DB |
| API | api/Dockerfile | **3001** | http://localhost:3001 |
| Dashboard | ui/Dockerfile | **3002** | http://localhost:3002 |
| Solver | solver (Dockerfile) | **3003** | Bridge IPC |

### Local Deployment Files

- **docker-compose.local.yml** - Local deployment configuration
- **.dockerignore** - Updated to exclude Tauri (reduced build context)

---

## 3. Ash.Black React Dashboard

### Dashboard Details

- **Location:** `ui/src/components/Dashboard.tsx`
- **Container:** `ui/Dockerfile` 
- **Base Image:** node:20-alpine
- **Framework:** React + Vite
- **Build Command:** `pnpm --filter @allbright/ui build`
- **Output:** Static files in `ui/dist/`

### Key Components

- Dashboard.tsx - Main Ash.Black Dashboard
- Sidebar.tsx - Navigation
- Layout.tsx - Layout wrapper

---

## 4. Render Deployment

### Existing Configuration (render.yaml)

Three services already configured:

| Service | Type | RootDir | Config |
|---------|------|--------|--------|
| allbright-solver | web (docker) | solver | Rust binary |
| allbright-api | web (docker) | . | Node.js API |
| allbright-dashboard | web (static) | ui/dist | React static |

### Render URLs

- Dashboard: https://allbright-ez5o.onrender.com
- API: https://allbright-api.onrender.com

---

## 5. Implementation Steps

### Phase 1: Local Docker Deployment ✅ (In Progress)

- [x] Step 1: Update .dockerignore to exclude Tauri directories
- [ ] Step 2: Create/update docker-compose.local.yml
- [ ] Step 3: Build Docker containers
- [ ] Step 4: Start services locally
- [ ] Step 5: Test health endpoints

### Phase 2: Local Testing

- [ ] Test API: http://localhost:3001/api/health
- [ ] Test Dashboard: http://localhost:3002

### Phase 3: Render Deployment

- [ ] Push to git repository
- [ ] Trigger Render build
- [ ] Verify deployment

---

## 6. Dependencies

- Docker Desktop installed
- docker-compose available
- Ports 3001-3010 free

---

## 7. Environment Variables Required

### For Docker Compose

```
POSTGRES_DB=allbright
POSTGRES_USER=allbright  
POSTGRES_PASSWORD=allbright
NODE_ENV=development
VITE_API_BASE_URL=http://localhost:3001
```

---

## 8. Quick Commands

### Check Ports
```powershell
powershell -File check-ports.ps1
```

### Start Local
```powershell
docker-compose -f docker-compose.local.yml up -d
```

### View Logs
```powershell
docker-compose -f docker-compose.local.yml logs -f
```

### Stop
```powershell
docker-compose -f docker-compose.local.yml down
```

---

## 9. Success Criteria

1. All 4 services running locally
2. API health check returns 200
3. Dashboard accessible at http://localhost:3002
4. Successfully pushed to Render

---

## 10. Notes

- Tauri desktop app excluded from Docker deployment (not needed for cloud)
- Build context reduced by excluding tauri/, src-tauri/, system-bundler/
- Ports 3001-3010 confirmed FREE for local deployment
