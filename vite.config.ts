import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";
import path from "node:path";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), tailwindcss()],
  resolve: {
    dedupe: ["react", "react-dom"],
    alias: {
      react: path.resolve(__dirname, "./node_modules/react"),
      "react-dom": path.resolve(__dirname, "./node_modules/react-dom"),
      "@": path.resolve(__dirname, "./src"),
      "@mock": path.resolve(__dirname, "./mock"),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
