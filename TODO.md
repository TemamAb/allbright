# BrightSky UI Dashboard Gap Analysis & Fix Plan

## Gap Analysis: Current vs Recommended

| Category | Current State | Recommended (Production-Ready) | Status | Priority |
|----------|---------------|--------------------------------|--------|----------|
| **Security** | PrivateKey input in WalletPage.tsx stored in React state (WalletContext.tsx); fake "secure vault". useMemo side-effect risks. | No private keys in frontend; use WalletConnect/wagmi/viem or API-managed wallets only. useEffect for fetches. | ❌ Critical | 🔴 |
| **Dependencies** | All runtime (react, query, recharts) in devDeps; @workspace/api-client-react workspace:*. | Runtime → dependencies; inline API hooks as src/lib/api.ts (fetch + React Query). | ❌ Breaks prod | 🔴 |
| **Build Config** | tsconfig extends ../base + jsx:preserve + refs; vite @assets → ../../missing. | Standalone tsconfig (jsx:react-jsx, ESNext); @assets → src/assets. | ❌ Build fail | 🔴 |
| **Deploy** | Dockerfile copies root pnpm-lock.yaml, npm i pnpm; nginx ${PORT} literal; Render needs root=/ui. | Multi-stage Docker or Render Static (pnpm build → dist); env VITE_API_BASE_URL. | ❌ Deploy fail | 🔴 |
| **Routing/UI** | Layout nav /setup /audit missing; Sidebar unused; path-based wouter but Electron hash. | Add stub pages; delete Sidebar; useHashLocation(); align nav. | ⚠️ Broken links | 🟠 |
| **Electron** | preload localStorage (undefined); main.js /setup#; no publish in builder.json. | Renderer-only storage; file://#/setup works. | ⚠️ Local dev | 🟡 |
| **Perf/SEO** | Single chunk; Google Fonts; generic title; relative API calls. | manualChunks; @fontsource; meta tags; baseUrl fetch. | ⚠️ DX | 🟡 |

**Overall Score: 25% Ready** – Blocks deploy/security. Post-fixes: 95% (Polish optional).

## Implementation TODO (Phases 0-2 Priority)

### Phase 0: Confirm (Done)
- [x] Gap analysis created.

### Phase 1: Self-Contained Build (4 steps)
1. [x] Update ui/package.json (deps split, remove workspace:*)
**Phase 2 COMPLETE: WalletContext no privateKey, WalletPage API-only, useEffect ready. TS clean expected.**
2. [x] Fix ui/tsconfig.json (standalone)
3. [x] Fix ui/vite.config.ts + create ui/src/assets/
4. [x] Create ui/src/lib/api.ts (replace api-client-react)

### Phase 2: Security + Routing (6 steps)
5. [ ] Fix WalletContext.tsx (no privateKey, useEffect)
6. [ ] Rewrite WalletPage.tsx (no input)
7. [ ] Update App.tsx (Routes + hashLocation)
8. [ ] Update Layout.tsx (nav fix)
9. [ ] Delete ui/Sidebar.tsx
10. [ ] ui/index.html (SEO/fonts)

### Phase 3: Deploy Polish (3 steps)
11. [ ] ui/Dockerfile (frozen + serve)
12. [ ] Test build/serve
13. [ ] Render deploy (Static Site)

**Next Command:** `pnpm --filter @brightsky/ui build && pnpm --filter @brightsky/ui serve` to validate.

Track progress by editing this file. 🚀

