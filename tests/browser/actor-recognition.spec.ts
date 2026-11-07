import { writeStoredState } from "./fixtures";
import { readFileSync } from "node:fs";
import AxeBuilder from "@axe-core/playwright";
import {
  test,
  expect,
  readStoredState,
  accountBackend,
  openRoundSetup,
  modePreparation,
  type Page,
} from "./fixtures";
import { prepareTestContent } from "../helpers/test-content";
import { addPackages, packages } from "../../src/packages";
import { emptyState, type State } from "../../src/model";
import { startRound } from "../../src/engine";
import portraits from "../../src/actorRecognitionPortraits.json" with { type: "json" };
import alternates from "../../src/actorRecognitionAlternatePortraits.json" with { type: "json" };
import { recognitionPortrait } from "../../src/portraitCatalog";
import { eventIdFor } from "../../src/recordModes";
import { actorTmdbUrl } from "../../src/actorTmdb";

test.use({ acknowledgeIncidentalSuccess: true });

for (const timed of [false, true]) {
  for (const failure of [false, true]) {
    test(`Pflichtbild ${timed ? "Zeitspiel" : "Lernspiel"}: ${failure ? "404 und erneutes Laden" : "verzögertes Bild"} ohne Blindantwort und Zeitneustart`, async ({
      page,
    }) => {
      const now = Date.parse("2026-10-18T10:00:00Z");
      await page.clock.install({ time: new Date(now) });
      const backend = accountBackend(page);
      backend.serverTime = now;
      const original = backend.release.questions.find(
        (q) => !!q.metadata.question_image_id,
      )!;
      const photo =
        portraits[original.metadata.person_id as keyof typeof portraits];
      const questions = (
        [
          "leicht",
          "leicht",
          "leicht",
          "mittel",
          "mittel",
          "mittel",
          "mittel",
          "schwer",
          "schwer",
          "schwer",
        ] as const
      ).map((difficulty, i) => ({
        ...structuredClone(original),
        id: `REVIEW-IMAGE-${i}`,
        knowledgeId: `REVIEW-IMAGE-GOAL-${i}`,
        difficulty,
        image: { src: photo.src, width: photo.width, height: photo.height },
      }));
      const film = backend.release.questions.find(
        (q) => !q.metadata.person_id && !q.tags.includes("Preisträger"),
      )!;
      await backend.seedRanked(
        await prepareTestContent([
          ...questions,
          { ...film, difficulty: "experte" },
        ]),
      );
      let release!: () => void;
      const gate = new Promise<void>((resolve) => {
        release = resolve;
      });
      let fail = failure;
      for (const src of [
        photo.src,
        alternates[original.metadata.person_id as keyof typeof alternates].src,
      ]) {
        await page.route(`**${src}*`, async (route) => {
          if (fail)
            return route.fulfill({
              status: 404,
              body: "Synthetic missing image",
            });
          if (!failure) await gate;
          await route.continue();
        });
      }
      try {
        await page.goto("/");
        await openRoundSetup(page);
        if (timed) {
          await page
            .getByRole("button", { name: "Auf Zeit", exact: true })
            .click();
          await modePreparation(page, /^10 Fragen /).click();
        } else {
          await modePreparation(page, /^Freies Spiel /).click();
          await openRoundSetup(page);
          await page
            .getByRole("group", { name: "Fragenbereiche", exact: true })
            .getByLabel("Schauspieler", { exact: true })
            .check();
          await page
            .getByRole("group", { name: "Fragenbereiche", exact: true })
            .getByLabel("Filmfragen", { exact: true })
            .uncheck();
        }
        await page.getByRole("button", { name: "Losspielen" }).click();
        await expect(page.locator("h1[data-question-id]")).toBeVisible();
        await expect(page.locator(".answer").first()).toBeDisabled();
        await expect(
          page.getByRole("button", { name: "Keine Ahnung", exact: true }),
        ).toBeDisabled();
        await expect(
          page.getByText(
            failure
              ? "Das Bild konnte nicht geladen werden."
              : "Das Bild wird geladen …",
            { exact: false },
          ),
        ).toBeVisible();
        await page.clock.runFor(5000);
        backend.serverTime = now + 5000;
        if (timed)
          await expect(page.getByRole("timer")).toHaveAttribute(
            "aria-label",
            /2[0-5] Sekunden/,
          );
        const schema = timed ? "quiz_ranked_internal" : "quiz_game_internal";
        const saved = await backend.admin(() =>
          backend.db.query<{ n: number }>(
            `select count(*)::integer n from ${schema}.questions where event is not null`,
          ),
        );
        expect(saved.rows[0].n).toBe(0);
        if (failure) {
          fail = false;
          await page.getByRole("button", { name: "Bild erneut laden" }).click();
        } else release();
        await expect(
          page.getByRole("button", { name: "Keine Ahnung", exact: true }),
        ).toBeEnabled();
        await expect(page.locator("h1[data-question-id]")).toBeFocused();
        if (timed) {
          await expect(page.getByRole("timer")).toHaveAttribute(
            "aria-label",
            /2[0-5] Sekunden/,
          );
          expect(
            backend.api.calls.filter(
              (call) =>
                call.name === "quiz_ranked_call" &&
                JSON.parse(String(call.args.request_text)).action === "start",
            ),
          ).toHaveLength(1);
        }
      } finally {
        release();
      }
    });
  }
}

