import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { readFileSync } from "node:fs";
import { emptyState } from "../../src/model";
import { importCsv } from "../../src/importer";
import { answer, complete, startRound } from "../../src/engine";

const questions = importCsv(
  readFileSync("public/horror-fragen.csv", "utf8"),
).questions;
const goals = (difficulty: string) => [
  ...new Map(
    questions
      .filter((q) => q.difficulty === difficulty)
      .map((q) => [q.knowledgeId, q]),
  ).values(),
];

for (const scenario of ["mittel", "schwer", "beide", "geraten"] as const) {
  test(`Freischaltung ${scenario}: Feier nur bei neuem Erfolg, respektiert Einstellungen und bleibt einmalig`, async ({
    page,
    context,
  }) => {
    const quiet = scenario === "beide";
    await page.setViewportSize({ width: 320, height: 800 });
    await page.emulateMedia({
      reducedMotion: quiet ? "reduce" : "no-preference",
    });
    await page.addInitScript(() => {
      const counters = { tones: 0, vibrations: [] as (number | number[])[] };
      Object.assign(window, { unlockTest: counters });
      const create = AudioContext.prototype.createOscillator;
      AudioContext.prototype.createOscillator = function () {
        counters.tones++;
        return create.call(this);
      };
      Object.defineProperty(navigator, "vibrate", {
        configurable: true,
        value: (p: number | number[]) => {
          counters.vibrations.push(p);
          return true;
        },
      });
    });
    const state = emptyState(questions);
    state.settings = {
      ...state.settings,
      allDifficulties: true,
      sound: !quiet,
      haptics: !quiet,
    };
    const history = startRound(
      state,
      { mode: "entdecken", topic: "Alle Themen", difficulty: "Alle Stufen" },
      1700000000000,
    );
    history.questions = [
      ...goals("leicht").slice(0, scenario === "schwer" ? 20 : 19),
      ...goals("mittel").slice(
        0,
        scenario === "beide" ? 20 : scenario === "schwer" ? 19 : 0,
      ),
    ];
    history.order = history.questions.map((q) => q.answers.map((a) => a.id));
    for (const q of history.questions)
      answer(state, history.id, q.id, q.correctId, 1000, 1700000001000);
    complete(state, history.id, 1700000002000);
    const current = startRound(
      state,
      { mode: "entdecken", topic: "Alle Themen", difficulty: "Alle Stufen" },
      1700000100000,
    );
    const q = goals(scenario === "schwer" ? "mittel" : "leicht")[19];
    current.questions = [q];
    current.order = [q.answers.map((a) => a.id)];
    await page.goto("/");
    await expect(
      page.getByRole("button", { name: "Losspielen" }),
    ).toBeEnabled();
    await page.getByRole("button", { name: "Profil", exact: true }).click();
    await page.getByRole("button", { name: "Optionen" }).click();
    await expect(
      page.getByText("Die App-Dateien sind im Offline-Cache bestätigt.", {
        exact: false,
      }),
    ).toBeVisible({ timeout: 20000 });
    await page.evaluate(async (state) => {
      await new Promise<void>((resolve, reject) => {
        const req = indexedDB.open("wissensquiz");
        req.onsuccess = () => {
          const db = req.result;
          const tx = db.transaction("state", "readwrite");
          tx.objectStore("state").put(state, "current");
          tx.oncomplete = () => {
            db.close();
            resolve();
          };
          tx.onerror = () => reject(tx.error);
        };
        req.onerror = () => reject(req.error);
      });
    }, state);
    await page.reload();
    await context.setOffline(true);
    await page.getByRole("button", { name: "Fortsetzen" }).click();
    await page
      .locator(".answer")
      .filter({ hasText: q.answers.find((a) => a.id === q.correctId)!.text })
      .click();
    if (scenario === "geraten")
      await page
        .getByRole("button", { name: "War geraten", exact: true })
        .click();
    await page.getByRole("button", { name: "Runde abschließen" }).click();
    const dialog = page.getByRole("dialog");
    if (scenario === "geraten") {
      await expect(
        page.getByRole("heading", { name: "Eine Runde weiter." }),
      ).toBeVisible();
      await expect(dialog).toHaveCount(0);
      return;
    }
    await expect(dialog).toBeVisible();
    await expect(dialog.locator(".unlock-levels li")).toHaveCount(
      quiet ? 2 : 1,
    );
    await expect(dialog).toContainText("Horror");
    await expect(dialog.locator("#unlock-description")).toContainText(
      "geöffnet. Diese",
    );
    await expect(dialog.locator(".unlock-levels")).toContainText(
      scenario === "schwer" ? "Schwer" : "Mittel",
    );
    await expect(
      dialog.getByRole("button", { name: "Weiter zum Ergebnis" }),
    ).toBeFocused();
    const counters = await page.evaluate(
      () =>
        (
          window as unknown as {
            unlockTest: { tones: number; vibrations: (number | number[])[] };
          }
        ).unlockTest,
    );
    expect(counters.tones).toBe(quiet ? 0 : 10); // Two answer notes plus eight fanfare notes; no duplicate completion sound.
    if (quiet) {
      expect(counters.vibrations.filter((p) => p !== 0)).toEqual([]);
      await expect(dialog.locator(".firework").first()).not.toBeVisible();
    } else expect(counters.vibrations).toContainEqual([35, 50, 35, 70, 75]);
    expect(
      await dialog.evaluate((el) => el.scrollWidth <= el.clientWidth),
    ).toBe(true);
    if (scenario === "mittel") {
      await expect
        .poll(() =>
          dialog.evaluate((el) => el.getAnimations({ subtree: true }).length),
        )
        .toBeGreaterThan(0);
      await expect
        .poll(() => dialog.evaluate((el) => getComputedStyle(el).opacity))
        .toBe("1");
      await expect
        .poll(() =>
          dialog
            .locator(".unlock-shackle")
            .evaluate((el) => getComputedStyle(el).transform),
        )
        .not.toBe("none");
      await page.screenshot({ path: "test-results/freischaltung-320.png" });
      expect(
        (
          await new AxeBuilder({ page })
            .withTags(["wcag2a", "wcag2aa"])
            .analyze()
        ).violations,
      ).toEqual([]);
    }
    if (quiet) await page.keyboard.press("Escape");
    else
      await dialog.getByRole("button", { name: "Weiter zum Ergebnis" }).click();
    await expect(dialog).toHaveCount(0);
    await expect(page.locator("main")).toBeFocused();
    await page.getByRole("button", { name: "Sammlung", exact: true }).click();
    await page.locator(".history button").first().click();
    await expect(
      page.getByRole("heading", { name: "Dein Rundenrückblick" }),
    ).toBeVisible();
    await expect(dialog).toHaveCount(0);
    expect(
      await page.evaluate(
        () =>
          (window as unknown as { unlockTest: { tones: number } }).unlockTest
            .tones,
      ),
    ).toBe(counters.tones);
    await page.reload();
    await expect(dialog).toHaveCount(0);
  });
}
