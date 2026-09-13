import { defineConfig } from "vitest/config";
import path from "path";

// Basic Node environment config — the test suite covers pure logic (scoring,
// parsing) with no DOM/browser APIs involved, so jsdom isn't needed.
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    exclude: ["node_modules", ".next", "dist-electron", "design-preview"],
  },
  resolve: {
    alias: {
      // Mirrors tsconfig.json's "@/*" path mapping to "./src/*".
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
});
