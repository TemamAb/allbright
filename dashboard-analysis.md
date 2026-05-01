I'll extract your zip and audit the contents.

I'll extract your zip and audit the contents.

9 tools used

I have enough. Here is the audit and prioritized fix plan.
DABOARD ANALYSIS REPORT 
PART I
Audit — BrightSky UI dashboard, deployment readiness on Render
🔴 Critical — will block deploy or leak secrets
Plaintext private key in browser state (src/pages/WalletPage.tsx, src/context/WalletContext.tsx). The UI accepts a raw EVM privateKey, stores it in React state and WalletContext, and the toast says "stored in secure enclave" — but nothing of the sort happens. For a flash-loan app this is the worst possible flaw.

Fix: never accept a private key in the frontend. Replace with WalletConnect / injected wallet (wagmi + viem) OR send the key once over TLS to a server that stores it in a KMS / hardware vault. Remove privateKey from WalletContext entirely.
.env shipped inside the zip with VITE_API_URL=http://localhost:3000. Any VITE_* value is baked into the static bundle.

Fix: delete .env from the repo, keep .dockerignore excluding it (already does), and set VITE_API_URL / VITE_API_BASE_URL in Render → Environment at build time. Pick one name (VITE_API_BASE_URL is what App.tsx reads — VITE_API_URL is dead).
Workspace dependency @workspace/api-client-react: workspace:* and tsconfig references: ../lib/api-client-react, extends: ../tsconfig.base.json. This project is a sub-package of a pnpm monorepo. Render gets only this folder → pnpm install will fail with "workspace protocol not allowed" and tsc will fail to find the base config.

Fix options: (a) deploy the whole monorepo and set Render's root dir to this package + add a pnpm-workspace.yaml; or (b) publish @workspace/api-client-react to a registry / vendor it into src/lib/api-client/; or (c) inline the few hooks (useGetEngineStatus, useGetTradeStream, setBaseUrl) as plain fetch + react-query.
Vite alias points outside the project: "@assets" → "../../attached_assets". On Render this path doesn't exist; any import using it breaks the build.

Fix: move assets into src/assets/ and update the alias to path.resolve(__dirname, "src/assets").
tsconfig.json extends ../tsconfig.base.json (missing on Render) and uses "jsx": "preserve" — React + Vite needs "react-jsx". Also allowImportingTsExtensions: true without noEmit consumers can break.

Fix: make tsconfig.json self-contained: "jsx": "react-jsx", "strict": true, "target": "ES2022", "module": "ESNext", "moduleResolution": "bundler", "skipLibCheck": true. Drop the references block.
Dockerfile copies pnpm-lock.yaml that isn't in the package and uses RUN pnpm install (not frozen) — non-reproducible and will fail without the lockfile.

Fix:

