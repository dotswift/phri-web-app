import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  workers: 1,
  fullyParallel: false,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  retries: 0,
  reporter: "html",
  globalSetup: "./e2e/global-setup.ts",
  use: {
    baseURL: "http://localhost:5173",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "app-tests",
      use: { browserName: "chromium" },
      testMatch: "app.spec.ts",
    },
    {
      name: "accessibility-tests",
      use: { browserName: "chromium" },
      testMatch: "accessibility.spec.ts",
      dependencies: ["app-tests"],
    },
    {
      name: "demo-tests",
      use: { browserName: "chromium" },
      testMatch: "demo.spec.ts",
      dependencies: ["accessibility-tests"],
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:5173",
    reuseExistingServer: true,
  },
});
