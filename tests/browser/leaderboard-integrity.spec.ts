import { test, expect, accountBackend } from "./fixtures";
import { server, alice, qs } from "./duel-service";
import { RankedSession } from "../../src/rankedRuns";
test.use({ serviceWorkers: "block" });

test("Duell fragt erst mit Serveruhr und erholt sich nach fehlgeschlagenem Fragenwechsel", async ({
  browser,
}) => {
  const service = await server();
  const context = await browser.newContext({ serviceWorkers: "block" });
  const page = await context.newPage();
  try {
    await service.setup(page, alice, true);
    let starts = 0;
    await page.route("**/rpc/quiz_duel_start", async (route) => {
      starts++;
      if (starts === 2)
        return route.fulfill({
          status: 503,
          json: { message: "Testunterbrechung" },
        });
      await route.fallback();
    });
    const firstResponse = page.waitForResponse((r) =>
      r.url().endsWith("/quiz_duel_start"),
    );
    await page
      .getByRole("button", { name: "Per Link einladen", exact: true })
      .click();
    expect(await (await firstResponse).json()).not.toHaveProperty("items");
    await expect(page.locator(".answer").first()).toBeEnabled();
    expect(starts).toBe(1); // onReady is local; no second start request after rendering.
    const first = (
      await service.db.query<{ duel_id: string; started_at: Date }>(
        "select duel_id,started_at from quiz_duel_answers where player=$1",
        [alice],
      )
    ).rows[0];
    expect(first.started_at).toBeTruthy();
    const id = await page
      .locator("h1[data-question-id]")
      .getAttribute("data-question-id");
    const q = qs.find((q) => q.id === id)!;
    const response = page.waitForResponse((r) =>
      r.url().endsWith("/quiz_duel_answer"),
    );
    await page
      .getByRole("button", {
        name: q.answers.find((a) => a.id === q.correctId)!.text,
        exact: false,
      })
      .click();
    expect((await (await response).json()).current).toBeNull();
    await expect(page.getByRole("alert")).toBeVisible();
    expect(
      (
        await service.db.query(
          "select * from quiz_duel_answers where duel_id=$1 and question_no=1",
          [first.duel_id],
        )
      ).rows,
    ).toHaveLength(0);
    await page
      .getByRole("button", { name: "Stand erneut laden", exact: true })
      .click();
    await expect(
      page.getByLabel("Frage 2: noch offen, aktuell", { exact: true }),
    ).toBeVisible();
    await expect(page.locator(".answer").first()).toBeEnabled();
    const second = (
      await service.db.query<{ started_at: Date }>(
        "select started_at from quiz_duel_answers where duel_id=$1 and question_no=1",
        [first.duel_id],
      )
    ).rows[0].started_at;
    await page
      .getByRole("button", { name: "Pause & Duellübersicht", exact: false })
      .click();
    await page
      .getByRole("button", { name: "Weiterspielen", exact: false })
      .click();
    await expect(page.locator(".answer").first()).toBeEnabled();
    expect(
      (
        await service.db.query<{ started_at: Date }>(
          "select started_at from quiz_duel_answers where duel_id=$1 and question_no=1",
          [first.duel_id],
        )
      ).rows[0].started_at,
    ).toEqual(second);
    expect(starts).toBe(3);
  } finally {
    await context.close();
    await service.db.close();
  }
});

test("Spielerbestenliste zeigt Wettbewerbs-XP aus echtem Serverabschluss", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Losspielen" })).toBeEnabled();
  const backend = accountBackend(page);
  await backend.ensureRanked();
  await page.route("**/rpc/quiz_public_players", async (route) => {
    const body = route.request().postDataJSON();
    const rows = await backend.admin(async () => {
      await backend.db.exec(
        "set role anon; select set_config('request.jwt.claim.sub','',false)",
      );
      try {
        return (
          await backend.db.query(
            "select * from public.quiz_public_players($1,$2)",
            [body.sort_by, body.page_offset],
          )
        ).rows;
      } finally {
        await backend.db.exec("reset role");
      }
    });
    // PGlite returns NUMERIC as text; PostgREST sends JSON numbers.
    await route.fulfill({
      json: rows.map((row) => {
        const value = row as { accuracy: string | number | null };
        return {
          ...value,
          accuracy: value.accuracy === null ? null : Number(value.accuracy),
        };
      }),
    });
  });
  const session = new RankedSession(backend.api, backend.release.hash);
  await session.start({
    mode: "fehlerfrei",
    preset: "standard",
    solutionDisplay: "question",
  });
  const q = backend.release.questions.find(
    (q) => q.id === session.current!.question.id,
  )!;
  await session.answer(q.answers.find((a) => a.id !== q.correctId)!.id);
  await page.getByRole("button", { name: "Highscores", exact: true }).click();
  await page.getByRole("button", { name: "Karriere", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Wettbewerbs-XP", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  const list = page.getByRole("list", { name: "Spielerrangliste" });
  await expect(list).toContainText("1 Wettbewerbs-XP");
  await expect(list).toContainText("1 abgeschlossene Spiele");
  await page.getByText("Was zählt für den Vergleich?", { exact: true }).click();
  await expect(
    page.getByText("Deine privaten Karriere-XP bleiben im Profil.", {
      exact: false,
    }),
  ).toBeVisible();
});
