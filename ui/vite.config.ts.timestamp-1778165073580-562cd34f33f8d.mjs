// vite.config.ts
import { defineConfig } from "file:///C:/Users/op/Desktop/allbright/node_modules/.pnpm/vite@5.4.21_@types+node@22.19.17_lightningcss@1.32.0_sugarss@5.0.1_postcss@8.5.13__terser@5.46.2/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Users/op/Desktop/allbright/node_modules/.pnpm/@vitejs+plugin-react@4.7.0_vite@5.4.21_@types+node@22.19.17_lightningcss@1.32.0_sugarss@5.0.1_mpbehofl5ghrjlnfcezlqyefgu/node_modules/@vitejs/plugin-react/dist/index.js";
import tailwindcss from "file:///C:/Users/op/Desktop/allbright/node_modules/.pnpm/@tailwindcss+vite@4.0.0-alpha.29_vite@5.4.21_@types+node@22.19.17_lightningcss@1.32.0_sugarss_vhqf5gpnubfmw6mj4ilrkoipfm/node_modules/@tailwindcss/vite/dist/index.mjs";
import path from "path";
var __vite_injected_original_dirname = "C:\\Users\\op\\Desktop\\allbright\\ui";
var rawPort = process.env.PORT ?? "3000";
var port = Number(rawPort);
var basePath = process.env.BASE_PATH ?? "/";
var vite_config_default = defineConfig({
  base: basePath,
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "src"),
      "@assets": path.resolve(__vite_injected_original_dirname, "./src/assets"),
      // Hardened alias for Monorepo resolution during Render builds
      "@workspace/api-client-react": path.resolve(__vite_injected_original_dirname, "../../lib/api-client-react/src/index.ts")
    },
    dedupe: ["react", "react-dom"]
  },
  root: path.resolve(__vite_injected_original_dirname),
  build: {
    outDir: "dist",
    emptyOutDir: true,
    sourcemap: false,
    chunkSizeWarningLimit: 1e3,
    rollupOptions: {
      input: path.resolve(__vite_injected_original_dirname, "allbright-dashboard.html"),
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
    port,
    host: "0.0.0.0",
    allowedHosts: true,
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  },
  preview: {
    port,
    host: "0.0.0.0",
    allowedHosts: true
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxvcFxcXFxEZXNrdG9wXFxcXGFsbGJyaWdodFxcXFx1aVwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcb3BcXFxcRGVza3RvcFxcXFxhbGxicmlnaHRcXFxcdWlcXFxcdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0M6L1VzZXJzL29wL0Rlc2t0b3AvYWxsYnJpZ2h0L3VpL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSBcInZpdGVcIjtcclxuaW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdFwiO1xyXG5pbXBvcnQgdGFpbHdpbmRjc3MgZnJvbSBcIkB0YWlsd2luZGNzcy92aXRlXCI7XHJcbmltcG9ydCBwYXRoIGZyb20gXCJwYXRoXCI7XHJcblxyXG4vLyBQT1JUIGFuZCBCQVNFX1BBVEggYXJlIG9wdGlvbmFsIGF0IGJ1aWxkIHRpbWUgKFJlbmRlciBzdGF0aWMgYnVpbGRzIGRvbid0IGluamVjdCBQT1JUKS5cclxuLy8gVGhleSBhcmUgb25seSBuZWVkZWQgZm9yIHRoZSBkZXYgc2VydmVyIC8gcHJldmlldyBzZXJ2ZXIuXHJcbmNvbnN0IHJhd1BvcnQgPSBwcm9jZXNzLmVudi5QT1JUID8/IFwiMzAwMFwiO1xyXG5jb25zdCBwb3J0ID0gTnVtYmVyKHJhd1BvcnQpO1xyXG5jb25zdCBiYXNlUGF0aCA9IHByb2Nlc3MuZW52LkJBU0VfUEFUSCA/PyBcIi9cIjtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XHJcbiAgYmFzZTogYmFzZVBhdGgsXHJcbiAgcGx1Z2luczogW3JlYWN0KCksIHRhaWx3aW5kY3NzKCldLFxyXG4gIHJlc29sdmU6IHtcclxuICAgIGFsaWFzOiB7XHJcbiAgICAgIFwiQFwiOiBwYXRoLnJlc29sdmUoaW1wb3J0Lm1ldGEuZGlybmFtZSwgXCJzcmNcIiksXHJcbiAgICAgIFwiQGFzc2V0c1wiOiBwYXRoLnJlc29sdmUoaW1wb3J0Lm1ldGEuZGlybmFtZSwgXCIuL3NyYy9hc3NldHNcIiksXHJcbiAgICAgIC8vIEhhcmRlbmVkIGFsaWFzIGZvciBNb25vcmVwbyByZXNvbHV0aW9uIGR1cmluZyBSZW5kZXIgYnVpbGRzXHJcbiAgICAgIFwiQHdvcmtzcGFjZS9hcGktY2xpZW50LXJlYWN0XCI6IHBhdGgucmVzb2x2ZShpbXBvcnQubWV0YS5kaXJuYW1lLCBcIi4uLy4uL2xpYi9hcGktY2xpZW50LXJlYWN0L3NyYy9pbmRleC50c1wiKSxcclxuICAgIH0sXHJcbiAgICBkZWR1cGU6IFtcInJlYWN0XCIsIFwicmVhY3QtZG9tXCJdLFxyXG4gIH0sXHJcbiAgcm9vdDogcGF0aC5yZXNvbHZlKGltcG9ydC5tZXRhLmRpcm5hbWUpLFxyXG4gIGJ1aWxkOiB7XHJcbiAgICBvdXREaXI6IFwiZGlzdFwiLFxyXG4gICAgZW1wdHlPdXREaXI6IHRydWUsXHJcbiAgICBzb3VyY2VtYXA6IGZhbHNlLFxyXG4gICAgY2h1bmtTaXplV2FybmluZ0xpbWl0OiAxMDAwLFxyXG4gICAgcm9sbHVwT3B0aW9uczoge1xyXG4gICAgICBpbnB1dDogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJ2FsbGJyaWdodC1kYXNoYm9hcmQuaHRtbCcpLFxyXG4gICAgICBleHRlcm5hbDogW1xyXG4gICAgICAgICdAdGF1cmktYXBwcy9hcGknLFxyXG4gICAgICAgICdAdGF1cmktYXBwcy9hcGkvdGF1cmknLFxyXG4gICAgICAgICdAdGF1cmktYXBwcy9hcGkvZXZlbnQnXHJcbiAgICAgIF0sXHJcbiAgICAgIG91dHB1dDoge1xyXG4gICAgICAgIG1hbnVhbENodW5rczoge1xyXG4gICAgICAgICAgdmVuZG9yOiBbXCJyZWFjdFwiLCBcInJlYWN0LWRvbVwiLCBcIkB0YW5zdGFjay9yZWFjdC1xdWVyeVwiXSxcclxuICAgICAgICAgIGNoYXJ0czogW1wicmVjaGFydHNcIl0sXHJcbiAgICAgICAgICBtb3Rpb246IFtcImZyYW1lci1tb3Rpb25cIl1cclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH0sXHJcbiAgfSxcclxuICBzZXJ2ZXI6IHtcclxuICAgIHBvcnQsXHJcbiAgICBob3N0OiBcIjAuMC4wLjBcIixcclxuICAgIGFsbG93ZWRIb3N0czogdHJ1ZSxcclxuICAgIGZzOiB7XHJcbiAgICAgIHN0cmljdDogdHJ1ZSxcclxuICAgICAgZGVueTogW1wiKiovLipcIl0sXHJcbiAgICB9LFxyXG4gIH0sXHJcbiAgcHJldmlldzoge1xyXG4gICAgcG9ydCxcclxuICAgIGhvc3Q6IFwiMC4wLjAuMFwiLFxyXG4gICAgYWxsb3dlZEhvc3RzOiB0cnVlLFxyXG4gIH0sXHJcbn0pO1xyXG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQThSLFNBQVMsb0JBQW9CO0FBQzNULE9BQU8sV0FBVztBQUNsQixPQUFPLGlCQUFpQjtBQUN4QixPQUFPLFVBQVU7QUFIakIsSUFBTSxtQ0FBbUM7QUFPekMsSUFBTSxVQUFVLFFBQVEsSUFBSSxRQUFRO0FBQ3BDLElBQU0sT0FBTyxPQUFPLE9BQU87QUFDM0IsSUFBTSxXQUFXLFFBQVEsSUFBSSxhQUFhO0FBRTFDLElBQU8sc0JBQVEsYUFBYTtBQUFBLEVBQzFCLE1BQU07QUFBQSxFQUNOLFNBQVMsQ0FBQyxNQUFNLEdBQUcsWUFBWSxDQUFDO0FBQUEsRUFDaEMsU0FBUztBQUFBLElBQ1AsT0FBTztBQUFBLE1BQ0wsS0FBSyxLQUFLLFFBQVEsa0NBQXFCLEtBQUs7QUFBQSxNQUM1QyxXQUFXLEtBQUssUUFBUSxrQ0FBcUIsY0FBYztBQUFBO0FBQUEsTUFFM0QsK0JBQStCLEtBQUssUUFBUSxrQ0FBcUIseUNBQXlDO0FBQUEsSUFDNUc7QUFBQSxJQUNBLFFBQVEsQ0FBQyxTQUFTLFdBQVc7QUFBQSxFQUMvQjtBQUFBLEVBQ0EsTUFBTSxLQUFLLFFBQVEsZ0NBQW1CO0FBQUEsRUFDdEMsT0FBTztBQUFBLElBQ0wsUUFBUTtBQUFBLElBQ1IsYUFBYTtBQUFBLElBQ2IsV0FBVztBQUFBLElBQ1gsdUJBQXVCO0FBQUEsSUFDdkIsZUFBZTtBQUFBLE1BQ2IsT0FBTyxLQUFLLFFBQVEsa0NBQVcsMEJBQTBCO0FBQUEsTUFDekQsVUFBVTtBQUFBLFFBQ1I7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLE1BQ0Y7QUFBQSxNQUNBLFFBQVE7QUFBQSxRQUNOLGNBQWM7QUFBQSxVQUNaLFFBQVEsQ0FBQyxTQUFTLGFBQWEsdUJBQXVCO0FBQUEsVUFDdEQsUUFBUSxDQUFDLFVBQVU7QUFBQSxVQUNuQixRQUFRLENBQUMsZUFBZTtBQUFBLFFBQzFCO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQUEsRUFDQSxRQUFRO0FBQUEsSUFDTjtBQUFBLElBQ0EsTUFBTTtBQUFBLElBQ04sY0FBYztBQUFBLElBQ2QsSUFBSTtBQUFBLE1BQ0YsUUFBUTtBQUFBLE1BQ1IsTUFBTSxDQUFDLE9BQU87QUFBQSxJQUNoQjtBQUFBLEVBQ0Y7QUFBQSxFQUNBLFNBQVM7QUFBQSxJQUNQO0FBQUEsSUFDQSxNQUFNO0FBQUEsSUFDTixjQUFjO0FBQUEsRUFDaEI7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
