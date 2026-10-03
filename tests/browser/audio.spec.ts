import {
  test,
  expect,
  readStoredState,
  fixCalendarTime,
  type Page,
} from "./fixtures";

type Note = { frequency: number; type: string };
type AudioProbe = { notes: Note[]; context?: AudioContext; simulated: boolean };

async function prepare(page: Page) {
  await fixCalendarTime(page, new Date("2026-10-03T12:00:00+02:00"));
  await page.addInitScript(() => {
    const probe: AudioProbe = { notes: [], simulated: false };
    Object.assign(window, { audioProbe: probe });
    // Desktop WebKit cannot reproduce the physical ring/silent switch.
    Object.defineProperty(navigator, "audioSession", {
      configurable: true,
      value: { type: "auto" },
    });
    let NativeAudio =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!NativeAudio) {
      // The Windows WebKit build has no Web Audio API. Simulate its interface
      // for UI integration; the missing-support case below stays unmodified.
      probe.simulated = true;
      class SimulatedAudio {
        state = "suspended";
        currentTime = 0;
        destination = {};
        async resume() {
          this.state = "running";
        }
        async suspend() {
          this.state = "suspended";
        }
        createOscillator() {
          return {
            frequency: { value: 0 },
            type: "sine",
            onended: null,
            connect: (gain: unknown) => gain,
            start() {},
            stop() {},
            disconnect() {},
          };
        }
        createGain() {
          return {
            gain: {
              setValueAtTime() {},
              linearRampToValueAtTime() {},
              exponentialRampToValueAtTime() {},
            },
            connect() {},
            disconnect() {},
          };
        }
      }
      NativeAudio = SimulatedAudio as unknown as typeof AudioContext;
      window.AudioContext = NativeAudio;
    }
    const create = NativeAudio.prototype.createOscillator;
    NativeAudio.prototype.createOscillator = function () {
      probe.context = this;
      const oscillator = create.call(this),
        start = oscillator.start.bind(oscillator);
      oscillator.start = (at = 0) => {
        probe.notes.push({
          frequency: oscillator.frequency.value,
          type: oscillator.type,
        });
        start(at);
      };
      return oscillator;
    };
  });
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Losspielen" })).toBeEnabled();
  if (
    await page.evaluate(
      () =>
        (window as unknown as { audioProbe: AudioProbe }).audioProbe.simulated,
    )
  )
    test.info().annotations.push({
      type: "audio",
      description:
        "Web Audio simulated: Windows WebKit has no audio interface.",
    });
}

const notes = (page: Page) =>
  page.evaluate(
    () => (window as unknown as { audioProbe: AudioProbe }).audioProbe.notes,
  );

async function respond(page: Page, correct: boolean) {
  const id = await page
    .locator("h1[data-question-id]")
    .getAttribute("data-question-id");
  const state = await readStoredState(page);
  const round = state.rounds.find((round) => round.status === "active")!;
  const question = round.questions.find((q) => q.id === id)!;
  const answer = question.answers.find((a) =>
    correct ? a.id === question.correctId : a.id !== question.correctId,
  )!;
  const control = page
    .locator(".answer")
    .filter({ has: page.getByText(answer.text, { exact: true }) });
  await expect(control).toBeEnabled();
  const before = (await notes(page)).length;
  await control.click();
  await expect(
    round.solutionDisplay === "round"
      ? page.getByRole("status").filter({ hasText: "Antwort gespeichert" })
      : page.locator(".feedback"),
  ).toBeVisible();
  await expect
    .poll(async () => (await notes(page)).length)
    .toBeGreaterThan(before);
  return (await notes(page)).slice(before);
}

