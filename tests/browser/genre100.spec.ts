import { readFileSync } from "node:fs";
import { test, expect, readStoredState, type Page } from "./fixtures";
import { startRound } from "../../src/engine";
import { questionSourceOf, genreOf } from "../../src/filters";
import { filmIdentity } from "../../src/familiarity";
import { catalogCounts } from "../catalog-counts";

test("enthält 100 Rom-Com-Filme, erhält beide bestehenden Regieziele und lädt das Paket offline", async ({
  page,
  context,
}) => {
  await page.clock.install({ time: new Date("2026-10-08T12:00:00+02:00") });
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Losspielen" })).toBeEnabled();
  const initial = await readStoredState(page);
  const romcom = initial.questions.filter(
    (q) => questionSourceOf(q) === "film" && genreOf(q) === "Rom-Com",
  );
  expect(new Set(romcom.map(filmIdentity)).size).toBe(100);
  expect(romcom).toHaveLength(830);
  for (const [id, original] of [
    ["G100-20261008-ROMCOM-004-D", "SCHAUSPIELER-202610-P01-070-S-1"],
    ["G100-20261008-ROMCOM-012-D", "SCHAUSPIELER-202610-P01-081-S-2"],
  ]) {
    expect(initial.questions.find((q) => q.id === id)!.knowledgeId).toBe(
      initial.questions.find((q) => q.id === original)!.knowledgeId,
    );
  }
  await prepareQuestion(page, "G100-20261008-ROMCOM-004-D");
  await expect(page.locator(".question-card h1")).not.toContainText(
    "Woody Allen",
  );
  await expect(page.locator(".film-data")).toHaveCount(0);
  await page.getByRole("button", { name: "Keine Ahnung", exact: true }).click();
  await page.locator(".film-data > summary").click();
  await expect(page.locator(".film-data")).toContainText("Woody Allen");
  await expect(page.locator(".film-data")).toContainText("1977");
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
  expect(
    await page.evaluate(async () =>
      (await fetch("/genre100-romcom-fragen.csv")).text(),
    ),
  ).toBe(readFileSync("public/genre100-romcom-fragen.csv", "utf8"));
  expect((await readStoredState(page)).questions).toEqual(initial.questions);
});

test("enthält 100 Musikfilme, teilt das bestehende Regieziel und erhält den Festival-Erststart offline", async ({
  page,
  context,
}) => {
  await page.clock.install({ time: new Date("2026-10-08T12:00:00+02:00") });
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Losspielen" })).toBeEnabled();
  const initial = await readStoredState(page);
  const music = initial.questions.filter(
    (q) => questionSourceOf(q) === "film" && genreOf(q) === "Musik",
  );
  expect(new Set(music.map(filmIdentity)).size).toBe(100);
  expect(music).toHaveLength(830);
  const variant = initial.questions.find(
    (q) => q.id === "G100-20261008-MUSIK-017-D",
  )!;
  expect(variant.knowledgeId).toBe(
    initial.questions.find((q) => q.id === "SCHAUSPIELER-202610-P01-004-M-2")!
      .knowledgeId,
  );
  const year = initial.questions.find(
    (q) => q.id === "G100-20261008-MUSIK-019-Y",
  )!;
  expect(year.metadata.film_year).toBe("2009");
  await prepareQuestion(page, year.id);
  await expect(page.locator(".question-card h1")).not.toContainText("2009");
  await expect(page.locator(".film-data")).toHaveCount(0);
  await page.getByRole("button", { name: "Keine Ahnung", exact: true }).click();
  await page.locator(".film-data > summary").click();
  await expect(page.locator(".film-data")).toContainText("2009");
  await expect(page.locator(".film-data")).toContainText("2010");
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
  expect(
    await page.evaluate(async () =>
      (await fetch("/genre100-musik-fragen.csv")).text(),
    ),
  ).toBe(readFileSync("public/genre100-musik-fragen.csv", "utf8"));
  expect((await readStoredState(page)).questions).toEqual(initial.questions);
});