async function writeState(page: Page, state: State) {
  await writeStoredState(page, state);
}

for (const [number, choice, variant] of [
  [1, "correct", 0],
  [1, "correct", 1],
  [182, "wrong", 0],
  [193, "unknown", 1],
  [113, "correct", 1],
] as const) {
  test(`Bildfrage ${number}, Foto ${variant + 1}: vor ${choice}, Name und Bildnachweis nachher, Fortsetzen und Neuladen`, async ({
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
        text: readFileSync(`${p.path}`, "utf8"),
      })),
    );
    const q = state.questions.find(
      (q) =>
        q.id ===
        `SCHAUSPIELER-BILD-20261007-${String(number).padStart(3, "0")}`,
    )!;
    const portrait = (variant === 0 ? portraits : alternates)[
      q.metadata.person_id as keyof typeof portraits
    ];
    const catalog = state.questions;
    state.questions = [q];
    startRound(
      state,
      { mode: "ueben", topic: "Schauspieler", difficulty: "Alle Stufen" },
      Date.parse("2026-10-07T12:00:00+02:00"),
    );
    const round = state.rounds.at(-1)!;
    for (let i = 0; ; i++) {
      round.id = `actor-image-${number}-${i}`;
      if (recognitionPortrait(q, eventIdFor(round, 0))!.src === portrait.src)
        break;
    }
    state.questions = catalog;
    await writeState(page, state);
    await page.reload();
    await page.getByRole("button", { name: "Fortsetzen" }).click();
    const image = page.getByRole("img", {
      name: "Schauspielerporträt für die Namensfrage",
    });
    await expect(image).toBeVisible();
    await expect(image).toHaveAttribute("src", portrait.src);
    // Reload while unanswered, then toggle sound to exercise a normal rerender.
    await page.reload();
    await page.getByRole("button", { name: "Fortsetzen" }).click();
    await page
      .getByRole("button", { name: "Soundeffekte ausschalten" })
      .click();
    await expect(image).toHaveAttribute("src", portrait.src);
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
      path: test.info().outputPath("recognition-before.png"),
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
    await expect(page.locator(".actor-name > span")).toHaveText("Schauspiel");
    await expect(page.locator(".actor-name > strong")).toHaveText(
      portrait.name,
    );
    await expect(
      page.getByRole("img", { name: `Porträt von ${portrait.name}` }),
    ).toHaveAttribute("src", portrait.src);
    await expect(
      page.locator(".explanation .actor-portrait > a"),
    ).toHaveAttribute("href", actorTmdbUrl(q)!);
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
    if (browserName === "chromium") {
      await page.reload();
    } else {
      await page.reload();
    }
    await page.getByRole("button", { name: "Fortsetzen" }).click();
    await expect(page.locator(".actor-name > strong")).toHaveText(
      portrait.name,
    );
    if (browserName === "chromium")
      await expect
        .poll(() =>
          page
            .getByRole("img", { name: `Porträt von ${portrait.name}` })
            .evaluate((img: HTMLImageElement) => img.naturalWidth),
        )
        .toBe(portrait.width);
    await page.getByRole("button", { name: "Runde abschließen" }).click();
    await page.locator(".review > details > summary").click();
    await expect(
      page.locator(".review .actor-portrait img:not(.disclosure-artwork)"),
    ).toHaveAttribute("src", portrait.src);
  });
}
