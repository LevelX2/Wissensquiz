import { buildSync } from "esbuild";
import { test, expect, readStoredState } from "./fixtures";
import { decodeQuestionCatalog } from "../../src/catalogCodec";

test("getrennter Katalog migriert Vollstände, erhält Antworten und reduziert lokale Schreibdaten", async ({
  page,
  context,
  browserName,
}, testInfo) => {
  await page.clock.setFixedTime(new Date("2026-10-03T12:00:00+02:00"));
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Losspielen" })).toBeEnabled();
  const full = await readStoredState(page);
  expect(full.questions).toHaveLength(10877);
  // Inject the actual storage API only into this isolated test browser.
  const bundle = buildSync({
    stdin: {
      contents:
        'import { read, update } from "./src/storage"; globalThis.__quizStorage = { read, update };',
      resolveDir: process.cwd(),
    },
    bundle: true,
    write: false,
    format: "iife",
    platform: "browser",
  });
  await page.addScriptTag({ content: bundle.outputFiles[0].text });
  const metrics = await page.evaluate(async (full) => {
    const api = (globalThis as any).__quizStorage;
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open("wissensquiz");
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const put = (key: string, value: unknown) =>
      new Promise<void>((resolve, reject) => {
        const tx = db.transaction("state", "readwrite");
        tx.objectStore("state").put(value, key);
        tx.oncomplete = () => resolve();
        tx.onabort = () => reject(tx.error);
      });
    await put("benchmark:full", full);
    await api.update(() => {}, full, "benchmark:split");
    const legacyUpdate = () =>
      new Promise<void>((resolve, reject) => {
        const tx = db.transaction("state", "readwrite");
        const store = tx.objectStore("state"),
          request = store.get("benchmark:full");
        request.onsuccess = () => {
          request.result.settings.sound = !request.result.settings.sound;
          store.put(request.result, "benchmark:full");
        };
        tx.oncomplete = () => resolve();
        tx.onabort = () => reject(tx.error);
      });
    // Warm up, then alternate methods to reduce order/cache bias. Only Date
    // was fixed above; performance.now measures real elapsed time.
    await legacyUpdate();
    await api.update(
      (s: any) => {
        s.settings.sound = !s.settings.sound;
      },
      undefined,
      "benchmark:split",
    );
    const baseline: number[] = [],
      split: number[] = [];
    for (let i = 0; i < 7; i++) {
      for (const method of i % 2
        ? ["split", "baseline"]
        : ["baseline", "split"]) {
        const start = performance.now();
        if (method === "baseline") await legacyUpdate();
        else
          await api.update(
            (s: any) => {
              s.settings.sound = !s.settings.sound;
            },
            undefined,
            "benchmark:split",
          );
        (method === "baseline" ? baseline : split).push(
          performance.now() - start,
        );
      }
    }
    const stored = await new Promise<any>((resolve) => {
      const tx = db.transaction("state"),
        store = tx.objectStore("state");
      const state = store.get("benchmark:split"),
        catalog = store.get("catalog:benchmark:split");
      tx.oncomplete = () =>
        resolve({ state: state.result, catalog: catalog.result });
    });
    const median = (samples: number[]) =>
      [...samples].sort((a, b) => a - b)[Math.floor(samples.length / 2)];
    const bytes = (value: unknown) =>
      new TextEncoder().encode(JSON.stringify(value)).length;
    // Restore a legacy guest fixture to exercise migration on the next app load.
    await put("current", full);
    db.close();
    return {
      questions: full.questions.length,
      baselineWriteBytes: bytes(full),
      splitWriteBytes: bytes(stored.state),
      splitCatalogBytes: new TextEncoder().encode(stored.catalog).length,
      baselineMedianMs: median(baseline),
      splitMedianMs: median(split),
      baseline,
      split,
    };
  }, full);
  expect(metrics.splitWriteBytes).toBeLessThan(
    metrics.baselineWriteBytes * 0.01,
  );
  await testInfo.attach("indexeddb-measurement.json", {
    body: JSON.stringify(metrics, null, 2),
    contentType: "application/json",
  });
  console.info(`${testInfo.project.name}: ${JSON.stringify(metrics)}`);
  await page.reload();
  await expect(page.getByRole("button", { name: "Losspielen" })).toBeEnabled();
  expect(await readStoredState(page)).toEqual(full);
  const catalogBefore = await page.evaluate(
    () =>
      new Promise<string>((resolve) => {
        const req = indexedDB.open("wissensquiz");
        req.onsuccess = () => {
          const db = req.result,
            query = db
              .transaction("state")
              .objectStore("state")
              .get("catalog:current");
          query.onsuccess = () => {
            db.close();
            resolve(query.result);
          };
        };
      }),
  );
  expect(decodeQuestionCatalog(catalogBefore)).toEqual(full.questions);
  await page.getByRole("button", { name: "Profil", exact: true }).click();
  await page.getByRole("button", { name: "Optionen" }).click();
  await expect(
    page.getByText("Die App-Dateien sind im Offline-Cache bestätigt.", {
      exact: false,
    }),
  ).toBeVisible();
  // Windows WebKit cannot navigate to the service-worker cache while offline;
  // persist/reload is still checked there. Chromium covers offline navigation.
  if (browserName === "chromium") await context.setOffline(true);
  await page.reload();
  await page.getByRole("button", { name: "Losspielen" }).click();
  await page.locator(".answer").first().click();
  await expect(page.locator(".feedback")).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: "Fortsetzen" }).click();
  await expect(page.locator(".feedback")).toBeVisible();
  const saved = await readStoredState(page);
  expect(saved.events).toHaveLength(1);
  expect(saved.questions).toEqual(full.questions);
});
