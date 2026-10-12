import {
  test,
  expect,
  readStoredState,
  accountBackend,
  testOwner,
  type Page,
} from "./fixtures";
import AxeBuilder from "@axe-core/playwright";

async function options(page: Page) {
  await page.getByRole("button", { name: "Profil", exact: true }).click();
  await page.getByRole("button", { name: "Optionen" }).click();
}

for (const duration of [500, 4000]) {
  test(`Anzeigezeit ${duration} ms: Schieberegler gespeichert, richtig/falsch/Keine Ahnung gleich lang`, async ({
    page,
  }, info) => {
    await page.clock.install({ time: new Date("2026-10-03T12:00:00+02:00") });
    await page.setViewportSize({ width: 320, height: 664 });
    await page.goto("/");
    await expect(
      page.getByRole("button", { name: /^Losspielen/ }),
    ).toBeEnabled();
    await options(page);
    const slider = page.getByRole("slider", {
      name: "Anzeigezeit der Antworten",
    });
    await expect(slider).toHaveValue("1.1");
    await expect(slider).toHaveAttribute("min", "0.5");
    await expect(slider).toHaveAttribute("max", "4");
    await expect(slider).toHaveAttribute("step", "0.1");
    await slider.focus();
    await slider.press(duration === 500 ? "Home" : "End");
    await expect(slider).toHaveValue(String(duration / 1000));
    await expect(slider).toHaveAttribute(
      "aria-valuetext",
      duration === 500 ? "0,5 Sekunden" : "4,0 Sekunden",
    );
    await expect
      .poll(async () => (await readStoredState(page)).settings.answerRevealMs)
      .toBe(duration);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    if (duration === 4000) {
      await slider.scrollIntoViewIfNeeded();
      await page.screenshot({
        path: `test-results/anzeigezeit-${info.project.name}-320.png`,
      });
      expect(
        (
          await new AxeBuilder({ page })
            .withTags(["wcag2a", "wcag2aa"])
            .analyze()
        ).violations,
      ).toEqual([]);
    }
    await page.reload();
    await expect(
      page.getByRole("button", { name: /^Losspielen/ }),
    ).toBeEnabled();
    await options(page);
    await expect(
      page.getByRole("slider", { name: "Anzeigezeit der Antworten" }),
    ).toHaveValue(String(duration / 1000));
    await page.getByRole("button", { name: "Spielen", exact: true }).click();
    await page.clock.pauseAt(
      new Date((await page.evaluate(() => Date.now())) + 1000),
    );
    await page.getByRole("button", { name: /^Losspielen/ }).click();
    for (const choice of ["correct", "wrong", "unknown"] as const) {
      await expect
        .poll(async () => {
          await page.clock.runFor(50);
          return page
            .getByRole("button", { name: "Keine Ahnung", exact: true })
            .isEnabled();
        })
        .toBe(true);
      const id = await page
        .locator("h1[data-question-id]")
        .getAttribute("data-question-id");
      const before = await readStoredState(page);
      const question = before.rounds
        .find((round) => round.status === "active")!
        .questions.find((q) => q.id === id)!;
      const backend = accountBackend(page);
      const issuedAt = await backend.admin(async () => {
        const result = await backend.db.query<{ issued: number }>(
          `select floor(extract(epoch from q.issued_at)*1000)::double precision issued
           from quiz_game_internal.questions q join quiz_game_internal.runs r on r.id=q.run_id
           where r.owner_id=$1 and r.status='active' and q.question->>'id'=$2`,
          [testOwner, id],
        );
        return result.rows[0].issued;
      });
      await page.clock.runFor(1000);
      const answeredAt = await page.evaluate(() => Date.now());
      if (choice === "unknown")
        await page
          .getByRole("button", { name: "Keine Ahnung", exact: true })
          .click();
      else {
        const answer = question.answers.find((a) =>
          choice === "correct"
            ? a.id === question.correctId
            : a.id !== question.correctId,
        )!;
        await page
          .locator(".answer")
          .filter({ has: page.getByText(answer.text, { exact: true }) })
          .click();
      }
      await expect(page.locator(".solution-reveal")).toBeVisible();
      await expect(page.locator(".solution-reveal .answer")).toHaveCount(4);
      await expect(page.locator(".answer.correct")).toBeVisible();
      await expect(page.locator(".answer.wrong")).toHaveCount(
        choice === "wrong" ? 1 : 0,
      );
      await page.clock.runFor(duration - 1);
      await expect(page.locator(".solution-reveal")).toBeVisible();
      await expect(page.locator(".explanation")).toHaveCount(0);
      await page.clock.runFor(1);
      await expect(page.locator(".solution-reveal")).toHaveCount(0);
      await expect(page.locator(".explanation")).toBeVisible();
      const saved = await readStoredState(page);
      expect(saved.events).toHaveLength(before.events.length + 1);
      expect(saved.events.at(-1)?.elapsedMs).toBeGreaterThanOrEqual(1000);
      // Polling readiness advances the controlled clock too. The reveal
      // duration must never enter the server's response-time measurement.
      expect(saved.events.at(-1)?.elapsedMs).toBe(answeredAt - issuedAt);
      if (choice !== "unknown")
        await page.getByRole("button", { name: "Nächste Frage" }).click();
    }
    await page.clock.resume();
  });
}

