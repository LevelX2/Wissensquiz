import { writeStoredState } from "./fixtures";

import { test, expect, readStoredState, type Page } from "./fixtures";
import { startRound } from "../../src/engine";

test.use({ acknowledgeIncidentalSuccess: true });

async function prepareQuestion(page: Page, id: string) {
  const state = await readStoredState(page),
    catalog = state.questions;
  state.questions = [catalog.find((q) => q.id === id)!];
  startRound(
    state,
    { mode: "ueben", topic: "Alle Themen", difficulty: "Alle Stufen" },
    Date.parse("2026-10-07T11:59:00+02:00"),
  );
  state.questions = catalog;
  await writeStoredState(page, state);
  await page.reload();
  await page.getByRole("button", { name: "Fortsetzen" }).click();
}

test("zeigt neue Personen mit vollständigem Namen und deren Filmdaten sowie Preisträgerdaten ausschließlich nach der Antwort", async ({
  page,
}) => {
  await page.clock.install({ time: new Date("2026-10-07T12:00:00+02:00") });
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Losspielen" })).toBeEnabled();
  await prepareQuestion(page, "E20261007-P-001-L1");
  await expect(page.locator(".question-card h1")).toContainText("Tim Robbins");
  await expect(page.locator(".film-data")).toHaveCount(0);
  await page.getByRole("button", { name: "Keine Ahnung", exact: true }).click();
  await expect(page.locator(".explanation")).toContainText("Banker");
  await page.locator(".film-data > summary").click();
  await expect(page.locator(".film-data")).toContainText(
    "The Shawshank Redemption",
  );
  await expect(page.locator(".film-data")).toContainText("Frank Darabont");
  await page.getByRole("button", { name: "Runde abschließen" }).click();
  await page.getByRole("button", { name: "Neue Runde wählen" }).click();
  await prepareQuestion(page, "E20261007-A-018-L");
  await expect(page.locator(".question-card h1")).not.toContainText(
    "Der letzte Kaiser",
  );
  await expect(page.locator(".film-data")).toHaveCount(0);
  await page.getByRole("button", { name: "Keine Ahnung", exact: true }).click();
  await expect(page.locator(".explanation")).toContainText("Der letzte Kaiser");
  await page.locator(".film-data > summary").click();
  await expect(page.locator(".film-data")).toContainText("Bernardo Bertolucci");
  const state = await readStoredState(page);
  expect(
    state.events.filter((e) => e.questionId.startsWith("E20261007-")),
  ).toHaveLength(2);
});
