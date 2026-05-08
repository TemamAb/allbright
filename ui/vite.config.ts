import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { fileURLToPath } from "url";

// PORT and BASE_PATH are optional at build time (Render static builds don't inject PORT).
// They are only needed for the dev server / preview server.
const rawPort = process.env.PORT ?? "3000";
const port = Number(rawPort);
const basePath = process.env.BASE_PATH ?? "/";
const currentDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  base: basePath,
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(currentDir, "src"),
      "@assets": path.resolve(currentDir, "src/assets"),
      "@workspace/api-client-react": path.resolve(
        currentDir,
        "../lib/api-client-react/src/index.ts",
      ),
    },
    dedupe: ["react", "react-dom"],
  },
  root: currentDir,
  build: {
    outDir: "dist",
    emptyOutDir: true,
    sourcemap: false,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      input: path.resolve(currentDir, "allbright-dashboard.html"),
      external: [
        "@tauri-apps/api",
        "@tauri-apps/api/tauri",
        "@tauri-apps/api/event",
      ],
      output: {
        manualChunks: {
          vendor: ["react", "react-dom", "@tanstack/react-query"],
          charts: ["recharts"],
          motion: ["framer-motion"],
        },
      },
    },
  },
  server: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
  preview: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
  },
});
