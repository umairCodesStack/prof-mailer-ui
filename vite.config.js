import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// The dev server forwards /api/* to the backend, so there are no CORS problems.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target:
          "https://prof-mailer-geh8gqhrdkhvgcaj.centralindia-01.azurewebsites.net",
        changeOrigin: true,
        secure: true,
      },
    },
  },
});
