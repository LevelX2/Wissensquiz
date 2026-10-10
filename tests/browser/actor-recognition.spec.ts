import { writeStoredState } from "./fixtures";
import { readFileSync } from "node:fs";
import AxeBuilder from "@axe-core/playwright";
import { test, expect, readStoredState, type Page } from "./fixtures";
import { addPackages, packages } from "../../src/packages";
import { emptyState, type State } from "../../src/model";
import { startRound } from "../../src/engine";
import portraits from "../../src/actorRecognitionPortraits.json" with { type: "json" };
import alternates from "../../src/actorRecognitionAlternatePortraits.json" with { type: "json" };
import { recognitionPortrait } from "../../src/ActorPortrait";
import { eventIdFor } from "../../src/recordModes";

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
        text: readFileSync(`public${p.path}`, "utf8"),
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
      path: `test-results/recognition-${number}-${variant}-${info.project.name}-before.png`,
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
    ).toHaveAttribute("src", portrait.src);
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
    await expect(page.locator(".actor-name")).toHaveText(portrait.name);
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
    await expect(page.locator(".review .actor-portrait img")).toHaveAttribute(
      "src",
      portrait.src,
    );
  });
}
