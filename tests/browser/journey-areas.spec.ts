import { test, expect, readStoredState } from "./fixtures";
import AxeBuilder from "@axe-core/playwright";
import { readFileSync } from "node:fs";
import { packages, addPackages } from "../../src/packages";
import { emptyState, type State } from "../../src/model";
import { startRound } from "../../src/engine";
import { actorPresentation } from "../../src/actorEditorial";
import type { Page } from "./fixtures";

async function writeState(page: Page, value: State) {
  await page.evaluate(
    (state) =>
      new Promise<void>((resolve, reject) => {
        const request = indexedDB.open("wissensquiz");
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const db = request.result,
            tx = db.transaction("state", "readwrite");
          tx.objectStore("state").put(state, "current");
          tx.oncomplete = () => {
            db.close();
            resolve();
          };
          tx.onerror = () => reject(tx.error);
        };
      }),
    value,
  );
}
const now = new Date("2026-10-03T12:00:00+02:00");
test("Filmreise erhält die additive Auswahl, zeigt getrennte Stufen und spielt reine Personenrunden", async ({
  page,
}) => {
  await page.clock.install({ time: now });
  await page.setViewportSize({ width: 320, height: 820 });
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Losspielen" })).toBeEnabled();
  const sources = page.getByRole("group", {
    name: "Fragenbereiche",
    exact: true,
  });
  await sources.getByLabel("Schauspieler", { exact: true }).check();
  await sources.getByLabel("Preisträger", { exact: true }).check();
  await expect(page.getByRole("button", { name: /Filmreise/ })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page.getByText("Deine Stufenfortschritte", { exact: true }).click();
  const panel = page.locator(".learning-path");
  await expect(
    panel.getByRole("progressbar", {
      name: "Schauspieler: Fortschritt zu Experte",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    panel.getByRole("progressbar", {
      name: "Preisträger: Fortschritt zu Mittel",
      exact: true,
    }),
  ).toHaveAttribute("max", "20");
  await page.getByRole("button", { name: "Losspielen" }).click();
  let state = await readStoredState(page);
  const mixed = state.rounds.find((r) => r.status === "active")!;
  expect(mixed.mode).toBe("entdecken");
  expect(mixed.filters?.sources).toEqual(["film", "awards", "actors"]);
  expect(
    mixed.questions
      .filter((q) => q.metadata.person_id || q.tags.includes("Preisträger"))
      .every((q) => q.difficulty === "leicht"),
  ).toBe(true);
  await page.getByRole("button", { name: "Pause & Startseite" }).click();
  await page
    .getByRole("button", { name: "Runde beenden", exact: true })
    .click();
  await expect
    .poll(
      async () =>
        (await readStoredState(page)).rounds.filter(
          (r) => r.status === "active",
        ).length,
    )
    .toBe(0);
  await sources.getByLabel("Filmfragen", { exact: true }).uncheck();
  await expect
    .poll(
      async () => (await readStoredState(page)).settings.roundSetup?.sources,
    )
    .toEqual(["awards", "actors"]);
  await sources.getByLabel("Preisträger", { exact: true }).uncheck();
  await expect
    .poll(
      async () => (await readStoredState(page)).settings.roundSetup?.sources,
    )
    .toEqual(["actors"]);
  await page.reload();
  await expect(page.getByRole("button", { name: /Filmreise/ })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(
    sources.getByLabel("Schauspieler", { exact: true }),
  ).toBeChecked();
  await expect(
    sources.getByLabel("Filmfragen", { exact: true }),
  ).not.toBeChecked();
  expect(
    (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze())
      .violations,
  ).toEqual([]);
  await page.screenshot({
    path: "test-results/filmreise-schauspieler-320.png",
  });
  await page.getByRole("button", { name: "Losspielen" }).click();
  state = await readStoredState(page);
  const people = state.rounds.find((r) => r.status === "active")!;
  expect(people.filters?.sources).toEqual(["actors"]);
  expect(people.mode).toBe("entdecken");
  expect(
    people.questions.every(
      (q) => !!q.metadata.person_id && q.difficulty === "leicht",
    ),
  ).toBe(true);
});
for (const suffix of ["001-M-2", "001-S-2", "001-M-1"]) {
  test(`${suffix}: vollständiger Name, individuelle Vertiefung und passende Filmdaten im alten Snapshot`, async ({
    page,
  }) => {
    await page.clock.install({ time: now });
    await page.setViewportSize({ width: 320, height: 820 });
    await page.goto("/");
    await expect(
      page.getByRole("button", { name: "Losspielen" }),
    ).toBeEnabled();
    const state = emptyState();
    addPackages(
      state,
      packages.map((p) => ({
        filename: p.filename,
        text: readFileSync(`public${p.path}`, "utf8"),
      })),
    );
    const q = state.questions.find((q) => q.id.endsWith(suffix))!;
    const catalog = state.questions;
    state.questions = [q];
    const round = startRound(
      state,
      { mode: "ueben", topic: "Schauspieler", difficulty: "Alle Stufen" },
      now.getTime(),
    );
    state.questions = catalog;
    await writeState(page, state);
    await page.reload();
    await page.getByRole("button", { name: "Fortsetzen" }).click();
    await expect(page.locator(".question-card h1")).toContainText("Tom Hanks");
    await expect(page.locator(".film-data")).toHaveCount(0);
    await expect(page.locator(".explanation")).toHaveCount(0);
    await page
      .locator(".answer")
      .filter({ hasText: q.answers.find((a) => a.id === q.correctId)!.text })
      .click();
    await page.getByText("Etwas tiefer eintauchen", { exact: true }).click();
    const editorial = actorPresentation(q)!;
    await expect(page.locator(".explanation")).toContainText(editorial.text);
    await expect(page.locator(".film-data")).toHaveCount(
      editorial.films.length ? 1 : 0,
    );
    if (editorial.films.length) {
      await page.getByText("Filmdaten", { exact: true }).click();
      await expect(page.locator(".film-data h3")).toHaveCount(
        editorial.films.length,
      );
      await expect(page.locator(".film-data")).toContainText(
        "Erscheinungsjahr",
      );
      await expect(page.locator(".film-data")).toContainText("Regie");
    }
    expect(
      (await readStoredState(page)).rounds.find((r) => r.id === round.id)!
        .questions[0],
    ).toEqual(q);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({ path: `test-results/actor-${suffix}-320.png` });
  });
}
