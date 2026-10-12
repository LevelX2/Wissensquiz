import {
  test,
  expect,
  fixCalendarTime,
  readStoredState,
  writeStoredState,
} from "./fixtures";
import { answer, complete, startRound } from "../../src/engine";
import AxeBuilder from "@axe-core/playwright";

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
      Object.assign(window, { successNotes: notes });
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
    });
    await page.getByRole("button", { name: "Runde abschließen" }).click();
    const dialog = page.getByRole("dialog", {
      name: promote ? "Level 2 erreicht!" : "Neues Abzeichen!",
    });
    await expect(dialog).toBeVisible();
    await expect(page.locator("dialog[open]")).toHaveCount(1);
    if (promote) await expect(dialog).toContainText("Gratulation!");
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
    await page.reload();
    await expect(page.locator("dialog[open]")).toHaveCount(0);
    await page.getByRole("button", { name: "Sammlung", exact: true }).click();
    await expect(badges.locator("li.earned")).toHaveCount(1);
  });
}
