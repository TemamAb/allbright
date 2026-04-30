# BrightSky Render Deployment Readiness TODO

## Approved Plan Steps (Live Sim Mode)

### 1. Install dependencies ✅ (npm --ignore-scripts bypass)
`pnpm install`

### 2. Run master readiness check [PENDING]
`pnpm --filter @workspace/api-server run ready`

### 3. Analyze output and fix blocks [PENDING]
- Env vars (DATABASE_URL, API_KEYS, etc.)
- Code issues (e.g., controllers/main.rs)
- Update TODO_TRACKER.md

### 4. Approve gates [PENDING]
`node api/approve_gates.mjs`

### 5. Test local stack [PENDING]
`docker-compose up -d`

### 6. Update reports and confirm Render.yaml [PENDING]

### 7. Get final approval before Render deploy [PENDING]

**Status: Running...**
