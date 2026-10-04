import {
  modePreparation,
  openRoundSetup,
  test,
  expect,
  readStoredState,
  type Page,
} from "./fixtures";
import AxeBuilder from "@axe-core/playwright";
import { answer, complete, DAY, guess, startRound } from "../../src/engine";
import type { State } from "../../src/model";

const now = new Date("2026-10-02T12:00:00+02:00");
async function readState(page: Page): Promise<State> {
  return readStoredState(page);
}
async function writeState(page: Page, state: State) {
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
}

test("Lernstufen zeigen Zwischenfortschritt, Termine und Fehlerkorrektur auch nach Neuladen offline", async ({
  page,
  context,
  browserName,
}) => {
  const time = new Date("2026-10-14T12:00:00+02:00");
  const at = time.getTime();
  await page.clock.install({ time });
  await page.setViewportSize({ width: 320, height: 850 });
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Losspielen" })).toBeEnabled();
  const state = await readState(page);
  state.settings.sound = false;
  const qs = [
    ...new Map(
      state.questions
        .filter((q) => !q.id.startsWith("FACT-"))
        .map((q) => [q.knowledgeId, q]),
    ).values(),
  ].slice(0, 5);
  const play = (questions: typeof qs, date: number, wrong = false) => {
    const r = startRound(
      state,
      { mode: "ueben", topic: "Alle Themen", difficulty: "Alle Stufen" },
      date,
    );
    r.questions = structuredClone(questions);
    r.order = questions.map((q) => q.answers.map((a) => a.id));
    r.before = Object.fromEntries(
      questions
        .filter((q) => state.learning[q.knowledgeId])
        .map((q) => [
          q.knowledgeId,
          structuredClone(state.learning[q.knowledgeId]),
        ]),
    );
    r.familiaritySnapshot = undefined;
    questions.forEach((q, i) =>
      answer(
        state,
        r.id,
        q.id,
        wrong && i === questions.length - 1
          ? q.answers.find((a) => a.id !== q.correctId)!.id
          : q.correctId,
        1000,
        date + i,
      ),
    );
    complete(state, r.id, date + questions.length);
  };
  play([qs[2]], at - 11 * DAY);
  play([qs[2]], at - 10 * DAY);
  play([qs[2]], at - 7 * DAY);
  play([qs[1]], at - 4 * DAY);
  play([qs[1]], at - 3 * DAY);
  play([qs[0], qs[2], qs[3]], at - DAY, true);
  const r = startRound(
    state,
    { mode: "ueben", topic: "Alle Themen", difficulty: "Alle Stufen" },
    at,
  );
  r.questions = structuredClone(qs);
  r.order = qs.map((q) => q.answers.map((a) => a.id));
  r.before = Object.fromEntries(
    qs
      .filter((q) => state.learning[q.knowledgeId])
      .map((q) => [
        q.knowledgeId,
        structuredClone(state.learning[q.knowledgeId]),
      ]),
  );
  r.familiaritySnapshot = undefined;
  await writeState(page, state);
  await page.reload();
  await page.getByRole("button", { name: "Fortsetzen" }).click();
  const feedback = page.getByLabel("Lernfortschritt dieses Wissensziels");
  for (const [i, stage] of [2, 3, 4, 1, 1].entries()) {
    await page
      .locator(".answer")
      .filter({
        has: page.getByText(
          qs[i].answers.find((a) => a.id === qs[i].correctId)!.text,
          { exact: true },
        ),
      })
      .click();
    await expect(feedback).toContainText(`Lernstufe ${stage} von 4`);
    await expect(feedback.locator(".earned")).toHaveCount(stage);
    if (i === 0)
      await expect(feedback).toContainText("Nächste Lernstufe: in 3 Tagen");
    if (i === 1)
      await expect(feedback).toContainText("Nächste Lernstufe: in 7 Tagen");
    if (i === 2) await expect(feedback).toContainText("Gefestigt");
    if (i === 3)
      await expect(feedback).toContainText("aus dem Fehlertraining entfernt");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    if (i === 0) {
      const saved = await readState(page);
      await page.evaluate(() =>
        navigator.serviceWorker.ready.then(() => undefined),
      );
      if (browserName === "chromium") await context.setOffline(true);
      await page.reload();
      await page.getByRole("button", { name: "Fortsetzen" }).click();
      if (browserName === "webkit") await context.setOffline(true);
      await expect(feedback).toContainText("Lernstufe 2 von 4");
      expect((await readState(page)).events.length).toBe(saved.events.length);
      await page.screenshot({
        path: `test-results/lernstufe-2-${browserName}.png`,
        fullPage: true,
      });
    }
    await page
      .getByRole("button", {
        name: i === qs.length - 1 ? "Runde abschließen" : "Nächste Frage",
      })
      .click();
  }
  const insights = page.locator(".result-insights");
  await expect(
    insights.locator("div").filter({ hasText: "Erstmals sicher gelöst" }),
  ).toContainText("2");
  await expect(
    insights.locator("div").filter({ hasText: "Lernstufen verbessert" }),
  ).toContainText("5");
  await expect(
    insights.locator("div").filter({ hasText: "Frühere Fehler sicher gelöst" }),
  ).toContainText("1");
  await expect(
    insights.locator("div").filter({ hasText: "Neue Wissensziele entdeckt" }),
  ).toContainText("1");
  await expect(page.locator(".result-progress")).toContainText(
    "2 Wissensziele in dieser Runde neu geübt",
  );
  await expect(page.locator(".result-progress")).toContainText(
    "1 Wissensziel nach Abstand gefestigt",
  );
  expect((await readState(page)).learning[qs[2].knowledgeId].status).toBe(
    "gefestigt",
  );
  await page.screenshot({
    path: `test-results/lernstufen-ergebnis-${browserName}.png`,
    fullPage: true,
  });
  // Windows WebKit cannot fetch a previously unopened lazy view offline.
  // Offline answers/persistence are verified above; inspect collection online.
  await context.setOffline(false);
  await page.getByRole("button", { name: "Sammlung", exact: true }).click();
  await page
    .getByRole("button", { name: "Mit beantworteten Fragen", exact: true })
    .click();
  const card = page.locator(".topic-card").filter({
    has: page.getByRole("heading", { name: qs[0].topic, exact: true }),
  });
  await expect(card).toContainText("Stufe 2/4");
  expect(
    Number(await card.locator("progress").getAttribute("value")),
  ).toBeGreaterThan(0);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(
    (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze())
      .violations,
  ).toEqual([]);
  await page.screenshot({
    path: `test-results/lernstufen-sammlung-${browserName}.png`,
    fullPage: true,
  });
});

