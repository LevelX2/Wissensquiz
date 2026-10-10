import { writeStoredState } from "./fixtures";
import {
  test,
  expect,
  openRoundSetup,
  modePreparation,
  readStoredState,
} from "./fixtures";
import AxeBuilder from "@axe-core/playwright";
import { emptyState } from "../../src/model";
import { answer, complete, startRound, recordKey, rebuild } from "../../src/engine";

test("Große Moduskachel: Auswahl schließt sich, speichert den Modus und startet noch keine Runde", async ({
  page,
}) => {
  await page.clock.install({ time: new Date("2026-10-03T16:00:00+02:00") });
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Losspielen" })).toBeEnabled();
  const tile = page.locator(".mode-selection > summary");
  await expect(page.locator(".mode-card")).toHaveCount(0);
  await expect(tile).toHaveAttribute("aria-expanded", "false");
  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 850 });
    const image = tile.locator("img"),
      box = (await image.boundingBox())!,
      card = (await tile.boundingBox())!;
    expect(box.width).toBeGreaterThanOrEqual(100);
    expect(box.height).toBeGreaterThanOrEqual(100);
    expect(box.x + box.width).toBeLessThanOrEqual(card.x + card.width);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  await tile.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator(".mode-card")).toHaveCount(3);
  await modePreparation(page, /Freies Spiel Alle Stufen/).click();
  await expect(page.locator(".mode-selection")).not.toHaveAttribute("open", "");
  await expect(page.locator(".mode-card")).toHaveCount(0);
  await expect(tile).toHaveAttribute("aria-expanded", "false");
  await expect(tile).toContainText("Freies Spiel");
  await expect(tile.locator("img")).toHaveAttribute("src", "/modes/ueben.png");
  await tile.click();
  await page.getByRole("button", { name: "Auf Zeit", exact: true }).click();
  await modePreparation(page, /^Fehlerfrei /).click();
  await expect(tile).toContainText("Fehlerfrei");
  await expect(page.locator(".mode-card")).toHaveCount(0);
  expect((await readStoredState(page)).rounds).toHaveLength(0);
  await page.getByRole("button", { name: "Themen", exact: true }).click();
  await page.getByRole("button", { name: "Spielen", exact: true }).click();
  await expect(tile).toContainText("Fehlerfrei");
  await expect(page.locator(".mode-card")).toHaveCount(0);
  await expect(tile.locator("img")).toHaveAttribute(
    "src",
    "/modes/fehlerfrei.svg",
  );
  expect((await readStoredState(page)).rounds).toHaveLength(0);
  await page.reload();
  await expect(tile).toContainText("Fehlerfrei");
  await expect(page.locator(".mode-card")).toHaveCount(0);
  expect(
    (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze())
      .violations,
  ).toEqual([]);
  await page.screenshot({
    path: `test-results/modusauswahl-${test.info().project.name}.png`,
    fullPage: true,
  });
});

