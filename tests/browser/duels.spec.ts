import {
  modePreparation,
  openRoundSetup,
  test,
  expect,
  type Page,
} from "./fixtures";
import AxeBuilder from "@axe-core/playwright";
import { server, alice, bob, qs } from "./duel-service";
test.use({
  serviceWorkers: "block",
  acknowledgeIncidentalSuccess: true,
  autoLogin: true,
});
async function play(page: Page, count = 10, guessLast = false) {
  await page.bringToFront();
  await page.clock.pauseAt(
    new Date((await page.evaluate(() => Date.now())) + 100),
  );
  const previousCorrect = await page.locator(".progress-step.correct").count();
  for (let i = 0; i < count; i++) {
    const heading = page.locator("h1[data-question-id]");
    await expect(heading).toBeVisible();
    const id = await heading.getAttribute("data-question-id");
    const question = qs.find((q) => q.id === id)!;
    if (guessLast && i === count - 1)
      await page
        .getByLabel("Ich rate bei dieser Frage", { exact: true })
        .check();
    const choice = page.getByRole("button", {
      name: question.answers.find((a) => a.id === question.correctId)!.text,
      exact: false,
    });
    await expect
      .poll(async () => {
        await page.clock.runFor(50);
        return choice.isEnabled();
      })
      .toBe(true);
    await choice.click();
    await expect(
      page.locator(".solution-reveal .answer.correct"),
    ).toBeVisible();
    await expect(page.locator(".progress-step.correct")).toHaveCount(
      previousCorrect + i + 1,
    );
    // Give React's passive effect one frame to install the reveal timer.
    await page.clock.runFor(2600);
    await expect
      .poll(
        async () => {
          await page.clock.runFor(50);
          return page.locator(`h1[data-question-id="${id}"]`).count();
        },
        { intervals: [20] },
      )
      .toBe(0);
    await expect(
      page.locator(".feedback-outcome").getByText("Richtig", { exact: true }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: /Nächste Frage|Runde abschließen/ }),
    ).toHaveCount(0);
  }
  await page.clock.resume();
}
test("zwei Konten spielen nach Paarung unabhängig, sehen offene Duelle und erhalten ein Unentschieden", async ({
  browser,
}, testInfo) => {
  // Two accounts complete 60 answers, including the feedback and save steps.
  test.setTimeout(180000);
  const service = await server();
  const ac = await browser.newContext({ serviceWorkers: "block" }),
    bc = await browser.newContext({ serviceWorkers: "block" });
  const a = await ac.newPage(),
    b = await bc.newPage();
  try {
    await service.setup(a, alice);
    await a
      .getByRole("button", { name: "Duell vorlegen", exact: true })
      .click();
    await expect(
      a.getByRole("group", { name: "Lösungen anzeigen" }),
    ).toHaveCount(0);
    await play(a, 10, true);
    await expect(
      a.getByRole("button", { name: "Neues Duell starten", exact: false }),
    ).toBeVisible();
    await expect(
      a.getByRole("button", { name: "Neue Runde wählen", exact: false }),
    ).toHaveCount(0);
    await a
      .getByRole("button", { name: "Zur Duellübersicht", exact: false })
      .click();
    await expect(a.getByText("1 von 10 Spielplätzen belegt")).toBeVisible();
    await expect(
      a.getByText("Gegner steht noch nicht fest", { exact: true }),
    ).toBeVisible();
    await service.setup(b, bob);
    await expect(
      b.getByRole("checkbox", { name: "Alle Genres (gemischt)", exact: true }),
    ).toBeChecked();
    await b
      .getByRole("checkbox", { name: "Alle Genres (gemischt)", exact: true })
      .uncheck();
    const find = b.getByRole("button", {
      name: "Zufälligen Gegner finden",
      exact: true,
    });
    await b.getByRole("checkbox", { name: "Horror", exact: true }).uncheck();
    await b.getByRole("checkbox", { name: "Western", exact: true }).uncheck();
    await find.click();
    await expect(
      b.getByText("Gerade ist kein passendes Duell offen.", { exact: false }),
    ).toBeVisible();
    await expect(b.locator("h1[data-question-id]")).toHaveCount(0);
    await b
      .getByRole("checkbox", { name: "Alle Genres (gemischt)", exact: true })
      .check();
    await b.getByRole("button", { name: "Zufälligen Gegner finden" }).click();
    await expect(
      b.getByText("Duellthema: Alle Genres (gemischt)", { exact: true }),
    ).toBeVisible();
    await play(b);
    await expect(b.locator(".duel-round.is-draw")).toHaveCount(1);
    await expect(b.locator(".duel-round.is-open")).toHaveCount(2);
    await b
      .getByRole("button", { name: "Runde 2 spielen", exact: false })
      .click();
    await play(b);
    await b
      .getByRole("button", { name: "Runde 3 spielen", exact: false })
      .click();
    await play(b);
    await expect(
      b.getByText("Du hast alle drei Runden beendet.", { exact: false }),
    ).toBeVisible();
    await expect(b.locator(".duel-round.is-waiting")).toHaveCount(2);
    await expect(b.locator(".duel-round.is-draw")).toContainText(
      "Abgeschlossen · unentschieden",
    );
    await b.screenshot({
      path: testInfo.outputPath("duel-round-status.png"),
      fullPage: true,
    });
    expect((await new AxeBuilder({ page: b }).analyze()).violations).toEqual(
      [],
    );
    await expect(
      b.getByRole("button", { name: /Runde \d spielen/ }),
    ).toHaveCount(0);
    await a.getByRole("button", { name: "Aktualisieren", exact: true }).click();
    await a
      .getByRole("button", { name: "Weiterspielen", exact: false })
      .click();
    await play(a);
    await a
      .getByRole("button", { name: "Runde 3 spielen", exact: false })
      .click();
    await play(a);
    await b
      .getByRole("button", { name: "Duellstand aktualisieren", exact: true })
      .click();
    await a
      .getByRole("button", { name: "Zur Duellübersicht", exact: false })
      .click();
    await a.getByRole("button", { name: "Aktualisieren", exact: true }).click();
    await expect(a.getByText("0 von 10 Spielplätzen belegt")).toBeVisible();
    await a.getByText("Abgeschlossene Duelle (1)").click();
    await a
      .locator(".duel-history")
      .evaluate((node) =>
        node
          .getAnimations({ subtree: true })
          .forEach((animation) => animation.finish()),
      );
    await expect(a.getByText("Unentschieden.")).toBeVisible();
    await expect(a.getByText("30 : 30", { exact: true })).toBeVisible();
    expect((await new AxeBuilder({ page: a }).analyze()).violations).toEqual(
      [],
    );
    await a.setViewportSize({ width: 320, height: 740 });
    expect(
      await a.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await a.screenshot({
      path: testInfo.outputPath("duel-overview-mobile.png"),
      fullPage: true,
    });
    // This fixture's older backend has no rankings RPC. Return the actual
    // completed synthetic duel in the current private-results response shape.
    const result = await service.db.query<{
      summary: object;
      finished: number;
    }>(
      "select public.quiz_duel_summary(d,$1::uuid) as summary, floor(extract(epoch from d.finished_at)*1000)::double precision as finished from public.quiz_duels d where status='completed'",
      [bob],
    );
    expect(result.rows).toHaveLength(1);
    await b.route("**/rpc/quiz_duel_results", (route) => {
      expect(route.request().postDataJSON()).toEqual({
        selected_period: "all",
        page_offset: 0,
      });
      return route.fulfill({
        json: [
          { ...result.rows[0].summary, finishedAt: result.rows[0].finished },
        ],
      });
    });
    await expect(
      a.getByRole("button", { name: /Runde \d ansehen/ }),
    ).toHaveCount(0);
    await b.getByRole("button", { name: "Duell-Bestenliste ansehen" }).click();
    await expect(
      b.getByRole("button", { name: "Duelle", exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    await expect(
      b.getByRole("button", { name: "Meine Läufe", exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    await expect(b.locator(".is-current-run")).toContainText("Dieses Duell");
    await expect(b.locator(".is-current-run")).toContainText(
      "1 Ranglistenpunkte",
    );
    await expect(b.locator(".is-current-run")).toBeInViewport();
  } finally {
    await ac.close();
    await bc.close();
    await service.db.close();
  }
});
test("Duell: Antwortfarben, richtige und falsche Töne, Keine Ahnung und Stummschaltung mit automatischem Wechsel", async ({
  browser,
  browserName,
}, testInfo) => {
  const service = await server();
  const context = await browser.newContext({
    serviceWorkers: "block",
    viewport: { width: 320, height: 740 },
  });
  const page = await context.newPage();
  try {
    await page.addInitScript(() => {
      const tones: number[] = [];
      (window as any).__duelTones = tones;
      let Audio = window.AudioContext || (window as any).webkitAudioContext;
      if (!Audio) {
        // Windows WebKit has no Web Audio. Check the requested signals using
        // the same interface; physical sound is outside a browser assertion.
        Audio = class {
          state = "running";
          currentTime = 0;
          destination = {};
          async resume() {
            this.state = "running";
          }
          async close() {
            this.state = "closed";
          }
          createOscillator() {
            return {
              frequency: { value: 0 },
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
        };
        (window as any).AudioContext = Audio;
      }
      const create = Audio.prototype.createOscillator;
      Audio.prototype.createOscillator = function () {
        const oscillator = create.call(this);
        const start = oscillator.start.bind(oscillator);
        oscillator.start = (at = 0) => {
          tones.push(oscillator.frequency.value);
          start(at);
        };
        return oscillator;
      };
    });
    const nativeTimers = browserName === "webkit";
    await service.setup(page, alice, nativeTimers);
    await page.bringToFront();
    await page.setViewportSize({ width: 320, height: 740 });
    await page
      .getByRole("button", { name: "Duell vorlegen", exact: true })
      .click();
    if (!nativeTimers)
      await page.clock.pauseAt(
        new Date((await page.evaluate(() => Date.now())) + 100),
      );
    for (const kind of ["correct", "wrong", "unknown", "muted"] as const) {
      await expect
        .poll(async () => {
          if (!nativeTimers) await page.clock.runFor(50);
          return page
            .getByRole("button", { name: "Keine Ahnung", exact: true })
            .isEnabled();
        })
        .toBe(true);
      const heading = page.locator("h1[data-question-id]");
      const id = await heading.getAttribute("data-question-id");
      const q = qs.find((q) => q.id === id)!;
      if (kind === "muted")
        await page
          .getByRole("button", {
            name: "Soundeffekte ausschalten",
            exact: true,
          })
          .click();
      const beforeTones = await page.evaluate(
        () => (window as any).__duelTones.length as number,
      );
      if (kind !== "unknown") {
        await page
          .getByRole("button", {
            name: q.answers.find((a) =>
              kind === "correct" ? a.id === q.correctId : a.id !== q.correctId,
            )!.text,
            exact: false,
          })
          .click();
        await expect(
          page.locator(".solution-reveal .answer.wrong"),
        ).toHaveCount(kind === "correct" ? 0 : 1);
      } else {
        await page
          .getByRole("button", { name: "Keine Ahnung", exact: true })
          .click();
        await expect(
          page.locator(".solution-reveal .answer.wrong"),
        ).toHaveCount(0);
      }
      await expect(
        page.locator(".solution-reveal .answer.correct"),
      ).toBeVisible();
      await expect(page.locator(".explanation")).toHaveCount(0);
      const wanted =
        kind === "correct"
          ? [659, 831]
          : kind === "wrong"
            ? [349, 294]
            : kind === "unknown"
              ? [523, 659]
              : [];
      await expect
        .poll(() =>
          page.evaluate(
            (from) => (window as any).__duelTones.slice(from),
            beforeTones,
          ),
        )
        .toEqual(wanted);
      if (kind === "wrong") {
        await page.screenshot({
          path: testInfo.outputPath("duel-answer-mobile.png"),
          fullPage: true,
        });
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        ).toBe(true);
      }
      if (!nativeTimers) {
        await page.clock.runFor(2490);
        await expect(heading).toHaveAttribute("data-question-id", id!);
        await page.clock.runFor(100);
      }
      await expect(page.locator(`h1[data-question-id="${id}"]`)).toHaveCount(0);
    }
    await expect(page.locator(".progress-step.wrong")).toHaveCount(3);
    await expect(page.locator(".progress-step.correct")).toHaveCount(1);
    if (!nativeTimers) await page.clock.resume();
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    await page
      .getByRole("button", { name: "Pause & Duellübersicht", exact: false })
      .click();
  } finally {
    await context.close();
    await service.db.close();
  }
});
test("Freies Spiel fragt ohne Unterbrechung ab und zeigt gesammelte Lösungen im eigenen Rückblick", async ({
  page,
}, testInfo) => {
  await page.clock.install({ time: new Date("2026-10-02T12:00:00Z") });
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Losspielen" })).toBeEnabled();
  await openRoundSetup(page);
  await page.getByRole("button", { name: "Lernen", exact: true }).click();
  await openRoundSetup(page);
  await modePreparation(page, /Freies Spiel Alle Stufen/).click();
  await expect(
    page.getByRole("radio", { name: "Nach der Runde", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Profil", exact: true }).click();
  await page.getByRole("button", { name: /Optionen/ }).click();
  await expect(
    page.getByRole("heading", {
      name: "Lösungen in Zeitspielen und im Freien Spiel",
    }),
  ).toBeVisible();
  await page
    .getByRole("radio", { name: "Nach der Runde", exact: true })
    .check();
  await page.getByRole("button", { name: "Spielen", exact: true }).click();
  await expect(
    page.getByRole("radio", { name: "Nach der Runde", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Losspielen" }).click();
  for (let i = 0; i < 10; i++) {
    const id = await page
      .locator("h1[data-question-id]")
      .getAttribute("data-question-id");
    await expect(
      page.getByRole("button", { name: "Keine Ahnung", exact: false }),
    ).toBeEnabled();
    await page
      .getByRole("button", { name: "Keine Ahnung", exact: false })
      .click();
    await expect(page.locator(`h1[data-question-id="${id}"]`)).toHaveCount(0);
    if (i < 9) {
      await expect(page.locator(".explanation")).toHaveCount(0);
      await expect(
        page.locator(".progress-step.correct,.progress-step.wrong"),
      ).toHaveCount(0);
    }
    if (i === 0) {
      await page.screenshot({
        path: testInfo.outputPath("collected-answer.png"),
        fullPage: true,
      });
      await page
        .getByRole("button", { name: "Pause & Startseite", exact: false })
        .click();
      await page.reload();
      await page
        .getByRole("button", { name: "Fortsetzen", exact: false })
        .click();
      await expect(
        page.getByLabel("Frage 1: Antwort gespeichert", { exact: true }),
      ).toBeVisible();
    }
  }
  await expect(
    page.getByRole("heading", { name: "Dein Rundenrückblick" }),
  ).toBeVisible();
  await page.locator(".review details summary").first().click();
  await page
    .locator(".review")
    .evaluate((node) =>
      node
        .getAnimations({ subtree: true })
        .forEach((animation) => animation.finish()),
    );
  await expect(page.locator(".review .explanation").first()).toBeVisible();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

test("direkte Duelllösungen, Einladungslink und Wiederaufnahme erhalten den Servertimer", async ({
  browser,
}, testInfo) => {
  test.setTimeout(120000);
  const service = await server();
  const context = await browser.newContext({
    serviceWorkers: "block",
    viewport: { width: 320, height: 740 },
  });
  const page = await context.newPage();
  try {
    await service.setup(page, alice);
    const topics = page.getByLabel("Duellthema", { exact: true });
    await expect(topics.locator("option")).toHaveCount(15);
    await expect(
      topics.getByRole("option", { name: "Classics", exact: true }),
    ).toHaveCount(0);
    await expect(
      topics.getByRole("option", { name: "Arthouse", exact: true }),
    ).toHaveCount(0);
    await topics.selectOption("Science-Fiction");
    await expect(
      page.getByRole("radio", { name: "Nach der Runde", exact: true }),
    ).toHaveCount(0);
    await page
      .getByRole("button", { name: "Per Link einladen", exact: true })
      .click();
    await expect(
      page.getByText("Duellthema: Sci-Fi", { exact: true }),
    ).toBeVisible();
    await play(page, 1);
    await expect(page.locator(".answer").first()).toBeEnabled();
    await page
      .getByRole("button", { name: "Pause & Duellübersicht", exact: false })
      .click();
    const duel = (
      await service.db.query<{ id: string }>(
        "select id from quiz_duels where creator=$1 and status='preparing'",
        [alice],
      )
    ).rows[0].id;
    await service.db.query(
      "update quiz_duel_answers set started_at=clock_timestamp()-interval '31 seconds' where duel_id=$1 and question_no=1",
      [duel],
    );
    await page.reload();
    await openRoundSetup(page);
    await expect(
      page.getByRole("button", { name: "Duell", exact: true }),
    ).toBeEnabled();
    await openRoundSetup(page);
    await page.getByRole("button", { name: "Duell", exact: true }).click();
    await page.getByRole("button", { name: /^Duell Drei Runden/ }).click();
    await page.getByRole("button", { name: "Duell wählen" }).click();
    await page
      .getByRole("button", { name: "Weiterspielen", exact: false })
      .click();
    await expect(
      page.getByLabel("Frage 3: noch offen, aktuell", { exact: true }),
    ).toBeVisible();
    await expect(page.locator(".progress-step.correct")).toHaveCount(1);
    await expect(page.locator(".progress-step.wrong")).toHaveCount(1);
    await expect(page.locator(".explanation")).toHaveCount(0);
    await page.screenshot({
      path: testInfo.outputPath("collected-duel-mobile.png"),
      fullPage: true,
    });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await play(page, 8);
    await expect(page.locator(".result-score")).toContainText("9");
    await page
      .getByRole("button", { name: "Zur Duellübersicht", exact: false })
      .click();
    await expect(
      page.getByRole("button", {
        name: "Einladungslink kopieren",
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Per Link einladen", exact: true }),
    ).toBeEnabled();
    const row = (
      await service.db.query<{ token: string }>(
        "select token from quiz_duels where id=$1",
        [duel],
      )
    ).rows[0];
    const second = await browser.newContext({ serviceWorkers: "block" });
    const other = await second.newPage();
    try {
      await service.setup(other, bob);
      await other.goto(`/#duel=${row.token}`);
      await other
        .getByRole("button", { name: "Einladung annehmen", exact: true })
        .click();
      await expect(other.getByRole("timer")).toBeVisible();
      expect(
        (
          await service.db.query<{ opponent: string }>(
            "select opponent from quiz_duels where id=$1",
            [duel],
          )
        ).rows[0].opponent,
      ).toBe(bob);
    } finally {
      await other.unrouteAll({ behavior: "wait" });
      await second.unrouteAll({ behavior: "wait" });
      await second.close();
    }
  } finally {
    await page.unrouteAll({ behavior: "wait" });
    await context.unrouteAll({ behavior: "wait" });
    await context.close();
    await service.db.close();
  }
});
