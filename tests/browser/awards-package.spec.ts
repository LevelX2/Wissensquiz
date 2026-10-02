import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { readFileSync } from "node:fs";
import { importCsv } from "../../src/importer";
import { addPackages, packages } from "../../src/packages";
import { emptyState } from "../../src/model";
import { startRound } from "../../src/engine";

test("Preisträger und Experte sind mobil auswählbar, zeigen Vertiefung und bleiben offline erhalten", async ({
  page,
  context,
}) => {
  await page.clock.install({ time: new Date("2026-10-02T12:00:00+02:00") });
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Losspielen" })).toBeEnabled();
  await page.getByRole("button", { name: "Themen", exact: true }).click();
  await page.getByRole("button", { name: "Preisträger spielen" }).click();
  await expect(
    page.getByLabel("Nur Preisträger", { exact: true }),
  ).toBeChecked();
  await page.getByRole("button", { name: /Freies Spiel Alle Stufen/ }).click();
  const levels = page.getByRole("group", {
    name: "Schwierigkeitsstufen",
    exact: true,
  });
  for (const level of ["Leicht", "Mittel", "Schwer"])
    await levels.getByLabel(level, { exact: true }).uncheck();
  await expect(levels.getByLabel("Experte", { exact: true })).toBeChecked();
  await expect(page.locator("#round-summary")).toContainText("5 Fragen");
  await expect(page.locator("#round-summary")).toContainText("Preisträger");
  expect(
    (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze())
      .violations,
  ).toEqual([]);
  await page
    .locator(".round-setup")
    .screenshot({ path: "test-results/preistraeger-experte-320.png" });
  await page.getByRole("button", { name: "Losspielen" }).click();
  await expect(page.locator(".question-difficulty")).toHaveText(
    "Schwierigkeit: Experte",
  );
  await expect(page.locator(".film-data")).toHaveCount(0);
  await page.locator(".answer").first().click();
  await expect(page.locator(".explanation")).toBeVisible();
  await page.locator(".film-data > summary").click();
  await expect(page.locator(".film-data")).toContainText("Regie");
  await expect(page.locator(".film-data")).toContainText("Produktionsländer");
  await page
    .locator(".film-data")
    .screenshot({ path: "test-results/preistraeger-filmdaten-320.png" });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "Pause & Startseite" }).click();
  await page.getByRole("button", { name: "Profil", exact: true }).click();
  await page.getByRole("button", { name: "Optionen" }).click();
  await expect(
    page.getByText("Die App-Dateien sind im Offline-Cache bestätigt.", {
      exact: false,
    }),
  ).toBeVisible();
  await context.setOffline(true);
  await page.reload();
  await page.getByRole("button", { name: "Fortsetzen" }).click();
  await expect(page.locator(".explanation")).toBeVisible();
  await expect(page.locator(".question-difficulty")).toHaveText(
    "Schwierigkeit: Experte",
  );
  await expect(page.locator(".question-history")).toContainText(
    "1× beantwortet",
  );
});

test("Gewinnerfilm-Fragen verraten die Lösung erst nach der Antwort und zeigen das Filmjahr", async ({
  page,
}) => {
  await page.clock.install({ time: new Date("2026-10-02T12:00:00+02:00") });
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Losspielen" })).toBeEnabled();
  const q = importCsv(readFileSync("public/preistraeger-fragen.csv", "utf8"))
    .questions[0];
  const state = emptyState([q]);
  startRound(
    state,
    { mode: "ueben", topic: "Preisträger", difficulty: "leicht" },
    Date.parse("2026-10-02T11:59:00+02:00"),
  );
  addPackages(
    state,
    packages.map((p) => ({
      filename: p.filename,
      text: readFileSync(`public${p.path}`, "utf8"),
    })),
  );
  await page.evaluate(
    (value) =>
      new Promise<void>((resolve, reject) => {
        const req = indexedDB.open("wissensquiz");
        req.onerror = () => reject(req.error);
        req.onsuccess = () => {
          const db = req.result;
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
  await page.getByRole("button", { name: "Fortsetzen" }).click();
  await expect(page.locator(".question-card h1")).not.toContainText(
    q.metadata.film_title_de,
  );
  await expect(page.locator(".film-data")).toHaveCount(0);
  await page
    .locator(".answer")
    .filter({ hasText: q.answers.find((a) => a.id === q.correctId)!.text })
    .click();
  await expect(page.locator(".explanation")).toContainText("1940");
  await page.locator(".film-data > summary").click();
  await expect(page.locator(".film-data")).toContainText("Gone with the Wind");
  await expect(page.locator(".film-data")).toContainText("1939");
  await expect(page.locator(".film-data")).toContainText("Victor Fleming");
});
