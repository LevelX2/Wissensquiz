import { readFileSync } from "node:fs";
import AxeBuilder from "@axe-core/playwright";
import { test, expect, readStoredState, type Page } from "./fixtures";
import { addPackages, packages } from "../../src/packages";
import { emptyState, type State } from "../../src/model";
import { startRound } from "../../src/engine";
import portraits from "../../src/actorRecognitionPortraits.json" with { type: "json" };

async function writeState(page: Page, state: State) {
  await page.evaluate(
    (state) =>
      new Promise<void>((resolve, reject) => {
        const request = indexedDB.open("wissensquiz");
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const db = request.result;
          const tx = db.transaction("state", "readwrite");
          tx.objectStore("state").put(state, "current");
          tx.oncomplete = () => {
            db.close();
            resolve();
          };
          tx.onerror = () => {
            db.close();
            reject(tx.error);
          };
        };
      }),
    state,
  );
}

for (const [number, choice] of [
  [1, "correct"],
  [182, "wrong"],
  [193, "unknown"],
] as const) {
  test(`Bildfrage ${number}: Foto vor ${choice}, Name und Bildnachweis nachher, Fortsetzen und Offline`, async ({
    page,
    context,
    browserName,
  }, info) => {
    await page.clock.install({ time: new Date("2026-10-07T12:00:00+02:00") });
    await page.setViewportSize({ width: 320, height: 740 });
    await page.goto("/");
    await expect(
      page.getByRole("button", { name: "Losspielen" }),
    ).toBeEnabled();
    const state = emptyState();
    addPackages(
      state,
      packages.map((p) => ({
        filename: p.filename,
        text: readFileSync(`public${p.path}`, "utf8"),
      })),
    );
    const q = state.questions.find(
      (q) =>
        q.id ===
        `SCHAUSPIELER-BILD-20261007-${String(number).padStart(3, "0")}`,
    )!;
    const portrait = portraits[q.metadata.person_id as keyof typeof portraits];
    const catalog = state.questions;
    state.questions = [q];
    startRound(
      state,
      { mode: "ueben", topic: "Schauspieler", difficulty: "Alle Stufen" },
      Date.parse("2026-10-07T12:00:00+02:00"),
    );
    state.questions = catalog;
    await writeState(page, state);
    await page.reload();
    await page.getByRole("button", { name: "Fortsetzen" }).click();
    const image = page.getByRole("img", {
      name: "Schauspielerporträt für die Namensfrage",
    });
    await expect(image).toBeVisible();
    await expect
      .poll(() => image.evaluate((img: HTMLImageElement) => img.naturalWidth))
      .toBe(portrait.width);
    await expect(page.locator(".question-card h1")).not.toContainText(
      portrait.name,
    );
    await expect(page.locator(".question-hints")).not.toContainText(
      portrait.name,
    );
    await expect(page.locator(".actor-name")).toHaveCount(0);
    await expect(page.locator(".recognition-portrait")).not.toContainText(
      portrait.name,
    );
    await expect(page.locator(".recognition-portrait a")).toHaveCount(0);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `test-results/recognition-${number}-${info.project.name}-before.png`,
      fullPage: true,
    });
    expect(
      (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze())
        .violations,
    ).toEqual([]);

    if (choice === "unknown")
      await page
        .getByRole("button", { name: "Keine Ahnung", exact: true })
        .click();
    else {
      const answer = q.answers.find(
        (a) => (a.id === q.correctId) === (choice === "correct"),
      )!;
      await page
        .getByRole("button", {
          name: new RegExp(answer.text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
        })
        .click();
    }
    await expect(page.locator(".actor-name")).toHaveText(portrait.name);
    await expect(
      page.getByRole("img", { name: `Porträt von ${portrait.name}` }),
    ).toBeVisible();
    await page.getByText("Bildnachweis", { exact: true }).click();
    await expect(page.locator(".actor-portrait figcaption")).toContainText(
      portrait.photographer,
    );
    await expect(
      page.getByRole("link", { name: portrait.license, exact: true }),
    ).toHaveAttribute("href", portrait.licenseUrl);
    await page.getByText("Etwas tiefer eintauchen", { exact: true }).click();
    await expect(page.locator(".explanation")).toContainText(q.context);
    const saved = await readStoredState(page);
    expect(saved.events.at(-1)?.correct).toBe(choice === "correct");
    expect(saved.events.at(-1)?.dontKnow === true).toBe(choice === "unknown");
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
    await expect(page.locator(".actor-name")).toHaveText(portrait.name);
    // Chromium verifies pixels after the offline reload. Windows WebKit's
    // offline image decoding has the already documented platform limitation.
    if (browserName === "chromium")
      await expect
        .poll(() =>
          page
            .getByRole("img", { name: `Porträt von ${portrait.name}` })
            .evaluate((img: HTMLImageElement) => img.naturalWidth),
        )
        .toBe(portrait.width);
    if (number === 1) {
      const cache = await page.evaluate(
        async (paths) => {
          const names = (await caches.keys()).filter((name) =>
            name.startsWith("film-"),
          );
          const store = await caches.open(names.at(-1)!);
          return Promise.all(
            paths.map(async (path) => {
              const response = await store.match(path, { ignoreVary: true });
              return response ? (await response.arrayBuffer()).byteLength : 0;
            }),
          );
        },
        Object.values(portraits).map((p) => p.src),
      );
      expect(cache).toHaveLength(200);
      expect(cache.every((bytes) => bytes > 0)).toBe(true);
    }
  });
}
