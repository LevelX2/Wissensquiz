import {
  test,
  expect,
  fixCalendarTime,
  readStoredState,
  writeStoredState,
} from "./fixtures";
import { learningPathProgress } from "../../src/learningPath";
import { answer, complete, startRound } from "../../src/engine";
import { familiarityOf } from "../../src/familiarity";
import { genreOf, questionSourceOf } from "../../src/filters";
import AxeBuilder from "@axe-core/playwright";

test("Schmale Themenskalen zeigen Bekanntheit und Schwierigkeit unabhängig vom Lernstand", async ({
  page,
}, info) => {
  await fixCalendarTime(page, new Date("2026-10-22T10:00:00Z"));
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Losspielen" })).toBeEnabled();
  await page.getByRole("button", { name: "Themen", exact: true }).click();
  const card = (name: string) =>
    page.locator(".topic-card").filter({
      has: page.getByRole("heading", { name, exact: true }),
    });
  const horror = card("Horror");
  await expect(horror.locator(".topic-unlock-scale")).toHaveCount(2);
  await expect(
    horror.getByRole("img", { name: /^Bekanntheit: 1 von 4/ }),
  ).toBeVisible();
  await expect(
    horror.getByRole("img", { name: /^Schwierigkeit: 1 von 3/ }),
  ).toBeVisible();
  for (const name of ["Schauspieler", "Preisträger"])
    await expect(
      card(name).getByRole("img", { name: /^Schwierigkeit: 1 von 4/ }),
    ).toBeVisible();
  await expect(horror.locator(".topic-unlocks")).toHaveText(
    "BekanntheitSchwierigkeit",
  );

  const state = await readStoredState(page);
  const target = learningPathProgress(state)("Horror").easyTarget;
  const qs = [
    ...new Map(
      state.questions
        .filter(
          (q) =>
            questionSourceOf(q) === "film" &&
            genreOf(q) === "Horror" &&
            q.difficulty === "leicht" &&
            familiarityOf(q)! > 1,
        )
        .map((q) => [q.knowledgeId, q]),
    ).values(),
  ].slice(0, target);
  expect(qs).toHaveLength(target);
  for (let i = 0; i < qs.length; i += 10) {
    const round = startRound(
      state,
      { mode: "ueben", topic: "Alle Themen", difficulty: "leicht" },
      1792500000000 + i * 10000,
    );
    round.questions = qs.slice(i, i + 10);
    round.order = round.questions.map((q) => q.answers.map((a) => a.id));
    for (const q of round.questions)
      answer(
        state,
        round.id,
        q.id,
        q.correctId,
        1000,
        1792500001000 + i * 10000,
      );
    complete(state, round.id, 1792500002000 + i * 10000);
  }
  await writeStoredState(page, state);
  await page.reload();
  await page.getByRole("button", { name: "Themen", exact: true }).click();
  await expect(
    horror.getByRole("img", { name: /^Bekanntheit: 1 von 4/ }),
  ).toBeVisible();
  await expect(
    horror.getByRole("img", { name: /^Schwierigkeit: 2 von 3/ }),
  ).toBeVisible();
  await expect(horror.locator(".topic-encountered")).toContainText(
    `${target} von`,
  );
  const before = await readStoredState(page);
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 844 });
    await horror.scrollIntoViewIfNeeded();
    expect(
      await horror
        .locator(".topic-unlocks")
        .evaluate((el) => el.getBoundingClientRect().height),
    ).toBeLessThan(55);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await horror.screenshot({ path: info.outputPath(`skalen-${width}.png`) });
  }
  expect(
    (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze())
      .violations,
  ).toEqual([]);
  expect((await readStoredState(page)).events).toEqual(before.events);
});
