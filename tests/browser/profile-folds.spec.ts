import AxeBuilder from "@axe-core/playwright";
import {
  test,
  expect,
  fixCalendarTime,
  readStoredState,
  accountBackend,
} from "./fixtures";

for (const width of [320, 1280]) {
  test(`Profilklappen bei ${width} Pixeln: Icons, Tastatur und unveränderter Spielstand`, async ({
    page,
  }, testInfo) => {
    await fixCalendarTime(page, new Date("2026-10-11T12:00:00+02:00"));
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await expect(
      page.getByRole("button", { name: "Losspielen" }),
    ).toBeEnabled();
    const before = await readStoredState(page);
    await page.getByRole("button", { name: "Profil", exact: true }).click();
    const sections = page.locator(".profile-section");
    await expect(sections).toHaveCount(6);
    const subjects = [
      "film",
      "learning",
      "statistics",
      "achievements",
      "account",
      "report",
    ];
    const closedArrow = await sections
      .first()
      .locator("summary")
      .evaluate((el) => getComputedStyle(el, "::after").transform);
    for (const [index, section] of (await sections.all()).entries()) {
      await expect(section).not.toHaveAttribute("open");
      const summary = section.locator(":scope > summary");
      const icon = summary.locator("img");
      await expect(icon).toHaveAttribute(
        "src",
        `/disclosures/${subjects[index]}.png`,
      );
      await expect(icon).toHaveAttribute("alt", "");
      expect(
        await icon.evaluate((el) => (el as HTMLImageElement).naturalWidth),
      ).toBeGreaterThan(0);
      await summary.focus();
      await page.keyboard.press("Enter");
      await expect(section).toHaveAttribute("open", "");
      await expect(section.locator(".profile-section-content")).toBeVisible();
      await expect
        .poll(() =>
          summary.evaluate((el) => getComputedStyle(el, "::after").transform),
        )
        .not.toBe(closedArrow);
      await page.keyboard.press("Space");
      await expect(section).not.toHaveAttribute("open");
      await summary.click();
    }
    await expect
      .poll(() =>
        sections
          .last()
          .locator(".profile-section-content")
          .evaluate((el) => getComputedStyle(el).opacity),
      )
      .toBe("1");
    await expect(
      page.getByRole("button", { name: "Abmelden", exact: true }),
    ).toBeVisible();
    await expect(page.getByLabel("Kurztitel")).toBeVisible();
    expect(
      (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze())
        .violations,
    ).toEqual([]);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    expect(await readStoredState(page)).toEqual(before);
    await page.screenshot({
      path: testInfo.outputPath("profil-offen.png"),
      fullPage: true,
    });
    await page.getByRole("button", { name: "Spielen", exact: true }).click();
    await page.getByRole("button", { name: "Profil", exact: true }).click();
    await expect(page.locator(".profile-section[open]")).toHaveCount(0);
    await page.screenshot({
      path: testInfo.outputPath("profil-kompakt.png"),
      fullPage: true,
    });
    await page.getByRole("button", { name: "Optionen" }).click();
    await expect(
      page.getByRole("button", { name: "← Zurück zum Profil" }),
    ).toBeVisible();
  });
}

