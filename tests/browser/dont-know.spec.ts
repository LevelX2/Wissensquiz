import { test, expect, readStoredState, type Page } from "./fixtures";
import AxeBuilder from "@axe-core/playwright";
import { readFileSync } from "node:fs";
import { importCsv } from "../../src/importer";
import { answer, complete, startRound } from "../../src/engine";
import { emptyState, type Mode, type State } from "../../src/model";

const now = new Date("2026-10-02T12:00:00+02:00");
const catalog = importCsv(
  readFileSync("public/western-fragen.csv", "utf8"),
).questions;
const qs = [
  ...new Map(
    catalog
      .filter((q) => q.difficulty === "leicht")
      .map((q) => [q.knowledgeId, q]),
  ).values(),
].slice(0, 2);
async function readState(page: Page): Promise<State> {
  return readStoredState(page);
}
async function prepare(page: Page, mode: Mode = "ueben") {
  await page.clock.install({ time: now });
  await page.clock.pauseAt(now);
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Losspielen" })).toBeEnabled();
  const state = emptyState(catalog);
  state.settings.sound = false;
  if (mode === "fehler") {
    const previous = startRound(
      state,
      { mode: "ueben", topic: "Alle Themen", difficulty: "leicht" },
      now.getTime() - 2000,
    );
    previous.questions = qs;
    previous.order = qs.map((q) => q.answers.map((a) => a.id));
    previous.familiaritySnapshot = undefined;
    for (const q of qs)
      answer(
        state,
        previous.id,
        q.id,
        q.answers.find((a) => a.id !== q.correctId)!.id,
        100,
        now.getTime() - 1000,
      );
    complete(state, previous.id, now.getTime() - 500);
  }
  let round = startRound(
    state,
    { mode, topic: "Alle Themen", difficulty: "leicht" },
    now.getTime(),
  );
  round.questions = qs;
  round.order = qs.map((q) => q.answers.map((a) => a.id));
  round.familiaritySnapshot = undefined;
  if (mode === "rekord") {
    // A reload deliberately aborts record rounds. Start this one through the UI.
    state.rounds = [];
    state.settings.roundSetup = {
      mode,
      genres: ["Western"],
      categories: [],
      difficulties: ["leicht"],
      familiarities: [1, 2, 3, 4],
    };
  }
  await page.evaluate(
    (value) =>
      new Promise<void>((resolve, reject) => {
        const request = indexedDB.open("wissensquiz");
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const db = request.result;
          const tx = db.transaction("state", "readwrite");
          tx.objectStore("state").put(value, "current");
          tx.oncomplete = () => {
            db.close();
            resolve();
          };
          tx.onerror = () => reject(tx.error);
        };
      }),
    state,
  );
  await page.reload();
  if (mode === "rekord") {
    await page.getByRole("button", { name: "Losspielen" }).click();
    round = (await readState(page)).rounds.at(-1)!;
  } else await page.getByRole("button", { name: "Fortsetzen" }).click();
  await page.clock.runFor(50);
  await expect(
    page.getByRole("button", { name: "Keine Ahnung", exact: true }),
  ).toBeEnabled();
  return round;
}

