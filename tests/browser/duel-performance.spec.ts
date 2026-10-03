import { openRoundSetup } from "./fixtures";
import { test, expect } from "@playwright/test";
import { writeFileSync } from "node:fs";
import { server, alice, qs } from "./duel-service";
import { readSavedState } from "./saved-state";
test.use({ trace: "off", serviceWorkers: "block" });
// Measure real browser frames, excluding trace capture and external network variability.
test.describe("Duellreaktion", () => {
  test("zeigt die bestätigte Antwort ohne erneute Katalogkopie", async ({
    page,
    browserName,
  }, testInfo) => {
    const service = await server();
    try {
      await service.setup(page, alice, true);
      expect(
        await page.evaluate(() => requestAnimationFrame.toString()),
      ).toContain("[native code]");
      await expect.poll(() => page.workers().length).toBe(1);
      await page
        .getByRole("button", { name: "Zufälligen Gegner finden" })
        .click();
      const id = await page
        .locator("h1[data-question-id]")
        .getAttribute("data-question-id");
      const q = qs.find((q) => q.id === id)!;
      const choice = page.getByRole("button", {
        name: q.answers.find((a) => a.id === q.correctId)!.text,
        exact: false,
      });
      await expect(choice).toBeEnabled();
      const cdp =
        browserName === "chromium"
          ? await page.context().newCDPSession(page)
          : null;
      if (cdp) {
        await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
        if (process.env.PERF_PROFILE) {
          await cdp.send("Profiler.enable");
          await cdp.send("Profiler.start");
        }
      }
      await page.evaluate(() => {
        const metrics = { start: 0, confirmed: 0, latency: 0, put: 0 };
        (window as any).__duelResponse = metrics;
        const fetch = window.fetch;
        window.fetch = async (...args) => {
          const response = await fetch(...args);
          if (String(args[0]).endsWith("/quiz_duel_answer"))
            metrics.confirmed = performance.now();
          return response;
        };
        const put = IDBObjectStore.prototype.put;
        IDBObjectStore.prototype.put = function (...args: any[]) {
          const start = performance.now();
          const req = put.apply(this, args as any);
          metrics.put = Math.max(metrics.put, performance.now() - start);
          return req;
        };
        document.addEventListener(
          "click",
          (e) => {
            if ((e.target as Element).closest(".answers .answer"))
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
          subtree: true,
          attributes: true,
          childList: true,
        });
      });
      await choice.click();
      await expect(
        page.getByRole("heading", { name: "Genau richtig." }),
      ).toBeVisible();
      await expect
        .poll(() => page.evaluate(() => (window as any).__duelResponse.latency))
        .toBeGreaterThan(0);
      const metrics = await page.evaluate(() => (window as any).__duelResponse);
      if (cdp && process.env.PERF_PROFILE) {
        const { profile } = await cdp.send("Profiler.stop");
        writeFileSync("tmp-perf/duel-profile.json", JSON.stringify(profile));
      }
      if (cdp) await cdp.send("Emulation.setCPUThrottlingRate", { rate: 1 });
      const local = metrics.start + metrics.latency - metrics.confirmed;
      console.log(
        JSON.stringify({ browser: browserName, duel: true, ...metrics, local }),
      );
      await testInfo.attach("duel-response.json", {
        body: JSON.stringify({ ...metrics, local }),
        contentType: "application/json",
      });
      expect(metrics.confirmed).toBeGreaterThan(metrics.start);
      expect(local).toBeLessThan(250);
      expect(metrics.put).toBeLessThan(100);
      await expect(page.locator(".nav-symbol .sync-symbol.saved")).toHaveCount(
        1,
      );
      await page.reload();
      await openRoundSetup(page);
      await expect(
        page.getByRole("button", { name: "Duell", exact: true }),
      ).toBeEnabled();
      await openRoundSetup(page);
      await page.getByRole("button", { name: "Duell", exact: true }).click();
      await page
        .getByRole("button", { name: "Weiterspielen", exact: false })
        .click();
      await expect(
        page.getByLabel("Frage 1: richtig beantwortet", { exact: true }),
      ).toBeVisible();
      await expect(
        page.getByLabel("Frage 2: noch offen, aktuell", { exact: true }),
      ).toBeVisible();
      const saved = await readSavedState(
        page,
        `account:quiz-test.supabase.co:${alice}`,
      );
      expect(saved.events).toHaveLength(1);
      expect(saved.events[0].correct).toBe(true);
    } finally {
      await service.db.close();
    }
  });
});