test("Profil lädt geschlossene Statistikklappen nicht und bündelt offene Erfolge mit der Spielstatistik", async ({
  page,
}) => {
  await fixCalendarTime(page, new Date("2026-10-12T18:00:00+02:00"));
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Losspielen" })).toBeEnabled();
  const { api } = accountBackend(page);
  const start = api.calls.length;
  const actions = () =>
    api.calls
      .slice(start)
      .filter((c) => c.name === "quiz_game_view")
      .map((c) => JSON.parse(c.args.request_text as string).action as string)
      .filter((a) =>
        [
          "summary",
          "profile-stats",
          "learning-achievements",
          "profile-progress",
        ].includes(a),
      );
  await page.getByRole("button", { name: "Profil", exact: true }).click();
  await expect(page.locator(".profile-section")).toHaveCount(6);
  expect(actions()).toEqual([]);
  const achievements = page.getByRole("region", {
    name: "Deine Erfolge",
    exact: true,
  });
  await achievements.locator(".profile-section > summary").click();
  await expect(
    achievements.getByRole("region", { name: "Filmkenner", exact: true }),
  ).toBeVisible();
  expect(actions()).toEqual(["profile-progress"]);
  const statistics = page.getByRole("region", {
    name: "Deine Spielstatistik",
    exact: true,
  });
  await statistics.locator("summary").click();
  await expect(statistics).toContainText("Runden gespielt");
  expect(actions()).toEqual(["profile-progress"]);
  await achievements.locator(".profile-section > summary").click();
  await achievements.locator(".profile-section > summary").click();
  await expect(
    achievements.getByRole("region", { name: "Filmkenner", exact: true }),
  ).toBeVisible();
  expect(actions()).toEqual(["profile-progress"]);
  // A previously cached summary may satisfy this fold; no unrelated reload.
  const learning = page.getByRole("region", {
    name: "Dein Lernstand",
    exact: true,
  });
  await learning.locator("summary").click();
  await expect(learning).toContainText("Stufe 4 · Gefestigt");
  expect(actions().filter((a) => a === "profile-progress")).toHaveLength(1);
  expect(actions().filter((a) => a === "summary").length).toBeLessThanOrEqual(
    1,
  );
});

test("Fehler einer Profilabfrage lassen Klappen bedienbar und werden gezielt wiederholt", async ({
  page,
}) => {
  await fixCalendarTime(page, new Date("2026-10-12T18:00:00+02:00"));
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Losspielen" })).toBeEnabled();
  const { api } = accountBackend(page);
  await page.getByRole("button", { name: "Profil", exact: true }).click();
  const achievements = page.getByRole("region", {
    name: "Deine Erfolge",
    exact: true,
  });
  api.unavailable("quiz_game_view");
  await achievements.locator(".profile-section > summary").click();
  await expect(achievements.getByRole("alert")).toContainText(
    "Dieser Bereich konnte nicht geladen werden.",
  );
  await expect(
    page
      .getByRole("region", { name: "Dein Lernstand", exact: true })
      .locator("summary"),
  ).toBeVisible();
  await achievements.getByRole("button", { name: "Erneut versuchen" }).click();
  await expect(
    achievements.getByRole("region", { name: "Filmkenner", exact: true }),
  ).toBeVisible();
  expect(
    api.calls.filter(
      (c) =>
        c.name === "quiz_game_view" &&
        JSON.parse(c.args.request_text as string).action === "profile-progress",
    ),
  ).toHaveLength(2);
});

test("Fehler der Lernübersicht wiederholen nur die fehlgeschlagene Abfrage", async ({
  page,
}) => {
  const now = new Date("2026-10-12T18:00:00+02:00");
  await fixCalendarTime(page, now);
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Losspielen" })).toBeEnabled();
  await page.getByRole("button", { name: "Profil", exact: true }).click();
  await expect(page.locator(".profile-section")).toHaveCount(6);
  // Expire the Date.now-based cache explicitly in every browser engine.
  await page.evaluate((stamp) => {
    window.Date = new Proxy(Date, {
      get(target, key, receiver) {
        return key === "now" ? () => stamp : Reflect.get(target, key, receiver);
      },
    });
  }, now.getTime() + 31000);
  const { api } = accountBackend(page);
  const start = api.calls.length;
  let fail = true;
  api.hook(async (name, args) => {
    if (
      name === "quiz_game_view" &&
      JSON.parse(args.request_text as string).action === "summary" &&
      fail
    ) {
      fail = false;
      throw new Error("Synthetische Offlinephase");
    }
  });
  const learning = page.getByRole("region", {
    name: "Dein Lernstand",
    exact: true,
  });
  await learning.locator("summary").click();
  await expect(learning.getByRole("alert")).toContainText(
    "Dieser Bereich konnte nicht geladen werden.",
  );
  await learning.getByRole("button", { name: "Erneut versuchen" }).click();
  await expect(learning).toContainText("Stufe 4 · Gefestigt");
  const actions = api.calls
    .slice(start)
    .filter((c) => c.name === "quiz_game_view")
    .map((c) => JSON.parse(c.args.request_text as string).action);
  expect(actions.filter((a) => a === "profile-progress")).toHaveLength(1);
  expect(actions.filter((a) => a === "summary")).toHaveLength(2);
});