FROM node:20-alpine AS build
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9 --activate
COPY pnpm-lock.yaml package.json ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build
FROM node:20-alpine
RUN npm i -g serve
COPY --from=build /app/dist /app/dist
ENV PORT=10000
CMD sh -c "serve -s /app/dist -l tcp://0.0.0.0:$PORT"
Or simpler on Render: deploy as a Static Site with Build Command pnpm build, Publish Dir dist, Rewrite /* → /index.html (200). No Docker needed.
nginx.conf uses ${PORT} literal without envsubst. As-is, nginx will fail to start.

Fix: either drop nginx and use serve (above), or run envsubst '${PORT}' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf at container start. Also add the SPA try_files (already there) ✓ but no gzip/cache-control.
🟠 High — runtime breakage
Routing mismatch: App.tsx uses wouter <Switch>, but Layout's navItems references /audit and /setup which have no <Route> registered. Sidebar.tsx (a second, unused sidebar) lists /auto-optimizer and /strategies while Layout doesn't. Electron main.js hard-codes loadURL('http://localhost:3000/setup') and a hash redirect to #/setup, but wouter is path-based, not hash-based, and the route doesn't exist → blank screen on launch.

Fix: pick one sidebar (delete Sidebar.tsx or Layout.tsx), create the missing pages (SetupPage, AuditPage), and use wouter's useHashLocation if you want #/setup to work for file:// (Electron production).
Two competing nav components (Sidebar.tsx + Layout.tsx) — leftover code; ensure only one is mounted to avoid double sidebars and dead links.

useMemo used as a side-effect in WalletContext.tsx (useMemo(() => { wallets.forEach(... fetchBalance ...) })). React may skip this on memo hits → no fetch, or run it during render → state update warning.

Fix: move to useEffect with proper deps.
SettingsPage.tsx calls /api/engine/start|stop with relative URL, but the API server runs on a different origin (VITE_API_BASE_URL, port 3001 in Electron). On Render this will hit the static site itself → 404.

Fix: route through the configured API_BASE_URL, and on Render add a rewrite or deploy the API as a separate service.
CORS / WebSocket: App.tsx opens a Socket.IO connection to API_BASE_URL with transports: ['websocket'] only. Render free static sites can't proxy WS; the API service must enable CORS for the static origin and accept WS upgrades. Document that the API is a separate Render Web Service.

tailwind.config.js exists but Vite uses @tailwindcss/vite (Tailwind v4 plugin). Mixing v3 config + v4 plugin yields silent style loss for custom tokens (grafana-bg, grafana-green, text-electric used in markup). Verify src/index.css has the v4 @theme block defining these tokens; otherwise Tailwind drops them.

Electron preload.js calls localStorage at preload time — localStorage is undefined in the preload context (isolated). That whole setupComplete line throws on launch.

Fix: only access localStorage inside the renderer, or via ipcRenderer.invoke('get-setup-state') backed by app.getPath('userData').
Electron auto-updater is invoked without a feedURL and uses default Squirrel — won't work on Windows NSIS builds. Use electron-updater (already a dep) and configure publish in electron-builder.json.

🟡 Medium — quality / SEO / DX
index.html title is generic ("BrightSky Elite Dashboard"), no <meta name="description">, no Open Graph, no canonical — fix for SEO/sharing. Add <meta name="theme-color">.
Google Fonts loaded via <link> blocks first paint; consider self-hosting via @fontsource/inter.
package.json lists everything in devDependencies (including react, electron). For a Docker build that runs pnpm install --prod, runtime deps must be in dependencies. Even for static build it's misleading.
eslint, prettier, tests, and a CI step are missing — no lint/test scripts; add pnpm lint and pnpm typecheck to CI.
vite.config.ts reads process.env.PORT at build time → fine, but build.outDir uses import.meta.dirname which requires Node ≥ 20.11. Pin Node version with engines.node or .nvmrc.
No manualChunks and no build.sourcemap policy — bundle is one big JS (index-FpFzaueP.js). Split vendor/recharts/framer-motion to drop TTI.
defaultTheme="dark" + forcedTheme="dark" on next-themes → the theme switcher in Layout.tsx is dead code.
Dev/CSP: Electron BrowserWindow has no CSP and loads remote http://localhost:3000 — packaged app should load file:// only, with a strict CSP meta tag.
KPI mock data hard-coded in Dashboard.tsx (profitData) — leftover scaffolding; either wire to telemetry or remove.
Implementation plan (in execution order)
Phase 0 — decide the deploy shape (15 min)

Pick one Render topology:
A: Static Site (frontend only) + separate Web Service for the API. Recommended.
B: Single Docker Web Service serving the built SPA via serve.
Decide what to do with @workspace/api-client-react (vendor / publish / monorepo deploy).
Phase 1 — make the project self-contained (½ day)

Remove .env from the repo; add .env.example.
Rewrite tsconfig.json to be standalone (jsx: react-jsx, drop extends/references).
Replace @workspace/api-client-react imports with a local src/lib/api/ module (typed fetch + react-query hooks).
Move attached_assets into src/assets; fix @assets alias.
Consolidate dependencies: move runtime deps out of devDependencies; pin versions (no catalog:).
Add engines.node ≥ 20.11 and .nvmrc.
Phase 2 — security hardening (½ day) 7. Remove the private-key textarea from WalletPage. Add wagmi + viem with WalletConnect / injected provider. 8. Purge privateKey from WalletContext. 9. Move every /api/* call through a single apiClient that prepends VITE_API_BASE_URL and includes auth headers. 10. Add a strict CSP meta tag in index.html and in the Electron BrowserWindow.webContents.session.webRequest.

Phase 3 — routing & UI cleanup (½ day) 11. Delete the unused Sidebar.tsx; keep Layout.tsx. 12. Create the missing routes (SetupPage, AuditPage, AutoOptimizerPage) or remove the nav entries. 13. Switch wouter to useHashLocation so the same build works under file:// (Electron) and https:// (Render). 14. Fix WalletContext useMemo → useEffect.

Phase 4 — Render deployment (1–2 h) 15. Static Site path: - Build Command: corepack enable && pnpm install --frozen-lockfile && pnpm build - Publish Dir: dist - Add Rewrite: /* → /index.html (200) - Env vars: VITE_API_BASE_URL 16. Docker path: replace Dockerfile with the multi-stage version above; drop nginx.conf (or fix envsubst). 17. Deploy the API as a second Render Web Service; set Access-Control-Allow-Origin to the static site URL; expose WS. 18. Add a Render healthCheckPath (/).

Phase 5 — polish (optional) 19. Add SEO meta + OG tags to index.html. 20. Self-host Inter via @fontsource-variable/inter. 21. Configure build.rollupOptions.output.manualChunks (vendor split). 22. Fix Electron auto-updater config in electron-builder.json (publish: { provider: "github", owner, repo }). 23. Add lint, format, test scripts; wire CI


PART II
urrent Theme Analysis
Your dashboard uses shadcn/ui's default slate palette via oklch tokens in src/styles.css:

Dark bg: oklch(0.129 0.042 264.695) — a cool blue-black, similar to Grafana but slightly lighter
Borders: oklch(1 0 0 / 10%) — subtle white at 10% (good, matches Grafana)
Primary (dark mode): near-white — too bright for accents; Grafana uses orange/blue accents
No status colors (success/warning/info) — critical for metrics dashboards
No monospace font token — required for numeric metric values
Charts: generic rainbow palette, not tuned for dark monitoring UIs
Recommended Grafana-Style Setup
1. Theme tokens (Grafana-accurate dark palette)
Add to :root in .dark block of src/styles.css:


.dark {
  --background: oklch(0.18 0.012 250);        /* #111217 - Grafana panel bg */
  --card: oklch(0.215 0.012 250);             /* #181b1f - panel surface */
  --popover: oklch(0.235 0.012 250);
  --border: oklch(1 0 0 / 8%);                /* hairline dividers */
  --muted: oklch(0.26 0.012 250);
  --muted-foreground: oklch(0.72 0.015 250);  /* #ccccdc secondary text */
  --foreground: oklch(0.96 0.005 250);        /* #d8d9da primary text */
  --primary: oklch(0.72 0.17 55);             /* #ff9830 Grafana orange accent */
  --primary-foreground: oklch(0.18 0.012 250);

  /* Status (add these — missing today) */
  --success: oklch(0.72 0.17 155);            /* #56a64b */
  --warning: oklch(0.78 0.16 75);             /* #f2cc0c */
  --info:    oklch(0.68 0.15 230);            /* #5794f2 */
  --destructive: oklch(0.62 0.22 25);         /* #e02f44 */

  /* Charts — Grafana classic palette */
  --chart-1: oklch(0.68 0.15 230);  /* blue */
  --chart-2: oklch(0.72 0.17 155);  /* green */
  --chart-3: oklch(0.78 0.16 75);   /* yellow */
  --chart-4: oklch(0.72 0.17 55);   /* orange */
  --chart-5: oklch(0.62 0.22 25);   /* red */
}
Register --color-success, --color-warning, --color-info inside @theme inline so you get bg-success, text-warning, etc.

