import { readFileSync } from "node:fs";
import { test, expect, readStoredState, type Page } from "./fixtures";
import { startRound } from "../../src/engine";

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
  await page.evaluate(
    (value) =>
      new Promise<void>((resolve, reject) => {
        const request = indexedDB.open("wissensquiz");
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const db = request.result,
            tx = db.transaction("state", "readwrite");
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
}

test("lädt drei neue Pakete einmal, schützt das Regieteam und erhält alle Fragen und Antworten offline", async ({
  page,
  context,
}) => {
  await page.clock.install({ time: new Date("2026-10-07T12:00:00+02:00") });
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Losspielen" })).toBeEnabled();
  const initial = await readStoredState(page);
  expect(initial.questions).toHaveLength(10877);
  expect(initial.imports).toHaveLength(24);
  expect(
    initial.questions.filter((q) => q.id.startsWith("E20261007-")),
  ).toHaveLength(2480);
  await prepareQuestion(page, "E20261007-F-180-D");
  await expect(page.locator(".question-card h1")).not.toContainText(
    "Roger Waters",
  );
  await expect(page.locator(".question-card h1")).not.toContainText(
    "Sean Evans",
  );
  await expect(page.locator(".film-data")).toHaveCount(0);
  await page.getByRole("button", { name: "Keine Ahnung", exact: true }).click();
  await expect(page.locator(".explanation")).toBeVisible();
  await page.locator(".film-data > summary").click();
  await expect(page.locator(".film-data")).toContainText(
    "Roger Waters und Sean Evans",
  );
  await expect(page.locator(".film-data")).toContainText("2014");
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
  for (const path of [
    "/film-erweiterung-20261007-fragen.csv",
    "/personen-erweiterung-20261007-fragen.csv",
    "/preise-erweiterung-20261007-fragen.csv",
  ])
    expect(
      await page.evaluate(async (url) => (await fetch(url)).text(), path),
    ).toBe(readFileSync(`public${path}`, "utf8"));
  const final = await readStoredState(page);
  expect(final.questions).toEqual(initial.questions);
  expect(final.imports).toHaveLength(24);
  expect(
    final.events.filter((e) => e.questionId === "E20261007-F-180-D"),
  ).toHaveLength(1);
});

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
