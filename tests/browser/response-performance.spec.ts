import { writeStoredState } from "./fixtures";
import { readSavedState } from "./saved-state";
import { fixCalendarTime } from "./fixtures";
import { test, expect } from "./fixtures";
import { readFileSync, writeFileSync } from "node:fs";
import {
  emptyState,
  type State,
  type Round,
  type AnswerEvent,
} from "../../src/model";
import { addPackages, packages } from "../../src/packages";
import { rebuild } from "../../src/engine";

// Playwright trace snapshots visit the whole DOM and distort CPU-throttled timing.
// Functional browser cases retain traces; this benchmark measures the app alone.
test.use({ serviceWorkers: "block", trace: "off" });
const catalog = emptyState();
addPackages(
  catalog,
  packages.map((p) => ({
    filename: p.filename,
    text: readFileSync(`public${p.path}`, "utf8"),
  })),
);
function fixture(count: number) {
  const state = structuredClone(catalog);
  state.settings.sound = false;
  state.settings.roundSetup = {
    mode: "ueben",
    genres: null,
    categories: [],
    difficulties: ["leicht", "mittel", "schwer", "experte"],
    familiarities: [1, 2, 3, 4],
  };
  const qs = [
    ...new Map(
      state.questions
        .filter((q) => !q.id.startsWith("FACT-"))
        .map((q) => [q.knowledgeId, q]),
    ).values(),
  ].slice(0, 10);
  for (let i = 0; i < count; i++) {
    const round: Round = {
      id: `history-${i}`,
      mode: i % 2 ? "ueben" : "rekord",
      topic: "Alle Themen",
      difficulty: "Alle Stufen",
      ruleVersion: "1",
      questions: qs,
      order: qs.map((q) => q.answers.map((a) => a.id)),
      events: [],
      before: {},
      startedAt: Date.UTC(2025, 0, 1) + i * 60000,
      finishedAt: Date.UTC(2025, 0, 1) + i * 60000 + 20000,
      status: "completed",
    };
    qs.forEach((q, index) => {
      const event: AnswerEvent = {
        id: `${round.id}:${q.knowledgeId}`,
        roundId: round.id,
        questionId: q.id,
        knowledgeId: q.knowledgeId,
        version: q.version,
        answerId: q.correctId,
        correct: true,
        guessed: false,
        elapsedMs: 1000,
        at: round.startedAt + index * 1000,
        knowledgePoints: round.mode === "rekord" ? 100 : 0,
        timeBonus: round.mode === "rekord" ? 58 : 0,
      };
      state.events.push(event);
      round.events.push(event.id);
    });
    state.rounds.push(round);
  }
  const active: Round = {
    id: "performance-active",
    mode: "ueben",
    topic: "Alle Themen",
    difficulty: "Alle Stufen",
    ruleVersion: "1",
    questions: qs.slice(0, 5),
    order: qs.slice(0, 5).map((q) => q.answers.map((a) => a.id)),
    events: [],
    before: {},
    startedAt: Date.UTC(2026, 8, 1),
    finishedAt: null,
    status: "active",
  };
  state.rounds.push(active);
  rebuild(state);
  return state;
}
for (const history of [0, 100, 500])
  test(`Antwortreaktion mit ${history} bisherigen Runden`, async ({
    page,
    browserName,
  }, testInfo) => {
    await fixCalendarTime(page, new Date("2026-10-03T12:00:00+02:00"));
    await page.goto("/");
    expect(
      await page.evaluate(() => requestAnimationFrame.toString()),
    ).toContain("[native code]");
    await expect(
      page.getByRole("button", { name: /^Losspielen/ }),
    ).toBeEnabled();
    await writeStoredState(page, fixture(history));
    await page.reload();
    await page.getByRole("button", { name: /^Fortsetzen/ }).click();
    const cdp =
      browserName === "chromium"
        ? await page.context().newCDPSession(page)
        : null;
    if (cdp) {
      await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
    }
    if (cdp && process.env.PERF_PROFILE) {
      await cdp.send("Profiler.enable");
      await cdp.send("Profiler.start");
    }
    await page.evaluate(() => {
      const metrics = { start: 0, latency: 0, get: 0, put: 0, write: 0 };
      (window as any).__responseMetrics = metrics;
      const get = IDBObjectStore.prototype.get,
        put = IDBObjectStore.prototype.put;
      IDBObjectStore.prototype.get = function (key) {
        const start = performance.now();
        const req = get.call(this, key);
        if (key === "current")
          req.addEventListener(
            "success",
            () => (metrics.get = performance.now() - start),
          );
        return req;
      };
      IDBObjectStore.prototype.put = function (...args: any[]) {
        const start = performance.now();
        const req = put.apply(this, args as any);
        if (args[1] === "current") {
          metrics.put = performance.now() - start;
          this.transaction.addEventListener(
            "complete",
            () => (metrics.write = performance.now() - start),
          );
        }
        return req;
      };
      document.addEventListener(
        "click",
        (e) => {
          if (
            (e.target as Element).closest(".answers .answer") &&
            !metrics.start
          )
            metrics.start = performance.now();
        },
        true,
      );
      const observer = new MutationObserver(() => {
        if (
          metrics.start &&
          document.querySelector(".question-wrap.is-answered")
        ) {
          observer.disconnect();
          requestAnimationFrame(() =>
            requestAnimationFrame(
              () => (metrics.latency = performance.now() - metrics.start),
            ),
          );
        }
      });
      observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
      });
    });
    await page.locator(".answers .answer").first().click();
    await expect(page.locator(".feedback")).toBeVisible();
    await expect
      .poll(() =>
        page.evaluate(() => (window as any).__responseMetrics.latency),
      )
      .toBeGreaterThan(0);
    const metrics = await page.evaluate(
      () => (window as any).__responseMetrics,
    );
    if (cdp && process.env.PERF_PROFILE) {
      const { profile } = await cdp.send("Profiler.stop");
      writeFileSync(
        `tmp-perf/profile-${history}.json`,
        JSON.stringify(profile),
      );
    }
    console.log(JSON.stringify({ history, browser: browserName, ...metrics }));
    await testInfo.attach("answer-response.json", {
      body: JSON.stringify(metrics),
      contentType: "application/json",
    });
    const persisted = await readSavedState(page);
    expect(persisted.events).toHaveLength(history * 10 + 1);
    expect(
      persisted.rounds.find((r) => r.id === "performance-active")?.events,
    ).toHaveLength(1);
    if (!process.env.PERF_BASELINE) {
      expect(metrics.latency).toBeLessThan(450);
      expect(metrics.put).toBeLessThan(100);
    }
  });
