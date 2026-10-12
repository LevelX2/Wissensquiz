import {
  test,
  expect,
  fixCalendarTime,
  readStoredState,
  writeStoredState,
} from "./fixtures";
import { answer, complete, startRound } from "../../src/engine";
import AxeBuilder from "@axe-core/playwright";
import { archiveClosedRounds } from "../../src/roundArchive";
import { questionSourceOf, genreOf } from "../../src/filters";

for (const { sound, promote } of [
  { sound: true, promote: true },
  { sound: false, promote: true },
  { sound: true, promote: false },
]) {
  test(`${promote ? "Levelaufstieg und" : "Nur"} erstes Zehner-Abzeichen bestätigen; Ton ${sound ? "an" : "aus"}`, async ({
    page,
  }, testInfo) => {
    const now = new Date("2026-10-12T18:00:00+02:00");
    await fixCalendarTime(page, now);
    await page.setViewportSize({ width: 320, height: 800 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.addInitScript(() => {
      const notes: number[] = [];
      const vibrations: (number | number[])[] = [];
      Object.assign(window, {
        successNotes: notes,
        successVibrations: vibrations,
      });
      Object.defineProperty(navigator, "vibrate", {
        configurable: true,
        value: (pattern: number | number[]) => {
          vibrations.push(pattern);
          return true;
        },
      });
      // Instrumented Web Audio interface; no claim about physical speakers.
      class AudioProbe {
        state = "running";
        currentTime = 0;
        destination = {};
        async resume() {}
        createOscillator() {
          const oscillator = {
            frequency: { value: 0 },
            type: "sine",
            onended: null,
            connect: (gain: unknown) => gain,
            disconnect: () => {},
            start() {
              notes.push(oscillator.frequency.value);
            },
            stop() {},
          };
          return oscillator;
        }
        createGain() {
          return {
            gain: {
              setValueAtTime() {},
              linearRampToValueAtTime() {},
              exponentialRampToValueAtTime() {},
            },
            connect() {
              return this;
            },
            disconnect() {},
          };
        }
      }
      Object.assign(window, { AudioContext: AudioProbe });
    });
    await page.goto("/");
    await expect(
      page.getByRole("button", { name: "Losspielen" }),
    ).toBeEnabled();
    const state = await readStoredState(page);
    state.settings.sound = sound;
    state.settings.haptics = true;
    const qs = [
      ...new Map(
        state.questions
          .filter((q) => q.difficulty === "leicht")
          .map((q) => [q.knowledgeId, q]),
      ).values(),
    ].slice(0, 29);
    for (let i = 0; i < (promote ? 19 : 0); i++) {
      const r = startRound(
        state,
        { mode: "ueben", topic: "Alle Themen", difficulty: "Alle Stufen" },
        now.getTime() - 60000 + i * 100,
      );
      r.questions = [structuredClone(qs[i])];
      r.order = [qs[i].answers.map((a) => a.id)];
      r.familiaritySnapshot = undefined;
      answer(
        state,
        r.id,
        qs[i].id,
        qs[i].correctId,
        1000,
        now.getTime() - 59000 + i * 100,
      );
      complete(state, r.id, now.getTime() - 58000 + i * 100);
    }
    expect(state.experience).toBe(promote ? 95 : 0);
    const active = startRound(
      state,
      { mode: "entdecken", topic: "Alle Themen", difficulty: "Alle Stufen" },
      now.getTime() - 10000,
    );
    active.questions = structuredClone(qs.slice(19));
    active.order = active.questions.map((q) => q.answers.map((a) => a.id));
    active.familiaritySnapshot = undefined;
    for (const q of active.questions)
      answer(state, active.id, q.id, q.correctId, 1000, now.getTime() - 9000);
    await writeStoredState(page, state);
    await page.reload();
    await page.getByRole("button", { name: "Fortsetzen" }).click();
    await page.evaluate(() => {
      (window as unknown as { successNotes: number[] }).successNotes.length = 0;
      (
        window as unknown as { successVibrations: unknown[] }
      ).successVibrations.length = 0;
    });
    let rewardUnavailable = !sound;
    await page.route("**/rest/v1/rpc/quiz_game_view", async (route) => {
      if (
        rewardUnavailable &&
        JSON.parse(route.request().postDataJSON().request_text).action ===
          "round-experience"
      )
        return route.fulfill({
          status: 503,
          json: { message: "Test: Belohnung vorübergehend nicht verfügbar" },
        });
      await route.fallback();
    });
    await page.getByRole("button", { name: "Runde abschließen" }).click();
    if (!sound) {
      const failure = page
        .getByRole("alert")
        .filter({ hasText: "Rundenerfahrung" });
      await expect(failure).toBeVisible();
      await expect(page.locator("dialog[open]")).toHaveCount(0);
      expect(
        await page.evaluate(
          () =>
            (window as unknown as { successVibrations: unknown[] })
              .successVibrations,
        ),
      ).toEqual([]);
      rewardUnavailable = false;
      await failure.getByRole("button", { name: "Erneut versuchen" }).click();
    }
    const dialog = page.getByRole("dialog", {
      name: promote ? "Level 2 erreicht!" : "Neue Erfolge!",
    });
    await expect(dialog).toBeVisible();
    await expect(page.locator("dialog[open]")).toHaveCount(1);
    if (promote) {
      await expect(dialog).toContainText("Gratulation!");
      await expect(dialog).toContainText("100 EXP gesammelt");
    }
    await expect(dialog).toContainText("Erste perfekte Zehnerrunde");
    await expect(
      dialog.getByRole("button", { name: "Weiter zum Ergebnis" }),
    ).toBeFocused();
    const notes = await page.evaluate(
      () => (window as unknown as { successNotes: number[] }).successNotes,
    );
    expect(notes.filter((n) => n !== 600)).toEqual(
      sound
        ? promote
          ? [392, 523, 659, 784, 1047]
          : [523, 659, 784, 1047]
        : [],
    );
    expect(
      await page.evaluate(
        () =>
          (window as unknown as { successVibrations: unknown[] })
            .successVibrations,
      ),
    ).toEqual([promote ? [30, 50, 30, 50, 60] : [25, 50, 25, 50, 45]]);
    expect(
      (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze())
        .violations,
    ).toEqual([]);
    await dialog.screenshot({
      path: testInfo.outputPath(`level-und-abzeichen-${promote}-${sound}.png`),
    });
    await dialog.getByRole("button", { name: "Weiter zum Ergebnis" }).click();
    await expect(dialog).not.toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Eine Runde weiter." }),
    ).toBeFocused();
    expect((await readStoredState(page)).experience).toBe(promote ? 145 : 50);
    await page.getByRole("button", { name: "Sammlung", exact: true }).click();
    const badges = page.getByRole("region", { name: "Perfekte Zehnerrunden" });
    await expect(badges.locator("li.earned")).toHaveCount(1);
    await expect(badges).toContainText("1 geschafft");
    await expect(badges.getByRole("progressbar")).toHaveAttribute("value", "1");
    await expect(badges.getByRole("progressbar")).toHaveAttribute("max", "10");
    await page.reload();
    await expect(page.locator("dialog[open]")).toHaveCount(0);
    await page.getByRole("button", { name: "Sammlung", exact: true }).click();
    await expect(badges.locator("li.earned")).toHaveCount(1);
    await page.getByRole("button", { name: "Profil", exact: true }).click();
    const achievements = page.getByRole("region", {
      name: "Deine Erfolge",
      exact: true,
    });
    await achievements.locator(".profile-section > summary").click();
    const perfect = achievements.getByRole("region", {
      name: "Perfekte Zehnerrunden",
      exact: true,
    });
    await perfect.locator("summary").click();
    await expect(perfect.getByRole("progressbar")).toHaveAttribute(
      "value",
      "1",
    );
    await expect(perfect.getByRole("progressbar")).toHaveAttribute("max", "10");
    await expect(perfect.locator("li.earned")).toHaveCount(1);
    await expect(achievements).toContainText("Heute war nicht mein Tag");
  });
}

for (const scenario of [
  { count: 2, correct: true, tier: null, next: 10 },
  { count: 10, correct: true, tier: "silver", next: 25 },
  { count: 25, correct: true, tier: "gold", next: 50 },
  { count: 1, correct: false, tier: "bronze", next: 1 },
]) {
  test(`Erfolgssystem: ${scenario.count} ${scenario.correct ? "perfekte" : "trefferlose"} Zehnerrunden`, async ({
    page,
  }, testInfo) => {
    const now = new Date("2026-10-12T18:00:00+02:00");
    await fixCalendarTime(page, now);
    await page.goto("/");
    await expect(
      page.getByRole("button", { name: "Losspielen" }),
    ).toBeEnabled();
    const state = await readStoredState(page);
    const questions = [
      ...new Map(
        state.questions
          .filter((q) => q.difficulty === "leicht")
          .map((q) => [q.knowledgeId, q]),
      ).values(),
    ].slice(0, 10);
    for (let i = 0; i < scenario.count; i++) {
      const at = now.getTime() - 60000 + i * 1000;
      const round = startRound(
        state,
        { mode: "entdecken", topic: "Alle Themen", difficulty: "Alle Stufen" },
        at,
      );
      round.questions = structuredClone(questions);
      round.order = questions.map((q) => q.answers.map((a) => a.id));
      round.familiaritySnapshot = undefined;
      for (const q of questions)
        answer(
          state,
          round.id,
          q.id,
          scenario.correct
            ? q.correctId
            : q.answers.find((a) => a.id !== q.correctId)!.id,
          100,
          at + 100,
        );
      if (i < scenario.count - 1) complete(state, round.id, at + 500);
    }
    archiveClosedRounds(state);
    await writeStoredState(page, state);
    await page.reload();
    await page.getByRole("button", { name: "Fortsetzen" }).click();
    await page.getByRole("button", { name: "Runde abschließen" }).click();
    if (scenario.tier) {
      const dialog = page.getByRole("dialog");
      await expect(dialog).toBeVisible();
      await expect(dialog).toHaveAttribute("data-success-tier", scenario.tier);
      await expect(dialog).toContainText(
        scenario.correct
          ? `${scenario.count} perfekte Zehnerrunden`
          : "Heute war nicht mein Tag",
      );
      await dialog.screenshot({
        path: testInfo.outputPath(`erfolg-${scenario.tier}.png`),
      });
      await dialog.getByRole("button", { name: "Weiter zum Ergebnis" }).click();
    }
    await expect(
      page.getByRole("heading", { name: "Eine Runde weiter." }),
    ).toBeVisible();
    await expect(page.locator("dialog[open]")).toHaveCount(0);
    if (scenario.correct) {
      const progress = page
        .locator(".result-achievements")
        .getByRole("progressbar");
      await expect(progress).toHaveAttribute("value", String(scenario.count));
      await expect(progress).toHaveAttribute("max", String(scenario.next));
    }
    await page.getByRole("button", { name: "Profil", exact: true }).click();
    const collection = page.getByRole("region", {
      name: "Deine Erfolge",
      exact: true,
    });
    await collection.locator(".profile-section > summary").click();
    const track = collection.getByRole("region", {
      name: scenario.correct
        ? "Perfekte Zehnerrunden"
        : "Heute war nicht mein Tag",
      exact: true,
    });
    await track.locator("summary").click();
    await expect(track.locator("li.earned")).toHaveCount(
      scenario.count >= 25 ? 3 : scenario.count >= 10 ? 2 : 1,
    );
    await expect(track.getByRole("progressbar")).toHaveAttribute(
      "value",
      String(scenario.count),
    );
    await expect
      .poll(() =>
        collection
          .locator(".profile-section-content")
          .evaluate((el) => getComputedStyle(el).opacity),
      )
      .toBe("1");
    expect(
      (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze())
        .violations,
    ).toEqual([]);
    await page.reload();
    await expect(
      page.getByRole("button", { name: "Losspielen" }),
    ).toBeEnabled();
    await expect(page.locator("dialog[open]")).toHaveCount(0);
  });
}

test("Ein Film gelernt: Meldung, Genre, EXP und nächstes Ziel im Profil", async ({
  page,
}, testInfo) => {
  const now = new Date("2026-10-12T18:00:00+02:00");
  await fixCalendarTime(page, now);
  await page.setViewportSize({ width: 320, height: 850 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Losspielen" })).toBeEnabled();
  const state = await readStoredState(page);
  const topics = new Map<string, typeof state.questions>();
  for (const q of state.questions.filter(
    (q) => questionSourceOf(q) === "film" && q.difficulty === "leicht",
  ))
    topics.set(q.topic, [...(topics.get(q.topic) ?? []), q]);
  const qs = [...topics.values()]
    .map((qs) => [...new Map(qs.map((q) => [q.knowledgeId, q])).values()])
    .find((qs) => qs.length >= 2 && qs.length <= 10)!;
  expect(qs).toBeTruthy();
  const round = startRound(
    state,
    { mode: "ueben", topic: "Alle Themen", difficulty: "Alle Stufen" },
    now.getTime() - 10000,
  );
  round.questions = structuredClone(qs);
  round.order = qs.map((q) => q.answers.map((a) => a.id));
  round.familiaritySnapshot = undefined;
  for (const q of qs)
    answer(state, round.id, q.id, q.correctId, 100, now.getTime() - 9000);
  await writeStoredState(page, state);
  await page.reload();
  await page.getByRole("button", { name: "Fortsetzen" }).click();
  await page.getByRole("button", { name: "Runde abschließen" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toContainText("1 Film gelernt");
  await expect(
    dialog.getByRole("heading", { name: "Neue Erfolge!" }),
  ).toBeInViewport();
  await expect(
    dialog.getByRole("button", { name: "Weiter zum Ergebnis" }),
  ).toBeInViewport();
  await dialog.screenshot({
    path: testInfo.outputPath("film-genre-erfolg.png"),
  });
  await dialog.getByRole("button", { name: "Weiter zum Ergebnis" }).click();
  await page.getByRole("button", { name: "Profil", exact: true }).click();
  const collection = page.getByRole("region", {
    name: "Deine Erfolge",
    exact: true,
  });
  await collection.locator(".profile-section > summary").click();
  const film = collection.getByRole("region", {
    name: "Filmkenner",
    exact: true,
  });
  await film.locator("summary").click();
  await expect(film.getByRole("progressbar")).toHaveAttribute("value", "1");
  await expect(film.getByRole("progressbar")).toHaveAttribute("max", "10");
  await expect(film.locator("li.earned")).toHaveCount(1);
  const genre = collection.locator(".achievement-track").filter({
    hasText: `${genreOf(qs[0]) === "Science-Fiction" ? "Sci-Fi" : genreOf(qs[0])}-Filmkenner`,
  });
  await genre.locator("summary").click();
  await expect(genre.getByRole("progressbar")).toHaveAttribute("value", "1");
  const xp = collection.getByRole("region", {
    name: "Erfahrung gesammelt",
    exact: true,
  });
  await xp.locator("summary").click();
  await expect(xp.getByRole("progressbar")).toHaveAttribute("max", "100");
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
    path: testInfo.outputPath("film-genre-exp-erfolge.png"),
    fullPage: true,
  });
  await film.screenshot({
    path: testInfo.outputPath("filmkenner-fortschritt.png"),
  });
  await page.reload();
  await expect(page.locator("dialog[open]")).toHaveCount(0);
});
