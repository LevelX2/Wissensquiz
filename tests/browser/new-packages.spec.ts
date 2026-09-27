import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

for (const both of [false, true]) {
  test(`Arthouse ${both ? "mit Classics" : "allein"}: Genre, Film, Bilder und Offline bleiben korrekt`, async ({
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
    await expect(
      page.getByLabel("Nur Arthouse", { exact: true }),
    ).toBeChecked();
    await page
      .getByRole("button", { name: "Alle Genres abwählen", exact: true })
      .click();
    await page
      .getByRole("group", { name: "Filmgenres", exact: true })
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
      .getByRole("group", { name: "Zusätzliche Kategorien" })
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
    await expect(page.locator(".question-genre")).toHaveText("Rom-Com");
    const saved = await page.evaluate(
      () =>
        new Promise<any>((resolve, reject) => {
          const req = indexedDB.open("wissensquiz");
          req.onerror = () => reject(req.error);
          req.onsuccess = () => {
            const db = req.result;
            const r = db
              .transaction("state")
              .objectStore("state")
              .get("current");
            r.onsuccess = () => {
              db.close();
              resolve(r.result);
            };
          };
        }),
    );
    expect(saved.questions).toHaveLength(2567);
    expect(new Set(saved.questions.map((q: any) => q.knowledgeId)).size).toBe(
      2237,
    );
    expect(
      saved.questions.filter((q: any) => q.tags.includes("Arthouse")),
    ).toHaveLength(389);
    expect(
      saved.questions.filter((q: any) => q.tags.includes("Classics")),
    ).toHaveLength(557);
    const round = saved.rounds.at(-1);
    expect(round.topic).toBe(both ? "Classics + Arthouse" : "Arthouse");
    expect(
      round.questions.every(
        (q: any) =>
          (q.tags.includes("Arthouse") ||
            (both && q.tags.includes("Classics"))) &&
          q.metadata.subdomain === "Rom-Com",
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
    await expect(
      page.getByText("Die App-Dateien sind im Offline-Cache bestätigt.", {
        exact: false,
      }),
    ).toBeVisible();
    await context.setOffline(true);
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
