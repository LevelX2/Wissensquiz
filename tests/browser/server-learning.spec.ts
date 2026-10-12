import {
  test,
  expect,
  accountBackend,
  fixCalendarTime,
  openRoundSetup,
  modePreparation,
  readStoredState,
  writeStoredState,
} from "./fixtures";
import { answer, complete, startRound } from "../../src/engine";
import { questionSourceOf, genreOf } from "../../src/filters";

test("Wiederholen bietet alle Fragenbereiche und startet fällige Schauspieler- und Preisfragen", async ({
  page,
}) => {
  const now = new Date("2026-10-11T12:00:00+02:00");
  await page.clock.install({ time: now });
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Losspielen" })).toBeEnabled();
  const state = await readStoredState(page);
  state.settings.sound = false;
  const questions = (["film", "actors", "awards"] as const).map((source) =>
    state.questions.find(
      (q) => questionSourceOf(q) === source && q.difficulty === "leicht",
    )!,
  );
  expect(new Set(questions.map((q) => q.knowledgeId)).size).toBe(3);
  const seed = startRound(
    state,
    { mode: "ueben", topic: "Alle Themen", difficulty: "Alle Stufen" },
    now.getTime() - 1200000,
  );
  seed.questions = structuredClone(questions);
  seed.order = questions.map((q) => q.answers.map((a) => a.id));
  seed.familiaritySnapshot = undefined;
  for (const q of questions)
    answer(
      state,
      seed.id,
      q.id,
      { dontKnow: true },
      1000,
      now.getTime() - 1200000,
    );
  complete(state, seed.id, now.getTime() - 1199000);
  state.settings.roundSetup = {
    mode: "fehler",
    sources: ["film", "actors", "awards"],
    genres: [genreOf(questions[0])],
    categories: [],
    difficulties: ["leicht", "mittel", "schwer", "experte"],
    familiarities: [1, 2, 3, 4],
  };
  await writeStoredState(page, state);
  await page.reload();
  await openRoundSetup(page);
  const sources = page.getByRole("group", {
    name: "Fragenbereiche",
    exact: true,
  });
  for (const label of ["Filmfragen", "Schauspieler", "Preisträger"])
    await expect(sources.getByLabel(label, { exact: true })).toBeChecked();
  await expect(
    page.getByLabel("Fällige Wiederholungen", { exact: true }),
  ).toContainText("3 Wiederholungen fällig");
  // Narrowing the areas must update both the count and the actual server start.
  await sources.getByLabel("Filmfragen", { exact: true }).uncheck();
  await expect(
    page.getByLabel("Fällige Wiederholungen", { exact: true }),
  ).toContainText("2 Wiederholungen fällig");
  await page.getByRole("button", { name: "Losspielen" }).click();
  await expect(
    page.getByRole("button", { name: "Keine Ahnung", exact: true }),
  ).toBeEnabled();
  const round = (await readStoredState(page)).rounds.find(
    (r) => r.status === "active",
  )!;
  expect(round.questions).toHaveLength(2);
  expect(new Set(round.questions.map(questionSourceOf))).toEqual(
    new Set(["actors", "awards"]),
  );
  for (let i = 0; i < 2; i++) {
    await page
      .getByRole("button", { name: "Keine Ahnung", exact: true })
      .click();
    await page
      .getByRole("button", {
        name: i === 1 ? /Runde abschließen/ : /Nächste Frage/,
      })
      .click();
  }
  await expect(page.locator(".result")).toBeVisible();
  // Move the calendar without firing request timeouts of still loading result views.
  await page.clock.setSystemTime(new Date(now.getTime() + 11 * 60_000));
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await expect(
    page.getByRole("button", {
      name: /Fällige Fragen dieser Runde wiederholen \(2\)/,
    }),
  ).toBeVisible();
});

