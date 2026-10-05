import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { resolve, extname } from "node:path";
import { test } from "@playwright/test";
import {
  expect,
  readStoredState,
  fixCalendarTime,
  type Page,
} from "./fixtures";

test.setTimeout(90_000);

// Two actual worker versions, served from one isolated origin. Never replace
// the shared production build or contact the real account service.
async function updateServer(accounts = false) {
  const root = resolve("dist");
  const worker = await readFile(resolve(root, "sw.js"), "utf8");
  let version = 1;
  const server = createServer(async (request, response) => {
    try {
      const path = new URL(request.url!, "http://localhost").pathname;
      if (path === "/account-config.json") {
        response.setHeader("Content-Type", "application/json");
        return response.end(
          JSON.stringify({
            enabled: accounts,
            supabaseUrl: "https://quiz-test.supabase.co",
            publishableKey: "sb_publishable_test",
          }),
        );
      }
      if (path === "/sw.js") {
        response.setHeader("Content-Type", "application/javascript");
        response.setHeader("Cache-Control", "no-store");
        return response.end(
          worker.replace(
            /const CACHE=("[^"]+")/,
            (_, cache) =>
              `const CACHE=${JSON.stringify(JSON.parse(cache) + "-test-" + version)}`,
          ),
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
  const address = server.address() as { port: number };
  return {
    url: `http://127.0.0.1:${address.port}`,
    publish: () => {
      version++;
    },
    close: () =>
      new Promise<void>((done) => {
        server.closeAllConnections();
        server.close(() => done());
      }),
  };
}

async function controlled(page: Page) {
  await expect
    .poll(() => page.evaluate(() => !!navigator.serviceWorker.controller))
    .toBe(true);
}
async function settings(page: Page) {
  await page.getByRole("button", { name: "Profil", exact: true }).click();
  await page.getByRole("button", { name: /Optionen/ }).click();
}

const syntheticOwner = "11111111-1111-4111-8111-111111111111";
const syntheticUser = {
  id: syntheticOwner,
  aud: "authenticated",
  role: "authenticated",
  email: "synthetic@example.test",
  email_confirmed_at: "2026-10-01T10:00:00Z",
  created_at: "2026-10-01T10:00:00Z",
  app_metadata: { provider: "email" },
  user_metadata: {},
};
async function signedIn(page: Page) {
  const token = [
    { alg: "HS256", typ: "JWT" },
    { sub: syntheticOwner, exp: 2000000000, role: "authenticated" },
    "synthetic",
  ]
    .map((value) =>
      Buffer.from(
        typeof value === "string" ? value : JSON.stringify(value),
      ).toString("base64url"),
    )
    .join(".");
  await page.addInitScript(
    (session) =>
      localStorage.setItem(
        "wissensquiz-auth:quiz-test.supabase.co",
        JSON.stringify(session),
      ),
    {
      access_token: token,
      refresh_token: "synthetic-refresh",
      token_type: "bearer",
      expires_at: 2000000000,
      expires_in: 3600,
      user: syntheticUser,
    },
  );
}

test("ein unbestätigter Kontostand sperrt das Update bis zur erfolgreichen Sicherung", async ({
  page,
}) => {
  const server = await updateServer(true);
  try {
    await fixCalendarTime(page, new Date("2026-10-05T12:00:00+02:00"));
    await signedIn(page);
    await page.addInitScript((user) => {
      const original = window.fetch;
      let saved:
        { state: unknown; revision: number; updated_at: string } | undefined;
      window.fetch = async (input, init) => {
        const url = input instanceof Request ? input.url : String(input);
        const json = (value: unknown, status = 200) =>
          new Response(JSON.stringify(value), {
            status,
            headers: { "Content-Type": "application/json" },
          });
        if (url === "https://quiz-test.supabase.co/auth/v1/user")
          return json(user);
        if (url.endsWith("/quiz_sync_metadata"))
          return json({ code: "PGRST202" }, 404);
        if (url.includes("/rest/v1/quiz_saves?")) return json(saved ?? null);
        if (url.endsWith("/quiz_save_state")) {
          if (localStorage.getItem("synthetic-save-fail"))
            return json({ code: "XX000" }, 500);
          const body = JSON.parse(String(init?.body));
          saved = {
            state: body.payload,
            revision: (saved?.revision ?? 0) + 1,
            updated_at: new Date().toISOString(),
          };
          return json(saved.revision);
        }
        if (url.startsWith("https://quiz-test.supabase.co/")) return json([]);
        return original(input, init);
      };
    }, syntheticUser);
    await page.goto(server.url);
    await expect(page.locator(".sync-symbol.saved").first()).toBeVisible();
    await controlled(page);
    await settings(page);
    await page.evaluate(() => localStorage.setItem("synthetic-save-fail", "1"));
    await page.getByRole("checkbox", { name: "Soundeffekte" }).click();
    await expect(
      page.getByRole("checkbox", { name: "Soundeffekte" }),
    ).not.toBeChecked();
    await expect(page.locator(".sync-symbol.offline").first()).toBeVisible();
    const key = `account:quiz-test.supabase.co:${syntheticOwner}`;
    const before = await readStoredState(page, key);
    server.publish();
    await page.getByRole("button", { name: "Nach Update suchen" }).click();
    const update = page.getByRole("button", {
      name: "Quiz aktualisieren",
      exact: true,
    });
    await expect(update).toBeDisabled();
    await expect(
      page.getByText("Warte, bis Dein Spielstand online gespeichert ist."),
    ).toBeVisible();
    expect(await readStoredState(page, key)).toEqual(before);
    await page.evaluate(() => {
      localStorage.removeItem("synthetic-save-fail");
      window.dispatchEvent(new Event("online"));
    });
    await expect(page.locator(".sync-symbol.saved").first()).toBeVisible();
    await expect(update).toBeEnabled();
    expect(await readStoredState(page, key)).toEqual(before);
  } finally {
    await server.close();
  }
});

test("Quiz-Update wartet auf andere Fenster, erhält den Gaststand und startet danach offline", async ({
  page,
  context,
}) => {
  const server = await updateServer();
  try {
    await fixCalendarTime(page, new Date("2026-10-05T12:00:00+02:00"));
    await page.goto(server.url);
    await expect(
      page.getByRole("button", { name: "Losspielen" }),
    ).toBeEnabled();
    await controlled(page);
    const before = await readStoredState(page);
    const second = await context.newPage();
    await second.goto(server.url);
    await expect(
      second.getByRole("button", { name: "Losspielen" }),
    ).toBeEnabled();
    await settings(page);
    server.publish();
    await page.getByRole("button", { name: "Nach Update suchen" }).click();
    const update = page.getByRole("button", {
      name: "Quiz aktualisieren",
      exact: true,
    });
    await expect(update).toBeEnabled();
    await update.click();
    await expect(
      page.getByText("Schließe die anderen Quiz-Tabs", { exact: false }),
    ).toBeVisible();
    expect(await readStoredState(page)).toEqual(before);
    await second.close();
    const reloaded = page.waitForEvent("load");
    await update.click();
    await reloaded;
    await expect(
      page.getByRole("button", { name: "Losspielen" }),
    ).toBeEnabled();
    expect(await readStoredState(page)).toEqual(before);
    await context.setOffline(true);
    await page.reload();
    await expect(
      page.getByRole("button", { name: "Losspielen" }),
    ).toBeEnabled();
    expect(await readStoredState(page)).toEqual(before);
  } finally {
    await context.setOffline(false);
    await server.close();
  }
});

test("eine unterbrochene Runde sperrt den Versionswechsel auch in den Optionen", async ({
  page,
}) => {
  const server = await updateServer();
  try {
    await fixCalendarTime(page, new Date("2026-10-05T12:00:00+02:00"));
    await page.goto(server.url);
    await expect(
      page.getByRole("button", { name: "Losspielen" }),
    ).toBeEnabled();
    await controlled(page);
    await page.getByRole("button", { name: "Losspielen" }).click();
    await expect(page.locator(".answers button").first()).toBeEnabled();
    await settings(page);
    const before = await readStoredState(page);
    server.publish();
    await page.getByRole("button", { name: "Nach Update suchen" }).click();
    await expect(
      page.getByRole("button", { name: "Quiz aktualisieren", exact: true }),
    ).toBeDisabled();
    await expect(
      page.getByText("Beende zuerst Deine laufende Runde."),
    ).toBeVisible();
    expect(await readStoredState(page)).toEqual(before);
  } finally {
    await server.close();
  }
});

test("Update-Erkennung funktioniert bereits beim fehlgeschlagenen Kontoladen", async ({
  page,
}) => {
  const server = await updateServer(true);
  const owner = "11111111-1111-4111-8111-111111111111";
  const user = {
    id: owner,
    aud: "authenticated",
    role: "authenticated",
    email: "synthetic@example.test",
    email_confirmed_at: "2026-10-01T10:00:00Z",
    created_at: "2026-10-01T10:00:00Z",
    app_metadata: { provider: "email" },
    user_metadata: {},
  };
  const token = [
    { alg: "HS256", typ: "JWT" },
    { sub: owner, exp: 2000000000, role: "authenticated" },
    "synthetic",
  ]
    .map((value) =>
      Buffer.from(
        typeof value === "string" ? value : JSON.stringify(value),
      ).toString("base64url"),
    )
    .join(".");
  try {
    await fixCalendarTime(page, new Date("2026-10-05T12:00:00+02:00"));
    await page.setViewportSize({ width: 360, height: 780 });
    await page.addInitScript(
      (session) =>
        localStorage.setItem(
          "wissensquiz-auth:quiz-test.supabase.co",
          JSON.stringify(session),
        ),
      {
        access_token: token,
        refresh_token: "synthetic-refresh",
        token_type: "bearer",
        expires_at: 2000000000,
        expires_in: 3600,
        user,
      },
    );
    // Native worker fetches also receive this mock; routes alone are bypassed
    // by some browsers once their worker controls the page.
    await page.addInitScript((user) => {
      const original = window.fetch;
      window.fetch = async (input, init) => {
        const url = input instanceof Request ? input.url : String(input);
        if (url === "https://quiz-test.supabase.co/auth/v1/user")
          return new Response(JSON.stringify(user), {
            headers: { "Content-Type": "application/json" },
          });
        if (url.endsWith("/quiz_sync_metadata"))
          return new Response(
            JSON.stringify({ code: "XX000", message: "Synthetic failure" }),
            { status: 500, headers: { "Content-Type": "application/json" } },
          );
        if (url.startsWith("https://quiz-test.supabase.co/"))
          return new Response("[]", {
            headers: { "Content-Type": "application/json" },
          });
        return original(input, init);
      };
    }, user);
    await page.goto(server.url);
    await expect(
      page.getByText("Dein Spielstand konnte nicht geöffnet werden.", {
        exact: false,
      }),
    ).toBeVisible();
    await expect(
      page.getByText("Prüfe Deine Internetverbindung", { exact: false }),
    ).toHaveCount(0);
    await controlled(page);
    server.publish();
    await page.getByRole("button", { name: "Nach Update suchen" }).click();
    await expect(
      page.getByRole("button", { name: "Quiz aktualisieren", exact: true }),
    ).toBeEnabled();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: "tmp-sync/update-error-preview.png",
      fullPage: true,
    });
    expect(await page.evaluate(() => indexedDB.databases())).toEqual([]);
  } finally {
    await server.close();
  }
});