test("frühe sichere Wiederholung erklärt die unveränderte Stufe und erhält den Termin", async ({
  page,
}) => {
  await page.clock.install({ time: now });
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Losspielen" })).toBeEnabled();
  const state = await readState(page);
  const q = state.questions.find((q) => !q.id.startsWith("FACT-"))!;
  const at = now.getTime();
  for (const time of [at - 1000, at]) {
    const r = startRound(
      state,
      { mode: "ueben", topic: "Alle Themen", difficulty: "Alle Stufen" },
      time,
    );
    r.questions = [q];
    r.order = [q.answers.map((a) => a.id)];
    r.familiaritySnapshot = undefined;
    if (time < at) {
      answer(state, r.id, q.id, q.correctId, 100, time);
      complete(state, r.id, time);
    }
  }
  const due = state.learning[q.knowledgeId].due;
  await writeState(page, state);
  await page.reload();
  await page.getByRole("button", { name: "Fortsetzen" }).click();
  await page
    .locator(".answer")
    .filter({
      has: page.getByText(q.answers.find((a) => a.id === q.correctId)!.text, {
        exact: true,
      }),
    })
    .click();
  const progress = page.getByLabel("Lernfortschritt dieses Wissensziels");
  await expect(progress).toContainText("Lernstufe 1 von 4");
  await expect(progress).toContainText(
    "Heute hast Du bereits eine Lernstufe erreicht",
  );
  expect((await readState(page)).learning[q.knowledgeId].due).toBe(due);
});

