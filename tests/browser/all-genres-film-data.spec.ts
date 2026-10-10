import { writeStoredState } from "./fixtures";
import { test, expect } from "./fixtures";
import { readFileSync } from "node:fs";
import { addPackages, packages } from "../../src/packages";
import { emptyState } from "../../src/model";
import { startRound } from "../../src/engine";

test("neue Filmdaten zeigen nach der Antwort Regie, Jahr, Produktionsland und Reihenposition auch nach Neuladen", async ({
  page,
  context,
}) => {
  await page.clock.install({ time: new Date("2026-10-02T12:00:00+02:00") });
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Losspielen" })).toBeEnabled();
  const state = emptyState();
  addPackages(
    state,
    packages.map((p) => ({
      filename: p.filename,
      text: readFileSync(`public${p.path}`, "utf8"),
    })),
  );
  const q = state.questions.find(
    (question) => question.id === "ADV-202610-P01-L-003",
  )!;
  const all = state.questions;
  state.questions = [q];
  startRound(
    state,
    { mode: "ueben", topic: q.topic, difficulty: "Alle Stufen" },
    Date.parse("2026-10-02T11:59:00+02:00"),
  );
  state.questions = all;
  await writeStoredState(page, state);
  await page.reload();
  await page.getByRole("button", { name: "Fortsetzen" }).click();
  await expect(page.locator(".film-data")).toHaveCount(0);
  await page
    .locator(".answer")
    .filter({ hasText: q.answers.find((a) => a.id === q.correctId)!.text })
    .click();
  await expect(page.locator(".explanation")).toBeVisible();
  await page.locator(".film-data > summary").click();
  await expect(page.locator(".film-data")).toContainText(
    "Indiana Jones and the Last Crusade",
  );
  await expect(page.locator(".film-data")).toContainText("1989");
  await expect(page.locator(".film-data")).toContainText("Steven Spielberg");
  await expect(page.locator(".film-data")).toContainText("USA");
  await expect(page.locator(".film-data")).toContainText("Teil 3");
  await page.locator(".film-director-context summary").click();
  await expect(page.locator(".film-director-context p")).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: "Fortsetzen" }).click();
  await expect(page.locator(".explanation")).toBeVisible();
  await page.locator(".film-data > summary").click();
  await expect(page.locator(".film-data")).toContainText("Teil 3");
});
