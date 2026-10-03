import { test, expect, readStoredState, type Page } from "./fixtures";
import AxeBuilder from "@axe-core/playwright";

async function options(page: Page) {
  await page.getByRole("button", { name: "Profil", exact: true }).click();
  await page.getByRole("button", { name: "Optionen" }).click();
}

for (const duration of [500, 4000]) {
  test(`Anzeigezeit ${duration} ms: Schieberegler gespeichert, richtig/falsch/Keine Ahnung gleich lang`, async ({
    page,
  }, info) => {
    await page.clock.install({ time: new Date("2026-10-03T12:00:00+02:00") });
    await page.setViewportSize({ width: 320, height: 664 });
    await page.goto("/");
    await expect(
      page.getByRole("button", { name: "Losspielen" }),
    ).toBeEnabled();
    await options(page);
    const slider = page.getByRole("slider", {
      name: "Anzeigezeit der Antworten",
    });
    await expect(slider).toHaveValue("1.1");
    await expect(slider).toHaveAttribute("min", "0.5");
    await expect(slider).toHaveAttribute("max", "4");
    await expect(slider).toHaveAttribute("step", "0.1");
    await slider.focus();
    await slider.press(duration === 500 ? "Home" : "End");
    await expect(slider).toHaveValue(String(duration / 1000));
    await expect(slider).toHaveAttribute(
      "aria-valuetext",
      duration === 500 ? "0,5 Sekunden" : "4,0 Sekunden",
    );
    await expect
      .poll(async () => (await readStoredState(page)).settings.answerRevealMs)
      .toBe(duration);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    if (duration === 4000) {
      await slider.scrollIntoViewIfNeeded();
      await page.screenshot({
        path: `test-results/anzeigezeit-${info.project.name}-320.png`,
      });
      expect(
        (
          await new AxeBuilder({ page })
            .withTags(["wcag2a", "wcag2aa"])
            .analyze()
        ).violations,
      ).toEqual([]);
    }
    await page.reload();
    await expect(
      page.getByRole("button", { name: "Losspielen" }),
    ).toBeEnabled();
    await options(page);
    await expect(
      page.getByRole("slider", { name: "Anzeigezeit der Antworten" }),
    ).toHaveValue(String(duration / 1000));
    await page.getByRole("button", { name: "Spielen", exact: true }).click();
    await page.getByRole("button", { name: "Losspielen" }).click();
    for (const choice of ["correct", "wrong", "unknown"] as const) {
      await expect(
        page.getByRole("button", { name: "Keine Ahnung", exact: true }),
      ).toBeEnabled();
      const id = await page
        .locator("h1[data-question-id]")
        .getAttribute("data-question-id");
      const before = await readStoredState(page);
      const question = before.rounds
        .find((round) => round.status === "active")!
        .questions.find((q) => q.id === id)!;
      await page.clock.pauseAt(
        new Date((await page.evaluate(() => Date.now())) + 1000),
      );
      if (choice === "unknown")
        await page
          .getByRole("button", { name: "Keine Ahnung", exact: true })
          .click();
      else {
        const answer = question.answers.find((a) =>
          choice === "correct"
            ? a.id === question.correctId
            : a.id !== question.correctId,
        )!;
        await page
          .locator(".answer")
          .filter({ has: page.getByText(answer.text, { exact: true }) })
          .click();
      }
      await expect(page.locator(".solution-reveal")).toBeVisible();
      await expect(page.locator(".solution-reveal .answer")).toHaveCount(4);
      await expect(page.locator(".answer.correct")).toBeVisible();
      await expect(page.locator(".answer.wrong")).toHaveCount(
        choice === "wrong" ? 1 : 0,
      );
      await page.clock.runFor(duration - 1);
      await expect(page.locator(".solution-reveal")).toBeVisible();
      await expect(page.locator(".explanation")).toHaveCount(0);
      await page.clock.runFor(1);
      await expect(page.locator(".solution-reveal")).toHaveCount(0);
      await expect(page.locator(".explanation")).toBeVisible();
      const saved = await readStoredState(page);
      expect(saved.events).toHaveLength(before.events.length + 1);
      expect(saved.events.at(-1)?.elapsedMs).toBeLessThan(duration + 1500);
      await page.clock.resume();
      if (choice !== "unknown")
        await page.getByRole("button", { name: "Nächste Frage" }).click();
    }
  });
}