2. Typography
Grafana uses Inter for UI and Roboto Mono / JetBrains Mono for numeric values. Add:


@theme inline {
  --font-sans: "Inter", system-ui, sans-serif;
  --font-mono: "JetBrains Mono", "Roboto Mono", ui-monospace, monospace;
}
Then use font-mono tabular-nums on every metric value cell — this stops digits from jiggling as values update.

3. Professional Metrics Data Table
Build on top of your existing src/components/ui/table.tsx (it's already solid). The Grafana pattern is:

Dense rows (~32px height, not the default 40px)
Right-aligned numeric columns with font-mono tabular-nums
Colored status pill in first column (dot + label)
Sparkline column (10–20 datapoints, 60×24px) using Recharts <Line> without axes
Delta column with arrow + colored % (text-success / text-destructive)
Sortable headers with chevron icon, sticky header on scroll
Zebra striping off (Grafana doesn't use it — just border-b dividers)
Hover row: bg-muted/40
Suggested column layout for a flash-loan dashboard:

Status	Pair / Pool	TVL	24h Volume	Spread	Est. Profit	Gas	Sparkline	Action
Use @tanstack/react-table for sorting/filtering/virtualization (essential past ~100 rows) — it pairs natively with shadcn's table primitives.

4. Panel/Card pattern
Wrap each metric block in a Grafana-style panel:

bg-card border border-border rounded-md
Header: 36px, text-xs uppercase tracking-wide text-muted-foreground
Optional time-range chip top-right
No card shadows in dark mode (Grafana is flat)
5. KPI tiles (stat panels)
Big-number tiles above the table:

Huge value: text-4xl font-mono font-semibold tabular-nums
Label above: text-xs uppercase text-muted-foreground
Delta below: colored arrow + %
Optional background sparkline at 20% opacity