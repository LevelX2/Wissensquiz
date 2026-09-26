import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { importCsv } from "../../src/importer";
const imported = [
  ...importCsv(readFileSync("public/fragen.csv", "utf8")).questions,
  ...importCsv(readFileSync("public/action-fragen.csv", "utf8")).questions,
  ...importCsv(readFileSync("public/horror-fragen.csv", "utf8")).questions,
  ...importCsv(readFileSync("public/fantasy-fragen.csv", "utf8")).questions,
];
async function launch(page: Page) {
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Losspielen" })).toBeEnabled();
}
async function answerCurrent(page: Page, correct = true) {
  const prompt = await page.locator(".question-card h1").innerText();
  const q = imported.find((q) => q.question === prompt)!;
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

test("Genres und Stufen lassen sich kombinieren und bleiben in der Runde erhalten", async ({
  page,
}) => {
  await page.clock.install({ time: new Date("2026-09-26T12:00:00+02:00") });
  await page.setViewportSize({ width: 320, height: 740 });
  await launch(page);
  const genres = page.getByRole("group", { name: "Filmgenres", exact: true });
  const levels = page.getByRole("group", {
    name: "Schwierigkeitsstufen",
    exact: true,
  });
  await expect(genres.getByRole("checkbox")).toHaveCount(4);
  await expect(page.getByLabel("Thema wählen")).not.toBeVisible();
  await genres.getByLabel("Action", { exact: true }).uncheck();
  await genres.getByLabel("Fantasy", { exact: true }).uncheck();
  await levels.getByLabel("Schwer", { exact: true }).uncheck();
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
    "Wähle mindestens ein Genre",
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
  const readRound = () =>
    page.evaluate(
      () =>
        new Promise<{
          filters: { genres: string[]; difficulties: string[] };
          questions: { difficulty: string; metadata: { subdomain: string } }[];
        }>((resolve, reject) => {
          const req = indexedDB.open("wissensquiz", 1);
          req.onerror = () => reject(req.error);
          req.onsuccess = () => {
            const db = req.result;
            const query = db
              .transaction("state")
              .objectStore("state")
              .get("current");
            query.onsuccess = () => {
              resolve(
                query.result.rounds.find(
                  (r: { status: string }) => r.status === "active",
                ),
              );
              db.close();
            };
            query.onerror = () => reject(query.error);
          };
        }),
    );
  const before = await readRound();
  expect(before.filters).toEqual({
    genres: ["Horror", "Science-Fiction"],
    difficulties: ["leicht", "mittel"],
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

for (const oldPackageCount of [1, 2, 3]) {
  test(`Neue Pakete ergänzen einen Spielstand mit ${oldPackageCount} Paketen beim Neuladen`, async ({
    page,
  }) => {
    await page.clock.install({ time: new Date("2026-09-26T12:00:00+02:00") });
    await launch(page);
    await page
      .getByText("Optional: einzelne Filme oder Filmreihen", { exact: true })
      .click();
    await page.getByLabel("Thema wählen").selectOption("Alien");
    await page.getByRole("button", { name: "Losspielen" }).click();
    await answerCurrent(page, true);
    await page.getByRole("button", { name: "Pause & Startseite" }).click();
    await page.evaluate(async (packageCount) => {
      await new Promise<void>((resolve, reject) => {
        const request = indexedDB.open("wissensquiz", 1);
        request.onsuccess = () => {
          const db = request.result;
          const tx = db.transaction("state", "readwrite");
          const store = tx.objectStore("state");
          const read = store.get("current");
          read.onsuccess = () => {
            const state = read.result;
            state.questions = state.questions.filter(
              (q: { id: string }) =>
                !q.id.startsWith("FAN-") &&
                (packageCount >= 3 || !q.id.startsWith("HOR-")) &&
                (packageCount >= 2 || !q.id.startsWith("ACT-")),
            );
            state.imports = state.imports.filter(
              (r: { filename: string }) =>
                r.filename !== "Fantasy_Quiz_180_Fragen.csv" &&
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
    }, oldPackageCount);
    await page.reload();
    await page.getByRole("button", { name: "Fortsetzen" }).click();
    await expect(page.locator(".feedback")).toBeVisible();
    await page.getByRole("button", { name: "Pause & Startseite" }).click();
    await page.getByRole("button", { name: "Einstellungen & Daten" }).click();
    await expect(
      page.getByText("720 Fragen · 600 Wissensziele · 0 Demo-Fragen"),
    ).toBeVisible();
  });
}

test("Ton und Vibration sind steuerbar, gespeichert und ergänzen das Antwortfeedback", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const counters = { tones: 0, vibrations: [] as (number | number[])[] };
    Object.assign(window, { feedbackTest: counters });
    const create = AudioContext.prototype.createOscillator;
    AudioContext.prototype.createOscillator = function () {
      counters.tones++;
      return create.call(this);
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
            feedbackTest: { tones: number; vibrations: (number | number[])[] };
          }
        ).feedbackTest,
    );
  await launch(page);
  expect((await counters()).tones).toBe(0);
  await page.getByRole("button", { name: "Einstellungen & Daten" }).click();
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
  await expect(
    page.getByRole("button", { name: "Ton aus", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Losspielen" }).click();
  await answerCurrent(page);
  expect((await counters()).tones).toBe(0);
  expect((await counters()).vibrations).toContainEqual([20, 40, 25]);
  await page.getByRole("button", { name: "Ton aus", exact: true }).click();
  await expect.poll(async () => (await counters()).tones).toBeGreaterThan(0);
  await page.getByRole("button", { name: "Nächste Frage" }).click();
  const before = (await counters()).tones;
  await answerCurrent(page, false);
  expect((await counters()).tones).toBe(before + 2);
  expect((await counters()).vibrations).toContain(45);
  await page.getByRole("button", { name: "Pause & Startseite" }).click();
  await page.getByRole("button", { name: "Einstellungen & Daten" }).click();
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
  await page
    .getByRole("group", { name: "Filmgenres", exact: true })
    .getByLabel("Action", { exact: true })
    .uncheck();
  await page
    .getByRole("group", { name: "Filmgenres", exact: true })
    .getByLabel("Fantasy", { exact: true })
    .uncheck();
  await page
    .getByRole("group", { name: "Schwierigkeitsstufen", exact: true })
    .getByLabel("Schwer", { exact: true })
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
  await page
    .getByRole("button", { name: "Meine Sammlung", exact: true })
    .click();
  await expect(page.locator(".leaderboard-category")).toContainText(
    "Horror + Sci-Fi · Leicht + Mittel · 5 Fragen",
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
  await page
    .getByText("Optional: einzelne Filme oder Filmreihen", { exact: true })
    .click();
  await page.getByLabel("Thema wählen").selectOption("Conjuring");
  await page.getByRole("button", { name: "Losspielen" }).click();
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
  await page.getByRole("button", { name: "Einstellungen & Daten" }).click();
  await expect(page.getByLabel("Vibration", { exact: true })).toBeDisabled();
  await expect(
    page.getByText("Dieser Browser bietet keine Vibration an.", {
      exact: false,
    }),
  ).toBeVisible();
});
test("Einstiegsrunde, Feedback, Meldung, Sammlung und Wiederherstellung", async ({
  page,
}) => {
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
  await expect(page.getByText("10 Erfahrung · Level 1")).toBeVisible();
  await page
    .getByRole("button", { name: "Meine Sammlung", exact: true })
    .click();
  await expect(page.locator(".history").first()).toContainText("4/5 richtig");
  await page
    .getByRole("button", { name: /Als Favorit markieren: Alien/ })
    .click();
  await expect(
    page.getByRole("button", { name: "Favorit entfernen: Alien" }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Einstellungen & Daten" }).click();
  await expect(
    page.getByText("720 Fragen · 600 Wissensziele · 0 Demo-Fragen"),
  ).toBeVisible();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Alles als JSON sichern" }).click();
  const file = await download;
  await file.saveAs("test-results/backup.json");
  await page
    .getByLabel("Sicherung auswählen")
    .setInputFiles("test-results/backup.json");
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
    await expect(page.getByText("Paket bereit", { exact: false })).toBeVisible({
      timeout: 20000,
    });
    const genreChoices = page.getByRole("group", {
      name: "Filmgenres",
      exact: true,
    });
    for (const genre of ["Action", "Sci-Fi", "Horror", "Fantasy"].filter(
      (g) => g !== offlinePackage.genre,
    )) {
      await genreChoices.getByLabel(genre, { exact: true }).uncheck();
    }
    await expect(
      genreChoices.getByLabel(offlinePackage.genre, { exact: true }),
    ).toBeChecked();
    await page
      .getByText("Optional: einzelne Filme oder Filmreihen", { exact: true })
      .click();
    await page.getByLabel("Thema wählen").selectOption(offlinePackage.topic);
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
  await page.getByRole("button", { name: "Einstellungen & Daten" }).click();
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
    page.getByText("732 Fragen · 612 Wissensziele · 12 Demo-Fragen"),
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
    page.getByRole("heading", { name: "Neugier? Film ab." }),
  ).toBeVisible();
});
