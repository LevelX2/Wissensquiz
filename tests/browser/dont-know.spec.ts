import { writeStoredState, accountBackend } from "./fixtures";
import { test, expect, readStoredState, type Page } from "./fixtures";
import AxeBuilder from "@axe-core/playwright";
import { answer, complete, startRound } from "../../src/engine";
import { emptyState, type Mode, type State } from "../../src/model";

test.use({ acknowledgeIncidentalSuccess: true });

const now = new Date("2026-10-02T12:00:00+02:00");
async function readState(page: Page): Promise<State> {
  return readStoredState(page);
}
async function waitForAnswers(page: Page) {
  await expect
    .poll(async () => {
      await page.clock.runFor(50);
      return page
        .getByRole("button", { name: "Keine Ahnung", exact: true })
        .isEnabled();
    })
    .toBe(true);
}
async function prepare(page: Page, mode: Mode = "ueben") {
  await page.clock.install({ time: new Date(now.getTime() - 60000) });
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Losspielen" })).toBeEnabled();
  const catalog = accountBackend(page).release.questions;
  const qs = [
    ...new Map(
      catalog
        .filter(
          (q) =>
            q.difficulty === "leicht" && q.metadata.subdomain === "Western",
        )
        .map((q) => [q.knowledgeId, q]),
    ).values(),
  ].slice(0, 2);
  const state = emptyState(catalog);
  state.settings.sound = false;
  if (mode === "fehler") {
    const previous = startRound(
      state,
      { mode: "ueben", topic: "Alle Themen", difficulty: "leicht" },
      now.getTime() - 20 * 60_000,
    );
    previous.questions = qs;
    previous.order = qs.map((q) => q.answers.map((a) => a.id));
    previous.familiaritySnapshot = undefined;
    for (const q of qs)
      answer(
        state,
        previous.id,
        q.id,
        q.answers.find((a) => a.id !== q.correctId)!.id,
        100,
        now.getTime() - 19 * 60_000,
      );
    complete(state, previous.id, now.getTime() - 18 * 60_000);
  }
  let round = startRound(
    state,
    { mode, topic: "Alle Themen", difficulty: "leicht" },
    now.getTime(),
  );
  round.questions = qs;
  round.order = qs.map((q) => q.answers.map((a) => a.id));
  round.familiaritySnapshot = undefined;
  if (mode === "rekord") {
    // A reload deliberately aborts record rounds. Start this one through the UI.
    state.rounds = [];
    state.settings.roundSetup = {
      mode,
      genres: ["Western"],
      categories: [],
      difficulties: ["leicht"],
      familiarities: [1, 2, 3, 4],
    };
  }
  await writeStoredState(page, state);
  await page.reload();
  // Both entry loads must finish before freezing the reveal timers.
  await expect(
    page.getByRole("button", {
      name: mode === "rekord" ? /^Losspielen/ : /^Fortsetzen/,
    }),
  ).toBeVisible();
  await page.clock.pauseAt(now);
  if (mode === "rekord") {
    await page.getByRole("button", { name: "Losspielen" }).click();
  } else await page.getByRole("button", { name: "Fortsetzen" }).click();
  await waitForAnswers(page);
  if (mode === "rekord") round = (await readState(page)).rounds.at(-1)!;
  return round;
}

