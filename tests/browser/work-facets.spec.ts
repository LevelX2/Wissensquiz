import {
  test,
  expect,
  readStoredState,
  writeStoredState,
  openRoundSetup,
} from "./fixtures";
import { startRound } from "../../src/engine";
import AxeBuilder from "@axe-core/playwright";

test("mehrere Serienzuordnungen bleiben bei 320 Pixeln lesbar und lösungssicher", async ({
  page,
}, testInfo) => {
  await page.clock.install({ time: new Date("2026-11-08T12:00:00+01:00") });
  await page.setViewportSize({ width: 320, height: 850 });
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Losspielen" })).toBeEnabled();
  const state = await readStoredState(page);
  const base = state.questions.find((q) => q.metadata.person_id)!;
  const q = {
    ...base,
    question: "Wer spielt die Hauptrolle?",
    context: "Auflösung nach der Antwort.",
    difficulty: "leicht" as const,
    metadata: {
      person_id: base.metadata.person_id,
      subdomain: "Science-Fiction",
    },
    answers: base.answers.map((answer, i) => ({
      ...answer,
      text: `Person ${i + 1}`,
    })),
    works: [
      {
        type: "series" as const,
        originalTitle: "Verborgener Titel",
        year: 1999,
        season: 2,
        episode: 4,
        genres: ["Fantasy", "Science-Fiction"],
        techniques: ["animation" as const],
        collections: ["Classics" as const],
        familiarity: 1 as const,
      },
    ],
  };
  state.questions = [q];
  state.rounds = [];
  state.events = [];
  state.settings.showGenre = true;
  startRound(state, {
    mode: "ueben",
    topic: "Alle Themen",
    difficulty: "Alle Stufen",
    filters: { genres: null, difficulties: ["leicht"], sources: ["actors"] },
  });
  await writeStoredState(page, state);
  await page.reload();
  await page.getByRole("button", { name: /^Fortsetzen/ }).click();
  const facets = page.locator(".question-facets");
  await expect(facets).toBeVisible();
  await expect(facets.locator(".question-facet")).toHaveCount(6);
  for (const label of [
    "Serie",
    "Fantasy",
    "Sci-Fi",
    "Schauspieler",
    "Animation",
    "Classics",
  ])
    await expect(facets).toContainText(label);
  await expect(page.locator(".question-card")).not.toContainText(
    "Verborgener Titel",
  );
  await expect(page.locator(".question-card")).not.toContainText("1999");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(
    (
      await new AxeBuilder({ page })
        .include(".question-card")
        .withTags(["wcag2a", "wcag2aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
  await page
    .locator(".question-card")
    .screenshot({ path: testInfo.outputPath("series-facets-320.png") });
});

test("Werkart und Machart bleiben unabhängig gespeichert und zeigen einen leeren Serienbestand", async ({
  page,
}, testInfo) => {
  await page.clock.install({ time: new Date("2026-11-08T12:00:00+01:00") });
  await page.setViewportSize({ width: 320, height: 850 });
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Losspielen" })).toBeEnabled();
  // An empty current intersection, even when live-action series are present.
  const empty = await readStoredState(page);
  empty.questions = empty.questions.filter((q) =>
    q.works?.every(
      (w) => w.type !== "series" || !w.techniques.includes("animation"),
    ),
  );
  await writeStoredState(page, empty);
  await page.reload();
  await openRoundSetup(page);
  const types = page.getByRole("group", { name: "Werkart", exact: true });
  await types.getByLabel("Filme", { exact: true }).uncheck();
  await page.getByLabel("Animation", { exact: true }).check();
  await expect(page.getByRole("button", { name: "Losspielen" })).toBeDisabled();
  await expect
    .poll(
      async () => (await readStoredState(page)).settings.roundSetup?.workTypes,
    )
    .toEqual(["series"]);
  await expect
    .poll(
      async () => (await readStoredState(page)).settings.roundSetup?.techniques,
    )
    .toEqual(["animation"]);
  await page.reload();
  await openRoundSetup(page);
  await expect(types.getByLabel("Serien", { exact: true })).toBeChecked();
  await expect(types.getByLabel("Filme", { exact: true })).not.toBeChecked();
  await expect(page.getByLabel("Animation", { exact: true })).toBeChecked();
  await expect(page.locator("#round-summary")).toContainText("Serien");
  await expect(page.locator("#round-summary")).toContainText("Animation");
  for (const name of ["film", "series", "animation", "live-action"]) {
    const group = ["film", "series"].includes(name)
      ? types
      : page.getByRole("group", { name: "Machart", exact: true });
    const art = group.locator(`img[src*="genre-${name}-"]`);
    await expect(art).toHaveCount(1);
    await expect
      .poll(() => art.evaluate((img) => (img as HTMLImageElement).naturalWidth))
      .toBeGreaterThan(0);
  }
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await types.screenshot({ path: testInfo.outputPath("work-types-320.png") });
  await page
    .getByRole("group", { name: "Machart", exact: true })
    .screenshot({ path: testInfo.outputPath("techniques-320.png") });
});

for (const example of [
  {
    id: "SCHAUSPIELER-202610-P01-034-L-1",
    labels: ["Serie", "Sci-Fi", "Schauspieler", "Realfilm"],
    asset: "series",
  },
  {
    id: "SCHAUSPIELER-202610-P02-121-L-1",
    labels: ["Serie", "Komödie", "Schauspieler"],
    asset: "series",
  },
  {
    id: "SCHAUSPIELER-202610-P01-006-A-2",
    labels: ["Serie", "Fantasy", "Schauspieler"],
    asset: "series",
  },
  {
    id: "SCHAUSPIELER-202610-P01-021-A-2",
    labels: ["Film", "Fantasy", "Schauspieler", "Animation"],
    asset: "animation",
  },
]) {
  test(`echte Bestandsfrage ${example.id} zeigt passende Bildsymbole bei 320 Pixeln`, async ({
    page,
  }, testInfo) => {
    await page.clock.install({ time: new Date("2026-11-08T12:00:00+01:00") });
    await page.setViewportSize({ width: 320, height: 850 });
    await page.goto("/");
    await expect(
      page.getByRole("button", { name: "Losspielen" }),
    ).toBeEnabled();
    const state = await readStoredState(page);
    const q = state.questions.find((q) => q.id === example.id)!;
    expect(q).toBeTruthy();
    state.questions = [q];
    state.rounds = [];
    state.events = [];
    state.settings.showGenre = true;
    startRound(state, {
      mode: "ueben",
      topic: "Alle Themen",
      difficulty: "Alle Stufen",
      filters: {
        genres: null,
        difficulties: [q.difficulty],
        sources: ["actors"],
      },
    });
    await writeStoredState(page, state);
    await page.reload();
    await page.getByRole("button", { name: /^Fortsetzen/ }).click();
    const facets = page.locator(".question-facets");
    for (const label of example.labels)
      await expect(facets).toContainText(label);
    await expect(facets.locator("svg")).toHaveCount(0);
    const art = facets.locator(`img[src*="genre-${example.asset}-"]`);
    await expect(art).toHaveCount(1);
    await expect
      .poll(() => art.evaluate((img) => (img as HTMLImageElement).naturalWidth))
      .toBeGreaterThan(0);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page
      .locator(".question-card")
      .screenshot({ path: testInfo.outputPath("current-facets-320.png") });
  });
}
