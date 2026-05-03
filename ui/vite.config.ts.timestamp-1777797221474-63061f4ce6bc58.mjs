// vite.config.ts
import { defineConfig } from "file:///C:/Users/op/Desktop/allbright/node_modules/.pnpm/vite@5.4.21_@types+node@22.19.17_lightningcss@1.32.0/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Users/op/Desktop/allbright/node_modules/.pnpm/@vitejs+plugin-react@4.7.0_vite@5.4.21_@types+node@22.19.17_lightningcss@1.32.0_/node_modules/@vitejs/plugin-react/dist/index.js";
import tailwindcss from "file:///C:/Users/op/Desktop/allbright/node_modules/.pnpm/@tailwindcss+vite@4.0.0-alpha.29_vite@5.4.21_@types+node@22.19.17_lightningcss@1.32.0_/node_modules/@tailwindcss/vite/dist/index.mjs";
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
      "@assets": path.resolve(__vite_injected_original_dirname, "src/assets")
    },
    dedupe: ["react", "react-dom"]
  },
  root: path.resolve(__vite_injected_original_dirname),
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom", "@tanstack/react-query"],
          charts: ["recharts"],
          motion: ["framer-motion"]
        }
      }
    },
    sourcemap: false
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxvcFxcXFxEZXNrdG9wXFxcXGFsbGJyaWdodFxcXFx1aVwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcb3BcXFxcRGVza3RvcFxcXFxhbGxicmlnaHRcXFxcdWlcXFxcdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0M6L1VzZXJzL29wL0Rlc2t0b3AvYWxsYnJpZ2h0L3VpL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSBcInZpdGVcIjtcclxuaW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdFwiO1xyXG5pbXBvcnQgdGFpbHdpbmRjc3MgZnJvbSBcIkB0YWlsd2luZGNzcy92aXRlXCI7XHJcbmltcG9ydCBwYXRoIGZyb20gXCJwYXRoXCI7XHJcblxyXG4vLyBQT1JUIGFuZCBCQVNFX1BBVEggYXJlIG9wdGlvbmFsIGF0IGJ1aWxkIHRpbWUgKFJlbmRlciBzdGF0aWMgYnVpbGRzIGRvbid0IGluamVjdCBQT1JUKS5cclxuLy8gVGhleSBhcmUgb25seSBuZWVkZWQgZm9yIHRoZSBkZXYgc2VydmVyIC8gcHJldmlldyBzZXJ2ZXIuXHJcbmNvbnN0IHJhd1BvcnQgPSBwcm9jZXNzLmVudi5QT1JUID8/IFwiMzAwMFwiO1xyXG5jb25zdCBwb3J0ID0gTnVtYmVyKHJhd1BvcnQpO1xyXG5jb25zdCBiYXNlUGF0aCA9IHByb2Nlc3MuZW52LkJBU0VfUEFUSCA/PyBcIi9cIjtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XHJcbiAgYmFzZTogYmFzZVBhdGgsXHJcbiAgcGx1Z2luczogW3JlYWN0KCksIHRhaWx3aW5kY3NzKCldLFxyXG4gIHJlc29sdmU6IHtcclxuICAgIGFsaWFzOiB7XHJcbiAgICAgIFwiQFwiOiBwYXRoLnJlc29sdmUoaW1wb3J0Lm1ldGEuZGlybmFtZSwgXCJzcmNcIiksXHJcbiAgICAgIFwiQGFzc2V0c1wiOiBwYXRoLnJlc29sdmUoaW1wb3J0Lm1ldGEuZGlybmFtZSwgXCJzcmMvYXNzZXRzXCIpLFxyXG4gICAgfSxcclxuICAgIGRlZHVwZTogW1wicmVhY3RcIiwgXCJyZWFjdC1kb21cIl0sXHJcbiAgfSxcclxuICByb290OiBwYXRoLnJlc29sdmUoaW1wb3J0Lm1ldGEuZGlybmFtZSksXHJcbiAgYnVpbGQ6IHtcclxuICAgIG91dERpcjogXCJkaXN0XCIsXHJcbiAgICBlbXB0eU91dERpcjogdHJ1ZSxcclxuICAgIHJvbGx1cE9wdGlvbnM6IHtcclxuICAgICAgb3V0cHV0OiB7XHJcbiAgICAgICAgbWFudWFsQ2h1bmtzOiB7XHJcbiAgICAgICAgICB2ZW5kb3I6IFtcInJlYWN0XCIsIFwicmVhY3QtZG9tXCIsIFwiQHRhbnN0YWNrL3JlYWN0LXF1ZXJ5XCJdLFxyXG4gICAgICAgICAgY2hhcnRzOiBbXCJyZWNoYXJ0c1wiXSxcclxuICAgICAgICAgIG1vdGlvbjogW1wiZnJhbWVyLW1vdGlvblwiXVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfSxcclxuICAgIHNvdXJjZW1hcDogZmFsc2VcclxuICB9LFxyXG4gIHNlcnZlcjoge1xyXG4gICAgcG9ydCxcclxuICAgIGhvc3Q6IFwiMC4wLjAuMFwiLFxyXG4gICAgYWxsb3dlZEhvc3RzOiB0cnVlLFxyXG4gICAgZnM6IHtcclxuICAgICAgc3RyaWN0OiB0cnVlLFxyXG4gICAgICBkZW55OiBbXCIqKi8uKlwiXSxcclxuICAgIH0sXHJcbiAgfSxcclxuICBwcmV2aWV3OiB7XHJcbiAgICBwb3J0LFxyXG4gICAgaG9zdDogXCIwLjAuMC4wXCIsXHJcbiAgICBhbGxvd2VkSG9zdHM6IHRydWUsXHJcbiAgfSxcclxufSk7XHJcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBOFIsU0FBUyxvQkFBb0I7QUFDM1QsT0FBTyxXQUFXO0FBQ2xCLE9BQU8saUJBQWlCO0FBQ3hCLE9BQU8sVUFBVTtBQUhqQixJQUFNLG1DQUFtQztBQU96QyxJQUFNLFVBQVUsUUFBUSxJQUFJLFFBQVE7QUFDcEMsSUFBTSxPQUFPLE9BQU8sT0FBTztBQUMzQixJQUFNLFdBQVcsUUFBUSxJQUFJLGFBQWE7QUFFMUMsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDMUIsTUFBTTtBQUFBLEVBQ04sU0FBUyxDQUFDLE1BQU0sR0FBRyxZQUFZLENBQUM7QUFBQSxFQUNoQyxTQUFTO0FBQUEsSUFDUCxPQUFPO0FBQUEsTUFDTCxLQUFLLEtBQUssUUFBUSxrQ0FBcUIsS0FBSztBQUFBLE1BQzVDLFdBQVcsS0FBSyxRQUFRLGtDQUFxQixZQUFZO0FBQUEsSUFDM0Q7QUFBQSxJQUNBLFFBQVEsQ0FBQyxTQUFTLFdBQVc7QUFBQSxFQUMvQjtBQUFBLEVBQ0EsTUFBTSxLQUFLLFFBQVEsZ0NBQW1CO0FBQUEsRUFDdEMsT0FBTztBQUFBLElBQ0wsUUFBUTtBQUFBLElBQ1IsYUFBYTtBQUFBLElBQ2IsZUFBZTtBQUFBLE1BQ2IsUUFBUTtBQUFBLFFBQ04sY0FBYztBQUFBLFVBQ1osUUFBUSxDQUFDLFNBQVMsYUFBYSx1QkFBdUI7QUFBQSxVQUN0RCxRQUFRLENBQUMsVUFBVTtBQUFBLFVBQ25CLFFBQVEsQ0FBQyxlQUFlO0FBQUEsUUFDMUI7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUFBLElBQ0EsV0FBVztBQUFBLEVBQ2I7QUFBQSxFQUNBLFFBQVE7QUFBQSxJQUNOO0FBQUEsSUFDQSxNQUFNO0FBQUEsSUFDTixjQUFjO0FBQUEsSUFDZCxJQUFJO0FBQUEsTUFDRixRQUFRO0FBQUEsTUFDUixNQUFNLENBQUMsT0FBTztBQUFBLElBQ2hCO0FBQUEsRUFDRjtBQUFBLEVBQ0EsU0FBUztBQUFBLElBQ1A7QUFBQSxJQUNBLE1BQU07QUFBQSxJQUNOLGNBQWM7QUFBQSxFQUNoQjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
