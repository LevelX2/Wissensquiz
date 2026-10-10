import { writeStoredState } from "./fixtures";
import { catalogCounts } from "../catalog-counts";
import { readFileSync } from "node:fs";
import { test, expect, readStoredState } from "./fixtures";
import { startRound } from "../../src/engine";

const packagePath = "/film-ergaenzung-240-fragen.csv";
const expectedCsv = readFileSync(`public${packagePath}`, "utf8");

test("240-Film-Paket lädt einmal, zeigt das vollständige Hondo-Regieteam erst zur Lösung und bleibt nach Neuladen verfügbar", async ({
  page,
  context,
}) => {
  await page.clock.install({ time: new Date("2026-10-06T12:00:00+02:00") });
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Losspielen" })).toBeEnabled();
  const state = await readStoredState(page);
  expect(state.questions).toHaveLength(catalogCounts.questions);
  expect(
    state.questions.filter((q) => q.id.startsWith("F240-20261006-")),
  ).toHaveLength(1920);
  const q = state.questions.find((q) => q.id === "F240-20261006-230-L1")!;
  const catalog = state.questions;
  state.questions = [q];
  startRound(
    state,
    { mode: "ueben", topic: "Alle Themen", difficulty: "Alle Stufen" },
    Date.parse("2026-10-06T11:59:00+02:00"),
  );
  state.questions = catalog;
  await writeStoredState(page, state);
  await page.reload();
  await page.getByRole("button", { name: "Fortsetzen" }).click();
  await expect(page.locator(".question-card h1")).toContainText("Hondo");
  await expect(page.locator(".film-data")).toHaveCount(0);
  await page.getByRole("button", { name: "Keine Ahnung", exact: true }).click();
  await expect(page.locator(".explanation")).toBeVisible();
  await page.locator(".film-data > summary").click();
  await expect(page.locator(".film-data")).toContainText(
    "John Farrow und John Ford",
  );
  await expect(page.locator(".film-data")).toContainText("1953");
  await expect(page.locator(".film-data")).toContainText("USA");
  await expect(page.locator(".film-data")).toContainText("Vorspanncredit");
  await page.getByRole("button", { name: "Pause & Startseite" }).click();
  await page.getByRole("button", { name: "Profil", exact: true }).click();
  await page.getByRole("button", { name: "Optionen" }).click();
  await page.reload();
  await page.getByRole("button", { name: "Fortsetzen" }).click();
  await expect(page.locator(".explanation")).toBeVisible();
  await page.locator(".film-data > summary").click();
  await expect(page.locator(".film-data")).toContainText(
    "John Farrow und John Ford",
  );
  expect(
    await page.evaluate(
      async (path) => (await fetch(path)).text(),
      packagePath,
    ),
  ).toBe(expectedCsv);
  const saved = await readStoredState(page);
  expect(saved.questions).toHaveLength(catalogCounts.questions);
  expect(
    saved.questions.filter((q) => q.id.startsWith("F240-20261006-")),
  ).toHaveLength(1920);
  expect(saved.events.filter((e) => e.questionId === q.id)).toHaveLength(1);
  expect(saved.events.find((e) => e.questionId === q.id)?.dontKnow).toBe(true);
});
