import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: { baseURL: "http://127.0.0.1:4321", trace: "retain-on-failure" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "bash -c 'source scripts/ci/env.sh; node scripts/ci/serve-production.mjs'",
    url: "http://127.0.0.1:4321",
    reuseExistingServer: false,
    timeout: 60_000,
  },
});
