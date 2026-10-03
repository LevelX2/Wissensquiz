import { test, expect, readStoredState, type Page } from "./fixtures";
import AxeBuilder from "@axe-core/playwright";
import { answer, complete, startRound } from "../../src/engine";
import type { State } from "../../src/model";

const now = new Date("2026-10-02T12:00:00+02:00");
async function readState(page: Page): Promise<State> {
  return readStoredState(page);
}
async function writeState(page: Page, state: State) {
  await page.evaluate(
    (state) =>
      new Promise<void>((resolve, reject) => {
        const req = indexedDB.open("wissensquiz");
        req.onsuccess = () => {
          const db = req.result,
            tx = db.transaction("state", "readwrite");
          tx.objectStore("state").put(state, "current");
          tx.oncomplete = () => {
            db.close();
            resolve();
          };
          tx.onerror = () => reject(tx.error);
        };
        req.onerror = () => reject(req.error);
      }),
    state,
  );
}
function seededRound(
  state: State,
  q: State["questions"][number],
  at: number,
  correct: boolean,
  finish = true,
) {
  const r = startRound(
    state,
    { mode: "ueben", topic: "Alle Themen", difficulty: "Alle Stufen" },
    at,
  );
  r.questions = [structuredClone(q)];
  r.order = [q.answers.map((a) => a.id)];
  answer(
    state,
    r.id,
    q.id,
    correct ? q.correctId : q.answers.find((a) => a.id !== q.correctId)!.id,
    1000,
    at + 1,
  );
  if (finish) complete(state, r.id, at + 2);
  return r;
}

for (const width of [320, 1280]) {
  test(`Filmkarriere bei ${width} Pixeln: sichtbarer Aufstieg, XP-Aufschlüsselung, Rückblick und Offline-Erhalt`, async ({
    page,
    context,
    browserName,
  }) => {
    await page.clock.install({ time: now });
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await expect(
      page.getByRole("button", { name: "Losspielen" }),
    ).toBeEnabled();
    const state = await readState(page);
    state.settings.sound = false;
    const qs = [
      ...new Map(
        state.questions
          .filter((q) => q.difficulty === "leicht" && !q.id.startsWith("FACT-"))
          .map((q) => [q.knowledgeId, q]),
      ).values(),
    ].slice(0, 20);
    qs.slice(0, 19).forEach((q, i) =>
      seededRound(state, q, now.getTime() - 60000 + i * 100, true),
    );
    expect(state.experience).toBe(95);
    seededRound(state, qs[19], now.getTime() - 100, true, false);
    await writeState(page, state);
    await page.reload();
    await page.getByRole("button", { name: "Fortsetzen" }).click();
    await page.getByRole("button", { name: "Runde abschließen" }).click();
    const reward = page.getByRole("region", { name: "Erfahrung dieser Runde" });
    await expect(reward).toContainText("+5 XP");
    await expect(reward).toContainText("Level 2 erreicht!");
    await expect(reward.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "0",
    );
    await expect(reward.getByRole("progressbar")).toHaveAttribute(
      "aria-valuemax",
      "150",
    );
    await expect(page.locator(".career-level-up")).toHaveCount(1);
    await reward.getByText("So setzen sich Deine XP zusammen").click();
    await expect(reward.locator(".xp-breakdown")).toContainText(
      "Sichere richtige Antworten+2 XP",
    );
    expect((await readState(page)).experience).toBe(100);
    expect(
      (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze())
        .violations,
    ).toEqual([]);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `test-results/filmkarriere-aufstieg-${width}-${browserName}.png`,
      fullPage: true,
    });
    await page.getByRole("button", { name: "Neue Runde wählen" }).click();
    await page.getByRole("button", { name: "Sammlung", exact: true }).click();
    await expect(page.locator(".history article").first()).toBeVisible();
    await expect(page.locator(".history button")).toHaveCount(0);
    await expect(page.locator(".career-level-up")).toHaveCount(0);
    expect((await readState(page)).experience).toBe(100);
    await page.getByRole("button", { name: "Profil", exact: true }).click();
    await expect(
      page.getByRole("main").getByRole("progressbar"),
    ).toHaveAttribute("aria-valuemax", "150");
    await expect(page.getByRole("main")).toContainText("Level 2 · Kinogänger");
    await page.evaluate(() =>
      navigator.serviceWorker.ready.then(() => undefined),
    );
    if (browserName === "chromium") await context.setOffline(true);
    await page.reload();
    await page.getByRole("button", { name: "Profil", exact: true }).click();
    await expect(page.getByRole("main")).toContainText("100 XP insgesamt");
    expect((await readState(page)).experience).toBe(100);
  });
}

test("alte Level und ihr Fortschritt werden beim Start einmal erhalten; reduzierte Bewegung bleibt ruhig", async ({
  page,
}) => {
  await page.clock.install({ time: now });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Losspielen" })).toBeEnabled();
  const state = await readState(page);
  const q = state.questions.find(
    (q) => q.difficulty === "leicht" && !q.id.startsWith("FACT-"),
  )!;
  for (let i = 0; i < 19; i++)
    seededRound(state, q, now.getTime() - 60000 + i * 100, false);
  delete state.career;
  state.experience = 190;
  const events = structuredClone(state.events);
  await writeState(page, state);
  await page.reload();
  await page.getByRole("button", { name: "Profil", exact: true }).click();
  await expect(page.getByRole("main")).toContainText("Level 2 · Kinogänger");
  await expect(page.getByRole("main")).toContainText("135 / 150 XP");
  await expect(page.getByRole("main")).toContainText("234 XP Startgutschrift");
  expect((await readState(page)).events).toEqual(events);
  expect((await readState(page)).experience).toBe(235);
  const track = page.getByRole("main").locator(".career-track > span");
  expect(
    await track.evaluate((el) => getComputedStyle(el).transitionDuration),
  ).toBe("0s");
  await page.reload();
  await expect(page.getByRole("button", { name: "Losspielen" })).toBeEnabled();
  expect((await readState(page)).experience).toBe(235);
  await expect(page.locator(".career-level-up")).toHaveCount(0);
});
