import { readSavedState } from "./saved-state";
import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { answer, complete, guess, startRound } from "../../src/engine";
import type { State } from "../../src/model";

const now = new Date("2026-10-02T12:00:00+02:00");
async function readState(page: Page): Promise<State> {
  return readSavedState(page);
}
async function writeState(page: Page, state: State) {
  await page.evaluate(
    (value) =>
      new Promise<void>((resolve, reject) => {
        const req = indexedDB.open("wissensquiz");
        req.onerror = () => reject(req.error);
        req.onsuccess = () => {
          const db = req.result;
          const tx = db.transaction("state", "readwrite");
          tx.objectStore("state").put(value, "current");
          tx.oncomplete = () => {
            db.close();
            resolve();
          };
          tx.onerror = () => reject(tx.error);
        };
      }),
    state,
  );
}

test("Fehlertraining hat einen verständlichen leeren Zustand und bleibt als Modus gespeichert", async ({
  page,
}) => {
  await page.clock.install({ time: now });
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Losspielen" })).toBeEnabled();
  await page
    .getByRole("button", { name: /Fehlertraining Offene Fehler/ })
    .click();
  await expect(page.getByRole("button", { name: "Losspielen" })).toBeDisabled();
  await expect(
    page.getByText(/Keine offenen Fehler in Deiner Auswahl/),
  ).toBeVisible();
  await expect
    .poll(async () => (await readState(page)).settings.roundSetup?.mode)
    .toBe("fehler");
  await page.reload();
  await expect(
    page.getByRole("button", { name: /Fehlertraining Offene Fehler/ }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".round-guide")).toContainText(
    "fällt es aus dem Fehlertraining heraus",
  );
});

for (const width of [320, 1280]) {
  test(`Auswertung und gezielte Fehlerrunde bei ${width} Pixeln mit Offline-Speicherung`, async ({
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
          .filter((q) => !q.id.startsWith("FACT-"))
          .map((q) => [q.knowledgeId, q]),
      ).values(),
    ].slice(0, 5);
    const old = startRound(
      state,
      { mode: "ueben", topic: "Alle Themen", difficulty: "Alle Stufen" },
      now.getTime() - 2000,
    );
    old.questions = [qs[0]];
    old.order = [qs[0].answers.map((a) => a.id)];
    answer(
      state,
      old.id,
      qs[0].id,
      qs[0].answers.find((a) => a.id !== qs[0].correctId)!.id,
      1000,
      now.getTime() - 1900,
    );
    complete(state, old.id, now.getTime() - 1800);
    const round = startRound(
      state,
      { mode: "ueben", topic: "Alle Themen", difficulty: "Alle Stufen" },
      now.getTime() - 1000,
    );
    round.questions = qs;
    round.order = qs.map((q) => q.answers.map((a) => a.id));
    round.familiaritySnapshot = undefined;
    qs.forEach((q, i) => {
      answer(
        state,
        round.id,
        q.id,
        i === 3
          ? null
          : i === 1
            ? q.answers.find((a) => a.id !== q.correctId)!.id
            : q.correctId,
        1000,
        now.getTime() - 900 + i,
      );
      if (i === 2) guess(state, `${round.id}:${q.knowledgeId}`);
    });
    await writeState(page, state);
    await page.reload();
    await page.getByRole("button", { name: "Fortsetzen" }).click();
    await page.getByRole("button", { name: "Runde abschließen" }).click();
    await expect(page.locator(".result-score")).toContainText("3 / 5");
    await expect(page.locator(".result-ring")).toContainText("60%");
    await expect(page.locator(".result-answer-strip .guessed")).toHaveCount(1);
    await expect(page.locator(".result-insights")).toContainText(
      "Frühere Fehler sicher gelöst",
    );
    await expect(
      page.getByRole("button", { name: /Fehler dieser Runde üben \(2\)/ }),
    ).toBeEnabled();
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
      path: `test-results/auswertung-${width}.png`,
      fullPage: true,
    });
    const review = page.getByRole("group", { name: "Rückblick filtern" });
    await review
      .getByRole("button", { name: "Fehler (2)", exact: true })
      .click();
    await expect(page.locator(".review > details")).toHaveCount(2);
    await page.locator(".review > details > summary").first().click();
    await expect(
      page
        .locator(".review > details[open]")
        .getByText("Deine Antwort:", { exact: true }),
    ).toBeVisible();
    await review
      .getByRole("button", { name: "Geraten (1)", exact: true })
      .click();
    await expect(page.locator(".review > details")).toHaveCount(1);
    await page
      .getByRole("button", { name: /Fehler dieser Runde üben \(2\)/ })
      .click();
    await expect(page.locator(".question-card")).toBeVisible();
    const retry = (await readState(page)).rounds.at(-1)!;
    expect(retry.mode).toBe("fehler");
    expect(retry.questions.map((q) => q.knowledgeId).sort()).toEqual(
      [qs[1].knowledgeId, qs[3].knowledgeId].sort(),
    );
    await page.evaluate(() =>
      navigator.serviceWorker.ready.then(() => undefined),
    );
    // Offline reload is exercised in Chromium. The Windows WebKit harness
    // raises an internal navigation error offline; test resume online there,
    // followed by offline answers and persistence in the same isolated context.
    if (browserName === "chromium") await context.setOffline(true);
    await page.reload();
    await expect(
      page.getByRole("button", { name: "Fortsetzen" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Fortsetzen" }).click();
    if (browserName === "webkit") await context.setOffline(true);
    for (let i = 0; i < retry.questions.length; i++) {
      const q = retry.questions[i];
      await page
        .locator(".answer")
        .filter({ hasText: q.answers.find((a) => a.id === q.correctId)!.text })
        .click();
      await page
        .getByRole("button", {
          name:
            i === retry.questions.length - 1
              ? "Runde abschließen"
              : "Nächste Frage",
        })
        .click();
    }
    await expect(page.locator(".result-ring")).toContainText("100%");
    await expect(page.locator(".result .lead")).toContainText(
      "2 frühere Fehler sicher gelöst",
    );
    await expect(
      page.getByRole("button", { name: /Fehler dieser Runde üben/ }),
    ).toHaveCount(0);
    await page.getByRole("button", { name: "Neue Runde wählen" }).click();
    await page
      .getByRole("button", { name: /Fehlertraining Offene Fehler/ })
      .click();
    await expect(
      page.getByRole("button", { name: "Losspielen" }),
    ).toBeDisabled();
    await expect(
      page.getByText(/Keine offenen Fehler in Deiner Auswahl/),
    ).toBeVisible();
    expect((await readState(page)).experience).toBe(33);
  });
}
