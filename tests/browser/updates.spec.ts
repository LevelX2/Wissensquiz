import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { resolve, extname } from "node:path";
import { test, expect, readStoredState, fixCalendarTime } from "./fixtures";

test.setTimeout(90_000);

async function retirementServer() {
  const root = resolve("dist");
  const retirement = await readFile(resolve(root, "sw.js"), "utf8");
  let legacy = true;
  const server = createServer(async (request, response) => {
    try {
      const path = new URL(request.url!, "http://localhost").pathname;
      if (path === "/account-config.json") {
        response.setHeader("Content-Type", "application/json");
        return response.end(JSON.stringify({ enabled: false }));
      }
      if (path === "/sw.js") {
        response.setHeader("Content-Type", "application/javascript");
        response.setHeader("Cache-Control", "no-store");
        return response.end(
          legacy
            ? `
          self.addEventListener('install', e => e.waitUntil(
            caches.open('film-test-old-package').then(c => c.put('/old-cover.jpg', new Response('old-image')))
          ));
          self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
          self.addEventListener('fetch', e => { if(new URL(e.request.url).origin!==self.location.origin)return; e.respondWith(
            caches.open('film-test-old-package').then(async c => (await c.match(e.request)) || fetch(e.request))
          ); });
        `
            : retirement,
        );
      }
      const file = resolve(root, path === "/" ? "index.html" : "." + path);
      if (!file.startsWith(root + "/") && !file.startsWith(root + "\\"))
        throw new Error();
      const mime: Record<string, string> = {
        ".html": "text/html",
        ".js": "application/javascript",
        ".css": "text/css",
        ".svg": "image/svg+xml",
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".webmanifest": "application/manifest+json",
      };
      response.setHeader(
        "Content-Type",
        mime[extname(file)] ?? "application/octet-stream",
      );
      response.end(await readFile(file));
    } catch {
      response.writeHead(404);
      response.end();
    }
  });
  await new Promise<void>((done) => server.listen(0, "127.0.0.1", done));
  return {
    url: `http://127.0.0.1:${(server.address() as { port: number }).port}`,
    retire: () => {
      legacy = false;
    },
    close: () =>
      new Promise<void>((done) => {
        server.closeAllConnections();
        server.close(() => done());
      }),
  };
}

test("neuer Besuch lädt kein Offline-Paket und erhält Fortschritt nach Neuladen", async ({
  page,
}) => {
  await fixCalendarTime(page, new Date("2026-10-10T12:00:00+02:00"));
  const requested: string[] = [];
  page.on("request", (request) =>
    requested.push(new URL(request.url()).pathname),
  );
  await page.goto("/");
  await page.getByRole("button", { name: "Losspielen" }).click();
  await page.locator(".answer").first().click();
  await expect(page.locator(".feedback")).toBeVisible();
  const saved = await readStoredState(page);
  await page.reload();
  await page.getByRole("button", { name: "Fortsetzen" }).click();
  await expect(page.locator(".feedback")).toBeVisible();
  expect(await readStoredState(page)).toEqual(saved);
  await page.getByRole("button", { name: "Pause & Startseite" }).click();
  await page.getByRole("button", { name: "Profil", exact: true }).click();
  await page.getByRole("button", { name: "Optionen" }).click();
  await expect(page.getByText(/Zum Öffnen des Quiz/)).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Nach Update suchen|Quiz aktualisieren/ }),
  ).toHaveCount(0);
  expect(
    await page.evaluate(() =>
      navigator.serviceWorker.getRegistrations().then((r) => r.length),
    ),
  ).toBe(0);
  expect(await page.evaluate(() => caches.keys())).toEqual([]);
  expect(await page.evaluate(() => indexedDB.databases())).toEqual([]);
  expect(requested).not.toContain("/sw.js");
  expect(requested.filter((path) => path.startsWith("/portraits/"))).toEqual(
    [],
  );
});

test("vorhandenes Offline-Paket wird entfernt; laufende Runde und fremder Cache bleiben erhalten", async ({
  page,
}) => {
  const server = await retirementServer();
  try {
    await fixCalendarTime(page, new Date("2026-10-10T12:00:00+02:00"));
    await page.goto(server.url);
    await page.getByRole("button", { name: "Losspielen" }).click();
    await page.locator(".answer").first().click();
    await expect(page.locator(".feedback")).toBeVisible();
    const saved = await readStoredState(page);
    await page.evaluate(async () => {
      localStorage.setItem("personal-marker", "keep");
      const other = await caches.open("other-app-cache");
      await other.put("/other.txt", new Response("keep"));
      await navigator.serviceWorker.register("/sw.js", {
        updateViaCache: "none",
      });
    });
    await expect
      .poll(() => page.evaluate(() => !!navigator.serviceWorker.controller))
      .toBe(true);
    expect(
      await page.evaluate(async () =>
        (await caches.match("/old-cover.jpg"))?.text(),
      ),
    ).toBe("old-image");
    let navigations = 0;
    page.on("framenavigated", () => navigations++);
    server.retire();
    await page.evaluate(async () =>
      (await navigator.serviceWorker.getRegistration())!.update(),
    );
    await expect
      .poll(() =>
        page.evaluate(async () => ({
          registrations: (await navigator.serviceWorker.getRegistrations())
            .length,
          packages: (await caches.keys()).filter((name) =>
            name.startsWith("film-"),
          ),
        })),
      )
      .toEqual({ registrations: 0, packages: [] });
    expect(navigations).toBe(0);
    await expect(page.locator(".feedback")).toBeVisible();
    expect(await readStoredState(page)).toEqual(saved);
    expect(
      await page.evaluate(() => localStorage.getItem("personal-marker")),
    ).toBe("keep");
    expect(
      await page.evaluate(async () =>
        (await caches.match("/other.txt"))?.text(),
      ),
    ).toBe("keep");
    await page.reload();
    await page.getByRole("button", { name: "Fortsetzen" }).click();
    await expect(page.locator(".feedback")).toBeVisible();
    expect(await readStoredState(page)).toEqual(saved);
    expect(await page.evaluate(() => caches.keys())).toEqual([
      "other-app-cache",
    ]);
    await page.getByRole("button", { name: "Nächste Frage" }).click();
    await expect(page.locator(".answer").first()).toBeEnabled();
  } finally {
    await server.close();
  }
});
