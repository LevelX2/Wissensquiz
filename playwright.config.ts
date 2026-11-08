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
      // Multi-step server flows need a functional budget on Windows Firefox.
      // Response-performance assertions keep their separate timing limits.
      timeout: 180000,
      testMatch: [
        "audio.spec.ts",
        "updates.spec.ts",
        "entry-sync.spec.ts",
        "server-learning.spec.ts",
        "journey-areas.spec.ts",
        "success-celebration.spec.ts",
      ],
      use: {
        ...devices["Desktop Firefox"],
        // Full DOM/video capture delays Firefox actions enough to expire mock
        // requests. Keep action/network logs, sources and failure screenshots.
        trace: {
          mode: "retain-on-failure",
          snapshots: false,
          screenshots: false,
          sources: true,
        },
        screenshot: "only-on-failure",
      },
    },
    {
      name: "webkit-mobile",
      // Multi-step UI and Axe checks need a functional budget on Windows WebKit.
      // Response-performance assertions retain their separate timing limits.
      timeout: 120000,
      testMatch: [
        "server-learning.spec.ts",
        "film-posters.spec.ts",
        "question-status.spec.ts",
        "updates.spec.ts",
        "entry-sync.spec.ts",
        "accounts.spec.ts",
        "trial.spec.ts",
        "startup.spec.ts",
        "audio.spec.ts",
        "answer-duration.spec.ts",
        "year-answers.spec.ts",
        "play-entry.spec.ts",
        "mobile-round.spec.ts",
        "work-facets.spec.ts",
        "error-training.spec.ts",
        "dont-know.spec.ts",
        "career.spec.ts",
        "success-celebration.spec.ts",
        "duels.spec.ts",
        "leaderboard-integrity.spec.ts",
        "actors-package.spec.ts",
        "actor-recognition.spec.ts",
        "question-organization.spec.ts",
        "duel-performance.spec.ts",
        "response-performance.spec.ts",
        "question-sources.spec.ts",
        "source-links.spec.ts",
        "journey-areas.spec.ts",

        "compact-home.spec.ts",
        "game-cards.spec.ts",
        "record-modes.spec.ts",
        "ranked-security.spec.ts",
        "release-info.spec.ts",
        "profile-folds.spec.ts",
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
