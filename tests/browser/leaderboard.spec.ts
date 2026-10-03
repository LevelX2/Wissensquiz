import { modePreparation, openRoundSetup, test, expect } from "./fixtures";
import { readFileSync } from "node:fs";
import { importCsv } from "../../src/importer";
import { packages } from "../../src/packages";
import { emptyState } from "../../src/model";
import { answer, complete, startRound } from "../../src/engine";
import AxeBuilder from "@axe-core/playwright";

test("Leere Highscores führen zur Rekordauswahl und zur Anmeldung", async ({
  page,
}) => {
  await page.clock.install({ time: new Date("2026-10-02T12:00:00+02:00") });
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Losspielen" })).toBeEnabled();
  await page.getByRole("button", { name: "Highscores", exact: true }).click();
  await expect(
    page
      .getByRole("group", { name: "Highscore-Bereiche", exact: true })
      .getByRole("button"),
  ).toHaveCount(3);
  await page
    .getByRole("button", { name: "Rekordspiel vorbereiten" })
    .press("Enter");
  await expect(page.locator(".round-setup")).toBeVisible();
  await openRoundSetup(page);
  await expect(modePreparation(page, /^10 Fragen 30 Sekunden/)).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(page.locator(".question-card")).toHaveCount(0);
  await page.reload();
  await openRoundSetup(page);
  await expect(modePreparation(page, /^10 Fragen 30 Sekunden/)).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page.getByRole("button", { name: "Highscores", exact: true }).click();
  await page
    .getByRole("button", { name: "Duelle", exact: true })
    .press("Enter");
  expect(
    (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze())
      .violations,
  ).toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "Im Profil anmelden" }).press("Enter");
  await expect(
    page.getByRole("heading", { name: "Anmelden", exact: true }),
  ).toBeVisible();
});

test("Genre und Schwierigkeit bleiben unabhängig einstellbar und über Neuladen erhalten", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Losspielen" })).toBeEnabled();
  await page.getByRole("button", { name: "Profil", exact: true }).click();
  await page.getByRole("button", { name: "Optionen" }).click();
  await page.getByLabel("Genre anzeigen", { exact: true }).click();
  await expect(
    page.getByLabel("Genre anzeigen", { exact: true }),
  ).not.toBeChecked();
  await page.reload();
  await page.getByRole("button", { name: "Losspielen" }).click();
  await expect(page.locator(".question-genre")).toHaveCount(0);
  await expect(page.locator(".question-difficulty")).toBeVisible();
  await page.getByRole("button", { name: "Pause & Startseite" }).click();
  await page.getByRole("button", { name: "Profil", exact: true }).click();
  await page.getByRole("button", { name: "Optionen" }).click();
  await page.getByLabel("Genre anzeigen", { exact: true }).click();
  await expect(
    page.getByLabel("Genre anzeigen", { exact: true }),
  ).toBeChecked();
  await page.getByLabel("Schwierigkeit anzeigen", { exact: true }).click();
  await expect(
    page.getByLabel("Schwierigkeit anzeigen", { exact: true }),
  ).not.toBeChecked();
  await page.reload();
  await page.getByRole("button", { name: "Fortsetzen" }).click();
  await expect(page.locator(".question-genre")).toBeVisible();
  await expect(page.locator(".question-difficulty")).toHaveCount(0);
  await page.locator(".answer").first().click();
  await expect(page.locator(".feedback")).toBeVisible();
  await expect(page.locator(".question-genre")).toBeVisible();
  await expect(page.locator(".question-difficulty")).toHaveCount(0);
});

test("Alle abgeschlossenen Läufe sind sichtbar, filterbar und offline im Rückblick erreichbar", async ({
  page,
  context,
}) => {
  await page.clock.install({ time: new Date("2026-09-26T12:00:00+02:00") });
  const questions = packages.flatMap(
    (p) => importCsv(readFileSync("public" + p.path, "utf8")).questions,
  );
  const state = emptyState(questions);
  for (const [i, genres] of [
    ["Horror"],
    ["Horror"],
    ["Horror", "Science-Fiction"],
    ["Fantasy"],
  ].entries()) {
    const run = emptyState(questions),
      r = startRound(
        run,
        {
          mode: "rekord",
          topic: "Alle Themen",
          difficulty: "Alle Stufen",
          filters: { genres, difficulties: ["leicht"], familiarities: [1] },
        },
        1790416800000 + i * 100000,
      );
    r.questions.forEach((q, j) =>
      answer(
        run,
        r.id,
        q.id,
        i === 0 ? null : q.correctId,
        1000,
        r.startedAt + 2000 + j * 2000,
      ),
    );
    complete(run, r.id, r.startedAt + 20000);
    state.rounds.push(r);
    state.events.push(...run.events);
  }
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Losspielen" })).toBeEnabled();
  await page.getByRole("button", { name: "Profil", exact: true }).click();
  await page.getByRole("button", { name: "Optionen" }).click();
  await expect(
    page.getByText("Die App-Dateien sind im Offline-Cache bestätigt.", {
      exact: false,
    }),
  ).toBeVisible({ timeout: 20000 });
  await page.evaluate(
    (value) =>
      new Promise<void>((resolve, reject) => {
        const req = indexedDB.open("wissensquiz");
        req.onsuccess = () => {
          const db = req.result,
            tx = db.transaction("state", "readwrite");
          tx.objectStore("state").put(value, "current");
          tx.oncomplete = () => {
            db.close();
            resolve();
          };
          tx.onerror = () => reject(tx.error);
        };
        req.onerror = () => reject(req.error);
      }),
    state,
  );
  await page.reload();
  await page.getByRole("button", { name: "Highscores", exact: true }).click();
  await expect(page.locator(".leaderboard-category")).toHaveCount(3);
  await expect(page.locator(".leaderboard-entry")).toHaveCount(4);
  const category = page.getByLabel("Vergleichskategorie", { exact: true });
  const options = await category.locator("option").allTextContents();
  await category.selectOption({
    label: options.find((o) => o.includes("Horror") && !o.includes("Sci-Fi"))!,
  });
  await expect(page.locator(".leaderboard-entry")).toHaveCount(2);
  await expect(page.locator(".leaderboard-entry").first()).toContainText(
    "Platz 1 · 790 Punkte",
  );
  await expect(page.locator(".leaderboard-entry").last()).toContainText(
    "Platz 2 · 0 Punkte",
  );
  await expect(page.locator(".leaderboard-entry").last()).toBeVisible();
  await page.setViewportSize({ width: 320, height: 740 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(
    (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze())
      .violations,
  ).toEqual([]);
  await page.getByRole("button", { name: "Spiel ansehen" }).first().click();
  await expect(
    page.getByRole("heading", { name: "Dein Rundenrückblick" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Bestenliste ansehen" }).click();
  await context.setOffline(true);
  await page.reload();
  await page.getByRole("button", { name: "Highscores", exact: true }).click();
  await expect(page.locator(".leaderboard-entry")).toHaveCount(4);
});
