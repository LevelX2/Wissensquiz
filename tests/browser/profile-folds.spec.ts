import AxeBuilder from "@axe-core/playwright";
import { test, expect, fixCalendarTime, readStoredState } from "./fixtures";

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
    await expect(sections).toHaveCount(5);
    const subjects = ["film", "learning", "statistics", "account", "report"];
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