for (const fail of [false, true]) {
  test(`Auswahl sofort sichtbar vor Online-Bestätigung${fail ? " mit Fehler und Wiederholung" : ""}`, async ({
    page,
    browserName,
  }, testInfo) => {
    await page.goto("/");
    await page.getByRole("button", { name: /^Losspielen/ }).click();
    const choice = fail
      ? page.locator(".answers .answer-unknown")
      : page.locator(".answers .answer").first();
    await expect(choice).toBeEnabled();
    const backend = accountBackend(page);
    const before = await readStoredState(page);
    expect(before.rounds.find((round) => round.status === "active")?.mode).toBe(
      "entdecken",
    );
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const packets: string[] = [];
    await page.route("**/rest/v1/rpc/quiz_game_call", async (route) => {
      packets.push(route.request().postData()!);
      if (packets.length === 1) {
        await gate;
        if (fail) {
          await route.fulfill({
            status: 503,
            json: { message: "Test: Bestätigung nicht verfügbar" },
          });
          return;
        }
      }
      await route.fallback();
    });
    const cdp =
      browserName === "chromium"
        ? await page.context().newCDPSession(page)
        : null;
    if (cdp) await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
    await page.evaluate(() => {
      const metrics = { start: 0, painted: 0 };
      (window as any).__selectionResponse = metrics;
      document.addEventListener(
        "click",
        (event) => {
          if ((event.target as Element).closest(".answers .answer"))
            metrics.start ||= performance.now();
        },
        true,
      );
      const observer = new MutationObserver(() => {
        if (!metrics.start || !document.querySelector(".answer.is-submitting"))
          return;
        observer.disconnect();
        requestAnimationFrame(() =>
          requestAnimationFrame(() => {
            metrics.painted = performance.now() - metrics.start;
          }),
        );
      });
      observer.observe(document.body, {
        attributes: true,
        childList: true,
        subtree: true,
      });
    });
    try {
      await choice.click();
      await expect(page.locator(".answer.is-submitting")).toHaveCount(1);
      await expect(choice).toContainText("Ausgewählt");
      await expect(choice).toHaveCSS("border-color", "rgb(82, 109, 140)");
      await expect(
        page.getByText("Antwort wird bestätigt …", { exact: true }),
      ).toBeVisible();
      await expect(page.locator(".answers .answer:enabled")).toHaveCount(0);
      await expect(
        page.locator(".feedback, .answer.correct, .answer.wrong"),
      ).toHaveCount(0);
      await expect.poll(() => packets.length).toBe(1);
      await expect
        .poll(() =>
          page.evaluate(() => (window as any).__selectionResponse.painted),
        )
        .toBeGreaterThan(0);
      const latency = await page.evaluate(
        () => (window as any).__selectionResponse.painted,
      );
      console.log(
        JSON.stringify({
          browser: browserName,
          fail,
          selectionPaintMs: latency,
        }),
      );
      expect(latency).toBeLessThan(250);
      const confirmation = page.locator(
        ".answer.is-submitting .answer-verdict",
      );
      await expect(confirmation).toBeInViewport();
      // Check actual animation progress while the server response is held.
      const times = await confirmation.evaluate(async (element) => {
        const animation = element.getAnimations({ subtree: true })[0];
        const start = animation?.currentTime;
        await new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
        );
        return [start, animation?.currentTime];
      });
      expect(typeof times[0]).toBe("number");
      expect(times[1]).toBeGreaterThan(times[0] as number);
      await page.screenshot({
        path: testInfo.outputPath("auswahl-vor-bestaetigung.png"),
      });
      await page.emulateMedia({ reducedMotion: "reduce" });
      await expect(confirmation).toBeVisible();
      await expect
        .poll(() =>
          confirmation.evaluate(
            (element) => element.getAnimations({ subtree: true }).length,
          ),
        )
        .toBe(0);
      await expect(choice).toContainText("Ausgewählt");
      await page.emulateMedia({ reducedMotion: "no-preference" });
      expect((await readStoredState(page)).events).toHaveLength(
        before.events.length,
      );
      // Repeated input cannot submit another choice while confirmation is held.
      await choice.evaluate((button: HTMLButtonElement) => button.click());
      expect(packets).toHaveLength(1);
      release();
      if (fail) {
        await expect(page.getByRole("alert")).toContainText(
          "Die Online-Speicherung konnte nicht bestätigt werden.",
        );
        await expect(page.locator(".answer.is-submitting")).toHaveCount(0);
        await expect(confirmation).toHaveCount(0);
        await expect(page.locator(".feedback")).toHaveCount(0);
        await page
          .getByRole("button", { name: "Erneut versuchen", exact: true })
          .click();
        await expect.poll(() => packets.length).toBe(2);
        expect(packets[1]).toBe(packets[0]);
      }
      await expect(page.locator(".feedback")).toBeVisible();
      await expect(page.locator(".answer.is-submitting")).toHaveCount(0);
      await expect(confirmation).toHaveCount(0);
      expect((await readStoredState(page)).events).toHaveLength(
        before.events.length + 1,
      );
      expect(
        backend.api.calls.filter(
          (call) =>
            call.name === "quiz_game_call" &&
            JSON.parse(call.args.request_text as string).action === "answer",
        ).length,
      ).toBeGreaterThan(0);
    } finally {
      release();
      if (cdp) await cdp.send("Emulation.setCPUThrottlingRate", { rate: 1 });
    }
  });
}
