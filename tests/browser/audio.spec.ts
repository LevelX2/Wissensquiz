import {
  test,
  expect,
  readStoredState,
  fixCalendarTime,
  openRoundSetup,
  modePreparation,
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
        async close() {
          this.state = "closed";
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
  await expect(
    page.getByRole("button", { name: "Keine Ahnung", exact: true }),
  ).toBeEnabled();
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
  if (round.solutionDisplay === "round")
    await expect(page.locator(`h1[data-question-id="${id}"]`)).toHaveCount(0);
  else await expect(page.locator(".feedback")).toBeVisible();
  await expect
    .poll(async () => (await notes(page)).length)
    .toBeGreaterThan(before + (round.solutionDisplay === "round" ? 1 : 0));
  return (await notes(page)).slice(before);
}

test("Klicksignale, verschiedene Antworttöne und gespeicherter Tonschalter im Spiel", async ({
  page,
  browserName,
}) => {
  test.slow(
    browserName === "firefox",
    "Vollständiger Audio- und Navigationsablauf im Firefox-Testbrowser",
  );
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
  const beforeNext = (await notes(page)).length;
  await page.getByRole("button", { name: "Nächste Frage" }).click();
  await expect
    .poll(async () => (await notes(page)).length)
    .toBe(beforeNext + 1);
  expect((await notes(page)).slice(beforeNext)).toEqual([
    { frequency: 440, type: "sine" },
  ]);
  await expect(page.locator("h1[data-question-id]")).toBeFocused();
  const wrong = await respond(page, false);
  expect(wrong).toHaveLength(2);
  expect(wrong[1].frequency).toBeLessThan(wrong[0].frequency);
  expect(wrong.every((note) => note.type === "sine")).toBe(true);
  await page.getByRole("button", { name: "Soundeffekte ausschalten" }).click();
  await expect(
    page.getByRole("button", { name: "Soundeffekte einschalten" }),
  ).toHaveAttribute("aria-pressed", "false");
  expect((await readStoredState(page)).settings.sound).toBe(false);
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
  await page.getByRole("button", { name: "Verbesserung vorschlagen" }).click();
  await expect.poll(async () => (await notes(page)).length).toBe(before + 1);
  await page.getByRole("button", { name: "Verbesserung vorschlagen" }).click();
  expect(await respond(page, true)).toHaveLength(2);
});

for (const event of ["visibilitychange", "pagehide", "blur"]) {
  test(`Audio-Sitzung wird nach ${event} beim ersten Klick erneuert`, async ({
    page,
  }) => {
    await prepare(page);
    await page.getByRole("button", { name: "Profil", exact: true }).click();
    await expect.poll(async () => (await notes(page)).length).toBe(1);
    const summary = page.locator(".profile-section > summary").first();
    for (let cycle = 0; cycle < 3; cycle++) {
      const before = (await notes(page)).length;
      await page.evaluate((event) => {
        const probe = (window as unknown as { audioProbe: AudioProbe })
          .audioProbe;
        const previous = probe.context!;
        Object.assign(window, { previousAudio: previous });
        // Model the device failure: the old context claims to run but is unusable.
        Object.defineProperty(previous, "state", {
          configurable: true,
          value: "running",
        });
        previous.resume = () => new Promise<void>(() => {});
        previous.createOscillator = () => {
          throw new Error("stale audio session");
        };
        if (event === "visibilitychange") {
          Object.defineProperty(document, "visibilityState", {
            configurable: true,
            value: "hidden",
          });
          document.dispatchEvent(new Event(event));
          Object.defineProperty(document, "visibilityState", {
            configurable: true,
            value: "visible",
          });
          document.dispatchEvent(new Event(event));
        } else window.dispatchEvent(new Event(event));
        window.dispatchEvent(new Event("focus"));
        window.dispatchEvent(new Event("pageshow"));
      }, event);
      expect(await notes(page)).toHaveLength(before);
      expect(
        await page.evaluate(() => {
          const probe = window as unknown as {
            audioProbe: AudioProbe;
            previousAudio: AudioContext;
          };
          return probe.audioProbe.context === probe.previousAudio;
        }),
      ).toBe(true);
      await summary.click();
      await expect
        .poll(async () => (await notes(page)).length)
        .toBe(before + 1);
      expect(
        await page.evaluate(() => {
          const probe = window as unknown as {
            audioProbe: AudioProbe;
            previousAudio: AudioContext;
          };
          return probe.audioProbe.context === probe.previousAudio;
        }),
      ).toBe(false);
    }
    await page.getByRole("button", { name: "Optionen" }).click();
    await page.getByLabel("Soundeffekte", { exact: true }).click();
    await expect(
      page.getByLabel("Soundeffekte", { exact: true }),
    ).not.toBeChecked();
    const muted = (await notes(page)).length;
    await page.evaluate(() => window.dispatchEvent(new Event("blur")));
    await page.getByRole("button", { name: /Zurück zum Profil/ }).click();
    await summary.click();
    expect(await notes(page)).toHaveLength(muted);
    expect((await readStoredState(page)).settings.sound).toBe(false);
  });
}

test("Filmquelle im zweiten Tab und Rückkehr erlauben wieder Antwort- und Klappentöne", async ({
  page,
  context,
}) => {
  await prepare(page);
  await page.getByRole("button", { name: "Losspielen" }).click();
  await respond(page, true);
  const summary = page.locator(".answer-sources > summary");
  await summary.click();
  const link = page.locator(".answer-sources a[target='_blank']").first();
  const url = (await link.getAttribute("href"))!;
  await context.route(url, (route) =>
    route.fulfill({
      contentType: "text/html",
      body: "<title>Filmquelle im Test</title>Filmquelle",
    }),
  );
  const popupPromise = page.waitForEvent("popup");
  await link.click();
  const popup = await popupPromise;
  await popup.waitForLoadState();
  await expect(popup).toHaveTitle("Filmquelle im Test");
  // Headless browsers do not reliably emit mobile background events for tabs.
  // Send the lifecycle explicitly; the actual link/popup above stays covered.
  await page.evaluate(() => window.dispatchEvent(new Event("pagehide")));
  await popup.close();
  await page.bringToFront();
  const before = (await notes(page)).length;
  await summary.click();
  await expect.poll(async () => (await notes(page)).length).toBe(before + 1);
  await page.getByRole("button", { name: "Nächste Frage" }).click();
  expect(await respond(page, false)).toHaveLength(2);
});

for (const interrupted of [false, true]) {
  test(`Profilklappen aktivieren Ton erneut trotz wartender Freigabe (${interrupted ? "interrupted" : "suspended"})`, async ({
    page,
  }) => {
    await prepare(page);
    await page.getByRole("button", { name: "Profil", exact: true }).click();
    await expect.poll(async () => (await notes(page)).length).toBe(1);
    await page.clock.install({ time: new Date("2026-10-03T10:00:00Z") });
    await page.clock.pauseAt(new Date("2026-10-03T10:00:01Z"));
    await page.evaluate(async (interrupted) => {
      const audio = (window as unknown as { audioProbe: AudioProbe }).audioProbe
        .context!;
      await audio.suspend();
      // Simulate Safari's interruption and an activation that stays pending.
      if (interrupted)
        Object.defineProperty(audio, "state", {
          configurable: true,
          value: "interrupted",
        });
      const resume = audio.resume.bind(audio);
      let attempts = 0;
      Object.assign(window, { resumeAttempts: () => attempts });
      audio.resume = () => {
        attempts++;
        if (attempts === 1) return new Promise<void>(() => {});
        if (interrupted) delete (audio as unknown as { state?: string }).state;
        return resume();
      };
    }, interrupted);
    const summary = page.locator(".profile-section > summary").first();
    await summary.click();
    await expect(page.locator(".profile-section").first()).toHaveAttribute(
      "open",
      "",
    );
    expect(await notes(page)).toHaveLength(1);
    // The first activation's one-second deadline has not elapsed.
    await summary.focus();
    await page.keyboard.press("Enter");
    await expect(page.locator(".profile-section").first()).not.toHaveAttribute(
      "open",
    );
    await expect.poll(async () => (await notes(page)).length).toBe(2);
    expect(
      await page.evaluate(() =>
        (
          window as unknown as { resumeAttempts: () => number }
        ).resumeAttempts(),
      ),
    ).toBe(2);
    await page.clock.runFor(1100);
    expect(await notes(page)).toHaveLength(2);
    await summary.click();
    await expect.poll(async () => (await notes(page)).length).toBe(3);
  });
}

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
  await openRoundSetup(page);
  await modePreparation(page, /Freies Spiel Alle Stufen/).click();
  await page.getByRole("button", { name: "Losspielen" }).click();
  const correct = await respond(page, true);
  await expect(page.locator(".answer.correct, .answer.wrong")).toHaveCount(0);
  const wrong = await respond(page, false);
  expect(correct).toEqual([
    { frequency: 600, type: "sine" },
    { frequency: 440, type: "sine" },
  ]);
  expect(wrong).toEqual(correct);
  await expect(page.locator(".answer.correct, .answer.wrong")).toHaveCount(0);
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