test("gesammelte Lösungen zeigen den Lernfortschritt erst im Rundenrückblick", async ({
  page,
}) => {
  await page.clock.install({ time: now });
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Losspielen" })).toBeEnabled();
  const state = await readState(page);
  state.settings.sound = false;
  const q = state.questions.find((q) => !q.id.startsWith("FACT-"))!;
  const r = startRound(
    state,
    { mode: "ueben", topic: "Alle Themen", difficulty: "Alle Stufen" },
    now.getTime(),
  );
  r.questions = [q];
  r.order = [q.answers.map((a) => a.id)];
  r.familiaritySnapshot = undefined;
  r.solutionDisplay = "round";
  await writeState(page, state);
  await page.reload();
  await page.getByRole("button", { name: "Fortsetzen" }).click();
  await page
    .locator(".answer")
    .filter({
      has: page.getByText(q.answers.find((a) => a.id === q.correctId)!.text, {
        exact: true,
      }),
    })
    .click();
  await expect(page.locator(".question-card .learning-progress")).toHaveCount(
    0,
  );
  await expect(
    page.getByRole("heading", { name: "Dein Rundenrückblick" }),
  ).toBeVisible();
  await page.locator(".review > details > summary").first().click();
  await expect(
    page.getByLabel("Lernfortschritt dieses Wissensziels"),
  ).toContainText("Lernstufe 1 von 4");
});

for (const mode of ["entdecken", "fehler"] as const) {
  test(`${mode}: die globale Lösungswahl lässt Antwort und Vertiefung immer direkt lesen`, async ({
    page,
  }) => {
    await page.clock.install({ time: now });
    await page.goto("/");
    await expect(
      page.getByRole("button", { name: "Losspielen" }),
    ).toBeEnabled();
    const state = await readState(page);
    const seed = startRound(
      state,
      { mode: "ueben", topic: "Alle Themen", difficulty: "Alle Stufen" },
      now.getTime(),
    );
    for (const q of seed.questions)
      answer(state, seed.id, q.id, { dontKnow: true }, 1000, now.getTime());
    complete(state, seed.id, now.getTime());
    state.settings.solutionDisplay = "round";
    const round = startRound(
      state,
      { mode, topic: "Alle Themen", difficulty: "Alle Stufen" },
      now.getTime(),
    );
    expect(round.solutionDisplay).toBeUndefined();
    const id = round.questions[0].id;
    await writeState(page, state);
    await page.reload();
    await page.getByRole("button", { name: "Fortsetzen" }).click();
    await page
      .getByRole("button", { name: "Keine Ahnung", exact: false })
      .click();
    await expect(page.locator(".explanation")).toBeVisible();
    await page.clock.runFor(5000);
    await expect(page.locator(`h1[data-question-id="${id}"]`)).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Nächste Frage", exact: false }),
    ).toBeVisible();
  });
}

test("Fehlertraining hat einen verständlichen leeren Zustand und bleibt als Modus gespeichert", async ({
  page,
}) => {
  await page.clock.install({ time: now });
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Losspielen" })).toBeEnabled();
  await openRoundSetup(page);
  await modePreparation(page, /Fehlertraining Offene Fehler/).click();
  await expect(page.getByRole("button", { name: "Losspielen" })).toBeDisabled();
  await expect(
    page.getByText(/Keine offenen Fehler in Deiner Auswahl/),
  ).toBeVisible();
  await expect
    .poll(async () => (await readState(page)).settings.roundSetup?.mode)
    .toBe("fehler");
  await page.reload();
  await openRoundSetup(page);
  await expect(
    modePreparation(page, /Fehlertraining Offene Fehler/),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".round-guide")).toContainText(
    "fällt es aus dem Fehlertraining heraus",
  );
});

