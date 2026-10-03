import { test, expect, readStoredState } from "./fixtures";
import AxeBuilder from "@axe-core/playwright";

for (const width of [320, 1440]) {
  test(`Startseite bleibt kompakt und Auswahlklappen sind per Tastatur bedienbar bei ${width} Pixeln`, async ({
    page,
  }) => {
    await page.clock.install({ time: new Date("2026-10-03T12:00:00+02:00") });
    await page.setViewportSize({ width, height: 850 });
    await page.goto("/");
    const start = page.getByRole("button", { name: "Losspielen" });
    await expect(start).toBeEnabled();
    await expect(page.locator(".setup-section[open]")).toHaveCount(0);
    await expect(page.locator(".mode-card").first()).not.toBeVisible();
    const startBox = (await start.boundingBox())!;
    expect(startBox.y + startBox.height).toBeLessThan(400);
    await page.screenshot({
      path: `test-results/kompakte-startseite-standard-${width}.png`,
      fullPage: true,
    });
    const mode = page.locator(".setup-section").filter({
      has: page.locator(".setup-section-title", { hasText: /^Spielmodus$/ }),
    });
    const modeSummary = mode.locator("summary");
    await expect(modeSummary).toContainText("Filmreise");
    const before = await readStoredState(page);
    await modeSummary.focus();
    await page.keyboard.press("Enter");
    await expect(mode).toHaveAttribute("open", "");
    await page.keyboard.press("Enter");
    await expect(mode).not.toHaveAttribute("open", "");
    await page.keyboard.press("Space");
    await expect(mode).toHaveAttribute("open", "");
    await page.keyboard.press("Space");
    await expect(mode).not.toHaveAttribute("open", "");
    expect(await readStoredState(page)).toEqual(before);
    await modeSummary.click();
    await mode
      .getByRole("button", { name: /Freies Spiel Alle Stufen/ })
      .click();
    await modeSummary.click();
    await expect(modeSummary).toContainText("Freies Spiel");
    const films = page.locator(".setup-section").filter({
      has: page.locator(".setup-section-title", {
        hasText: /^Filmgenres & Filmauswahl$/,
      }),
    });
    await films.locator("summary").click();
    await films.getByRole("button", { name: "Alle Genres abwählen" }).click();
    await films.getByLabel("Western", { exact: true }).check();
    await films.getByLabel("Nur Classics", { exact: true }).check();
    await films.locator("summary").click();
    await expect(films.locator("summary")).toContainText("Western · Classics");
    await page.reload();
    await expect(start).toBeEnabled();
    await expect(page.locator(".setup-section[open]")).toHaveCount(0);
    await expect(modeSummary).toContainText("Freies Spiel");
    await expect(films.locator("summary")).toContainText("Western · Classics");
    const sources = page.locator(".setup-section").filter({
      has: page.locator(".setup-section-title", {
        hasText: /^Fragenbereiche$/,
      }),
    });
    await sources.locator("summary").click();
    await sources.getByLabel("Filmfragen", { exact: true }).uncheck();
    await sources.locator("summary").click();
    await expect(start).toBeDisabled();
    await expect(sources.locator("summary")).toContainText("Keine Bereiche");
    await sources.locator("summary").click();
    await sources.getByLabel("Schauspieler", { exact: true }).check();
    await sources.locator("summary").click();
    await expect(start).toBeEnabled();
    await expect(sources.locator("summary")).toContainText("Schauspieler");
    await expect(films.locator("summary")).toContainText("derzeit abgewählt");
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
      path: `test-results/kompakte-startseite-${width}.png`,
      fullPage: true,
    });
    await start.click();
    const stored = await readStoredState(page);
    const round = stored.rounds.find((r) => r.status === "active")!;
    expect(round.filters?.sources).toEqual(["actors"]);
    expect(round.solutionDisplay ?? "question").toBe("question");
    await page.getByRole("button", { name: "Pause & Startseite" }).click();
    await expect(
      page.getByRole("button", { name: "Fortsetzen" }),
    ).toBeVisible();
    await expect(page.locator(".setup-section[open]")).toHaveCount(0);
    await page.getByRole("button", { name: "Fortsetzen" }).click();
    expect(
      (await readStoredState(page)).rounds.find((r) => r.status === "active")
        ?.id,
    ).toBe(round.id);
  });
}
