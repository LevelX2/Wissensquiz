import {
  modePreparation,
  test,
  expect,
  readStoredState,
  openRoundSetup,
  type Page,
} from "./fixtures";
import AxeBuilder from "@axe-core/playwright";

// Keep all synthetic account requests inside Playwright's route handlers.
test.use({ serviceWorkers: "block" });

async function readyQuestion(page: Page) {
  await expect(page.locator(".answer").first()).toBeVisible();
  await expect
    .poll(async () => {
      await page.clock.runFor(50);
      return page.locator(".answer").first().isEnabled();
    })
    .toBe(true);
}
async function timedMode(page: Page, mode: "Fehlerfrei" | "Zeitkonto") {
  await openRoundSetup(page);
  await page.getByRole("button", { name: "Auf Zeit", exact: true }).click();
  await page
    .getByRole("button", { name: new RegExp("^" + mode + " ") })
    .click();
  await page.getByRole("button", { name: "Losspielen" }).click();
  await readyQuestion(page);
}
async function respond(page: Page, correct: boolean) {
  await readyQuestion(page);
  const s = await readStoredState(page),
    r = s.rounds.at(-1)!,
    q = r.questions[r.events.length];
  const a = q.answers.find((a) =>
    correct ? a.id === q.correctId : a.id !== q.correctId,
  )!;
  await page.clock.runFor(3000);
  await page
    .locator(".answer")
    .filter({ has: page.getByText(a.text, { exact: true }) })
    .click();
  await expect(page.locator(".feedback")).toBeVisible();
}
test("Fehlerfrei sichert den ersten Fehler sofort, bleibt nach Neuladen und steht einzeln in allen Zeiträumen", async ({
  page,
}) => {
  await page.clock.install({ time: new Date("2026-10-03T12:00:00+02:00") });
  await page.clock.pauseAt(new Date("2026-10-03T12:00:00+02:00"));
  const reports: { event_kind: string; answers: number; hits: number }[] = [];
  await page.route("**/rest/v1/rpc/quiz_report_guest_activity", (r) => {
    reports.push(r.request().postDataJSON());
    return r.fulfill({ json: null });
  });
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("button", { name: "Losspielen" })).toBeEnabled();
  await timedMode(page, "Fehlerfrei");
  await respond(page, false);
  let s = await readStoredState(page);
  expect(s.rounds.at(-1)!.status).toBe("completed");
  expect(s.rounds.at(-1)!.events).toHaveLength(1);
  await expect
    .poll(() => reports.filter((r) => r.event_kind === "completed"))
    .toEqual([expect.objectContaining({ answers: 1, hits: 0 })]);
  await page.reload();
  await page.clock.resume();
  await page.getByRole("button", { name: "Highscores", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Fehlerfrei", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  for (const period of ["Woche", "Monat", "Jahr", "Allzeit"]) {
    await page.getByRole("button", { name: period, exact: true }).click();
    await expect(page.locator(".leaderboard-entry")).toHaveCount(1);
    await expect(page.locator(".leaderboard-entry")).toContainText("0 Punkte");
  }
  await page.getByRole("button", { name: "Spielen", exact: true }).click();
  await timedMode(page, "Fehlerfrei");
  await respond(page, false);
  await page.getByRole("button", { name: /^Runde abschließen/ }).click();
  await page.getByRole("button", { name: "Bestenliste ansehen" }).click();
  await expect(page.locator(".leaderboard-entry")).toHaveCount(2);
  await expect(page.locator(".is-current-run")).toHaveCount(1);
  await expect(page.locator(".is-current-run")).toContainText("Dieser Lauf");
  await expect(page.locator(".is-current-run")).toBeInViewport();
  await expect(page.locator(".leaderboard-entry").last()).toContainText(
    "Platz 1",
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.clock.resume();
  expect(
    (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze())
      .violations,
  ).toEqual([]);
  await page.screenshot({
    path: `test-results/rekordmodi-highscores-320-${test.info().project.name}.png`,
    fullPage: true,
  });
});
test("Zeitkonto verbraucht Antwortzeit, pausiert Erklärungen und beendet den Lauf bei leerem Konto", async ({
  page,
}) => {
  await page.clock.install({ time: new Date("2026-10-03T12:00:00+02:00") });
  await page.clock.pauseAt(new Date("2026-10-03T12:00:00+02:00"));
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("button", { name: "Losspielen" })).toBeEnabled();
  await timedMode(page, "Zeitkonto");
  await respond(page, true);
  expect((await readStoredState(page)).rounds.at(-1)!.run!.bankMs).toBe(120000);
  await page.clock.fastForward(60000);
  expect((await readStoredState(page)).rounds.at(-1)!.run!.bankMs).toBe(120000);
  for (let i = 0; i < 2; i++) {
    await page.getByRole("button", { name: /^Nächste Frage/ }).click();
    await page.clock.runFor(100);
    await respond(page, false);
  }
  const before = (await readStoredState(page)).rounds.at(-1)!;
  expect(before.run!.bankMs).toBeGreaterThan(22000);
  expect(before.run!.bankMs).toBeLessThan(25000);
  await page.getByRole("button", { name: /^Nächste Frage/ }).click();
  await readyQuestion(page);
  await expect(page.locator(".timer")).toContainText(/2[34] s/);
  await page.clock.runFor(100);
  await page.clock.fastForward(30000);
  // A suspended WebKit clock dispatches the next interval after the jump.
  await page.clock.runFor(200);
  await expect(page.locator(".feedback")).toBeVisible();
  await expect
    .poll(async () => (await readStoredState(page)).rounds.at(-1)!.status)
    .toBe("completed");
  const last = (await readStoredState(page)).rounds.at(-1)!;
  expect(last.run!.bankMs).toBe(0);
  expect(last.status).toBe("completed");
  expect(last.events).toHaveLength(4);
  await page.getByRole("button", { name: /^Runde abschließen/ }).click();
  await expect(
    page.getByRole("heading", { name: "Eine Runde weiter." }),
  ).toBeVisible();
});
test("Gruppen merken Varianten, Standardmix ist fest und laufende Endlosspiele werden bei Neuladen abgebrochen", async ({
  page,
}) => {
  await page.clock.install({ time: new Date("2026-10-03T12:00:00+02:00") });
  await page.clock.pauseAt(new Date("2026-10-03T12:00:00+02:00"));
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("button", { name: "Losspielen" })).toBeEnabled();
  await openRoundSetup(page);
  await page.getByRole("button", { name: "Auf Zeit", exact: true }).click();
  await modePreparation(page, /^Zeitkonto /).click();
  await expect(page.getByLabel(/Königsklasse ·/)).toBeChecked();
  await expect(
    page.getByRole("group", { name: "Schwierigkeitsstufen", exact: true }),
  ).toHaveCount(0);
  await openRoundSetup(page);
  await modePreparation(page, /^Zeitkonto /).click();
  await openRoundSetup(page);
  await page.getByRole("button", { name: "Lernen", exact: true }).click();
  await openRoundSetup(page);
  await modePreparation(page, /Freies Spiel Alle Stufen/).click();
  await openRoundSetup(page);
  await page.getByRole("button", { name: "Auf Zeit", exact: true }).click();
  await modePreparation(page, /^Zeitkonto /).click();
  await expect(page.locator(".mode-selection > summary")).toContainText(
    "Zeitkonto",
  );
  await expect(page.locator(".mode-selection")).toHaveJSProperty("open", false);
  await page.reload();
  await openRoundSetup(page);
  await expect(modePreparation(page, /^Zeitkonto /)).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page.getByRole("button", { name: "Losspielen" }).click();
  await page.clock.runFor(100);
  await respond(page, true);
  await page.reload();
  await expect
    .poll(async () => (await readStoredState(page)).rounds.at(-1)!.status)
    .toBe("aborted");
  await page.clock.resume();
  await page.getByRole("button", { name: "Highscores", exact: true }).click();
  await page.getByRole("button", { name: "Zeitkonto", exact: true }).click();
  await expect(page.locator(".leaderboard-entry")).toHaveCount(0);
});
test("Gäste sehen alle gemeinsamen Läufe und wechseln Modus, Zeitraum und begrenzte Seiten", async ({
  page,
}) => {
  const queries: Record<string, unknown>[] = [];
  await page.route("**/rest/v1/rpc/quiz_record_categories", (r) =>
    r.fulfill({
      json: [
        {
          category: "standard",
          genres: ["Horror"],
          difficulties: ["leicht", "mittel", "schwer"],
          topic: "Alle Themen",
          question_count: 0,
          rule_version: "solo-v1.fehlerfrei.standard",
        },
      ],
    }),
  );
  await page.route("**/rest/v1/rpc/quiz_record_runs", (r) => {
    const query = r.request().postDataJSON();
    queries.push(query);
    return r.fulfill({
      json: Array.from({ length: query.page_offset ? 1 : 50 }, (_, i) => ({
        player_name: "Mehrfachspieler",
        points: 200,
        correct: 2,
        answers: 3,
        elapsed_ms: 9000,
        finished_at: Date.parse("2026-10-03T10:00:00Z") + i,
        place: 1,
        is_mine: false,
        experience: 10,
      })),
    });
  });
  await page.route("**/rest/v1/rpc/quiz_duel_rankings", (r) =>
    r.fulfill({
      json: [
        {
          player_name: "Duellspieler",
          points: 4,
          wins: 1,
          draws: 1,
          losses: 1,
          completed: 3,
          place: 1,
          is_mine: false,
        },
      ],
    }),
  );
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("button", { name: "Losspielen" })).toBeEnabled();
  await page.getByRole("button", { name: "Highscores", exact: true }).click();
  await page.getByRole("button", { name: "Fehlerfrei", exact: true }).click();
  await page
    .getByRole("button", { name: "Gemeinsame Rangliste", exact: true })
    .click();
  await expect(
    page.getByRole("list", { name: "Gemeinsame Läufe" }).getByRole("listitem"),
  ).toHaveCount(50);
  await page.getByRole("button", { name: "Nächste 50" }).click();
  await expect(
    page.getByRole("list", { name: "Gemeinsame Läufe" }).getByRole("listitem"),
  ).toHaveCount(1);
  await page.getByRole("button", { name: "Woche", exact: true }).click();
  await expect
    .poll(() => queries.at(-1))
    .toMatchObject({ selected_period: "week", page_offset: 0 });
  await page.getByRole("button", { name: "Duelle", exact: true }).click();
  await expect(
    page.getByText("Platz 1 · Duellspieler · 4 Punkte", { exact: true }),
  ).toBeVisible();
});