for (const width of [320, 1280]) {
  test(`Auswertung und gezielte Fehlerrunde bei ${width} Pixeln mit Offline-Speicherung`, async ({
    page,
    context,
    browserName,
  }) => {
    await page.clock.install({ time: now });
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await expect(
      page.getByRole("button", { name: "Losspielen" }),
    ).toBeEnabled();
    const state = await readState(page);
    state.settings.sound = false;
    const qs = [
      ...new Map(
        state.questions
          .filter((q) => !q.id.startsWith("FACT-"))
          .map((q) => [q.knowledgeId, q]),
      ).values(),
    ].slice(0, 5);
    const old = startRound(
      state,
      { mode: "ueben", topic: "Alle Themen", difficulty: "Alle Stufen" },
      now.getTime() - 2000,
    );
    old.questions = [qs[0]];
    old.order = [qs[0].answers.map((a) => a.id)];
    answer(
      state,
      old.id,
      qs[0].id,
      qs[0].answers.find((a) => a.id !== qs[0].correctId)!.id,
      1000,
      now.getTime() - 1900,
    );
    complete(state, old.id, now.getTime() - 1800);
    const round = startRound(
      state,
      { mode: "ueben", topic: "Alle Themen", difficulty: "Alle Stufen" },
      now.getTime() - 1000,
    );
    round.questions = qs;
    round.order = qs.map((q) => q.answers.map((a) => a.id));
    round.familiaritySnapshot = undefined;
    qs.forEach((q, i) => {
      answer(
        state,
        round.id,
        q.id,
        i === 3
          ? null
          : i === 1
            ? q.answers.find((a) => a.id !== q.correctId)!.id
            : q.correctId,
        1000,
        now.getTime() - 900 + i,
      );
      if (i === 2) guess(state, `${round.id}:${q.knowledgeId}`);
    });
    await writeState(page, state);
    await page.reload();
    await page.getByRole("button", { name: "Fortsetzen" }).click();
    await page.getByRole("button", { name: "Runde abschließen" }).click();
    await expect(page.locator(".result-score")).toContainText("3 / 5");
    await expect(page.locator(".result-ring")).toContainText("60%");
    await expect(page.locator(".result-answer-strip .guessed")).toHaveCount(1);
    await expect(page.locator(".result-insights")).toContainText(
      "Frühere Fehler sicher gelöst",
    );
    await expect(
      page.getByRole("button", { name: /Fehler dieser Runde üben \(2\)/ }),
    ).toBeEnabled();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    expect(
      (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze())
        .violations,
    ).toEqual([]);
    await page.screenshot({
      path: `test-results/auswertung-${width}.png`,
      fullPage: true,
    });
    const review = page.getByRole("group", { name: "Rückblick filtern" });
    await review
      .getByRole("button", { name: "Fehler (2)", exact: true })
      .click();
    await expect(page.locator(".review > details")).toHaveCount(2);
    await page.locator(".review > details > summary").first().click();
    await expect(
      page
        .locator(".review > details[open]")
        .getByText("Deine Antwort:", { exact: true }),
    ).toBeVisible();
    await review
      .getByRole("button", { name: "Geraten (1)", exact: true })
      .click();
    await expect(page.locator(".review > details")).toHaveCount(1);
    await page
      .getByRole("button", { name: /Fehler dieser Runde üben \(2\)/ })
      .click();
    await expect(page.locator(".question-card")).toBeVisible();
    const retry = (await readState(page)).rounds.at(-1)!;
    expect(retry.mode).toBe("fehler");
    expect(retry.questions.map((q) => q.knowledgeId).sort()).toEqual(
      [qs[1].knowledgeId, qs[3].knowledgeId].sort(),
    );
    await page.evaluate(() =>
      navigator.serviceWorker.ready.then(() => undefined),
    );
    // Offline reload is exercised in Chromium. The Windows WebKit harness
    // raises an internal navigation error offline; test resume online there,
    // followed by offline answers and persistence in the same isolated context.
    if (browserName === "chromium") await context.setOffline(true);
    await page.reload();
    await expect(
      page.getByRole("button", { name: "Fortsetzen" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Fortsetzen" }).click();
    if (browserName === "webkit") await context.setOffline(true);
    for (let i = 0; i < retry.questions.length; i++) {
      const q = retry.questions[i];
      await page
        .locator(".answer")
        .filter({ hasText: q.answers.find((a) => a.id === q.correctId)!.text })
        .click();
      await page
        .getByRole("button", {
          name:
            i === retry.questions.length - 1
              ? "Runde abschließen"
              : "Nächste Frage",
        })
        .click();
    }
    await expect(page.locator(".result-ring")).toContainText("100%");
    await expect(page.locator(".result .lead")).toContainText(
      "2 frühere Fehler sicher gelöst",
    );
    await expect(
      page.getByRole("button", { name: /Fehler dieser Runde üben/ }),
    ).toHaveCount(0);
    await page.getByRole("button", { name: "Neue Runde wählen" }).click();
    await openRoundSetup(page);
    await openRoundSetup(page);
    await openRoundSetup(page);
    await modePreparation(page, /Fehlertraining Offene Fehler/).click();
    await expect(
      page.getByRole("button", { name: "Losspielen" }),
    ).toBeDisabled();
    await expect(
      page.getByText(/Keine offenen Fehler in Deiner Auswahl/),
    ).toBeVisible();
    expect((await readState(page)).experience).toBe(33);
  });
}
