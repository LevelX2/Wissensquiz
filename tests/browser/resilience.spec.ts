import { openRoundSetup, test, expect, chromium } from "./fixtures";
import AxeBuilder from "@axe-core/playwright";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { isolateAccountService, testBaseUrl } from "./fixtures";
test("Ein vorbereitetes Update unterbricht keine laufende Runde", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Profil", exact: true }).click();
  await page.getByRole("button", { name: "Optionen" }).click();
  await expect(
    page.getByText("Die App-Dateien sind im Offline-Cache bestätigt.", {
      exact: false,
    }),
  ).toBeVisible({ timeout: 20000 });
  await page.getByRole("button", { name: "Spielen", exact: true }).click();
  await page.getByRole("button", { name: "Losspielen" }).click();
  await expect(page.locator(".answer").first()).toBeEnabled();
  const question = await page.locator(".question-card h1").innerText();
  await page.evaluate(async () => {
    await navigator.serviceWorker.register("/sw.js?update-check=1");
  });
  await expect
    .poll(() =>
      page.evaluate(
        async () =>
          !!(await navigator.serviceWorker.getRegistration())?.waiting,
      ),
    )
    .toBe(true);
  await expect(page.locator(".question-card h1")).toHaveText(question);
  await page.locator(".answer").first().click();
  await expect(page.locator(".feedback")).toBeVisible();
  await expect(page.getByText(/Eine neue Quiz-Version ist bereit/)).toHaveCount(
    0,
  );
  await page.getByRole("button", { name: "Pause & Startseite" }).click();
  await expect(
    page.getByText(/Eine neue Quiz-Version ist bereit/),
  ).toBeVisible();
});
test("Tastatur, sichtbarer Fokus und automatisierte Barrierearmutsprüfung", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const start = page.getByRole("button", { name: "Losspielen" });
  await expect(start).toBeEnabled();
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
  await start.focus();
  await page.keyboard.press("Enter");
  const answer = page.locator(".answer").first();
  await expect(answer).toBeEnabled();
  await answer.focus();
  expect(
    await answer.evaluate((e) => getComputedStyle(e).outlineStyle),
  ).not.toBe("none");
  await page.keyboard.press("Enter");
  await expect(page.locator(".feedback")).toBeVisible();
  await expect(page.locator(".feedback")).toBeFocused();
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
});
test("Fortschritt bleibt über einen vollständigen Browserneustart erhalten", async ({
  baseURL,
}) => {
  const profile = await mkdtemp(join(tmpdir(), "wissensquiz-test-"));
  let context = await chromium.launchPersistentContext(profile, {
    headless: true,
  });
  await isolateAccountService(context);
  let page = await context.newPage();
  await page.goto(testBaseUrl);
  await page.getByRole("button", { name: "Losspielen" }).click();
  await expect(page.locator(".answer").first()).toBeEnabled();
  await page.locator(".answer").first().click();
  await expect(page.locator(".feedback")).toBeVisible();
  const question = await page.locator(".question-card h1").innerText();
  await context.close();
  context = await chromium.launchPersistentContext(profile, { headless: true });
  await isolateAccountService(context);
  page = await context.newPage();
  await page.goto(testBaseUrl);
  await page.getByRole("button", { name: "Fortsetzen" }).click();
  await expect(page.locator(".question-card h1")).toHaveText(question);
  await expect(page.locator(".feedback")).toBeVisible();
  await context.close();
});
test("Hintergrundzeit und doppelte Klicks vergeben keine zweite Antwort", async ({
  page,
}) => {
  await page.clock.install();
  await page.goto("/");
  await openRoundSetup(page);
  await page.getByRole("button", { name: "Rekordrunde" }).click();
  await page.getByRole("button", { name: "Losspielen" }).click();
  await page.clock.runFor(100);
  await expect(page.locator(".answer").first()).toBeEnabled();
  await page.clock.fastForward(35000);
  await page.evaluate(() =>
    document.dispatchEvent(new Event("visibilitychange")),
  );
  await expect(
    page.getByRole("heading", { name: "Die Zeit ist um." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Nächste Frage" }).click();
  await page.clock.runFor(100);
  await page
    .locator(".answer")
    .first()
    .evaluate((button: HTMLButtonElement) => {
      button.click();
      button.click();
    });
  await expect(page.locator(".feedback")).toBeVisible();
  const counts = await page.evaluate(
    () =>
      new Promise<number[]>((resolve, reject) => {
        const request = indexedDB.open("wissensquiz");
        request.onsuccess = () => {
          const query = request.result
            .transaction("state")
            .objectStore("state")
            .get("current");
          query.onsuccess = () => {
            resolve([
              query.result.events.length,
              query.result.rounds[0].events.length,
            ]);
            request.result.close();
          };
          query.onerror = () => reject(query.error);
        };
      }),
  );
  expect(counts).toEqual([2, 2]);
});
