import {
  test,
  expect,
  openRoundSetup,
  modePreparation,
  readStoredState,
  accountBackend,
  fixCalendarTime,
} from "./fixtures";
import { statSync } from "node:fs";
import AxeBuilder from "@axe-core/playwright";
import { RankedSession } from "../../src/rankedRuns";
import type { Question } from "../../src/model";

test.use({ acknowledgeIncidentalSuccess: true });

test("Kleine Bildvarianten und lesbare Themen bei 320/390 Pixeln und großer Schrift", async ({
  page,
}, info) => {
  await fixCalendarTime(page, new Date("2026-10-18T10:00:00Z"));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Losspielen" })).toBeEnabled();
  const asset = await page
    .locator(".mode-selection > summary img")
    .evaluate(async (element: HTMLImageElement) => {
      await element.decode();
      const response = await fetch(element.currentSrc);
      return {
        url: element.currentSrc,
        bytes: (await response.arrayBuffer()).byteLength,
        width: element.naturalWidth,
      };
    });
  expect(asset.url).toMatch(/mode-entdecken-(160|320|480).*\.webp$/);
  expect(asset.width).toBeGreaterThan(0);
  expect(asset.bytes).toBeLessThan(
    statSync("public/modes/entdecken.png").size * 0.3,
  );
  await page.getByRole("button", { name: "Themen", exact: true }).click();
  await expect(page.locator(".topic-card")).toHaveCount(16);
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 844 });
    const text = page.locator(".topic-body .tiny").first();
    expect(
      await text.evaluate((element) =>
        Number.parseFloat(getComputedStyle(element).fontSize),
      ),
    ).toBeGreaterThanOrEqual(12);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  await page.screenshot({ path: info.outputPath("themen-390.png") });
  await page.evaluate(() => {
    document.documentElement.style.fontSize = "200%";
  });
  expect(
    await page
      .locator(".topic-body .tiny")
      .first()
      .evaluate((element) =>
        Number.parseFloat(getComputedStyle(element).fontSize),
      ),
  ).toBeGreaterThanOrEqual(24);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({ path: info.outputPath("themen-grosse-schrift.png") });
  await info.attach("Bilddaten", {
    body: Buffer.from(JSON.stringify(asset)),
    contentType: "application/json",
  });
});

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
    expect(box.width).toBeGreaterThanOrEqual(88);
    expect(box.height).toBeGreaterThanOrEqual(88);
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
  await expect(tile.locator("img")).toHaveAttribute(
    "src",
    /mode-ueben-320.*\.webp$/,
  );
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
  await modePreparation(page, /Filmreise Neues lernen/).click();
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

test("Aktueller Serverlauf behält seinen Rückblick; Genre-Ranglisten erhalten Spiele und Lernfortschritt", async ({
  page,
}) => {
  const now = new Date("2026-10-03T16:00:00+02:00");
  await page.clock.install({ time: now });
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Losspielen" })).toBeEnabled();
  const backend = accountBackend(page);
  await backend.ensureRanked();
  // Author complete native server runs, including the authoritative question pool.
  for (let i = 0; i < 25; i++) {
    const at = now.getTime() - 600_000 + i * 10_000;
    backend.api.clockAt(at);
    const session = new RankedSession(backend.api, backend.release.hash);
    await session.start({
      mode: "fehlerfrei",
      preset: "genre",
      genre: i >= 23 ? "Fantasy" : "Horror",
      solutionDisplay: "question",
    });
    const issuedQuestion = async () =>
      (
        await backend.admin(() =>
          backend.db.query<{ question: Question }>(
            "select question from quiz_ranked_internal.questions where run_id=$1 and index=$2",
            [session.run!.id, session.current!.index],
          ),
        )
      ).rows[0].question;
    const first = await issuedQuestion();
    backend.api.clockAt(at + 3000);
    await session.answer(first.correctId);
    await session.next();
    const second = await issuedQuestion();
    backend.api.clockAt(at + 6000);
    await session.answer(
      second.answers.find((a) => a.id !== second.correctId)!.id,
    );
    expect(session.run!.status).toBe("completed");
  }
  await page.reload();
  await expect(page.getByRole("button", { name: "Losspielen" })).toBeEnabled();
  const initial = await readStoredState(page);
  expect(initial.rounds).toHaveLength(25);
  expect(initial.experience).toBeGreaterThan(0);
  await openRoundSetup(page);
  await page.getByRole("button", { name: "Auf Zeit", exact: true }).click();
  await modePreparation(page, /^Fehlerfrei /).click();
  await page.getByLabel(/Ein Genre ·/).check();
  await page.getByLabel("Genre für den Rekord").selectOption("Horror");
  await page.getByRole("button", { name: "Losspielen" }).click();
  await expect(page.locator(".answer").first()).toBeEnabled();
  const current = (await readStoredState(page)).rounds.at(-1)!;
  const q = current.questions[0];
  await page
    .locator(".answer")
    .filter({
      has: page.getByText(q.answers.find((a) => a.id !== q.correctId)!.text, {
        exact: true,
      }),
    })
    .click();
  await expect(page.locator(".feedback")).toBeVisible();
  await page.getByRole("button", { name: /^Runde abschließen/ }).click();
  await expect(page.locator(".review")).toContainText(q.question);
  const result = await readStoredState(page);
  expect(result.rounds).toHaveLength(26);
  const newlySeen = initial.events.some((e) => e.knowledgeId === q.knowledgeId)
    ? 0
    : 1;
  expect(result.experience).toBe(initial.experience + newlySeen);
  await page.getByRole("button", { name: "Bestenliste ansehen" }).click();
  const category = page.getByLabel("Vergleichskategorie", { exact: true });
  await expect(category.locator("option:checked")).toContainText("Horror");
  await expect(page.locator(".leaderboard-entry")).toHaveCount(24);
  const highlighted = page.locator(".is-current-run");
  await expect(highlighted).toContainText("Dieser Lauf");
  await expect(highlighted).toContainText("0 Punkte");
  await expect(highlighted).toBeInViewport({ ratio: 0.5 });
  await expect(highlighted).toBeFocused();
  await expect(page.getByRole("button", { name: "Spiel ansehen" })).toHaveCount(
    0,
  );
  const fantasy = category.locator("option").filter({ hasText: "Fantasy" });
  await expect(fantasy).toHaveCount(1);
  await category.selectOption((await fantasy.getAttribute("value")) ?? "");
  await expect(page.locator(".leaderboard-entry")).toHaveCount(2);
  await page.reload();
  await page.getByRole("button", { name: "Highscores", exact: true }).click();
  await page.getByRole("button", { name: "Fehlerfrei", exact: true }).click();
  await expect(
    page.getByLabel("Vergleichskategorie", { exact: true }),
  ).toBeVisible();
  const saved = await readStoredState(page);
  expect(saved.rounds).toHaveLength(26);
  expect(saved.experience).toBe(result.experience);
  expect(saved.learning).toEqual(result.learning);
});
