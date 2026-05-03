import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    allowedHosts: ["colicky-calvin-goniac.ngrok-free.dev"],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom", "react-router-dom"],
          state: ["zustand", "axios"],
          forms: ["react-hook-form", "zod", "@hookform/resolvers"],
          motion: ["framer-motion", "sonner", "lucide-react"],
          realtime: ["@stomp/stompjs", "sockjs-client"],
        },
      },
    },
  },
});
