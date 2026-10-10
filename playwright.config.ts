import { defineConfig, devices } from "@playwright/test";
const browserPort = Number(process.env.WISSENSQUIZ_BROWSER_PORT ?? 4173);
if (!Number.isInteger(browserPort) || browserPort < 1024 || browserPort > 65535)
  throw new Error("Ungültiger Browser-Testport.");
const previewDir =
  process.env.WISSENSQUIZ_BROWSER_SNAPSHOT === "1"
    ? `tmp-browser-build/port-${browserPort}`
    : "dist";
export default defineConfig({
  testDir: "./tests/browser",
  outputDir: `./test-results/port-${browserPort}`,
  fullyParallel: false,
  workers: 1,
  timeout: 60000,
  expect: { timeout: 15000 },
  use: {
    baseURL: `http://localhost:${browserPort}`,
    trace: "retain-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    {
      name: "firefox",
      testMatch: ["updates.spec.ts", "entry-sync.spec.ts"],
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit-mobile",
      testMatch: [
        "film-posters.spec.ts",
        "updates.spec.ts",
        "entry-sync.spec.ts",
        "accounts.spec.ts",
        "audio.spec.ts",
        "answer-duration.spec.ts",
        "year-answers.spec.ts",
        "play-entry.spec.ts",
        "mobile-round.spec.ts",
        "error-training.spec.ts",
        "dont-know.spec.ts",
        "career.spec.ts",
        "duels.spec.ts",
        "actors-package.spec.ts",
        "actor-recognition.spec.ts",
        "question-organization.spec.ts",
        "duel-performance.spec.ts",
        "response-performance.spec.ts",
        "question-sources.spec.ts",
        "journey-areas.spec.ts",

        "compact-home.spec.ts",
        "game-cards.spec.ts",
        "record-modes.spec.ts",
        "release-info.spec.ts",
      ],
      use: { ...devices["iPhone 13"] },
    },
  ],
  webServer: {
    command: `npm run preview -- --port ${browserPort} --outDir ${previewDir}`,
    url: `http://localhost:${browserPort}`,
    reuseExistingServer: false,
    timeout: 30000,
  },
});
