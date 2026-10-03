import {
  test,
  expect,
  openRoundSetup,
  modePreparation,
  readStoredState,
} from "./fixtures";
import AxeBuilder from "@axe-core/playwright";
import { questionSourceOf } from "../../src/filters";
import { readFileSync } from "node:fs";
import { importCsv } from "../../src/importer";
import { emptyState } from "../../src/model";
import { answer, complete, recordKey, startRound } from "../../src/engine";

test("Die aktuelle Moduskachel zeigt ein großes Motiv, öffnet die Auswahl und behält den gewählten Modus", async ({
  page,
}) => {
  await page.clock.install({ time: new Date("2026-10-03T16:00:00+02:00") });
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Losspielen" })).toBeEnabled();
  const tile = page.locator(".mode-selection > summary");
  const image = tile.locator("img");
  await expect(tile).toContainText("Filmreise");
  await expect(tile).toContainText("Modus ändern");
  const before = await readStoredState(page);
  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 850 });
    await expect(image).toBeVisible();
    const box = (await image.boundingBox())!,
      card = (await tile.boundingBox())!;
    expect(box.width).toBeGreaterThanOrEqual(100);
    expect(box.height).toBeGreaterThanOrEqual(100);
    expect(box.x).toBeGreaterThanOrEqual(card.x);
    expect(box.x + box.width).toBeLessThanOrEqual(card.x + card.width);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    if (width === 320 || width === 768)
      await page.screenshot({
        path: `test-results/moduskachel-${width}-${test.info().project.name}.png`,
        fullPage: true,
      });
  }
  await tile.focus();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("group", { name: "Spielvarianten", exact: true }),
  ).toBeVisible();
  expect(await readStoredState(page)).toEqual(before);
  await modePreparation(page, /Freies Spiel Alle Stufen/).click();
  await tile.click();
  await expect(tile).toContainText("Freies Spiel");
  await expect(image).toHaveAttribute("src", "/modes/ueben.png");
  expect((await readStoredState(page)).rounds).toHaveLength(0);
  await page.reload();
  await expect(tile).toContainText("Freies Spiel");
  await expect(image).toBeVisible();
  await expect(page.locator(".mode-selection")).not.toHaveAttribute("open", "");
  expect(
    (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze())
      .violations,
  ).toEqual([]);
});

