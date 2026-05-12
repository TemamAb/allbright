# Deployment Fix Plan - Render Cloud "Not Found" Issue

## Task Analysis
- **Issue**: Dashboard at https://allbright-dashboard.onrender.com/ shows "Not Found"
- **Root Cause**: SPA fallback not configured for nginx - `_redirects` is Vercel format only
- **Constraint**: MUST NOT alter Apex trading logic (solver/, api/src/services/)

## Information Gathered
1. **render.yaml**: Dashboard deployed as static site with `ui/dist` output
2. **ui/Dockerfile**: Uses nginx:stable-alpine serving from `/usr/share/nginx/html`
3. **_redirects file**: Format is for Vercel/Netlify (`/* /index.html 200`) - NOT nginx compatible
4. **App.tsx**: Uses wouter for client-side routing with NotFound fallback

## Fix Plan
1. **Create nginx.conf** with proper SPA rewrite rules (location / { try_files $uri $uri/ /index.html; })
2. **Update ui/Dockerfile** to copy and use nginx.conf
3. **Test locally** with docker-compose to verify fix

## Files to Edit
- ui/nginx.conf (CREATE) - nginx configuration with SPA fallback
- ui/Dockerfile (MODIFY) - Add nginx.conf copy and use

## Files NOT to Modify (Preserve Apex Logic)
- solver/ - All Rust trading logic
- api/src/services/ - All API services
- api/controllers/ - All controllers

## Follow-up Steps
1. Build the UI: `pnpm --filter @allbright/ui build`
2. Commit and push to trigger Render redeploy
3. Verify dashboard loads at https://allbright-dashboard.onrender.com/
