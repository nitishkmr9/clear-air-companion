import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      // App rules and logic; UI-kit and platform glue are excluded.
      include: [
        "src/lib/**/*.ts",
        "src/components/app/alerts.tsx",
        "src/components/app/share.tsx",
        "src/components/app/aqi-ui.tsx",
      ],
      exclude: [
        "src/lib/ai/**",
        "src/lib/error-capture.ts",
        "src/lib/error-page.ts",
        "src/lib/lovable-error-reporting.ts",
      ],
      // The run fails if coverage of the app's logic slips below these levels.
      thresholds: { statements: 90, branches: 80, functions: 85, lines: 90 },
    },
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
