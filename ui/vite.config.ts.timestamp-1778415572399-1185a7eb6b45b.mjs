// vite.config.ts
import { defineConfig } from "file:///C:/Users/op/Desktop/allbright/node_modules/.pnpm/vite@5.4.21_@types+node@22.19.18_lightningcss@1.32.0/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Users/op/Desktop/allbright/node_modules/.pnpm/@vitejs+plugin-react@4.7.0_vite@5.4.21_@types+node@22.19.18_lightningcss@1.32.0_/node_modules/@vitejs/plugin-react/dist/index.js";
import tailwindcss from "file:///C:/Users/op/Desktop/allbright/node_modules/.pnpm/@tailwindcss+vite@4.0.0-alpha.29_vite@5.4.21_@types+node@22.19.18_lightningcss@1.32.0_/node_modules/@tailwindcss/vite/dist/index.mjs";
import path from "path";
import { fileURLToPath } from "url";
var __vite_injected_original_import_meta_url = "file:///C:/Users/op/Desktop/allbright/ui/vite.config.ts";
var rawPort = process.env.PORT ?? "3000";
var port = Number(rawPort);
var basePath = process.env.BASE_PATH ?? "/";
var currentDir = path.dirname(fileURLToPath(__vite_injected_original_import_meta_url));
var vite_config_default = defineConfig({
  base: basePath,
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(currentDir, "src"),
      "@assets": path.resolve(currentDir, "src/assets"),
      "@workspace/api-client-react": path.resolve(
        currentDir,
        "../lib/api-client-react/src/index.ts"
      )
    },
    dedupe: ["react", "react-dom"]
  },
  root: currentDir,
  build: {
    outDir: "dist",
    emptyOutDir: true,
    sourcemap: false,
    chunkSizeWarningLimit: 1e3,
    rollupOptions: {
      input: path.resolve(currentDir, "index.html"),
      external: [
        "@tauri-apps/api",
        "@tauri-apps/api/tauri",
        "@tauri-apps/api/event"
      ],
      output: {
        manualChunks: {
          vendor: ["react", "react-dom", "@tanstack/react-query"],
          charts: ["recharts"],
          motion: ["framer-motion"]
        }
      }
    }
  },
  server: {
    port: 3e3,
    strictPort: true,
    host: "0.0.0.0",
    allowedHosts: true,
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  },
  preview: {
    port: 3001,
    strictPort: true,
    host: "0.0.0.0",
    allowedHosts: true
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxvcFxcXFxEZXNrdG9wXFxcXGFsbGJyaWdodFxcXFx1aVwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcb3BcXFxcRGVza3RvcFxcXFxhbGxicmlnaHRcXFxcdWlcXFxcdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0M6L1VzZXJzL29wL0Rlc2t0b3AvYWxsYnJpZ2h0L3VpL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSBcInZpdGVcIjtcbmltcG9ydCByZWFjdCBmcm9tIFwiQHZpdGVqcy9wbHVnaW4tcmVhY3RcIjtcbmltcG9ydCB0YWlsd2luZGNzcyBmcm9tIFwiQHRhaWx3aW5kY3NzL3ZpdGVcIjtcbmltcG9ydCBwYXRoIGZyb20gXCJwYXRoXCI7XG5pbXBvcnQgeyBmaWxlVVJMVG9QYXRoIH0gZnJvbSBcInVybFwiO1xuXG4vLyBQT1JUIGFuZCBCQVNFX1BBVEggYXJlIG9wdGlvbmFsIGF0IGJ1aWxkIHRpbWUgKFJlbmRlciBzdGF0aWMgYnVpbGRzIGRvbid0IGluamVjdCBQT1JUKS5cbi8vIFRoZXkgYXJlIG9ubHkgbmVlZGVkIGZvciB0aGUgZGV2IHNlcnZlciAvIHByZXZpZXcgc2VydmVyLlxuY29uc3QgcmF3UG9ydCA9IHByb2Nlc3MuZW52LlBPUlQgPz8gXCIzMDAwXCI7XG5jb25zdCBwb3J0ID0gTnVtYmVyKHJhd1BvcnQpO1xuY29uc3QgYmFzZVBhdGggPSBwcm9jZXNzLmVudi5CQVNFX1BBVEggPz8gXCIvXCI7XG5jb25zdCBjdXJyZW50RGlyID0gcGF0aC5kaXJuYW1lKGZpbGVVUkxUb1BhdGgoaW1wb3J0Lm1ldGEudXJsKSk7XG5cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XG4gIGJhc2U6IGJhc2VQYXRoLFxuICBwbHVnaW5zOiBbcmVhY3QoKSwgdGFpbHdpbmRjc3MoKV0sXG4gIHJlc29sdmU6IHtcbiAgICBhbGlhczoge1xuICAgICAgXCJAXCI6IHBhdGgucmVzb2x2ZShjdXJyZW50RGlyLCBcInNyY1wiKSxcbiAgICAgIFwiQGFzc2V0c1wiOiBwYXRoLnJlc29sdmUoY3VycmVudERpciwgXCJzcmMvYXNzZXRzXCIpLFxuICAgICAgXCJAd29ya3NwYWNlL2FwaS1jbGllbnQtcmVhY3RcIjogcGF0aC5yZXNvbHZlKFxuICAgICAgICBjdXJyZW50RGlyLFxuICAgICAgICBcIi4uL2xpYi9hcGktY2xpZW50LXJlYWN0L3NyYy9pbmRleC50c1wiLFxuICAgICAgKSxcbiAgICB9LFxuICAgIGRlZHVwZTogW1wicmVhY3RcIiwgXCJyZWFjdC1kb21cIl0sXG4gIH0sXG4gIHJvb3Q6IGN1cnJlbnREaXIsXG4gIGJ1aWxkOiB7XG4gICAgb3V0RGlyOiBcImRpc3RcIixcbiAgICBlbXB0eU91dERpcjogdHJ1ZSxcbiAgICBzb3VyY2VtYXA6IGZhbHNlLFxuICAgIGNodW5rU2l6ZVdhcm5pbmdMaW1pdDogMTAwMCxcbiAgICByb2xsdXBPcHRpb25zOiB7XG4gICAgICBpbnB1dDogcGF0aC5yZXNvbHZlKGN1cnJlbnREaXIsIFwiaW5kZXguaHRtbFwiKSxcbiAgICAgIGV4dGVybmFsOiBbXG4gICAgICAgIFwiQHRhdXJpLWFwcHMvYXBpXCIsXG4gICAgICAgIFwiQHRhdXJpLWFwcHMvYXBpL3RhdXJpXCIsXG4gICAgICAgIFwiQHRhdXJpLWFwcHMvYXBpL2V2ZW50XCIsXG4gICAgICBdLFxuICAgICAgb3V0cHV0OiB7XG4gICAgICAgIG1hbnVhbENodW5rczoge1xuICAgICAgICAgIHZlbmRvcjogW1wicmVhY3RcIiwgXCJyZWFjdC1kb21cIiwgXCJAdGFuc3RhY2svcmVhY3QtcXVlcnlcIl0sXG4gICAgICAgICAgY2hhcnRzOiBbXCJyZWNoYXJ0c1wiXSxcbiAgICAgICAgICBtb3Rpb246IFtcImZyYW1lci1tb3Rpb25cIl0sXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgIH0sXG4gIH0sXG4gIHNlcnZlcjoge1xuICAgIHBvcnQ6IDMwMDAsXG4gICAgc3RyaWN0UG9ydDogdHJ1ZSxcbiAgICBob3N0OiBcIjAuMC4wLjBcIixcbiAgICBhbGxvd2VkSG9zdHM6IHRydWUsXG4gICAgZnM6IHtcbiAgICAgIHN0cmljdDogdHJ1ZSxcbiAgICAgIGRlbnk6IFtcIioqLy4qXCJdLFxuICAgIH0sXG4gIH0sXG4gIHByZXZpZXc6IHtcbiAgICBwb3J0OiAzMDAxLFxuICAgIHN0cmljdFBvcnQ6IHRydWUsXG4gICAgaG9zdDogXCIwLjAuMC4wXCIsXG4gICAgYWxsb3dlZEhvc3RzOiB0cnVlLFxuICB9LFxufSk7XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQThSLFNBQVMsb0JBQW9CO0FBQzNULE9BQU8sV0FBVztBQUNsQixPQUFPLGlCQUFpQjtBQUN4QixPQUFPLFVBQVU7QUFDakIsU0FBUyxxQkFBcUI7QUFKcUosSUFBTSwyQ0FBMkM7QUFRcE8sSUFBTSxVQUFVLFFBQVEsSUFBSSxRQUFRO0FBQ3BDLElBQU0sT0FBTyxPQUFPLE9BQU87QUFDM0IsSUFBTSxXQUFXLFFBQVEsSUFBSSxhQUFhO0FBQzFDLElBQU0sYUFBYSxLQUFLLFFBQVEsY0FBYyx3Q0FBZSxDQUFDO0FBRTlELElBQU8sc0JBQVEsYUFBYTtBQUFBLEVBQzFCLE1BQU07QUFBQSxFQUNOLFNBQVMsQ0FBQyxNQUFNLEdBQUcsWUFBWSxDQUFDO0FBQUEsRUFDaEMsU0FBUztBQUFBLElBQ1AsT0FBTztBQUFBLE1BQ0wsS0FBSyxLQUFLLFFBQVEsWUFBWSxLQUFLO0FBQUEsTUFDbkMsV0FBVyxLQUFLLFFBQVEsWUFBWSxZQUFZO0FBQUEsTUFDaEQsK0JBQStCLEtBQUs7QUFBQSxRQUNsQztBQUFBLFFBQ0E7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUFBLElBQ0EsUUFBUSxDQUFDLFNBQVMsV0FBVztBQUFBLEVBQy9CO0FBQUEsRUFDQSxNQUFNO0FBQUEsRUFDTixPQUFPO0FBQUEsSUFDTCxRQUFRO0FBQUEsSUFDUixhQUFhO0FBQUEsSUFDYixXQUFXO0FBQUEsSUFDWCx1QkFBdUI7QUFBQSxJQUN2QixlQUFlO0FBQUEsTUFDYixPQUFPLEtBQUssUUFBUSxZQUFZLFlBQVk7QUFBQSxNQUM1QyxVQUFVO0FBQUEsUUFDUjtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsTUFDRjtBQUFBLE1BQ0EsUUFBUTtBQUFBLFFBQ04sY0FBYztBQUFBLFVBQ1osUUFBUSxDQUFDLFNBQVMsYUFBYSx1QkFBdUI7QUFBQSxVQUN0RCxRQUFRLENBQUMsVUFBVTtBQUFBLFVBQ25CLFFBQVEsQ0FBQyxlQUFlO0FBQUEsUUFDMUI7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFBQSxFQUNBLFFBQVE7QUFBQSxJQUNOLE1BQU07QUFBQSxJQUNOLFlBQVk7QUFBQSxJQUNaLE1BQU07QUFBQSxJQUNOLGNBQWM7QUFBQSxJQUNkLElBQUk7QUFBQSxNQUNGLFFBQVE7QUFBQSxNQUNSLE1BQU0sQ0FBQyxPQUFPO0FBQUEsSUFDaEI7QUFBQSxFQUNGO0FBQUEsRUFDQSxTQUFTO0FBQUEsSUFDUCxNQUFNO0FBQUEsSUFDTixZQUFZO0FBQUEsSUFDWixNQUFNO0FBQUEsSUFDTixjQUFjO0FBQUEsRUFDaEI7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
