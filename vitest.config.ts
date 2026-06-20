import { config as loadEnv } from "dotenv";
import { defineConfig } from "vitest/config";
import path from "path";

loadEnv({ path: ".env" });
loadEnv({ path: ".env.local" });

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: ["__tests__/**/*.test.{ts,tsx}"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});