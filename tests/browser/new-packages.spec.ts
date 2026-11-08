import { catalogCounts } from "../catalog-counts";
import { openRoundSetup, test, expect, readStoredState } from "./fixtures";
import AxeBuilder from "@axe-core/playwright";
import type { Question } from "../../src/model";

for (const both of [false, true]) {
  test(`Arthouse ${both ? "mit Classics" : "allein"}: Genre, Film, Bilder und Neuladen bleiben korrekt`, async ({
    page,
    context,
  }) => {
    await page.clock.install({ time: new Date("2026-09-26T12:00:00+02:00") });
    await page.setViewportSize({ width: 320, height: 740 });
    await page.goto("/");
    await expect(
      page.getByRole("button", { name: "Losspielen" }),
    ).toBeEnabled();
    await page.getByRole("button", { name: "Themen", exact: true }).click();
    await page.getByRole("button", { name: "Arthouse spielen" }).click();
    await expect(page.locator(".round-setup")).toBeVisible();
    await openRoundSetup(page);
    await expect(
      page.getByLabel("Nur Arthouse", { exact: true }),
    ).toBeChecked();
    await page
      .getByRole("button", { name: "Alle Genres abwählen", exact: true })
      .click();
    await openRoundSetup(page);
    await page
      .getByRole("group", { name: "Genres", exact: true })
      .getByLabel("Rom-Com", { exact: true })
      .check();
    if (both) await page.getByLabel("Nur Classics", { exact: true }).check();
    await expect(
      page.getByRole("button", { name: "Losspielen" }),
    ).toBeDisabled();
    await page
      .getByRole("button", { name: "Zum Freien Spiel wechseln" })
      .click();
    const imgs = page
      .getByRole("group", { name: "Sammlungen" })
      .locator("img");
    for (const img of await imgs.all()) {
      await img.scrollIntoViewIfNeeded();
      await expect
        .poll(() => img.evaluate((e) => (e as HTMLImageElement).naturalWidth))
        .toBeGreaterThan(0);
    }
    expect(
      (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze())
        .violations,
    ).toEqual([]);
    await page.locator(".round-setup").screenshot({
      path: `test-results/kategorien-${both ? "kombiniert" : "arthouse"}-320.png`,
    });
    await page.getByRole("button", { name: "Losspielen" }).click();
    await expect(page.locator(".question-facets")).toContainText(
      "Rom-Com",
    );
    const saved = await readStoredState(page);
    expect(saved.questions).toHaveLength(catalogCounts.questions);
    expect(new Set(saved.questions.map((q: any) => q.knowledgeId)).size).toBe(
      catalogCounts.goals,
    );
    expect(
      saved.questions.filter((q: any) => q.tags.includes("Arthouse")),
    ).toHaveLength(catalogCounts.arthouseQuestions);
    expect(
      saved.questions.filter((q: any) => q.tags.includes("Classics")),
    ).toHaveLength(catalogCounts.classicsQuestions);
    const round = saved.rounds.at(-1)!;
    expect(round.topic).toBe("Filmfragen");
    expect(round.filters?.collections?.slice().sort()).toEqual(
      both ? ["Arthouse", "Classics"] : ["Arthouse"],
    );
    expect(
      round.questions.every(
        (q: Question) =>
          q.works?.some(
            (work) =>
              work.type === "film" &&
              work.genres.includes("Rom-Com") &&
              (work.collections?.includes("Arthouse") ||
                (both && work.collections?.includes("Classics"))),
          ),
      ),
    ).toBe(true);
    expect(new Set(round.questions.map((q: any) => q.knowledgeId)).size).toBe(
      round.questions.length,
    );
    await page.locator(".answer").first().click();
    await expect(page.locator(".feedback")).toBeVisible();
    await page.getByRole("button", { name: "Pause & Startseite" }).click();
    await page.getByRole("button", { name: "Profil", exact: true }).click();
    await page.getByRole("button", { name: "Optionen" }).click();
    await page.reload();
    await page.getByRole("button", { name: "Fortsetzen" }).click();
    await expect(page.locator(".feedback")).toBeVisible();
    await expect(page.locator(".question-history")).toContainText(
      "1× beantwortet",
    );
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  });
}
