import { test, expect } from "./fixtures";
import AxeBuilder from "@axe-core/playwright";
import { readFileSync } from "node:fs";
import { emptyState } from "../../src/model";
import { importCsv } from "../../src/importer";
import { answer, complete, startRound } from "../../src/engine";

test("Sammlung filtert gewählte Antworten einschließlich Fehlern, bietet leeren Zustand und erhält Fortschritt", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Losspielen" })).toBeEnabled();
  await page.getByRole("button", { name: "Sammlung", exact: true }).click();
  const filter = page.getByRole("group", { name: "Sammlungsfilter" });
  await filter
    .getByRole("button", { name: "Mit beantworteten Fragen", exact: true })
    .click();
  await expect(page.locator(".topic-card")).toHaveCount(0);
  await expect(
    page.getByText(/Noch keine Einträge mit beantworteten Fragen/),
  ).toBeVisible();
  await page.getByRole("button", { name: "Alle Einträge anzeigen" }).click();
  await expect(page.locator(".topic-card")).toHaveCount(779);

  const questions = importCsv(
    readFileSync("public/horror-fragen.csv", "utf8"),
  ).questions;
  const qs = [
    ...new Map(
      questions
        .filter((q) => q.difficulty === "leicht")
        .map((q) => [q.topic, q]),
    ).values(),
  ].slice(0, 3);
  const state = emptyState(questions);
  const round = startRound(state, {
    mode: "entdecken",
    topic: "Alle Themen",
    difficulty: "leicht",
  });
  round.questions = qs;
  round.order = qs.map((q) => q.answers.map((a) => a.id));
  answer(state, round.id, qs[0].id, qs[0].correctId, 1000);
  answer(
    state,
    round.id,
    qs[1].id,
    qs[1].answers.find((a) => a.id !== qs[1].correctId)!.id,
    1000,
  );
  answer(state, round.id, qs[2].id, null, 30000);
  complete(state, round.id);
  state.favorites = [qs[2].topic];
  await page.evaluate(async (value) => {
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.open("wissensquiz");
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
    });
  }, state);
  await page.reload();
  await page.getByRole("button", { name: "Sammlung", exact: true }).click();
  const readState = () =>
    page.evaluate(
      async () =>
        new Promise<string>((resolve, reject) => {
          const request = indexedDB.open("wissensquiz");
          request.onsuccess = () => {
            const db = request.result;
            const read = db
              .transaction("state")
              .objectStore("state")
              .get("current");
            read.onsuccess = () => {
              resolve(JSON.stringify(read.result));
              db.close();
            };
            read.onerror = () => reject(read.error);
          };
        }),
    );
  const before = await readState();
  await filter
    .getByRole("button", { name: "Mit beantworteten Fragen", exact: true })
    .click();
  await expect(page.locator(".topic-card")).toHaveCount(2);
  for (const q of qs.slice(0, 2))
    await expect(
      page
        .locator(".topic-card")
        .getByRole("heading", { name: q.topic, exact: true }),
    ).toBeVisible();
  await expect(
    page
      .locator(".topic-card")
      .getByRole("heading", { name: qs[2].topic, exact: true }),
  ).toHaveCount(0);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(
    (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze())
      .violations,
  ).toEqual([]);
  await page.screenshot({ path: "test-results/sammlung-filter-320.png" });
  await filter.getByRole("button", { name: "Alle", exact: true }).click();
  await expect(page.locator(".topic-card")).toHaveCount(779);
  expect(await readState()).toBe(before);
});

for (const behavior of ["false", "throws"] as const) {
  test(`Vibration bleibt bei abgelehnter Ausgabe (${behavior}) gespeichert und erklärt die Einschränkung`, async ({
    page,
  }) => {
    await page.addInitScript(
      (behavior) =>
        Object.defineProperty(navigator, "vibrate", {
          configurable: true,
          value: () => {
            if (behavior === "throws") throw new Error("not supported");
            return false;
          },
        }),
      behavior,
    );
    await page.goto("/");
    await page.getByRole("button", { name: "Profil", exact: true }).click();
    await page.getByRole("button", { name: "Optionen" }).click();
    const input = page.getByLabel("Vibration", { exact: true });
    await input.click();
    await expect(input).toBeChecked();
    await expect(
      page.getByText(/Der Browser konnte keine Vibration starten/),
    ).toBeVisible();
    await page.reload();
    await page.getByRole("button", { name: "Profil", exact: true }).click();
    await page.getByRole("button", { name: "Optionen" }).click();
    await expect(input).toBeChecked();
    await page.getByRole("button", { name: "Signal ausprobieren" }).click();
    await expect(
      page.getByText(/Der Browser konnte keine Vibration starten/),
    ).toBeVisible();
  });
}