test("Freies Spiel wiederholt innerhalb 24 Stunden keine richtigen nicht fälligen Ziele bei Alternativen", async ({
  page,
}) => {
  const now = new Date("2026-10-11T12:00:00+02:00");
  await page.clock.install({ time: now });
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Losspielen" })).toBeEnabled();
  const state = await readStoredState(page);
  state.settings.sound = false;
  const pool = [
    ...new Map(
      state.questions
        .filter(
          (q) => questionSourceOf(q) === "film" && q.difficulty === "leicht",
        )
        .map((q) => [q.knowledgeId, q]),
    ).values(),
  ].slice(0, 20);
  expect(pool).toHaveLength(20);
  const round = startRound(
    state,
    { mode: "ueben", topic: "Alle Themen", difficulty: "Alle Stufen" },
    now.getTime() - 3600000,
  );
  round.questions = structuredClone(pool.slice(0, 10));
  round.order = round.questions.map((q) => q.answers.map((a) => a.id));
  round.familiaritySnapshot = undefined;
  for (const q of round.questions)
    answer(state, round.id, q.id, q.correctId, 1000, now.getTime() - 3599000);
  complete(state, round.id, now.getTime() - 3598000);
  const previous = new Set(round.questions.map((q) => q.knowledgeId));
  state.settings.roundSetup = {
    mode: "ueben",
    sources: ["film", "actors", "awards"],
    genres: null,
    categories: [],
    difficulties: ["leicht", "mittel", "schwer", "experte"],
    familiarities: [1, 2, 3, 4],
  };
  await writeStoredState(page, state);
  const backend = accountBackend(page);
  await backend.admin(async () => {
    await backend.db.query(
      "delete from quiz_game_internal.catalog_meta where not(id=any($1::text[]))",
      [pool.map((q) => q.id)],
    );
    await backend.db.exec(
      "select quiz_game_internal.refresh_groups();delete from quiz_game_internal.journey_cache;",
    );
  });
  await page.reload();
  await openRoundSetup(page);
  await expect(
    modePreparation(page, /Freies Spiel Alle Stufen/),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Losspielen" }).click();
  await expect(
    page.getByRole("button", { name: "Keine Ahnung", exact: true }),
  ).toBeEnabled();
  const next = (await readStoredState(page)).rounds.find(
    (r) => r.status === "active",
  )!;
  expect(next.questions).toHaveLength(10);
  expect(next.questions.every((q) => !previous.has(q.knowledgeId))).toBe(true);
  expect(next.questions.map((q) => q.knowledgeId).sort()).toEqual(
    pool
      .slice(10)
      .map((q) => q.knowledgeId)
      .sort(),
  );
});
test("zeigt aktuelle 50-Prozent-Schwellen ohne Clientkatalog", async ({
  page,
}) => {
  await fixCalendarTime(page, new Date("2026-10-11T12:00:00+02:00"));
  await page.goto("/");
  await openRoundSetup(page);
  await page.getByText("Deine Stufenfortschritte", { exact: true }).click();
  await expect(
    page.getByRole("progressbar", {
      name: "Abenteuer: Fortschritt zu Mittel",
      exact: true,
    }),
  ).toHaveAttribute("max", "102");
  await expect(
    page.getByRole("progressbar", {
      name: "Abenteuer: Fortschritt zu Schwer",
      exact: true,
    }),
  ).toHaveAttribute("max", "194");
  await expect(
    page.getByRole("progressbar", {
      name: "Abenteuer: Fortschritt zur nächsten Filmgruppe",
      exact: true,
    }),
  ).toHaveAttribute("max", "8");
  await expect(page.locator(".learning-path")).toContainText(
    "Filmgruppe 1: 0 von 15 leichten Wissenszielen sicher beantwortet",
  );
  await expect(page.locator(".learning-path")).toContainText(
    "2 · Bekannte Filme freischalten: 8 sichere Ziele nötig (50 %)",
  );
  expect(
    (
      await accountBackend(page).admin(() =>
        accountBackend(page).db.query<{ n: number }>(
          "select count(*)::int n from quiz_game_internal.catalog_meta",
        ),
      )
    ).rows[0].n,
  ).toBeGreaterThan(12000);
});

test("zeigt den Gesamtbestand unabhängig von Genre und Bereich und zählt Varianten nur einmal", async ({
  page,
}, testInfo) => {
  const now = new Date("2026-10-12T12:00:00+02:00").getTime();
  await fixCalendarTime(page, new Date(now));
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Losspielen" })).toBeEnabled();
  const state = await readStoredState(page);
  const total = new Set(state.questions.map((q) => q.knowledgeId)).size;
  const percent = Math.round((10000 * 3) / total) / 100;
  const label = percent.toLocaleString("de-DE") + " %";
  const overview = page.getByLabel("Gesamtfortschritt der Filmreise", {
    exact: true,
  });
  await expect(overview.getByRole("progressbar")).toHaveAttribute(
    "aria-valuenow",
    "0",
  );
  await expect(overview).toContainText(
    "Noch 50 neue Wissensziele bis zur 50er-Medaille",
  );
  const goals = (["film", "actors", "awards"] as const).map((source) =>
    state.questions.find(
      (q) => questionSourceOf(q) === source && q.difficulty === "leicht",
    )!,
  );
  for (const [i, q] of [...goals, goals[0]].entries()) {
    const round = startRound(
      state,
      { mode: "ueben", topic: "Alle Themen", difficulty: "leicht" },
      now - 2000,
    );
    round.questions = [q];
    round.order = [q.answers.map((a) => a.id)];
    answer(
      state,
      round.id,
      q.id,
      i === 2 ? { dontKnow: true } : q.correctId,
      1000,
      now - 1000,
    );
    complete(state, round.id, now);
  }
  state.settings.roundSetup = {
    mode: "entdecken",
    sources: ["film"],
    genres: ["Martial Arts & Asia-Film"],
    categories: [],
    difficulties: ["leicht", "mittel", "schwer"],
    familiarities: [1, 2, 3, 4],
  };
  await writeStoredState(page, state);
  await page.reload();
  await expect(overview).toContainText(label);
  await expect(overview).toContainText(
    "Noch 47 neue Wissensziele bis zur 50er-Medaille",
  );
  await expect(overview).not.toContainText(/gefestigt|unentdeckt|von 12/);
  await expect(overview).not.toContainText(
    /Filmgruppe|Martial Arts|Nächste Etappe/,
  );
  await expect(overview.getByRole("progressbar")).toHaveAttribute(
    "aria-valuemax",
    "100",
  );
  await expect(overview.getByRole("progressbar")).toHaveAttribute(
    "aria-valuenow",
    String(percent),
  );
  await page.screenshot({ path: testInfo.outputPath("journey-320.png") });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    320,
  );
  const text = await overview.textContent();
  state.settings.roundSetup.sources = ["actors"];
  state.settings.roundSetup.genres = [];
  await writeStoredState(page, state);
  await page.reload();
  await expect(overview).toHaveText(text!);
});