test("Duell öffnet erst nach Variantenauswahl und Losspielen", async ({
  page,
}) => {
  await page.goto("/");
  await openRoundSetup(page);
  await page.getByRole("button", { name: "Duell", exact: true }).click();
  await expect(page.locator(".mode-selection > summary")).toContainText(
    "Filmreise",
  );
  await expect(page.locator(".mode-card")).toHaveCount(1);
  await expect(page.locator(".mode-card img")).toHaveAttribute(
    "src",
    "/modes/duell.svg",
  );
  await expect(page.getByRole("heading", { name: /Deine Duelle/ })).toHaveCount(
    0,
  );
  await page.getByRole("button", { name: /^Duell Drei Runden/ }).click();
  await expect(page.locator(".mode-selection")).not.toHaveAttribute("open", "");
  await expect(page.locator(".mode-selection > summary")).toContainText(
    "Duell",
  );
  expect((await readStoredState(page)).rounds).toHaveLength(0);
  await page.getByRole("button", { name: "Losspielen" }).click();
  await expect(
    page.getByRole("heading", { name: "Deine Duelle", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "← Zurück zum Spielen" }).click();
  await expect(page.locator(".mode-selection > summary")).toContainText(
    "Duell",
  );
});

test("Rekordauswahl hat nur Universal oder ein Genre, feste Stufen und passende Radios", async ({
  page,
}) => {
  await page.clock.install({ time: new Date("2026-10-03T16:00:00+02:00") });
  await page.goto("/");
  await openRoundSetup(page);
  await page.getByRole("button", { name: "Auf Zeit", exact: true }).click();
  const cards = page.locator(".mode-card");
  await expect(cards).toHaveCount(3);
  expect(
    new Set(
      await cards
        .locator("img")
        .evaluateAll((els) => els.map((e) => (e as HTMLImageElement).src)),
    ).size,
  ).toBe(3);
  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    const boxes = await cards.evaluateAll((els) =>
      els.map((e) => ({
        width: e.getBoundingClientRect().width,
        height: e.getBoundingClientRect().height,
      })),
    );
    expect(
      Math.max(...boxes.map((b) => b.width)) -
        Math.min(...boxes.map((b) => b.width)),
    ).toBeLessThan(1);
    expect(
      Math.max(...boxes.map((b) => b.height)) -
        Math.min(...boxes.map((b) => b.height)),
    ).toBeLessThan(1);
  }
  await modePreparation(page, /^Zeitkonto /).click();
  const field = page.getByRole("group", { name: "Rekordauswahl", exact: true });
  await expect(field.getByRole("radio")).toHaveCount(2);
  await expect(page.getByLabel(/Universal ·/)).toBeChecked();
  await expect(
    page.getByRole("group", { name: "Filmgenres", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("group", { name: "Schwierigkeitsstufen", exact: true }),
  ).toHaveCount(0);
  for (const width of [320, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    const bounds = (await field.boundingBox())!;
    for (const label of await field.locator("label:has(input)").all()) {
      const radio = (await label.locator("input").boundingBox())!,
        text = (await label.locator("span").boundingBox())!;
      expect(radio.width).toBeLessThanOrEqual(24);
      expect(radio.height).toBeLessThanOrEqual(24);
      expect(text.x).toBeGreaterThan(radio.x + radio.width);
      expect(text.x + text.width).toBeLessThanOrEqual(bounds.x + bounds.width);
    }
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  await page.getByLabel(/Ein Genre ·/).check();
  await page.getByLabel("Genre für den Rekord").selectOption("Horror");
  await page.getByRole("button", { name: "Losspielen" }).click();
  await expect(page.locator("h1[data-question-id]")).toBeVisible();
  const r = (await readStoredState(page)).rounds.at(-1)!;
  expect(r.recordPreset).toBe("genre");
  expect(r.filters).toEqual({
    genres: ["Horror"],
    sources: ["film"],
    difficulties: ["leicht", "mittel", "schwer"],
    familiarities: [1, 2, 3, 4],
  });
});

test("Lernfilter bleiben bestehen; auch während einer Runde bereitet Auswahl nur vor", async ({
  page,
}) => {
  await page.goto("/");
  await openRoundSetup(page);
  await modePreparation(page, /^Wiederholen /).click();
  await expect(page.getByRole("button", { name: "Losspielen" })).toBeDisabled();
  await openRoundSetup(page);
  await modePreparation(page, /Freies Spiel Alle Stufen/).click();
  await openRoundSetup(page);
  await page
    .getByRole("group", { name: "Fragenbereiche", exact: true })
    .getByLabel("Schauspieler", { exact: true })
    .check();
  const before = await readStoredState(page);
  expect(before.rounds).toHaveLength(0);
  await page.getByRole("button", { name: "Losspielen" }).click();
  await expect(page.locator("h1[data-question-id]")).toBeVisible();
  expect((await readStoredState(page)).rounds.at(-1)?.filters?.sources).toEqual(
    ["film", "actors"],
  );
  await page.getByRole("button", { name: "Pause & Startseite" }).click();
  await openRoundSetup(page);
  await modePreparation(page, /Filmreise Filmwelten/).click();
  await expect(page.locator(".mode-selection > summary")).toContainText(
    "Filmreise",
  );
  await expect(page.getByRole("button", { name: "Losspielen" })).toBeDisabled();
  expect((await readStoredState(page)).rounds).toHaveLength(1);
});

test("Alle drei Zeitvarianten warten nach Auswahl auf Losspielen", async ({
  page,
}) => {
  await page.clock.install({ time: new Date("2026-10-03T16:00:00+02:00") });
  await page.goto("/");
  for (const [name, mode] of [
    ["10 Fragen", "rekord"],
    ["Fehlerfrei", "fehlerfrei"],
    ["Zeitkonto", "zeitkonto"],
  ] as const) {
    await openRoundSetup(page);
    await page.getByRole("button", { name: "Auf Zeit", exact: true }).click();
    const before = (await readStoredState(page)).rounds.length;
    await modePreparation(page, new RegExp("^" + name + " ")).click();
    await expect(page.locator(".mode-selection")).not.toHaveAttribute(
      "open",
      "",
    );
    expect((await readStoredState(page)).rounds).toHaveLength(before);
    await page.getByRole("button", { name: "Losspielen" }).click();
    await expect(page.locator("h1[data-question-id]")).toBeVisible();
    const r = (await readStoredState(page)).rounds.at(-1)!;
    expect(r.mode).toBe(mode);
    expect(r.recordPreset).toBe("standard");
    await page
      .getByRole("button", { name: "← Runde beenden", exact: true })
      .click();
  }
});

test("Aktueller Fragenrückblick bleibt, Sonderwertungen entfallen ohne Verlust des Lernfortschritts", async ({
  page,
}) => {
  await page.clock.install({ time: new Date("2026-10-03T16:00:00+02:00") });
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Losspielen" })).toBeEnabled();
  const state = await readStoredState(page),
    at = Date.parse("2026-09-20T12:00:00Z");
  for (let i = 0; i < 25; i++) {
    const run = emptyState(state.questions),
      r = startRound(
        run,
        {
          mode: "fehlerfrei",
          topic: "Alle Themen",
          difficulty: "Alle Stufen",
          recordPreset: "genre",
          filters: {
            genres: [i >= 23 ? "Fantasy" : "Horror"],
            sources: ["film"],
            difficulties: ["leicht", "mittel", "schwer"],
            familiarities: [1, 2, 3, 4],
          },
        },
        at + i * 100000,
      );
    const q = r.questions[0];
    answer(run, r.id, q.id, q.correctId, 1000, r.startedAt + 2000);
    const wrong = r.questions[1];
    answer(
      run,
      r.id,
      wrong.id,
      wrong.answers.find((a) => a.id !== wrong.correctId)!.id,
      1000,
      r.startedAt + 4000,
    );
    complete(run, r.id, r.startedAt + 10000);
    if (i === 24) {
      r.recordPreset = "custom";
      r.ruleVersion = "solo-v1.fehlerfrei.custom";
    }
    state.rounds.push(r);
    state.events.push(...run.events);
  }
  rebuild(state);
  await writeStoredState(page, state);
  await page.reload();
  await openRoundSetup(page);
  await page.getByRole("button", { name: "Auf Zeit", exact: true }).click();
  await modePreparation(page, /^Fehlerfrei /).click();
  await page.getByLabel(/Ein Genre ·/).check();
  await page.getByLabel("Genre für den Rekord").selectOption("Horror");
  await page.getByRole("button", { name: "Losspielen" }).click();
  await expect(page.locator(".answer").first()).toBeEnabled();
  const current = (await readStoredState(page)).rounds.at(-1)!,
    q = current.questions[0],
    wrong = q.answers.find((a) => a.id !== q.correctId)!;
  await page
    .locator(".answer")
    .filter({ has: page.getByText(wrong.text, { exact: true }) })
    .click();
  await expect(page.locator(".feedback")).toBeVisible();
  await page.getByRole("button", { name: /^Runde abschließen/ }).click();
  await expect(page.locator(".review")).toContainText(q.question);
  const result = await readStoredState(page),
    xp = result.experience;
  await page.getByRole("button", { name: "Bestenliste ansehen" }).click();
  await expect(
    page.getByLabel("Vergleichskategorie", { exact: true }),
  ).toHaveValue(recordKey(current));
  const highlighted = page.locator(".is-current-run");
  // New server runs have their own rule/category; the 23 older client runs
  // remain in their earlier category and do not affect this run's placement.
  await expect(highlighted).toContainText("Platz 1 · 0 Punkte");
  await expect(highlighted).toBeInViewport({ ratio: 0.5 });
  await expect(highlighted).toBeFocused();
  await expect(page.getByRole("button", { name: "Spiel ansehen" })).toHaveCount(
    0,
  );
  const saved = await readStoredState(page);
  expect(saved.rounds).toHaveLength(26);
  expect(saved.experience).toBe(xp);
  expect(saved.rounds.every((r) => r.archive && !r.questions.length)).toBe(
    true,
  );
  await page.getByRole("button", { name: "Alle Kategorien anzeigen" }).click();
  await expect(page.locator(".leaderboard-entry")).toHaveCount(25);
  const horrorCategories = page.getByRole("heading", {
    name: "Genre · Horror",
    exact: true,
  });
  await expect(horrorCategories).toHaveCount(2);
  for (const heading of await horrorCategories.all())
    await expect(heading).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Frühere eigene Auswahl", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Genre · Fantasy", exact: true }),
  ).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: "Highscores", exact: true }).click();
  await expect(page.locator(".leaderboard-entry")).toHaveCount(25);
  expect((await readStoredState(page)).experience).toBe(xp);
  await page.screenshot({
    path: `test-results/archivierte-rekorde-${test.info().project.name}.png`,
    fullPage: true,
  });
});
