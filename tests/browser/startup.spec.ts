import {
  test,
  expect,
  accountBackend,
  fixCalendarTime,
  type Page,
} from "./fixtures";
import AxeBuilder from "@axe-core/playwright";

declare global {
  interface Window {
    startupImageAt: number | null;
  }
}

const artwork = /filmfieber-(?:wide|portrait)-\d+[^/]*\.webp/;

test.beforeEach(async ({ page }) => {
  await fixCalendarTime(page, new Date("2026-11-08T20:00:00Z"));
  // Keep native timers/RAF for React's asynchronous rendering and Axe.
  await page.addInitScript(() => {
    window.startupImageAt = null;
    const ready = (event: Event) => {
      if (
        window.startupImageAt === null &&
        event.target instanceof HTMLImageElement &&
        event.target.closest(".startup-screen .welcome-artwork")
      )
        window.startupImageAt = performance.now();
    };
    document.addEventListener("load", ready, true);
    document.addEventListener("error", ready, true);
  });
});

function gate() {
  let release = () => {};
  const ready = new Promise<void>((resolve) => {
    release = resolve;
  });
  return { ready, release: () => release() };
}

async function loadedIntro(page: Page) {
  await expect(page.locator(".startup-screen")).toBeVisible();
  await page
    .locator(".startup-screen .welcome-artwork img")
    .evaluate((img) => (img as HTMLImageElement).decode());
}

async function beforeEndOfIntro(page: Page) {
  await page.waitForFunction(
    () =>
      window.startupImageAt !== null &&
      performance.now() - window.startupImageAt >= 2300,
  );
  await expect(page.locator(".startup-screen")).toBeVisible();
  expect(accountBackend(page).api.calls).toHaveLength(0);
}

test("Kinostart bleibt 2,5 Sekunden vor dem automatischen Kontoeinstieg sichtbar", async ({
  page,
}) => {
  const verified = page.waitForResponse("**/auth/v1/user");
  await page.goto("/");
  await loadedIntro(page);
  await verified;
  await beforeEndOfIntro(page);
  await expect(page.getByRole("button", { name: "Losspielen" })).toBeEnabled();
  expect(
    await page.evaluate(() => performance.now() - window.startupImageAt!),
  ).toBeGreaterThanOrEqual(2500);
  await expect(page.locator(".startup-screen")).toHaveCount(0);
});

test("Kinostart ist auf Desktop und Smartphone lesbar und zugänglich", async ({
  page,
}, testInfo) => {
  const auth = gate();
  await page.route("**/auth/v1/user", async (route) => {
    await auth.ready;
    await route.fallback();
  });
  try {
    await page.goto("/");
    await loadedIntro(page);
    await expect(page.locator(".startup-screen .brand")).toBeVisible();
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
      path: testInfo.outputPath("kinostart.png"),
      fullPage: true,
    });
  } finally {
    auth.release();
  }
});

test("Sitzungsprüfung läuft während des Kinostarts und bekommt danach keine zweite Wartezeit", async ({
  page,
}) => {
  const auth = gate();
  const requested = gate();
  await page.route("**/auth/v1/user", async (route) => {
    requested.release();
    await auth.ready;
    await route.fallback();
  });
  try {
    await page.goto("/");
    await loadedIntro(page);
    await requested.ready;
    await page.waitForFunction(
      () =>
        window.startupImageAt !== null &&
        performance.now() - window.startupImageAt >= 3000,
    );
    await expect(page.locator(".startup-screen")).toBeVisible();
    expect(accountBackend(page).api.calls).toHaveLength(0);
    auth.release();
    // A second 2.5-second hold would prevent the account's first request here.
    await expect
      .poll(() => accountBackend(page).api.calls.length, { timeout: 2000 })
      .toBeGreaterThan(0);
    await expect(
      page.getByRole("button", { name: "Losspielen" }),
    ).toBeEnabled();
  } finally {
    auth.release();
  }
});

test("Ladezeit des Kinobilds verkürzt seine sichtbare Anzeigedauer nicht", async ({
  page,
}) => {
  const image = gate();
  await page.route(artwork, async (route) => {
    if (route.request().resourceType() !== "image") return route.continue();
    await image.ready;
    await route.continue();
  });
  try {
    const verified = page.waitForResponse("**/auth/v1/user");
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.locator(".startup-screen")).toBeVisible();
    await verified;
    await page.waitForFunction(() => performance.now() >= 3500);
    await expect(page.locator(".startup-screen")).toBeVisible();
    expect(accountBackend(page).api.calls).toHaveLength(0);
    image.release();
    await loadedIntro(page);
    await beforeEndOfIntro(page);
    await expect(
      page.getByRole("button", { name: "Losspielen" }),
    ).toBeEnabled();
  } finally {
    image.release();
  }
});

test("ein fehlgeschlagenes Titelbild blockiert den Kontoeinstieg nicht", async ({
  page,
}) => {
  await page.route(artwork, (route) =>
    route.request().resourceType() === "image"
      ? route.abort()
      : route.continue(),
  );
  await page.goto("/");
  await beforeEndOfIntro(page);
  await expect(page.getByRole("button", { name: "Losspielen" })).toBeEnabled();
});

test.describe("ohne bestehende Sitzung", () => {
  test.use({ autoLogin: false });

  test("der Kinostart führt nach 2,5 Sekunden zum interaktiven Probeeinstieg", async ({
    page,
  }) => {
    await page.goto("/");
    await loadedIntro(page);
    await beforeEndOfIntro(page);
    await expect(
      page.getByRole("button", { name: "Eine Runde ausprobieren" }),
    ).toBeEnabled();
    expect(
      await page.evaluate(() => performance.now() - window.startupImageAt!),
    ).toBeGreaterThanOrEqual(2500);
    await expect(page.locator(".startup-screen")).toHaveCount(0);
    expect(accountBackend(page).api.calls).toHaveLength(0);
  });
});
