import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["src/__tests__/**/*.test.js"],
    globalSetup: ["src/__tests__/setup/globalSetup.js"],
    setupFiles: ["src/__tests__/setup/testSetup.js"],
    pool: "forks",
    fileParallelism: false,
    testTimeout: 15000,
    hookTimeout: 30000,
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      reportsDirectory: "./coverage",
      include: ["src/**/*.js"],
      exclude: [
        "src/seed/**",
        "src/__tests__/**",
      ],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 60,
        statements: 70,
      },
    },
  },
});