test("zeigt genreübergreifende Entdecker-Medaillen ab 50 und 100 Zielen auch nach Neuladen", async ({
  page,
}, testInfo) => {
  const now = new Date("2026-10-12T12:00:00+02:00").getTime();
  await fixCalendarTime(page, new Date(now));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Losspielen" })).toBeEnabled();
  const state = await readStoredState(page);
  const questions = [
    ...new Map(state.questions.map((q) => [q.knowledgeId, q])).values(),
  ].slice(0, 100);
  let seeded = 0;
  async function seed(count: number) {
    while (seeded < count) {
      const batch = questions.slice(seeded, Math.min(count, seeded + 10));
      const round = startRound(
        state,
        { mode: "ueben", topic: "Alle Themen", difficulty: "Alle Stufen" },
        now - 2000,
      );
      round.questions = structuredClone(batch);
      round.order = batch.map((q) => q.answers.map((a) => a.id));
      for (const q of batch)
        answer(state, round.id, q.id, q.correctId, 1000, now - 1000);
      complete(state, round.id, now);
      seeded += batch.length;
    }
    await writeStoredState(page, state);
    await page.reload();
  }
  await seed(49);
  const overview = page.getByLabel("Gesamtfortschritt der Filmreise", {
    exact: true,
  });
  await expect(overview).toContainText(
    "Noch 1 neues Wissensziel bis zur 50er-Medaille",
  );
  await seed(50);
  await expect(overview).toContainText(
    "Noch 50 neue Wissensziele bis zur 100er-Medaille",
  );
  await page.getByRole("button", { name: "Sammlung", exact: true }).click();
  const medals = page.getByRole("region", {
    name: "Entdecker-Medaillen",
    exact: true,
  });
  await expect(
    medals.getByLabel("Entdecker-Medaille: 50 Wissensziele", { exact: true }),
  ).toContainText("Erreicht");
  await expect(
    medals.getByLabel("Entdecker-Medaille: 100 Wissensziele", { exact: true }),
  ).toContainText("Noch 50");
  await medals.scrollIntoViewIfNeeded();
  await page.screenshot({
    path: testInfo.outputPath("discovery-medals-390.png"),
  });
  await seed(100);
  await expect(overview).toContainText(
    "Noch 150 neue Wissensziele bis zur 250er-Medaille",
  );
  await page.getByRole("button", { name: "Sammlung", exact: true }).click();
  await expect(
    medals.getByLabel("Entdecker-Medaille: 50 Wissensziele", { exact: true }),
  ).toContainText("Erreicht");
  await expect(
    medals.getByLabel("Entdecker-Medaille: 100 Wissensziele", { exact: true }),
  ).toContainText("Erreicht");
});