for (const mode of ["entdecken", "ueben", "rekord", "fehler"] as const) {
  test(`Keine Ahnung in ${mode}: vier Antworten gleich lang zeigen, Lösung hervorheben und falsch werten`, async ({
    page,
    browserName,
  }, info) => {
    await page.setViewportSize({
      width: browserName === "webkit" || mode !== "ueben" ? 320 : 1280,
      height: 800,
    });
    const round = await prepare(page, mode);
    await expect(page.locator(".answer")).toHaveCount(5);
    const unknown = page.getByRole("button", {
      name: "Keine Ahnung",
      exact: true,
    });
    await unknown.focus();
    await page.keyboard.press("Enter");
    await expect(page.locator(".solution-reveal")).toBeVisible();
    await expect(
      page.locator(".solution-reveal .answer.correct"),
    ).toContainText(
      round.questions[0].answers.find(
        (a) => a.id === round.questions[0].correctId,
      )!.text,
    );
    await expect(page.locator(".feedback")).toBeFocused();
    await expect(page.locator(".answer")).toHaveCount(4);
    await expect(page.locator(".answer.correct")).toBeVisible();
    await expect(page.locator(".answer.wrong")).toHaveCount(0);
    await expect(page.locator(".answer.correct")).toHaveCSS(
      "background-color",
      "rgb(227, 242, 231)",
    );
    await expect(page.locator(".explanation")).toHaveCount(0);
    await expect(page.locator(".specific-feedback")).toHaveCount(0);
    await expect(page.locator(".feedback-actions")).toHaveCount(0);
    const saved = (await readState(page)).events.find(
      (e) => e.roundId === round.id,
    )!;
    expect(saved).toMatchObject({
      dontKnow: true,
      answerId: null,
      correct: false,
      knowledgePoints: 0,
      timeBonus: 0,
    });
    await page.screenshot({
      path: `test-results/keine-ahnung-${mode}-${info.project.name}.png`,
    });
    await page.clock.runFor(1000);
    await expect(page.locator(".solution-reveal")).toBeVisible();
    await expect(page.locator(".answer")).toHaveCount(4);
    await expect(page.locator(".feedback-actions")).toHaveCount(0);
    await page.clock.runFor(100);
    await expect(page.locator(".solution-reveal")).toHaveCount(0);
    await expect(page.locator(".chosen-answer")).toContainText("Keine Ahnung");
    await expect(page.locator(".feedback-outcome")).toContainText(
      "Nicht gewusst",
    );
    await expect(page.locator(".feedback-outcome")).not.toContainText(
      "Zeit abgelaufen",
    );
    await expect(page.locator(".explanation")).toBeVisible();
    await expect(page.locator(".feedback")).toBeFocused();
    await expect(page.locator(".answer-review")).not.toHaveAttribute("open");
    await page.getByText("Alle Antworten ansehen", { exact: true }).click();
    await expect(page.locator(".answer.correct")).toHaveCount(1);
    await expect(page.locator(".answer.wrong")).toHaveCount(0);
    await expect(page.locator(".answer")).toHaveCount(4);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.clock.resume();
    expect(
      (
        await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
          .analyze()
      ).violations,
    ).toEqual([]);
    await page.screenshot({
      path: `test-results/keine-ahnung-normal-${mode}-${info.project.name}.png`,
    });
    await page.getByRole("button", { name: "Nächste Frage" }).click();
    const questionCount = mode === "rekord" ? 10 : round.questions.length;
    for (let index = 1; index < questionCount; index++) {
      await waitForAnswers(page);
      const q = (await readState(page)).rounds.find((r) => r.id === round.id)!
        .questions[index];
      await page
        .locator(".answer")
        .filter({
          has: page.getByText(
            q.answers.find((a) => a.id === q.correctId)!.text,
            { exact: true },
          ),
        })
        .click();
      await expect(page.locator(".solution-reveal")).toBeVisible();
      await page.clock.runFor(1100);
      await page
        .getByRole("button", {
          name:
            index === questionCount - 1 ? "Runde abschließen" : "Nächste Frage",
        })
        .click();
    }
    await expect(page.locator(".result-metrics")).toContainText(
      "davon 1 × Keine Ahnung",
    );
    await expect(
      page
        .locator(".result-answer-strip")
        .getByLabel("Frage 1: keine Ahnung, als falsch gewertet"),
    ).toBeVisible();
    await page
      .locator(".review > details")
      .first()
      .locator(":scope > summary")
      .click();
    await expect(page.locator(".review > details").first()).toContainText(
      "Keine Ahnung",
    );
    expect(
      (await readState(page)).events.find((e) => e.roundId === round.id),
    ).toMatchObject({ dontKnow: true, answerId: null, correct: false });
  });
}

test("Reduzierte Animationen zeigen die richtige Lösung ruhig und erhalten die Tastaturbedienung", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await prepare(page);
  await page.getByRole("button", { name: "Keine Ahnung", exact: true }).click();
  await expect(page.locator(".solution-reveal")).toBeVisible();
  expect(
    await page
      .locator(".solution-reveal .answer.correct")
      .evaluate((el) => getComputedStyle(el).animationName),
  ).toBe("none");
  await page.clock.runFor(1100);
  await expect(
    page.getByRole("button", { name: "Nächste Frage" }),
  ).toBeEnabled();
});

test("Neuladen während der Lösungsanzeige bewahrt die Wahl; Fortsetzen speichert ohne doppelte Antwort", async ({
  page,
  context,
  browserName,
}) => {
  const round = await prepare(page);
  await page.getByRole("button", { name: "Keine Ahnung", exact: true }).click();
  await expect(page.locator(".solution-reveal")).toBeVisible();
  await page.reload();
  await page.clock.resume();
  await expect(page.getByRole("button", { name: "Fortsetzen" })).toBeVisible();
  await page.clock.pauseAt(
    new Date((await page.evaluate(() => Date.now())) + 1000),
  );
  await page.getByRole("button", { name: "Fortsetzen" }).click();
  await expect(page.locator(".chosen-answer")).toContainText("Keine Ahnung");
  await expect(page.locator(".solution-reveal")).toHaveCount(0);
  expect(
    (await readState(page)).events.filter((e) => e.roundId === round.id),
  ).toHaveLength(1);
  await page.getByRole("button", { name: "Nächste Frage" }).click();
  await waitForAnswers(page);
  await page.getByRole("button", { name: "Keine Ahnung", exact: true }).click();
  await expect(page.locator(".solution-reveal")).toBeVisible();
  await page.clock.runFor(1100);
  // Let WebKit flush passive effects after the reload with the clock
  // still anchored to the controlled test date.
  await page.clock.resume();
  await expect(page.locator(".solution-reveal")).toHaveCount(0);
  await page.getByRole("button", { name: "Runde abschließen" }).click();
  expect(
    (await readState(page)).events.filter(
      (e) => e.roundId === round.id && e.dontKnow,
    ),
  ).toHaveLength(2);
  await expect(page.locator(".result-metrics")).toContainText(
    "davon 2 × Keine Ahnung",
  );
});
