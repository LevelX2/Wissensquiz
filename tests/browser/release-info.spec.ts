import { test, expect } from "./fixtures";
import AxeBuilder from "@axe-core/playwright";

test("Profil zeigt die tatsächliche Veröffentlichungszeit in Deutschland und erhält sie offline", async ({
  page,
  context,
  browserName,
}) => {
  await page.setViewportSize({ width: 320, height: 740 });
  if (browserName === "webkit") {
    // Windows WebKit bypasses Playwright routes after a service worker takes
    // control. Keep the offline worker and isolate this RPC at fetch instead.
    await page.addInitScript(() => {
      const original = window.fetch;
      window.fetch = async (input, init) => {
        const url = input instanceof Request ? input.url : String(input);
        if (url.endsWith("/rest/v1/rpc/quiz_app_release")) {
          if (!navigator.onLine)
            throw new TypeError("Synthetic offline request");
          const version = JSON.parse(
            String(init?.body ?? "{}"),
          ).selected_version;
          if (!Number.isInteger(version) || version < 1)
            return new Response("Invalid version", { status: 400 });
          return new Response(
            JSON.stringify([
              { version, published_at: "2026-10-03T10:04:05+00:00" },
            ]),
            { headers: { "Content-Type": "application/json" } },
          );
        }
        return original(input, init);
      };
    });
  }
  await context.route("**/rest/v1/rpc/quiz_app_release", (r) => {
    const version = r.request().postDataJSON().selected_version;
    expect(version).toBeGreaterThan(0);
    return r.fulfill({
      json: [{ version, published_at: "2026-10-03T10:04:05+00:00" }],
    });
  });
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Losspielen" })).toBeEnabled();
  await page.getByRole("button", { name: "Profil", exact: true }).click();
  const info = page.getByLabel("Version und Veröffentlichung");
  await expect(info).toContainText(/Version \d+/);
  await expect(info).toContainText("03.10.2026, 12:04 Uhr");
  expect(
    (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze())
      .violations,
  ).toEqual([]);
  await page.getByRole("button", { name: "Optionen" }).click();
  await expect(
    page.getByText("Die App-Dateien sind im Offline-Cache bestätigt.", {
      exact: false,
    }),
  ).toBeVisible();
  if (browserName === "chromium") await context.setOffline(true);
  await page.reload();
  if (browserName !== "chromium") await context.setOffline(true);
  await page.getByRole("button", { name: "Profil", exact: true }).click();
  await expect(info).toContainText("03.10.2026, 12:04 Uhr");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
