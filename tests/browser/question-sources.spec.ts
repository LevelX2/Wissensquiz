import {
  modePreparation,
  openRoundSetup,
  test,
  expect,
  readStoredState,
} from "./fixtures";
import AxeBuilder from "@axe-core/playwright";
for (const width of [1440, 320]) {
  test(`Filmfragen, Schauspieler und Preisträger bilden einen additiven Pool bei ${width} Pixeln`, async ({
    page,
    context,
    browserName,
  }) => {
    test.skip(
      browserName === "webkit" && width === 1440,
      "Desktop in Chromium, mobile Ansicht in beiden Browsern.",
    );
    await page.clock.install({ time: new Date("2026-10-03T12:00:00+02:00") });
    await page.setViewportSize({ width, height: 850 });
    await page.goto("/");
    await expect(
      page.getByRole("button", { name: "Losspielen" }),
    ).toBeEnabled();
    await openRoundSetup(page);
    const sources = page.getByRole("group", {
      name: "Fragenbereiche",
      exact: true,
    });
    const genres = page.getByRole("group", { name: "Filmgenres", exact: true });
    await expect(
      sources.getByLabel("Filmfragen", { exact: true }),
    ).toBeChecked();
    await sources.getByLabel("Schauspieler", { exact: true }).check();
    await sources.getByLabel("Preisträger", { exact: true }).check();
    await openRoundSetup(page);
    await openRoundSetup(page);
    await modePreparation(page, /Freies Spiel Alle Stufen/).click();
    // Selecting a mode closes its panel after the asynchronous save.
    await openRoundSetup(page);
    await expect(
      sources.getByLabel("Filmfragen", { exact: true }),
    ).toBeChecked();
    await expect(
      modePreparation(page, /Freies Spiel Alle Stufen/),
    ).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator("#round-summary")).toContainText(
      "Filmfragen + Preisträger + Schauspieler",
    );
    await expect(page.locator("#round-summary")).toContainText("Alle Genres");
    await page.reload();
    await openRoundSetup(page);
    for (const label of ["Filmfragen", "Preisträger", "Schauspieler"])
      await expect(sources.getByLabel(label, { exact: true })).toBeChecked();
    const setup = (await readStoredState(page)).settings.roundSetup!;
    expect(setup.sources).toEqual(["film", "awards", "actors"]);
    expect(setup.categories).toEqual([]);
    expect(
      (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze())
        .violations,
    ).toEqual([]);
    await sources.scrollIntoViewIfNeeded();
    for (const img of await sources.locator("img").all()) {
      await expect
        .poll(() =>
          img.evaluate(
            (node) =>
              (node as HTMLImageElement).complete &&
              (node as HTMLImageElement).naturalWidth > 0,
          ),
        )
        .toBe(true);
      await img.evaluate((node) => (node as HTMLImageElement).decode());
      await img.screenshot();
    }
    await sources.screenshot({
      path: `test-results/fragenbereiche-${width}-${browserName}.png`,
    });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    // Film filters narrow only their own branch of the common pool.
    await page.getByRole("button", { name: "Alle Genres abwählen" }).click();
    await openRoundSetup(page);
    await genres.getByLabel("Sci-Fi", { exact: true }).check();
    await page.getByLabel("Nur Classics", { exact: true }).check();
    await page.getByRole("button", { name: "Losspielen" }).click();
    let state = await readStoredState(page);
    const mixed = state.rounds.find((r) => r.status === "active")!;
    expect(mixed.filters?.sources).toEqual(["film", "awards", "actors"]);
    expect(mixed.topic).toBe(
      "Filmfragen + Classics + Preisträger + Schauspieler",
    );
    expect(
      mixed.questions.every(
        (q) =>
          q.metadata.person_id ||
          q.tags.includes("Preisträger") ||
          (q.metadata.subdomain === "Science-Fiction" &&
            q.tags.includes("Classics")),
      ),
    ).toBe(true);
    expect(new Set(mixed.questions.map((q) => q.knowledgeId)).size).toBe(
      mixed.questions.length,
    );
    await page.getByRole("button", { name: "Pause & Startseite" }).click();
    await page
      .getByRole("button", { name: "Runde beenden", exact: true })
      .click();
    await openRoundSetup(page);
    await sources.getByLabel("Filmfragen", { exact: true }).uncheck();
    await expect(genres.getByRole("checkbox").first()).toBeDisabled();
    await expect(page.locator("#round-summary")).toContainText(
      "Preisträger + Schauspieler",
    );
    await expect(page.locator("#round-summary")).not.toContainText(
      "Kein Filmgenre",
    );
    await expect
      .poll(
        async () => (await readStoredState(page)).settings.roundSetup?.sources,
      )
      .toEqual(["awards", "actors"]);
    await page.reload();
    await openRoundSetup(page);
    await expect(
      sources.getByLabel("Filmfragen", { exact: true }),
    ).not.toBeChecked();
    await expect(
      page.getByRole("button", { name: "Losspielen" }),
    ).toBeEnabled();
    await page.getByRole("button", { name: "Losspielen" }).click();
    state = await readStoredState(page);
    const extra = state.rounds.find((r) => r.status === "active")!;
    expect(extra.filters?.sources).toEqual(["awards", "actors"]);
    expect(extra.filters?.genres).toEqual([]);
    expect(
      extra.questions.every(
        (q) => q.metadata.person_id || q.tags.includes("Preisträger"),
      ),
    ).toBe(true);
    await page.locator(".answer").first().click();
    await page.getByRole("button", { name: "Pause & Startseite" }).click();
    await page.getByRole("button", { name: "Profil", exact: true }).click();
    await page.getByRole("button", { name: "Optionen" }).click();
    await expect(
      page.getByText("Die App-Dateien sind im Offline-Cache bestätigt.", {
        exact: false,
      }),
    ).toBeVisible();
    if (browserName === "chromium") {
      await context.setOffline(true);
      await page.reload();
    } else {
      await page.reload();
      await context.setOffline(true);
    }
    await page.getByRole("button", { name: "Fortsetzen" }).click();
    await expect(page.locator(".explanation")).toBeVisible();
    const restored = await readStoredState(page);
    expect(restored.rounds.find((r) => r.id === extra.id)?.filters).toEqual(
      extra.filters,
    );
  });
}
