import { test, expect, writeStoredState } from "./fixtures";
import { currentQuestions } from "../helpers/current-content";
import { preparePresentation } from "../../src/questionPresentation";
import { emptyState } from "../../src/model";
import { startRound } from "../../src/engine";
import AxeBuilder from "@axe-core/playwright";

test.use({ acknowledgeIncidentalSuccess: true });

for (const solutionDisplay of ["question", "round"] as const) {
  test(`Quellen und Links: ${solutionDisplay}, Lösungsschutz und eindeutige Ziele auf schmalen Anzeigen`, async ({
    page,
  }) => {
    const now = Date.parse("2026-11-08T12:00:00+01:00");
    await page.clock.install({ time: new Date(now) });
    await page.setViewportSize({
      width: solutionDisplay === "question" ? 320 : 390,
      height: 844,
    });
    await page.goto("/");
    await expect(
      page.getByRole("button", { name: "Losspielen" }),
    ).toBeEnabled();
    const q =
      solutionDisplay === "question"
        ? currentQuestions().find(
            (q) => q.metadata.film_title_original === "The Prestige",
          )!
        : currentQuestions("actors").find(
            (q) =>
              q.metadata.person_id === "ACTOR-001" &&
              preparePresentation(q).films.length > 1,
          )!;
    const state = emptyState([q]);
    state.settings.solutionDisplay = solutionDisplay;
    state.settings.sound = false;
    startRound(
      state,
      { mode: "ueben", topic: q.topic, difficulty: "Alle Stufen" },
      now - 60_000,
    );
    await writeStoredState(page, state);
    await page.reload();
    await page.getByRole("button", { name: "Fortsetzen" }).click();
    await expect(page.locator(".question-card")).toBeVisible();
    const hidden = page.locator(
      '.question-card a[href*="imdb.com"], .question-card a[href*="ofdb.de"]',
    );
    await expect(hidden).toHaveCount(0);
    await expect(page.locator(".answer-sources")).toHaveCount(0);
    const correct = q.answers.find((answer) => answer.id === q.correctId)!;
    await page.locator(".answer").filter({ hasText: correct.text }).click();
    if (solutionDisplay === "round") {
      // Collected solutions finish the last question automatically.
      await expect(page.locator(".result")).toBeVisible();
      await expect(hidden).toHaveCount(0);
      await page.locator(".review > details > summary").click();
    } else {
      await expect(
        page.getByRole("button", { name: "Runde abschließen" }),
      ).toBeVisible();
    }
    const sources = page.locator(".answer-sources");
    await sources.locator(":scope > summary").click();
    await expect(
      sources.getByRole("heading", { name: "Belegquellen" }),
    ).toBeVisible();
    await expect(
      sources.getByRole("heading", { name: "Weiterführende Datenbanken" }),
    ).toBeVisible();
    const links = await sources.locator("a").evaluateAll((nodes) =>
      nodes.map((node) => ({
        href: node.getAttribute("href"),
        text: node.textContent,
      })),
    );
    expect(new Set(links.map((link) => link.href)).size).toBe(links.length);
    if (solutionDisplay === "question") {
      await expect(
        sources.getByRole("link", {
          name: "IMDb – Prestige – Die Meister der Magie (2006)",
          exact: true,
        }),
      ).toBeVisible();
      await expect(
        sources.getByRole("link", {
          name: "OFDb – Prestige – Die Meister der Magie (2006)",
          exact: true,
        }),
      ).toBeVisible();
      await expect(
        sources.getByRole("link", {
          name: /Wikipedia \(EN\) – Regie: Christopher Nolan/,
        }),
      ).toBeVisible();
      await expect(page.locator(".film-data a, .cast-sources a")).toHaveCount(
        0,
      );
    } else {
      await expect(
        sources.getByRole("link", { name: "IMDb – Tom Hanks", exact: true }),
      ).toBeVisible();
      expect(
        links.filter(({ href }) => href?.includes("imdb.com/title/")).length,
      ).toBeGreaterThan(1);
    }
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    // Both nested details animate on opening; audit the settled link colors.
    await page
      .locator(".review > details[open], .answer-sources")
      .evaluateAll(async (elements) => {
        await Promise.all(
          elements.flatMap((element) =>
            element
              .getAnimations({ subtree: true })
              .map((animation) => animation.finished),
          ),
        );
      });
    expect(
      (
        await new AxeBuilder({ page })
          .include(".answer-sources")
          .withTags(["wcag2a", "wcag2aa"])
          .analyze()
      ).violations,
    ).toEqual([]);
    await sources.screenshot({
      path: test.info().outputPath("quellen-und-links.png"),
    });
  });
}