test("lädt keinen Katalog, setzt eine Serverrunde fort und speichert zehn Antworten", async ({
  page,
}) => {
  await fixCalendarTime(page, new Date("2026-10-11T12:00:00+02:00"));
  const catalogs: string[] = [];
  page.on("request", (r) => {
    if (/\.csv(?:\?|$)|quiz_sync_catalog|\/catalogs\//.test(r.url()))
      catalogs.push(r.url());
  });
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Losspielen" })).toBeEnabled();
  await page.getByRole("button", { name: "Losspielen" }).click();
  await expect(
    page.getByRole("button", { name: "Keine Ahnung", exact: true }),
  ).toBeEnabled();
  const backend = accountBackend(page);
  const count = await backend.admin(() =>
    backend.db.query<{ n: number }>(
      "select count(*)::integer n from quiz_game_internal.questions",
    ),
  );
  expect(count.rows[0].n).toBe(1);
  await page.reload();
  await page.getByRole("button", { name: "Fortsetzen" }).click();
  for (let i = 0; i < 10; i++) {
    await page
      .getByRole("button", { name: "Keine Ahnung", exact: true })
      .click();
    const next = page.getByRole("button", {
      name: i === 9 ? /Runde abschließen/ : /Nächste Frage/,
    });
    await expect(next).toBeEnabled();
    await next.click();
  }
  await expect(page.locator(".result")).toBeVisible();
  await page.reload();
  await expect(page.getByRole("button", { name: "Losspielen" })).toBeEnabled();
  const totals = await backend.admin(() =>
    backend.db.query<{ n: number }>(
      "select count(*)::integer n from public.quiz_sync_entries e join public.quiz_account_heads h on h.owner_id=e.owner_id and h.generation=e.generation where kind='event' and not deleted",
    ),
  );
  expect(totals.rows[0].n).toBe(10);
  expect(catalogs).toEqual([]);
  await page.getByRole("button", { name: "Themen", exact: true }).click();
  await expect(page.locator(".topic-card").first()).toBeVisible();
  await page.getByRole("button", { name: "Sammlung", exact: true }).click();
  await expect(page.locator(".topic-card").first()).toBeVisible();
  await page.getByRole("button", { name: "Profil", exact: true }).click();
  await page.getByRole("button", { name: "Optionen" }).click();
  await expect(
    page.getByRole("button", { name: /Alles als JSON sichern/ }),
  ).toHaveCount(0);
  await expect(page.getByLabel("Sicherung auswählen")).toHaveCount(0);
  await page.getByLabel("Zum Bestätigen LÖSCHEN eingeben").fill("LÖSCHEN");
  await page
    .getByRole("button", { name: "Fortschritt jetzt endgültig zurücksetzen" })
    .click();
  await expect(page.getByRole("button", { name: "Losspielen" })).toBeEnabled();
  const resetCount = await backend.admin(() =>
    backend.db.query<{ n: number }>(
      "select count(*)::integer n from public.quiz_sync_entries e join public.quiz_account_heads h on h.owner_id=e.owner_id and h.generation=e.generation where kind='event' and not deleted",
    ),
  );
  expect(resetCount.rows[0].n).toBe(0);
  expect(catalogs).toEqual([]);
  expect(
    await page.evaluate(() => ({
      indexedDB: typeof indexedDB,
      local: localStorage.getItem("wissensquiz-state"),
    })),
  ).toMatchObject({ local: null });
});