test("Bestenliste aus einem älteren Rundenrückblick zeigt genau dessen Kategorie und scrollt auch zu einem niedrigen Platz", async ({
  page,
}) => {
  await page.clock.install({ time: new Date("2026-10-03T16:00:00+02:00") });
  await page.setViewportSize({ width: 320, height: 740 });
  const questions = ["horror-fragen.csv", "fantasy-fragen.csv"].flatMap(
    (p) => importCsv(readFileSync("public/" + p, "utf8")).questions,
  );
  const state = emptyState(questions);
  const at = new Date("2025-09-15T12:00:00+02:00").getTime();
  let targetId = "",
    targetKey = "";
  for (let i = 0; i < 27; i++) {
    const run = emptyState(questions);
    const round = startRound(
      run,
      {
        mode: i === 26 ? "rekord" : "fehlerfrei",
        topic: "Alle Themen",
        difficulty: "Alle Stufen",
        recordPreset: "custom",
        filters: {
          genres: [i === 25 ? "Fantasy" : "Horror"],
          sources: ["film"],
          difficulties: ["leicht"],
          familiarities: [1],
        },
      },
      at + i * 100000,
    );
    if (i === 26) {
      round.questions.forEach((q, j) =>
        answer(
          run,
          round.id,
          q.id,
          q.correctId,
          1000,
          round.startedAt + 2000 + j * 2000,
        ),
      );
    } else {
      if (i < 24) {
        const q = round.questions[0];
        answer(run, round.id, q.id, q.correctId, 1000, round.startedAt + 2000);
      }
      const q = round.questions[round.events.length];
      answer(
        run,
        round.id,
        q.id,
        q.answers.find((a) => a.id !== q.correctId)!.id,
        1000,
        round.startedAt + 5000,
      );
    }
    complete(run, round.id, round.startedAt + 30000);
    state.rounds.push(round);
    state.events.push(...run.events);
    if (i === 24) {
      targetId = round.id;
      targetKey = recordKey(round);
    }
  }
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Losspielen" })).toBeEnabled();
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
  await page.getByRole("button", { name: "Highscores", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "10 Fragen", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Fehlerfrei", exact: true }).click();
  await page
    .getByLabel("Vergleichskategorie", { exact: true })
    .selectOption(targetKey);
  await page
    .locator(".leaderboard-entry")
    .last()
    .getByRole("button", { name: "Spiel ansehen" })
    .click();
  await expect(page.locator(".result > .eyebrow")).toContainText("Fehlerfrei");
  await page.getByRole("button", { name: "Bestenliste ansehen" }).click();
  await expect(
    page.getByRole("button", { name: "Fehlerfrei", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(
    page.getByRole("button", { name: "Allzeit", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(
    page.getByLabel("Vergleichskategorie", { exact: true }),
  ).toHaveValue(targetKey);
  await expect(page.locator(".leaderboard-category")).toHaveCount(1);
  const highlighted = page.locator(".is-current-run");
  await expect(highlighted).toHaveCount(1);
  await expect(highlighted).toContainText("Dieser Lauf");
  await expect(highlighted).toContainText("Platz 25 · 0 Punkte");
  await expect(highlighted).toBeInViewport({ ratio: 0.5 });
  await expect(highlighted).toBeFocused();
  expect(
    (await readStoredState(page)).rounds.find((r) => r.id === targetId)?.status,
  ).toBe("completed");
  await page.screenshot({
    path: `test-results/lauf-besteliste-320-${test.info().project.name}.png`,
    fullPage: false,
  });
  // Ordinary navigation remains an overview, without an old result target.
  await page.getByRole("button", { name: "Spielen", exact: true }).click();
  await page.getByRole("button", { name: "Highscores", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "10 Fragen", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(
    page.getByLabel("Vergleichskategorie", { exact: true }),
  ).toHaveValue("");
  await expect(page.locator(".is-current-run")).toHaveCount(0);
});

test("Spielkacheln haben eigene Motive und Rekordoptionen passen bei Handy-, Tablet- und Desktopbreiten", async ({
  page,
}) => {
  await page.clock.install({ time: new Date("2026-10-03T16:00:00+02:00") });
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Losspielen" })).toBeEnabled();
  await openRoundSetup(page);
  await expect(page.locator(".mode-groups img")).toHaveCount(0);
  for (const group of ["Lernen", "Auf Zeit"]) {
    await page.getByRole("button", { name: group, exact: true }).click();
    const cards = page.locator(".mode-card");
    await expect(cards).toHaveCount(3);
    const images = cards.locator("img");
    await expect(images).toHaveCount(3);
    expect(
      new Set(
        await images.evaluateAll((els) =>
          els.map((e) => (e as HTMLImageElement).src),
        ),
      ).size,
    ).toBe(3);
    for (const image of await images.all()) {
      await expect
        .poll(() => image.evaluate((e) => (e as HTMLImageElement).naturalWidth))
        .toBeGreaterThan(0);
    }
    for (const width of [320, 390, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      const boxes = await cards.evaluateAll((els) =>
        els.map((e) => {
          const { width, height } = e.getBoundingClientRect();
          return { width, height };
        }),
      );
      expect(
        Math.max(...boxes.map((b) => b.width)) -
          Math.min(...boxes.map((b) => b.width)),
      ).toBeLessThan(1);
      expect(
        Math.max(...boxes.map((b) => b.height)) -
          Math.min(...boxes.map((b) => b.height)),
      ).toBeLessThan(1);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      if (group === "Auf Zeit") {
        const field = page.getByRole("group", {
          name: "Rekordauswahl",
          exact: true,
        });
        const fieldBox = (await field.boundingBox())!;
        for (const label of await field.locator("label").all()) {
          const radio = (await label.locator("input").boundingBox())!;
          const text = (await label.locator("span").boundingBox())!;
          expect(radio.width).toBeLessThanOrEqual(24);
          expect(radio.height).toBeLessThanOrEqual(24);
          expect(text.x).toBeGreaterThan(radio.x + radio.width);
          expect(text.x + text.width).toBeLessThanOrEqual(
            fieldBox.x + fieldBox.width,
          );
        }
      }
      if (width === 320 || width === 768) {
        await page.screenshot({
          path: `test-results/spielkacheln-${group}-${width}-${test.info().project.name}.png`,
          fullPage: true,
        });
      }
    }
  }
  await page.getByLabel(/Eigene Auswahl ·/).check();
  await expect(page.getByLabel(/Standardmix ·/)).not.toBeChecked();
  await page.getByLabel(/Standardmix ·/).check();
  await expect(page.getByLabel(/Eigene Auswahl ·/)).not.toBeChecked();
  expect(
    (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze())
      .violations,
  ).toEqual([]);
});

test("Ein Klick startet die gewählte Lernkachel mit gespeicherten Filtern und schützt die begonnene Runde", async ({
  page,
}) => {
  await page.clock.install({ time: new Date("2026-10-03T16:00:00+02:00") });
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Losspielen" })).toBeEnabled();
  await openRoundSetup(page);
  await expect(
    page.getByRole("button", { name: /^Fehlertraining Offene Fehler/ }),
  ).toBeDisabled();
  await modePreparation(page, /Freies Spiel Alle Stufen/).click();
  await openRoundSetup(page);
  await page
    .getByRole("group", { name: "Fragenbereiche", exact: true })
    .getByLabel("Filmfragen", { exact: true })
    .uncheck();
  await page
    .getByRole("group", { name: "Fragenbereiche", exact: true })
    .getByLabel("Schauspieler", { exact: true })
    .check();
  const levels = page.getByRole("group", {
    name: "Schwierigkeitsstufen",
    exact: true,
  });
  for (const name of ["Leicht", "Mittel", "Experte"])
    await levels.getByLabel(name, { exact: true }).uncheck();
  await modePreparation(page, /Filmreise Filmwelten/).click();
  await page.getByRole("button", { name: /Freies Spiel Alle Stufen/ }).click();
  await expect(page.locator("h1[data-question-id]")).toBeVisible();
  const first = await readStoredState(page),
    round = first.rounds.at(-1)!;
  expect(first.rounds).toHaveLength(1);
  expect(round.mode).toBe("ueben");
  expect(round.filters?.sources).toEqual(["actors"]);
  expect(
    round.questions.every(
      (q) => questionSourceOf(q) === "actors" && q.difficulty === "schwer",
    ),
  ).toBe(true);
  expect(first.settings.lastLearningMode).toBe("ueben");
  await page.getByRole("button", { name: "Pause & Startseite" }).click();
  await openRoundSetup(page);
  for (const card of await page.locator(".mode-card").all())
    await expect(card).toBeDisabled();
  expect((await readStoredState(page)).rounds).toHaveLength(1);
  await page
    .getByRole("button", { name: "Runde beenden", exact: true })
    .click();
  await page.getByRole("button", { name: /Filmreise Filmwelten/ }).click();
  await expect(page.locator("h1[data-question-id]")).toBeVisible();
  const second = (await readStoredState(page)).rounds.at(-1)!;
  expect(second.mode).toBe("entdecken");
  expect(second.questions.every((q) => q.difficulty === "leicht")).toBe(true);
});

test("Jede Zeitkachel startet ihren eigenen Modus ohne zweiten Startklick", async ({
  page,
}) => {
  await page.clock.install({ time: new Date("2026-10-03T16:00:00+02:00") });
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Losspielen" })).toBeEnabled();
  await openRoundSetup(page);
  await page.getByRole("button", { name: "Auf Zeit", exact: true }).click();
  for (const [name, mode] of [
    ["10 Fragen", "rekord"],
    ["Fehlerfrei", "fehlerfrei"],
    ["Zeitkonto", "zeitkonto"],
  ] as const) {
    await openRoundSetup(page);
    await page
      .getByRole("button", { name: new RegExp("^" + name + " ") })
      .click();
    await expect(page.locator("h1[data-question-id]")).toBeVisible();
    const state = await readStoredState(page),
      round = state.rounds.at(-1)!;
    expect(round.mode).toBe(mode);
    expect(round.ruleVersion).toBe(`solo-v1.${mode}.standard`);
    expect(state.settings.lastTimedMode).toBe(mode);
    if (mode === "zeitkonto") expect(round.run?.bankMs).toBe(120000);
    await page
      .getByRole("button", { name: "← Runde beenden", exact: true })
      .click();
    expect((await readStoredState(page)).rounds.at(-1)!.status).toBe("aborted");
  }
  expect((await readStoredState(page)).rounds).toHaveLength(3);
});
