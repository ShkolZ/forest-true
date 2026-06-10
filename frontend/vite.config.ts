import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    allowedHosts: ["df74-185-176-138-122.ngrok-free.app"],
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:42069",
        changeOrigin: true,
      },
    },
  },
});