async function prepareQuestion(page: Page, id: string) {
  const state = await readStoredState(page);
  const catalog = state.questions;
  state.questions = [catalog.find((q) => q.id === id)!];
  startRound(
    state,
    { mode: "ueben", topic: "Alle Themen", difficulty: "Alle Stufen" },
    Date.parse("2026-10-08T12:00:00+02:00"),
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

test("enthält 100 Abenteuerfilme, schützt beide Regienamen und lädt das neue Paket offline", async ({
  page,
  context,
}) => {
  await page.clock.install({ time: new Date("2026-10-08T12:00:00+02:00") });
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Losspielen" })).toBeEnabled();
  const initial = await readStoredState(page);
  expect(initial.questions).toHaveLength(catalogCounts.questions);
  const adventure = initial.questions.filter(
    (q) => questionSourceOf(q) === "film" && genreOf(q) === "Abenteuer",
  );
  expect(new Set(adventure.map(filmIdentity)).size).toBe(100);
  expect(adventure).toHaveLength(802);
  await prepareQuestion(page, "G100-20261008-ABENTEUER-038-D");
  await expect(page.locator(".question-card h1")).not.toContainText(
    "Kevin Lima",
  );
  await expect(page.locator(".question-card h1")).not.toContainText(
    "Chris Buck",
  );
  await expect(page.locator(".film-data")).toHaveCount(0);
  await page.getByRole("button", { name: "Keine Ahnung", exact: true }).click();
  await expect(page.locator(".explanation")).toBeVisible();
  await page.locator(".film-data > summary").click();
  await expect(page.locator(".film-data")).toContainText(
    "Kevin Lima und Chris Buck",
  );
  await expect(page.locator(".film-data")).toContainText("1999");
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
  expect(
    await page.evaluate(async () =>
      (await fetch("/genre100-abenteuer-fragen.csv")).text(),
    ),
  ).toBe(readFileSync("public/genre100-abenteuer-fragen.csv", "utf8"));
  const saved = await readStoredState(page);
  expect(saved.questions).toEqual(initial.questions);
  expect(saved.imports).toHaveLength(catalogCounts.packages);
});

test("unterscheidet den frühen Erststart von einem späteren Länderstart und zeigt Jahresdaten erst nach der Antwort", async ({
  page,
}) => {
  await page.clock.install({ time: new Date("2026-10-08T12:00:00+02:00") });
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Losspielen" })).toBeEnabled();
  await prepareQuestion(page, "G100-20261008-ABENTEUER-019-Y");
  await expect(page.locator(".question-card h1")).not.toContainText("1986");
  await expect(page.locator(".film-data")).toHaveCount(0);
  await page.getByRole("button", { name: "Keine Ahnung", exact: true }).click();
  await page.locator(".film-data > summary").click();
  await expect(page.locator(".film-data")).toContainText("1986");
  await expect(page.locator(".film-data")).toContainText("1987");
});

test("enthält 100 Thrillerfilme, erhält die bestehende Wissenszielidentität und lädt das Paket offline", async ({
  page,
  context,
}) => {
  await page.clock.install({ time: new Date("2026-10-08T12:00:00+02:00") });
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Losspielen" })).toBeEnabled();
  const initial = await readStoredState(page);
  const thriller = initial.questions.filter(
    (q) => questionSourceOf(q) === "film" && genreOf(q) === "Thriller",
  );
  expect(new Set(thriller.map(filmIdentity)).size).toBe(100);
  expect(thriller).toHaveLength(812);
  const variant = initial.questions.find(
    (q) => q.id === "G100-20261008-THRILLER-012-D",
  )!;
  expect(variant.knowledgeId).toBe(
    initial.questions.find((q) => q.id === "SCHAUSPIELER-202610-P03-153-M-1")!
      .knowledgeId,
  );
  await prepareQuestion(page, "G100-20261008-THRILLER-012-Y");
  await expect(page.locator(".question-card h1")).not.toContainText("1966");
  await expect(page.locator(".film-data")).toHaveCount(0);
  await page.getByRole("button", { name: "Keine Ahnung", exact: true }).click();
  await page.locator(".film-data > summary").click();
  await expect(page.locator(".film-data")).toContainText("1966");
  await expect(page.locator(".film-data")).toContainText("1967");
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
  expect(
    await page.evaluate(async () =>
      (await fetch("/genre100-thriller-fragen.csv")).text(),
    ),
  ).toBe(readFileSync("public/genre100-thriller-fragen.csv", "utf8"));
  expect((await readStoredState(page)).questions).toEqual(initial.questions);
});

test("enthält 100 Martial-Arts-Filme, unterscheidet die zweiteilige Erstveröffentlichung und lädt das Paket offline", async ({
  page,
  context,
}) => {
  await page.clock.install({ time: new Date("2026-10-08T12:00:00+02:00") });
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Losspielen" })).toBeEnabled();
  const initial = await readStoredState(page);
  const martial = initial.questions.filter(
    (q) =>
      questionSourceOf(q) === "film" &&
      genreOf(q) === "Martial Arts & Asia-Film",
  );
  expect(new Set(martial.map(filmIdentity)).size).toBe(100);
  expect(martial).toHaveLength(830);
  const year = initial.questions.find(
    (q) => q.id === "G100-20261008-MARTIALARTS-003-Y",
  )!;
  expect(year.metadata.film_year).toBe("1970");
  await prepareQuestion(page, year.id);
  await expect(page.locator(".question-card h1")).not.toContainText("1970");
  await expect(page.locator(".film-data")).toHaveCount(0);
  await page.getByRole("button", { name: "Keine Ahnung", exact: true }).click();
  await page.locator(".film-data > summary").click();
  await expect(page.locator(".film-data")).toContainText("1970");
  await expect(page.locator(".film-data")).toContainText("1971");
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
  expect(
    await page.evaluate(async () =>
      (await fetch("/genre100-martialarts-fragen.csv")).text(),
    ),
  ).toBe(readFileSync("public/genre100-martialarts-fragen.csv", "utf8"));
  expect((await readStoredState(page)).questions).toEqual(initial.questions);
});

test("enthält 100 Actionfilme, trennt Hauptregie und zweite Einheit und lädt das Paket offline", async ({
  page,
  context,
}) => {
  await page.clock.install({ time: new Date("2026-10-08T12:00:00+02:00") });
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Losspielen" })).toBeEnabled();
  const initial = await readStoredState(page);
  const action = initial.questions.filter(
    (q) => questionSourceOf(q) === "film" && genreOf(q) === "Action",
  );
  expect(new Set(action.map(filmIdentity)).size).toBe(100);
  expect(action).toHaveLength(828);
  await prepareQuestion(page, "G100-20261008-ACTION-009-D");
  await expect(page.locator(".question-card h1")).not.toContainText("Hunt");
  await expect(page.locator(".film-data")).toHaveCount(0);
  await page.getByRole("button", { name: "Keine Ahnung", exact: true }).click();
  await page.locator(".film-data > summary").click();
  await expect(
    page
      .locator(".film-data dl > div")
      .filter({ has: page.getByText("Regie", { exact: true }) })
      .locator("dd"),
  ).toHaveText("Peter R. Hunt");
  await expect(page.locator(".film-data")).toContainText("John Glen");
  await expect(page.locator(".film-data")).toContainText("zweite Einheit");
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
  expect(
    await page.evaluate(async () =>
      (await fetch("/genre100-action-fragen.csv")).text(),
    ),
  ).toBe(readFileSync("public/genre100-action-fragen.csv", "utf8"));
  expect((await readStoredState(page)).questions).toEqual(initial.questions);
});
