import {
  openRoundSetup,
  test,
  expect,
  readStoredState,
  type Page,
} from "./fixtures";
import { readFileSync } from "node:fs";
import { importCsv } from "../../src/importer";
import { packages } from "../../src/packages";
import { startRound } from "../../src/engine";
import type { Question, State } from "../../src/model";
const imported = packages.flatMap(
  (p) => importCsv(readFileSync(`public${p.path}`, "utf8")).questions,
);
async function launch(page: Page) {
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Losspielen" })).toBeEnabled();
}
// Historical single-film rounds remain resumable although new film selection is removed.
async function resumeFilmFixture(page: Page, topic: string) {
  const state = await readStoredState(page);
  const round = startRound(state, {
    mode: "ueben",
    topic,
    difficulty: "leicht",
  });
  const q = state.questions.find(
    (q) =>
      q.topic === topic &&
      q.difficulty === "leicht" &&
      !q.id.startsWith("FACT-"),
  )!;
  round.questions = [q];
  round.order = [q.answers.map((a) => a.id)];
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
}
async function answerCurrent(page: Page, correct = true) {
  const questionId = await page
    .locator(".question-card h1")
    .getAttribute("data-question-id");
  const q = await page.evaluate(
    (id) =>
      new Promise<Question>((resolve, reject) => {
        const req = indexedDB.open("wissensquiz");
        req.onerror = () => reject(req.error);
        req.onsuccess = () => {
          const db = req.result;
          const query = db
            .transaction("state")
            .objectStore("state")
            .get("current");
          query.onsuccess = () => {
            const state = query.result as State;
            const question = state.rounds
              .find((r) => r.status === "active")
              ?.questions.find((q) => q.id === id);
            db.close();
            question
              ? resolve(question)
              : reject(new Error(`Aktive Frage fehlt: ${id}`));
          };
          query.onerror = () => reject(query.error);
        };
      }),
    questionId,
  );
  const difficulty = `Schwierigkeit: ${q.difficulty[0].toUpperCase()}${q.difficulty.slice(1)}`;
  await expect(page.locator(".question-difficulty")).toHaveText(difficulty);
  await expect(page.locator(".question-difficulty")).toBeVisible();
  const a = q.answers.find((a) =>
    correct ? a.id === q.correctId : a.id !== q.correctId,
  )!;
  const button = page.getByRole("button", {
    name: new RegExp(a.text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
  });
  await expect(button).toBeEnabled();
  await button.click();
  await expect(page.locator(".feedback")).toBeVisible();
  await expect(page.locator(".question-difficulty")).toHaveText(difficulty);
  await expect(page.locator(".question-difficulty")).toBeVisible();
  return q;
}

test("Lernpfad ist Standard; freie Auswahl bleibt gespeichert; helle kompakte Fragen behalten Erklärungen und Optionen", async ({
  page,
}) => {
  await page.clock.install({ time: new Date("2026-09-26T12:00:00+02:00") });
  await page.setViewportSize({ width: 390, height: 844 });
  await launch(page);
  await expect(
    page.getByRole("button", { name: "Ton an", exact: true }),
  ).toHaveCount(0);
  await openRoundSetup(page);
  await expect(
    page.getByRole("button", { name: /Filmreise Filmwelten/ }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(
    page.getByText(/Mittel gesperrt · 0 \/ \d+ leichte Ziele/),
  ).toHaveCount(12);
  await page.reload();
  await openRoundSetup(page);
  await expect(
    page.getByRole("button", { name: /Filmreise Filmwelten/ }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Losspielen" }).click();
  await expect(page.locator(".question-difficulty")).toHaveText(
    "Schwierigkeit: Leicht",
  );
  await expect(page.locator(".answer")).toHaveCount(5);
  await expect(
    page.getByRole("button", { name: "Keine Ahnung", exact: true }),
  ).toBeEnabled();
  await expect(page.locator("footer")).not.toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({ path: "test-results/spiel-kompakt-390.png" });
  await answerCurrent(page);
  await expect(page.locator(".explanation")).toBeVisible();
  await expect(
    page.getByText("Etwas tiefer eintauchen", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Pause & Startseite" }).click();
  await openRoundSetup(page);
  await page.getByRole("button", { name: /Freies Spiel Alle Stufen/ }).click();
  await openRoundSetup(page);
  await page.locator(".round-guide summary").click();
  await expect(page.locator(".round-guide-details")).toBeVisible();
  await expect(page.locator(".round-guide-details")).toContainText(
    "zufällige Fragen ohne Zeitdruck",
  );
  await page.getByRole("button", { name: "Profil", exact: true }).click();
  await page.getByRole("button", { name: "Optionen" }).click();
  await expect(page.getByLabel("Soundeffekte", { exact: true })).toBeVisible();
});

test("Genres und Stufen lassen sich kombinieren und bleiben in der Runde erhalten", async ({
  page,
}) => {
  await page.clock.install({ time: new Date("2026-09-26T12:00:00+02:00") });
  await page.setViewportSize({ width: 320, height: 740 });
  await launch(page);
  await openRoundSetup(page);
  await page.getByRole("button", { name: /Freies Spiel Alle Stufen/ }).click();
  await openRoundSetup(page);
  await expect(
    page.getByRole("button", { name: /Freies Spiel Alle Stufen/ }),
  ).toHaveAttribute("aria-pressed", "true");
  const genres = page.getByRole("group", { name: "Filmgenres", exact: true });
  const levels = page.getByRole("group", {
    name: "Schwierigkeitsstufen",
    exact: true,
  });
  await expect(genres.getByRole("checkbox")).toHaveCount(12);
  await expect(page.getByLabel("Thema wählen")).not.toBeVisible();
  await page
    .getByRole("button", { name: "Alle Genres abwählen", exact: true })
    .click();
  await openRoundSetup(page);
  await genres.getByLabel("Sci-Fi", { exact: true }).check();
  await genres.getByLabel("Horror", { exact: true }).check();
  await levels.getByLabel("Schwer", { exact: true }).uncheck();
  await levels.getByLabel("Experte", { exact: true }).uncheck();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page
    .locator(".round-setup")
    .screenshot({ path: "test-results/multiple-filters-mobile.png" });
  await genres.getByLabel("Sci-Fi", { exact: true }).uncheck();
  await genres.getByLabel("Horror", { exact: true }).uncheck();
  await expect(page.getByRole("button", { name: "Losspielen" })).toBeDisabled();
  await expect(page.getByRole("status")).toContainText(
    "Für Filmfragen brauchst Du außerdem passende Genres und Filmgruppen",
  );
  await genres.getByLabel("Horror", { exact: true }).check();
  await genres.getByLabel("Sci-Fi", { exact: true }).check();
  await levels.getByLabel("Leicht", { exact: true }).uncheck();
  await levels.getByLabel("Mittel", { exact: true }).uncheck();
  await expect(page.getByRole("button", { name: "Losspielen" })).toBeDisabled();
  await levels.getByLabel("Leicht", { exact: true }).check();
  await levels.getByLabel("Mittel", { exact: true }).check();
  await page.getByRole("button", { name: "Losspielen" }).click();
  await answerCurrent(page);
  const readRound = async () =>
    (await readStoredState(page)).rounds.find((r) => r.status === "active")!;
  const before = await readRound();
  expect(before.filters).toEqual({
    genres: ["Horror", "Science-Fiction"],
    difficulties: ["leicht", "mittel"],
    familiarities: [1, 2, 3, 4],
    sources: ["film"],
  });
  expect(
    before.questions.every(
      (q) =>
        ["Horror", "Science-Fiction"].includes(q.metadata.subdomain) &&
        ["leicht", "mittel"].includes(q.difficulty),
    ),
  ).toBe(true);
  await page.reload();
  await page.getByRole("button", { name: "Fortsetzen" }).click();
  await expect(page.locator(".feedback")).toBeVisible();
  expect(await readRound()).toEqual(before);
});

test("Freigestellte Genreillustrationen laden auf Desktop und Handy sowie aus dem Offline-Paket", async ({
  page,
  context,
}) => {
  await launch(page);
  await page.getByRole("button", { name: "Profil", exact: true }).click();
  await page.getByRole("button", { name: "Optionen" }).click();
  await expect(
    page.getByText("Die App-Dateien sind im Offline-Cache bestätigt.", {
      exact: false,
    }),
  ).toBeVisible({ timeout: 20000 });
  await page.getByRole("button", { name: "Themen", exact: true }).click();
  await expect(page.locator(".genre-illustration")).toHaveCount(16);
  for (const img of await page.locator(".genre-illustration").all()) {
    await img.scrollIntoViewIfNeeded();
    await expect
      .poll(() => img.evaluate((el) => (el as HTMLImageElement).naturalWidth))
      .toBeGreaterThan(0);
  }
  await page
    .locator(".topic-grid")
    .screenshot({ path: "test-results/genre-illustrationen-desktop.png" });
  await page.setViewportSize({ width: 390, height: 844 });
  const actionCard = page.locator(".topic-card").filter({
    has: page.getByRole("heading", { name: "Action", exact: true }),
  });
  await actionCard.screenshot({
    path: "test-results/action-illustration-390.png",
  });
  await page.setViewportSize({ width: 320, height: 740 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await context.setOffline(true);
  await page.reload();
  await page.getByRole("button", { name: "Themen", exact: true }).click();
  for (const img of await page.locator(".genre-illustration").all()) {
    await img.scrollIntoViewIfNeeded();
    await expect
      .poll(() => img.evaluate((el) => (el as HTMLImageElement).naturalWidth))
      .toBeGreaterThan(0);
  }
  await page.getByRole("button", { name: "Spielen", exact: true }).click();
  await resumeFilmFixture(page, "Tombstone");
  await expect(page.locator(".film-title")).toHaveText("Tombstone");
  await expect(page.locator(".question-card h1")).not.toContainText("„");
  await expect(page.locator(".question-card h1")).toContainText("(1993)");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({ path: "test-results/filmtitel-320.png" });
});

for (const oldPackageCount of [1, 2, 3, 4, 5, 6, 8]) {
  test(`Neue Pakete ergänzen einen Spielstand mit ${oldPackageCount} Paketen beim Neuladen`, async ({
    page,
  }) => {
    await page.clock.install({ time: new Date("2026-09-26T12:00:00+02:00") });
    await launch(page);
    await openRoundSetup(page);
    await page.getByRole("button", { name: "Alle Genres abwählen" }).click();
    await openRoundSetup(page);
    await page
      .getByRole("group", { name: "Filmgenres", exact: true })
      .getByLabel("Sci-Fi", { exact: true })
      .check();
    await page.getByRole("button", { name: "Losspielen" }).click();
    await answerCurrent(page, true);
    await page.getByRole("button", { name: "Pause & Startseite" }).click();
    const legacyState = await readStoredState(page);
    await page.evaluate(
      async ({ packageCount, legacyState }) => {
        await new Promise<void>((resolve, reject) => {
          const request = indexedDB.open("wissensquiz");
          request.onsuccess = () => {
            const db = request.result;
            const tx = db.transaction("state", "readwrite");
            const store = tx.objectStore("state");
            const read = store.get("current");
            read.onsuccess = () => {
              const state = legacyState;
              state.questions = state.questions.filter(
                (q: { id: string }) =>
                  !q.id.includes("-202610-P01-") &&
                  !q.id.startsWith("MAR-") &&
                  !q.id.startsWith("ROM-") &&
                  !q.id.startsWith("ART-") &&
                  (packageCount >= 8 || !q.id.startsWith("CLA-")) &&
                  (packageCount >= 7 || !q.id.startsWith("DRA-")) &&
                  (packageCount >= 6 || !q.id.startsWith("WES-")) &&
                  (packageCount >= 5 || !q.id.startsWith("KOM-")) &&
                  (packageCount >= 4 || !q.id.startsWith("FAN-")) &&
                  (packageCount >= 3 || !q.id.startsWith("HOR-")) &&
                  (packageCount >= 2 || !q.id.startsWith("ACT-")),
              );
              state.imports = state.imports.filter(
                (r: { filename: string }) =>
                  ![
                    "MartialArts_Quiz_180_Fragen.csv",
                    "RomCom_Quiz_180_Fragen.csv",
                    "Arthouse_Quiz_180_Fragen.csv",
                    "Alle_Genres_120_Filme_960_Fragen.csv",
                    "Preistraeger_200_Fragen.csv",
                    "Schauspieler_800_Fragen_App.csv",
                  ].includes(r.filename) &&
                  (packageCount >= 8 ||
                    r.filename !== "Classics_Quiz_180_Fragen.csv") &&
                  (packageCount >= 7 ||
                    r.filename !== "Drama_Quiz_180_Fragen.csv") &&
                  (packageCount >= 6 ||
                    r.filename !== "Western_Quiz_180_Fragen.csv") &&
                  (packageCount >= 5 ||
                    r.filename !== "Komoedie_Quiz_180_Fragen.csv") &&
                  (packageCount >= 5 ||
                    r.filename !== "Komoedie_Ergaenzung_360_Fragen.csv") &&
                  (packageCount >= 4 ||
                    r.filename !== "Fantasy_Quiz_180_Fragen.csv") &&
                  (packageCount >= 3 ||
                    r.filename !== "Horror_Quiz_180_Fragen.csv") &&
                  (packageCount >= 2 ||
                    r.filename !== "Action_Quiz_180_Fragen.csv"),
              );
              store.put(state, "current");
            };
            tx.oncomplete = () => {
              db.close();
              resolve();
            };
            tx.onerror = () => reject(tx.error);
          };
          request.onerror = () => reject(request.error);
        });
      },
      { packageCount: oldPackageCount, legacyState },
    );
    await page.reload();
    await page.getByRole("button", { name: "Fortsetzen" }).click();
    await expect(page.locator(".feedback")).toBeVisible();
    await page.getByRole("button", { name: "Pause & Startseite" }).click();
    await page.getByRole("button", { name: "Profil", exact: true }).click();
    await page.getByRole("button", { name: "Optionen" }).click();
    await expect(
      page.getByText("5677 Fragen · 5147 Wissensziele · 0 Demo-Fragen"),
    ).toBeVisible();
  });
}

test("Ton und Vibration sind steuerbar, gespeichert und ergänzen das Antwortfeedback", async ({
  page,
}) => {
  await page.clock.install({ time: new Date("2026-09-27T12:00:00+02:00") });
  await page.addInitScript(() => {
    const counters = {
      tones: 0,
      notes: [] as {
        frequency: number;
        type: string;
        start: number;
        end: number;
      }[],
      vibrations: [] as (number | number[])[],
    };
    Object.assign(window, { feedbackTest: counters });
    const create = AudioContext.prototype.createOscillator;
    AudioContext.prototype.createOscillator = function () {
      counters.tones++;
      const oscillator = create.call(this);
      const start = oscillator.start.bind(oscillator),
        stop = oscillator.stop.bind(oscillator);
      let note: (typeof counters.notes)[number];
      oscillator.start = (at = 0) => {
        note = {
          frequency: oscillator.frequency.value,
          type: oscillator.type,
          start: at,
          end: at,
        };
        counters.notes.push(note);
        start(at);
      };
      oscillator.stop = (at = 0) => {
        if (note) note.end = at;
        stop(at);
      };
      return oscillator;
    };
    Object.defineProperty(navigator, "vibrate", {
      configurable: true,
      value: (pattern: number | number[]) => {
        counters.vibrations.push(pattern);
        return true;
      },
    });
  });
  const counters = () =>
    page.evaluate(
      () =>
        (
          window as unknown as {
            feedbackTest: {
              tones: number;
              notes: {
                frequency: number;
                type: string;
                start: number;
                end: number;
              }[];
              vibrations: (number | number[])[];
            };
          }
        ).feedbackTest,
    );
  await launch(page);
  expect((await counters()).tones).toBe(0);
  await page.getByRole("button", { name: "Profil", exact: true }).click();
  await page.getByRole("button", { name: "Optionen" }).click();
  await page.getByLabel("Vibration", { exact: true }).click();
  await expect(page.getByLabel("Vibration", { exact: true })).toBeChecked();
  expect((await counters()).vibrations).toContain(10);
  await page.getByRole("button", { name: "Signal ausprobieren" }).click();
  await expect.poll(async () => (await counters()).tones).toBeGreaterThan(0);
  await page.getByLabel("Soundeffekte", { exact: true }).click();
  await expect(
    page.getByLabel("Soundeffekte", { exact: true }),
  ).not.toBeChecked();
  await page.reload();
  await page.getByRole("button", { name: "Profil", exact: true }).click();
  await page.getByRole("button", { name: "Optionen" }).click();
  await expect(
    page.getByLabel("Soundeffekte", { exact: true }),
  ).not.toBeChecked();
  await page.getByRole("button", { name: "Spielen", exact: true }).click();
  await page.getByRole("button", { name: "Losspielen" }).click();
  await answerCurrent(page);
  expect((await counters()).tones).toBe(0);
  expect((await counters()).vibrations).toContainEqual([20, 40, 25]);
  await page.getByRole("button", { name: "Pause & Startseite" }).click();
  await page.getByRole("button", { name: "Profil", exact: true }).click();
  await page.getByRole("button", { name: "Optionen" }).click();
  await page.getByLabel("Soundeffekte", { exact: true }).click();
  await expect.poll(async () => (await counters()).tones).toBeGreaterThan(0);
  await page.getByRole("button", { name: "Spielen", exact: true }).click();
  await page.getByRole("button", { name: "Fortsetzen" }).click();
  const positive = (await counters()).notes.slice(-2);
  expect(positive[1].frequency).toBeGreaterThan(positive[0].frequency);
  expect(positive.every((n) => n.type === "sine")).toBe(true);
  expect(positive[1].end - positive[0].start).toBeLessThanOrEqual(0.3);
  await page.getByRole("button", { name: "Nächste Frage" }).click();
  const before = (await counters()).tones;
  await answerCurrent(page, false);
  expect((await counters()).tones).toBe(before + 2);
  const negative = (await counters()).notes.slice(-2);
  expect(negative[1].frequency).toBeLessThan(negative[0].frequency);
  expect(negative[0].frequency).toBeLessThan(positive[0].frequency);
  expect(negative.every((n) => n.type === "triangle")).toBe(true);
  expect(negative[1].end - negative[0].start).toBeLessThanOrEqual(0.3);
  expect((await counters()).vibrations).toContain(45);
  await page.getByRole("button", { name: "Pause & Startseite" }).click();
  await page.getByRole("button", { name: "Profil", exact: true }).click();
  await page.getByRole("button", { name: "Optionen" }).click();
  await page.getByLabel("Vibration", { exact: true }).click();
  await expect(page.getByLabel("Vibration", { exact: true })).not.toBeChecked();
  await page.getByLabel("Soundeffekte", { exact: true }).click();
  await expect(
    page.getByLabel("Soundeffekte", { exact: true }),
  ).not.toBeChecked();
  await expect(
    page.getByRole("button", { name: "Signal ausprobieren" }),
  ).toBeDisabled();
});

test("Rekordübersicht zeigt kombinierte Genres und Stufen ohne Darstellungsfehler", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await launch(page);
  await openRoundSetup(page);
  await page
    .getByRole("button", { name: "Alle Genres abwählen", exact: true })
    .click();
  await openRoundSetup(page);
  const genres = page.getByRole("group", { name: "Filmgenres", exact: true });
  await genres.getByLabel("Sci-Fi", { exact: true }).check();
  await genres.getByLabel("Horror", { exact: true }).check();
  await page.getByRole("button", { name: /Freies Spiel Alle Stufen/ }).click();
  await openRoundSetup(page);
  await expect(
    page.getByRole("button", { name: /Freies Spiel Alle Stufen/ }),
  ).toHaveAttribute("aria-pressed", "true");
  await page
    .getByRole("group", { name: "Schwierigkeitsstufen", exact: true })
    .getByLabel("Schwer", { exact: true })
    .uncheck();
  await page
    .getByRole("group", { name: "Schwierigkeitsstufen", exact: true })
    .getByLabel("Experte", { exact: true })
    .uncheck();
  await page.getByRole("button", { name: "Rekordrunde", exact: false }).click();
  await page.getByRole("button", { name: "Losspielen" }).click();
  for (let i = 0; i < 5; i++) {
    await answerCurrent(page);
    await page
      .getByRole("button", {
        name: i === 4 ? "Runde abschließen" : "Nächste Frage",
      })
      .click();
  }
  await expect(
    page.getByRole("heading", { name: "Eine Runde weiter." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Sammlung", exact: true }).click();
  await expect(page.locator(".leaderboard-category")).toContainText(
    "Horror + Sci-Fi · Filmfragen · Leicht + Mittel · 5 Fragen",
  );
  await expect(page.locator(".badge-art.locked svg")).toBeVisible();
  await page
    .locator(".badge-panel")
    .screenshot({ path: "test-results/badge-locked.png" });
  expect(errors).toEqual([]);
});

test("Conjuring zeigt passende Darsteller und Quellen erst in der Vertiefung, auch nach Neuladen", async ({
  page,
}) => {
  await launch(page);

  await page.getByRole("button", { name: "Losspielen" }).click();
  // Dieser Test prüft die Besetzungsergänzung der ursprünglichen CSV-Fragen.
  // Die ergänzenden Filmfragen haben eigene, gezielt getestete Zusatztexte.
  await page.evaluate(
    (q) =>
      new Promise<void>((resolve, reject) => {
        const req = indexedDB.open("wissensquiz");
        req.onerror = () => reject(req.error);
        req.onsuccess = () => {
          const db = req.result;
          const tx = db.transaction("state", "readwrite");
          const store = tx.objectStore("state");
          const query = store.get("current");
          query.onsuccess = () => {
            const state = query.result as State;
            const round = state.rounds.find((r) => r.status === "active")!;
            round.questions = [q];
            round.order = [q.answers.map((a) => a.id)];
            store.put(state, "current");
          };
          tx.oncomplete = () => {
            db.close();
            resolve();
          };
          tx.onerror = () => reject(tx.error);
        };
      }),
    imported.find((q) => q.topic === "Conjuring")!,
  );
  await page.reload();
  await page.getByRole("button", { name: "Fortsetzen" }).click();
  await expect(page.locator(".cast-context")).toHaveCount(0);
  await answerCurrent(page);
  await expect(page.locator(".cast-context")).not.toBeVisible();
  await page.getByText("Etwas tiefer eintauchen", { exact: true }).click();
  await expect(page.locator(".cast-context")).toBeVisible();
  const text = await page.locator(".cast-context").innerText();
  expect(text).toMatch(
    /Patrick Wilson|Vera Farmiga|Ron Livingston|Lili Taylor|Joseph Bishara/,
  );
  await expect(
    page.getByRole("link", { name: "Besetzungsquelle: catalog.afi.com" }),
  ).toHaveAttribute(
    "href",
    "https://catalog.afi.com/Catalog/MovieDetails/69558",
  );
  await page.reload();
  await page.getByRole("button", { name: "Fortsetzen" }).click();
  await page.getByText("Etwas tiefer eintauchen", { exact: true }).click();
  await expect(page.locator(".cast-context")).toHaveText(text);
});
test("Fehlende Audio- und Vibrationsschnittstellen verhindern keine Spielrunde", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "AudioContext", {
      value: undefined,
      configurable: true,
    });
    Object.defineProperty(window, "webkitAudioContext", {
      value: undefined,
      configurable: true,
    });
    Object.defineProperty(navigator, "vibrate", {
      value: undefined,
      configurable: true,
    });
  });
  await launch(page);
  await page.getByRole("button", { name: "Losspielen" }).click();
  await answerCurrent(page);
  await page.getByRole("button", { name: "Pause & Startseite" }).click();
  await page.getByRole("button", { name: "Profil", exact: true }).click();
  await page.getByRole("button", { name: "Optionen" }).click();
  const vibration = page.getByLabel("Vibration", { exact: true });
  await expect(vibration).toBeEnabled();
  await vibration.click();
  await expect(vibration).toBeChecked();
  await expect(
    page.getByText(/Vibration ist eingeschaltet und gespeichert/),
  ).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: "Profil", exact: true }).click();
  await page.getByRole("button", { name: "Optionen" }).click();
  await expect(vibration).toBeChecked();
  await vibration.click();
  await expect(vibration).not.toBeChecked();
  await page.reload();
  await page.getByRole("button", { name: "Profil", exact: true }).click();
  await page.getByRole("button", { name: "Optionen" }).click();
  await expect(vibration).not.toBeChecked();
  await expect(
    page.getByText("Dieser Browser bietet keine Vibration an.", {
      exact: false,
    }),
  ).toBeVisible();
});
test("Einstiegsrunde, Feedback, Meldung, Sammlung und Wiederherstellung", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await launch(page);
  await page.screenshot({
    path: "test-results/desktop-home.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Losspielen" }).click();
  await expect(page.locator(".round-progress")).toContainText("FRAGE 1 VON 5");
  await answerCurrent(page, true);
  await page.getByRole("button", { name: "War geraten", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Als geraten markiert" }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Frage melden" }).click();
  await page
    .getByLabel("Was ist Dir aufgefallen?")
    .fill("Testmeldung im isolierten Browserprofil");
  await page.getByRole("button", { name: "Meldung lokal speichern" }).click();
  await expect(
    page.getByText("Lokal gespeichert. Nicht versendet."),
  ).toBeVisible();
  await page.getByRole("button", { name: "Nächste Frage" }).click();
  await answerCurrent(page, false);
  await expect(
    page.getByText("Die richtige Antwort:", { exact: false }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Nächste Frage" }).click();
  for (let i = 2; i < 5; i++) {
    await answerCurrent(page, true);
    await page
      .getByRole("button", {
        name: i === 4 ? "Runde abschließen" : "Nächste Frage",
      })
      .click();
  }
  await expect(
    page.getByRole("heading", { name: "Eine Runde weiter." }),
  ).toBeVisible();
  await expect(page.locator(".result-score")).toContainText("4 / 5");
  await page.screenshot({ path: "test-results/result.png", fullPage: true });
  await page.reload();
  await expect(page.locator(".sidebar-bottom")).toContainText("17 / 100 XP");
  await page.getByRole("button", { name: "Sammlung", exact: true }).click();
  await expect(page.locator(".history").first()).toContainText("4/5 richtig");
  await expect(
    page.getByRole("button", { name: /Favorit|Thema spielen/ }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Profil", exact: true }).click();
  await page.getByRole("button", { name: "Optionen" }).click();
  await expect(
    page.getByText("5677 Fragen · 5147 Wissensziele · 0 Demo-Fragen"),
  ).toBeVisible();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Alles als JSON sichern" }).click();
  const file = await download;
  const backupPath = testInfo.outputPath("backup.json");
  await file.saveAs(backupPath);
  await page.getByLabel("Sicherung auswählen").setInputFiles(backupPath);
  await page
    .getByRole("button", { name: "Lokalen Stand durch Sicherung ersetzen" })
    .click();
  await expect(
    page.getByText("Sicherung vollständig wiederhergestellt."),
  ).toBeVisible();
  await page.getByLabel("CSV auswählen").setInputFiles("public/fragen.csv");
  await expect(page.locator(".import-preview")).toContainText(
    "180 vorhandene IDs übersprungen",
  );
  await expect(
    page.getByRole("button", { name: "Gültige Fragen importieren" }),
  ).toBeDisabled();
  expect(errors).toEqual([]);
});
test("Mobile Bedienung bei 390 und 320 Pixeln ohne horizontalen Überlauf", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await launch(page);
  await page.screenshot({
    path: "test-results/mobile-home.png",
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "Losspielen" }).click();
  await expect(page.locator(".answer").first()).toBeEnabled();
  await page.screenshot({
    path: "test-results/mobile-question.png",
    fullPage: true,
  });
  await answerCurrent(page, false);
  await expect(page.locator(".specific-feedback")).toBeVisible();
  await page.screenshot({
    path: "test-results/mobile-feedback.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 320, height: 740 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByText("Alle Antworten ansehen", { exact: true }).click();
  for (const b of await page.locator(".answer").all()) {
    const box = await b.boundingBox();
    expect(box!.height).toBeGreaterThanOrEqual(44);
    expect(box!.x + box!.width).toBeLessThanOrEqual(320);
  }
  await page.getByRole("button", { name: "Pause & Startseite" }).click();
  await expect(page.getByRole("button", { name: "Fortsetzen" })).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: "Fortsetzen" }).click();
  await expect(page.locator(".feedback")).toBeVisible();
});
test("Rekordtimer läuft ab, Erklärung hält an, Neuladen bricht ab", async ({
  page,
}) => {
  await page.clock.install();
  await launch(page);
  await openRoundSetup(page);
  await page.getByRole("button", { name: "Rekordrunde", exact: false }).click();
  await page.getByRole("button", { name: "Losspielen" }).click();
  await page.clock.runFor(100);
  await expect(page.locator(".answer").first()).toBeEnabled();
  await page.clock.fastForward(31_000);
  await expect(
    page.getByRole("heading", { name: "Die Zeit ist um." }),
  ).toBeVisible();
  await expect(page.getByText("+0 Punkte")).toBeVisible();
  await page.clock.fastForward(60000);
  await expect(page.locator(".round-progress")).toContainText("FRAGE 1 VON 5");
  await page.getByRole("button", { name: "Nächste Frage" }).click();
  await page.clock.runFor(100);
  await page.reload();
  await expect(page.getByRole("button", { name: "Losspielen" })).toBeEnabled();
  await expect(page.getByRole("button", { name: "Fortsetzen" })).toHaveCount(0);
});
for (const offlinePackage of [
  { genre: "Horror", topic: "Halloween", path: "/horror-fragen.csv" },
  { genre: "Drama", topic: "Die Verurteilten", path: "/drama-fragen.csv" },
  { genre: "Komödie", topic: "The Big Lebowski", path: "/komoedie-fragen.csv" },
  {
    genre: "Western",
    topic: "Für eine Handvoll Dollar",
    path: "/western-fragen.csv",
  },
  {
    genre: "Fantasy",
    topic: "Der Herr der Ringe",
    path: "/fantasy-fragen.csv",
  },
]) {
  test(`${offlinePackage.genre}: Offline-Neuladen mit gespeichertem Paket und Spielfortschritt`, async ({
    page,
    context,
  }) => {
    await launch(page);
    await page.getByRole("button", { name: "Profil", exact: true }).click();
    await page.getByRole("button", { name: "Optionen" }).click();
    await expect(
      page.getByText("Die App-Dateien sind im Offline-Cache bestätigt.", {
        exact: false,
      }),
    ).toBeVisible({ timeout: 20000 });
    await page.getByRole("button", { name: "Spielen", exact: true }).click();
    await openRoundSetup(page);
    const genreChoices = page.getByRole("group", {
      name: "Filmgenres",
      exact: true,
    });
    await page.getByRole("button", { name: "Alle Genres abwählen" }).click();
    await openRoundSetup(page);
    await genreChoices
      .getByLabel(offlinePackage.genre, { exact: true })
      .check();
    expect(
      await page.evaluate(
        async (path) => (await caches.match(path))?.ok,
        offlinePackage.path,
      ),
    ).toBe(true);
    await page.getByRole("button", { name: "Losspielen" }).click();
    await answerCurrent(page, true);
    await page.getByRole("button", { name: "Pause & Startseite" }).click();
    await context.setOffline(true);
    await page.reload();
    await expect(page.locator(".connection")).toContainText("Offline");
    await page.getByRole("button", { name: "Fortsetzen" }).click();
    await expect(page.locator(".feedback")).toBeVisible();
    await page.getByRole("button", { name: "Nächste Frage" }).click();
    await answerCurrent(page, true);
    await context.setOffline(false);
  });
}
test("Ungültige Sicherung, gültiger Zusatzimport und ausdrückliches Zurücksetzen", async ({
  page,
}) => {
  await launch(page);
  await page.getByRole("button", { name: "Profil", exact: true }).click();
  await page.getByRole("button", { name: "Optionen" }).click();
  await page.getByLabel("Sicherung auswählen").setInputFiles({
    name: "kaputt.json",
    mimeType: "application/json",
    buffer: Buffer.from('{"schemaVersion":999}'),
  });
  await expect(
    page.getByText("Datei abgelehnt:", { exact: false }),
  ).toBeVisible();
  await page
    .getByLabel("CSV auswählen")
    .setInputFiles("public/demo-fragen.csv");
  await expect(page.locator(".import-preview")).toContainText("12 gültig");
  await page
    .getByRole("button", { name: "Gültige Fragen importieren" })
    .click();
  await expect(
    page.getByText("5689 Fragen · 5159 Wissensziele · 12 Demo-Fragen"),
  ).toBeVisible();
  await expect(
    page.getByRole("button", {
      name: "Fortschritt jetzt endgültig zurücksetzen",
    }),
  ).toBeDisabled();
  await page.getByLabel("Zum Bestätigen LÖSCHEN eingeben").fill("LÖSCHEN");
  await page
    .getByRole("button", { name: "Fortschritt jetzt endgültig zurücksetzen" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Dein Filmquiz" }),
  ).toBeVisible();
});