for (const mode of ["entdecken", "ueben", "rekord", "fehler"] as const) {
  test(`Keine Ahnung in ${mode}: nur die Lösung hervorheben, falsch werten und im Rückblick erhalten`, async ({
    page,
    browserName,
  }, info) => {
    await page.setViewportSize({
      width: browserName === "webkit" || mode !== "ueben" ? 320 : 1280,
      height: 800,
    });
    const round = await prepare(page, mode);
    await expect(page.locator(".answer")).toHaveCount(5);
    const unknown = page.getByRole("button", {
      name: "Keine Ahnung",
      exact: true,
    });
    await unknown.focus();
    await page.keyboard.press("Enter");
    await expect(page.locator(".solution-reveal")).toBeVisible();
    await expect(page.locator(".solution-reveal p")).toContainText(
      round.questions[0].answers.find(
        (a) => a.id === round.questions[0].correctId,
      )!.text,
    );
    await expect(page.locator(".feedback")).toBeFocused();
    await expect(page.locator(".answer")).toHaveCount(0);
    await expect(page.locator(".explanation")).toHaveCount(0);
    await expect(page.locator(".specific-feedback")).toHaveCount(0);
    await expect(page.locator(".feedback-actions")).toHaveCount(0);
    const saved = (await readState(page)).events.find(
      (e) => e.roundId === round.id,
    )!;
    expect(saved).toMatchObject({
      dontKnow: true,
      answerId: null,
      correct: false,
      knowledgePoints: 0,
      timeBonus: 0,
    });
    await page.screenshot({
      path: `test-results/keine-ahnung-${mode}-${info.project.name}.png`,
    });
    await page.clock.runFor(1000);
    await expect(page.locator(".solution-reveal")).toBeVisible();
    await page.clock.runFor(100);
    await expect(page.locator(".solution-reveal")).toHaveCount(0);
    await expect(page.locator(".chosen-answer")).toContainText("Keine Ahnung");
    await expect(page.locator(".feedback")).not.toContainText(
      "Die Zeit ist um",
    );
    await expect(page.locator(".explanation")).toBeVisible();
    await expect(page.locator(".feedback")).toBeFocused();
    await page.getByText("Alle Antworten ansehen", { exact: true }).click();
    await expect(page.locator(".answer.correct")).toHaveCount(1);
    await expect(page.locator(".answer.wrong")).toHaveCount(0);
    await expect(page.locator(".answer")).toHaveCount(4);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.clock.resume();
    expect(
      (
        await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
          .analyze()
      ).violations,
    ).toEqual([]);
    await page.screenshot({
      path: `test-results/keine-ahnung-normal-${mode}-${info.project.name}.png`,
    });
    await page.getByRole("button", { name: "Nächste Frage" }).click();
    for (const [i, q] of round.questions.slice(1).entries()) {
      await page.clock.runFor(50);
      await page
        .locator(".answer")
        .filter({ hasText: q.answers.find((a) => a.id === q.correctId)!.text })
        .click();
      await page
        .getByRole("button", {
          name:
            i === round.questions.length - 2
              ? "Runde abschließen"
              : "Nächste Frage",
        })
        .click();
    }
    await expect(page.locator(".result-metrics")).toContainText(
      "davon 1 × Keine Ahnung",
    );
    const completed = (await readState(page)).rounds.find(
      (r) => r.id === round.id,
    )!;
    if (completed.unlocks?.length) {
      const celebration = page.getByRole("button", {
        name: "Weiter zum Ergebnis",
        exact: true,
      });
      await expect(celebration).toBeVisible();
      await celebration.click();
    }
    await expect(
      page
        .locator(".result-answer-strip")
        .getByLabel("Frage 1: keine Ahnung, als falsch gewertet"),
    ).toBeVisible();
    await page
      .locator(".review > details")
      .first()
      .locator(":scope > summary")
      .click();
    await expect(page.locator(".review > details").first()).toContainText(
      "Keine Ahnung",
    );
    await expect(page.locator(".review > details").first()).not.toContainText(
      "Zeit abgelaufen",
    );
  });
}

test("Reduzierte Animationen zeigen die richtige Lösung ruhig und erhalten die Tastaturbedienung", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await prepare(page);
  await page.getByRole("button", { name: "Keine Ahnung", exact: true }).click();
  await expect(page.locator(".solution-reveal")).toBeVisible();
  expect(
    await page
      .locator(".solution-reveal")
      .evaluate((el) => getComputedStyle(el).animationName),
  ).toBe("none");
  await page.clock.runFor(1100);
  await expect(
    page.getByRole("button", { name: "Nächste Frage" }),
  ).toBeEnabled();
});

test("Neuladen während der Lösungsanzeige bewahrt die Wahl; Offline-Fortsetzen speichert ohne doppelte Antwort", async ({
  page,
  context,
  browserName,
}) => {
  const round = await prepare(page);
  await page.evaluate(() =>
    navigator.serviceWorker.ready.then(() => undefined),
  );
  await page.getByRole("button", { name: "Keine Ahnung", exact: true }).click();
  await expect(page.locator(".solution-reveal")).toBeVisible();
  if (browserName === "chromium") await context.setOffline(true);
  await page.reload();
  await page.getByRole("button", { name: "Fortsetzen" }).click();
  if (browserName === "webkit") await context.setOffline(true);
  await expect(page.locator(".chosen-answer")).toContainText("Keine Ahnung");
  await expect(page.locator(".solution-reveal")).toHaveCount(0);
  expect(
    (await readState(page)).events.filter((e) => e.roundId === round.id),
  ).toHaveLength(1);
  await page.getByRole("button", { name: "Nächste Frage" }).click();
  await page.clock.runFor(50);
  await page.getByRole("button", { name: "Keine Ahnung", exact: true }).click();
  await expect(page.locator(".solution-reveal")).toBeVisible();
  await page.clock.runFor(1100);
  // Let WebKit flush passive effects after the offline reload with the clock
  // still anchored to the controlled test date.
  await page.clock.resume();
  await expect(page.locator(".solution-reveal")).toHaveCount(0);
  await page.getByRole("button", { name: "Runde abschließen" }).click();
  expect(
    (await readState(page)).events.filter(
      (e) => e.roundId === round.id && e.dontKnow,
    ),
  ).toHaveLength(2);
  await expect(page.locator(".result-metrics")).toContainText(
    "davon 2 × Keine Ahnung",
  );
});
