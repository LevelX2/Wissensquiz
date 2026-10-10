import { writeStoredState } from "./fixtures";
import {
  modePreparation,
  openRoundSetup,
  test,
  expect,
  readStoredState,
  type Page,
} from "./fixtures";
import AxeBuilder from "@axe-core/playwright";
import { readFileSync } from "node:fs";
import { packages, addPackages } from "../../src/packages";
import { emptyState, type State } from "../../src/model";
import { startRound } from "../../src/engine";
import { actorPresentation } from "../../src/actorEditorial";
import portraits from "../../src/actorPortraits.json" with { type: "json" };
const portraitEvidence = JSON.parse(
  readFileSync(
    "KI-Wissen-Wissensquiz/01 Rohquellen/Schauspielerportraets-2026-10-04/Nachweis.json",
    "utf8",
  ),
) as { images: { src: string; bytes: number; sha256: string }[] };

const now = new Date("2026-10-03T12:00:00+02:00");
async function writeState(page: Page, value: State) {
  await writeStoredState(page, value);
}

test("Schauspieler öffnet 220 Personen und spielt Expertenfragen unabhängig von Filmgruppen mobil und nach Neuladen", async ({
  page,
  context,
  browserName,
}) => {
  await page.clock.install({ time: now });
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Losspielen" })).toBeEnabled();
  await page.getByRole("button", { name: "Themen", exact: true }).click();
  await page.getByRole("button", { name: "Personen ansehen" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Schauspieler: Personen",
  );
  await expect(page.locator(".topic-card")).toHaveCount(220);
  await expect(
    page.getByRole("heading", { name: "Tom Hanks", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Zur Themenübersicht" }).click();
  await page.getByRole("button", { name: "Schauspieler spielen" }).click();
  await expect(page.locator(".round-setup")).toBeVisible();
  await openRoundSetup(page);
  await expect(
    page.getByRole("checkbox", { name: "Schauspieler", exact: true }),
  ).toBeChecked();
  await expect(
    modePreparation(page, /Freies Spiel Alle Stufen/),
  ).toHaveAttribute("aria-pressed", "true");
  const levels = page.getByRole("group", {
    name: "Schwierigkeitsstufen",
    exact: true,
  });
  for (const level of ["Leicht", "Mittel", "Schwer"])
    await levels.getByLabel(level, { exact: true }).uncheck();
  const groups = page.getByRole("group", {
    name: "Bekanntheit der Filme",
    exact: true,
  });
  await expect(groups.getByRole("checkbox").first()).toBeDisabled();
  await expect(page.getByRole("button", { name: "Losspielen" })).toBeEnabled();
  await expect(page.locator("#round-summary")).toContainText("Schauspieler");
  expect(
    (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze())
      .violations,
  ).toEqual([]);
  await page.getByRole("button", { name: "Losspielen" }).click();
  await expect(page.locator(".question-difficulty")).toHaveText(
    "Schwierigkeit: Experte",
  );
  await expect(page.locator(".question-genre")).toHaveText("Schauspieler");
  await page.locator(".answer").first().click();
  const active = (await readStoredState(page)).rounds.find(
    (r) => r.status === "active",
  )!;
  const linked =
    actorPresentation(active.questions[0])!.films.length > 0 ? 1 : 0;
  await expect(page.locator(".explanation .actor-name")).toBeVisible();
  await page.getByText("Etwas tiefer eintauchen", { exact: true }).click();
  await expect(page.locator(".film-data")).toHaveCount(linked);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "Pause & Startseite" }).click();
  await page.getByRole("button", { name: "Profil", exact: true }).click();
  await page.getByRole("button", { name: "Optionen" }).click();
  if (browserName === "chromium") {
    await page.reload();
  } else {
    await page.reload();
  }
  await page.getByRole("button", { name: "Fortsetzen" }).click();
  await expect(page.locator(".explanation .actor-name")).toBeVisible();
  await expect(page.locator(".question-difficulty")).toHaveText(
    "Schwierigkeit: Experte",
  );
  await expect(page.locator(".film-data")).toHaveCount(linked);
});

for (const [questionId, person, film] of [
  ["SCHAUSPIELER-202610-P01-001-L-1", "Tom Hanks", "Forrest Gump"],
  ["SCHAUSPIELER-202610-P02-102-L-1", "Russell Crowe", "Gladiator"],
  ["SCHAUSPIELER-202610-P03-136-L-1", "Willem Dafoe", "Spider-Man"],
])
  test(`Erkennungsfrage ${questionId} verbirgt die Person und zeigt Zusatzinfos erst nach der Antwort`, async ({
    page,
  }) => {
    await page.clock.install({ time: now });
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
    const q = state.questions.find((q) => q.id === questionId)!;
    const catalog = state.questions;
    state.questions = [q];
    startRound(
      state,
      { mode: "ueben", topic: "Schauspieler", difficulty: "leicht" },
      now.getTime(),
    );
    state.questions = catalog;
    await writeState(page, state);
    await page.reload();
    await page.getByRole("button", { name: "Fortsetzen" }).click();
    await expect(page.locator(".question-card h1")).not.toContainText(person);
    await expect(page.locator(".question-hints")).not.toContainText(person);
    await expect(page.locator(".actor-name")).toHaveCount(0);
    await expect(page.locator(".actor-portrait")).toHaveCount(0);
    await expect(page.locator(".explanation")).toHaveCount(0);
    await page.locator(".answer").filter({ hasText: person }).click();
    await expect(page.locator(".actor-name")).toHaveText(person);
    if (person === "Tom Hanks") {
      await expect(
        page.getByRole("img", { name: `Porträt von ${person}` }),
      ).toBeVisible();
    } else {
      await expect(page.locator(".actor-portrait")).toHaveCount(0);
    }
    await page.getByText("Etwas tiefer eintauchen", { exact: true }).click();
    await expect(page.locator(".explanation")).toContainText(q.context);
    await expect(page.locator(".film-data")).toHaveCount(1);
    await page.getByText("Filmdaten", { exact: true }).click();
    await expect(page.locator(".film-data")).toContainText(film);
  });

for (const [personId, person, response] of [
  ["ACTOR-051", "Meryl Streep", "unknown"],
  ["ACTOR-013", "Keanu Reeves", "wrong"],
] as const)
  test(`Porträt von ${person} erscheint nach ${response} und bleibt mit Bildnachweis nach Neuladen verfügbar`, async ({
    page,
    context,
    browserName,
  }) => {
    await page.clock.install({ time: now });
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
      (q) => q.metadata.person_id === personId && q.id.endsWith("L-1"),
    )!;
    const catalog = state.questions;
    state.questions = [q];
    startRound(
      state,
      { mode: "ueben", topic: "Schauspieler", difficulty: "leicht" },
      now.getTime(),
    );
    state.questions = catalog;
    await writeState(page, state);
    await page.reload();
    await page.getByRole("button", { name: "Fortsetzen" }).click();
    await expect(page.locator(".actor-portrait")).toHaveCount(0);
    if (response === "unknown") {
      await page
        .getByRole("button", { name: "Keine Ahnung", exact: true })
        .click();
    } else {
      const wrong = q.answers.find((answer) => answer.id !== q.correctId)!;
      await page.locator(".answer").filter({ hasText: wrong.text }).click();
    }
    const image = page.getByRole("img", { name: `Porträt von ${person}` });
    await expect(image).toBeVisible();
    await expect
      .poll(() =>
        image.evaluate((img) => (img as HTMLImageElement).naturalWidth),
      )
      .toBeGreaterThan(0);
    await page.screenshot({
      path: `test-results/portrait-${personId}-${browserName}-closed.png`,
      fullPage: true,
    });
    await page.getByText("Bildnachweis", { exact: true }).click();
    const credit = page.locator(".actor-portrait figcaption");
    const portrait = portraits[personId];
    await expect(credit).toContainText(portrait.photographer);
    await expect(
      credit.getByRole("link", { name: portrait.license, exact: true }),
    ).toHaveAttribute("href", portrait.licenseUrl);
    await expect(
      credit.getByRole("link", { name: "Wikimedia Commons", exact: true }),
    ).toHaveAttribute("href", portrait.sourceUrl);
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
      path: `test-results/portrait-${personId}-${browserName}.png`,
      fullPage: true,
    });
    await page.getByRole("button", { name: "Pause & Startseite" }).click();
    await page.getByRole("button", { name: "Profil", exact: true }).click();
    await page.getByRole("button", { name: "Optionen" }).click();
    if (browserName === "chromium") {
      await page.reload();
    } else {
      await page.reload();
    }
    await page.getByRole("button", { name: "Fortsetzen" }).click();
    await expect(image).toBeVisible();
    await expect
      .poll(() =>
        image.evaluate((img) => (img as HTMLImageElement).naturalWidth),
      )
      .toBeGreaterThan(0);
    const loaded = await page.evaluate(
      async (images) =>
        Promise.all(
          images.map(async (image) => {
            const response = await fetch(image.src);
            if (!response.ok) return false;
            const bytes = await response.arrayBuffer();
            const hash = Array.from(
              new Uint8Array(await crypto.subtle.digest("SHA-256", bytes)),
              (byte) => byte.toString(16).padStart(2, "0"),
            ).join("");
            return bytes.byteLength === image.bytes && hash === image.sha256;
          }),
        ),
      portraitEvidence.images,
    );
    expect(loaded).toEqual(Array(25).fill(true));
    await page.getByText("Bildnachweis", { exact: true }).click();
    await expect(credit).toContainText(portrait.photographer);
  });

test("Personenkategorie lässt sich aus der Filmreise direkt auswählen und vollständig sichern", async ({
  page,
}) => {
  await page.clock.install({ time: now });
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Losspielen" })).toBeEnabled();
  await openRoundSetup(page);
  await page
    .getByRole("checkbox", { name: "Schauspieler", exact: true })
    .check();
  await openRoundSetup(page);
  await expect(modePreparation(page, /Filmreise/)).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page.getByRole("button", { name: "Alle Genres abwählen" }).click();
  await expect(page.getByRole("button", { name: "Losspielen" })).toBeEnabled();
  await page.reload();
  await openRoundSetup(page);
  await expect(
    page.getByRole("checkbox", { name: "Schauspieler", exact: true }),
  ).toBeChecked();
  await expect(page.getByRole("button", { name: "Losspielen" })).toBeEnabled();
  await page.getByRole("button", { name: "Losspielen" }).click();
  await expect(page.locator(".question-genre")).toHaveText("Schauspieler");
});