test("Klicksignale, verschiedene Antworttöne und gespeicherter Tonschalter im Spiel", async ({
  page,
}) => {
  await prepare(page);
  expect(await notes(page)).toEqual([]);
  expect(
    await page.evaluate(
      () =>
        (navigator as Navigator & { audioSession: { type: string } })
          .audioSession.type,
    ),
  ).toBe("auto");
  await page.getByRole("button", { name: "Profil", exact: true }).click();
  await expect.poll(async () => (await notes(page)).length).toBe(1);
  expect(
    await page.evaluate(
      () =>
        (navigator as Navigator & { audioSession: { type: string } })
          .audioSession.type,
    ),
  ).toBe("auto");
  const options = page.getByRole("button", { name: "Optionen" });
  await options.focus();
  await page.keyboard.press("Enter");
  await expect.poll(async () => (await notes(page)).length).toBe(2);
  await page.getByRole("button", { name: "Signal ausprobieren" }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "Tonausgabe ist bereit" }),
  ).toBeVisible();
  expect((await notes(page)).length).toBe(4);
  await page.getByLabel("Soundeffekte", { exact: true }).click();
  await expect(
    page.getByLabel("Soundeffekte", { exact: true }),
  ).not.toBeChecked();
  const muted = (await notes(page)).length;
  expect(
    await page.evaluate(
      () =>
        (navigator as Navigator & { audioSession: { type: string } })
          .audioSession.type,
    ),
  ).toBe("auto");
  await page.getByRole("button", { name: "Spielen", exact: true }).click();
  await page.getByRole("button", { name: "Losspielen" }).click();
  const toggle = page.getByRole("button", {
    name: "Soundeffekte einschalten",
    exact: true,
  });
  await expect(toggle).toContainText("Ton aus");
  await expect(toggle).toHaveAttribute("aria-pressed", "false");
  expect((await notes(page)).length).toBe(muted);
  await toggle.click();
  await expect(
    page.getByRole("button", { name: "Soundeffekte ausschalten" }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect.poll(async () => (await notes(page)).length).toBe(muted + 2);
  const correct = await respond(page, true);
  expect(correct).toHaveLength(2);
  expect(correct[1].frequency).toBeGreaterThan(correct[0].frequency);
  expect(correct.every((note) => note.type === "sine")).toBe(true);
  await page.getByRole("button", { name: "Nächste Frage" }).click();
  const wrong = await respond(page, false);
  expect(wrong).toHaveLength(2);
  expect(wrong[1].frequency).toBeLessThan(wrong[0].frequency);
  expect(wrong.every((note) => note.type === "triangle")).toBe(true);
  await page.getByRole("button", { name: "Soundeffekte ausschalten" }).click();
  const quiet = (await notes(page)).length;
  await page.getByRole("button", { name: "Pause & Startseite" }).click();
  await page.reload();
  await expect(page.getByRole("button", { name: "Fortsetzen" })).toBeEnabled();
  expect(await notes(page)).toEqual([]);
  await page.getByRole("button", { name: "Fortsetzen" }).click();
  await expect(
    page.getByRole("button", { name: "Soundeffekte einschalten" }),
  ).toHaveAttribute("aria-pressed", "false");
  expect(await notes(page)).toEqual([]);
  expect(quiet).toBeGreaterThan(0);
  expect((await readStoredState(page)).settings.sound).toBe(false);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("Töne kehren nach einer Audio-Unterbrechung beim nächsten Klick zurück", async ({
  page,
}) => {
  await prepare(page);
  await page.getByRole("button", { name: "Losspielen" }).click();
  await expect.poll(async () => (await notes(page)).length).toBe(2);
  await page.evaluate(async () => {
    const audio = (window as unknown as { audioProbe: AudioProbe }).audioProbe
      .context!;
    await audio.suspend();
  });
  const before = (await notes(page)).length;
  await page.getByRole("button", { name: "Frage melden" }).click();
  await expect.poll(async () => (await notes(page)).length).toBe(before + 1);
  await page.getByRole("button", { name: "Frage melden" }).click();
  expect(await respond(page, true)).toHaveLength(2);
});

test("Gesammelte Lösungen bestätigen richtige und falsche Auswahl mit demselben neutralen Klick", async ({
  page,
}) => {
  await prepare(page);
  await page.getByRole("button", { name: "Profil", exact: true }).click();
  await page.getByRole("button", { name: "Optionen" }).click();
  await page.getByLabel("Nach der Runde", { exact: true }).check();
  await expect(
    page.getByLabel("Nach der Runde", { exact: true }),
  ).toBeChecked();
  await page.getByRole("button", { name: "Spielen", exact: true }).click();
  await page.getByRole("button", { name: "Losspielen" }).click();
  const correct = await respond(page, true);
  await expect(
    page.getByRole("status").filter({ hasText: "Antwort gespeichert" }),
  ).toBeVisible();
  await expect(page.locator(".answer.correct, .answer.wrong")).toHaveCount(0);
  await page.getByRole("button", { name: "Nächste Frage" }).click();
  const wrong = await respond(page, false);
  expect(correct).toHaveLength(1);
  expect(wrong).toEqual(correct);
  await expect(
    page.getByRole("status").filter({ hasText: "Antwort gespeichert" }),
  ).toBeVisible();
});

test("Fehlende Tonausgabe wird beim Probesignal erklärt und verhindert keine Antwort", async ({
  page,
}) => {
  await fixCalendarTime(page, new Date("2026-10-03T12:00:00+02:00"));
  await page.addInitScript(() => {
    Object.defineProperty(window, "AudioContext", {
      configurable: true,
      value: undefined,
    });
    Object.defineProperty(window, "webkitAudioContext", {
      configurable: true,
      value: undefined,
    });
  });
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Losspielen" })).toBeEnabled();
  await page.getByRole("button", { name: "Profil", exact: true }).click();
  await page.getByRole("button", { name: "Optionen" }).click();
  await page.getByRole("button", { name: "Signal ausprobieren" }).click();
  await expect(
    page
      .getByRole("status")
      .filter({ hasText: "Dieser Browser bietet keine Tonausgabe" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Spielen", exact: true }).click();
  await page.getByRole("button", { name: "Losspielen" }).click();
  await expect(
    page.getByRole("button", { name: "Keine Ahnung", exact: true }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "Keine Ahnung", exact: true }).click();
  await expect(page.locator(".solution-reveal")).toBeVisible();
  expect((await readStoredState(page)).events.at(-1)?.dontKnow).toBe(true);
});
