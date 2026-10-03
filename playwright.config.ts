import { defineConfig, devices } from "@playwright/test";
const testPort = Number(process.env.WISSENSQUIZ_TEST_PORT || 4173);
const testUrl = `http://localhost:${testPort}`;
export default defineConfig({
  testDir: "./tests/browser",
  fullyParallel: false,
  workers: 1,
  timeout: 45000,
  use: { baseURL: testUrl, trace: "retain-on-failure" },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    {
      name: "webkit-mobile",
      testMatch: [
        "mobile-round.spec.ts",
        "error-training.spec.ts",
        "dont-know.spec.ts",
        "career.spec.ts",
        "duels.spec.ts",
        "actors-package.spec.ts",
      ],
      use: { ...devices["iPhone 13"] },
    },
  ],
  webServer: {
    command: `npm run preview -- --port ${testPort}`,
    url: testUrl,
    reuseExistingServer: !process.env.WISSENSQUIZ_TEST_PORT,
    timeout: 30000,
  },
});
