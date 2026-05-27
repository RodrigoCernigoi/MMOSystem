import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) {
            return undefined;
          }

          if (id.includes("pixi.js")) {
            return "pixi";
          }

          if (id.includes("@xyflow")) {
            return "flow";
          }

          if (id.includes("tone")) {
            return "tone";
          }

          if (id.includes("@supabase")) {
            return "supabase";
          }

          if (id.includes("motion")) {
            return "motion";
          }

          return "vendor";
        },
      },
    },
  },
  server: {
    proxy: {
      "/api": process.env.VITE_API_PROXY_TARGET ?? `http://localhost:${process.env.API_PORT ?? 8787}`,
    },
  },
});
