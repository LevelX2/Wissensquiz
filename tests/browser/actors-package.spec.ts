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
import tmdbLinks from "../../src/actorTmdbLinks.json" with { type: "json" };
import { actorTmdbUrl } from "../../src/actorTmdb";
import selectedTmdbPortraits from "../../src/actorFamiliarityTmdbPortraits.json" with { type: "json" };

test.beforeEach(async ({ page }) => {
  await page.route("**/actor-tmdb-portraits/*.json", (route) => {
    const id = Number(
      new URL(route.request().url()).pathname
        .split("/")
        .at(-1)!
        .replace(".json", ""),
    );
    const person = Object.values(tmdbLinks).find((p) => p.tmdbId === id)!;
    return route.fulfill({
      json: {
        tmdbId: id,
        name: person.name,
        profilePath:
          Object.values(selectedTmdbPortraits).find((p) => p.tmdbId === id)
            ?.profilePath ?? `/Portrait${id}.jpg`,
        checkedAt: "2026-10-01T00:00:00Z",
        expiresAt: "2027-03-01T00:00:00Z",
      },
    });
  });
  await page.route("https://image.tmdb.org/**", (route) =>
    route.fulfill({
      contentType: "image/jpeg",
      body: readFileSync(`public${portraits["ACTOR-001"].src}`),
    }),
  );
});

const now = new Date("2026-10-03T12:00:00+02:00");
async function writeState(page: Page, value: State) {
  await writeStoredState(page, value);
}

test("Schauspieler öffnet 428 Personen und spielt Expertenfragen mit eigenen Bekanntheitsgruppen mobil und nach Neuladen", async ({
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
  // The server serves at most 40 topics per page. Check the entire list
  // through its public pagination instead of requiring a catalogue download.
  const people = new Set<string>();
  for (let currentPage = 0; currentPage < 11; currentPage++) {
    await expect(page.locator(".topic-card")).toHaveCount(
      currentPage < 10 ? 40 : 28,
    );
    const headings = page.locator(".topic-card h3");
    for (const name of await headings.allTextContents()) people.add(name);
    const next = page.getByRole("button", {
      name: "Weitere Themen →",
      exact: true,
    });
    if (currentPage < 10) {
      const first = await headings.first().textContent();
      await next.click();
      await expect(headings.first()).not.toHaveText(first!);
    } else await expect(next).toHaveCount(0);
  }
  expect(people.size).toBe(428);
  expect(people.has("Tom Hanks")).toBe(true);
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
    name: "Bekanntheit",
    exact: true,
  });
  await expect(groups.getByRole("checkbox").first()).toBeEnabled();
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
  await expect(page.locator(".question-genre")).toHaveAccessibleName(
    "Schauspieler",
  );
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
    await expect(page.locator(".actor-name > span")).toHaveText("Schauspiel");
    await expect(page.locator(".actor-name > strong")).toHaveText(person);
    await expect(
      page.getByRole("img", { name: `Porträt von ${person}` }),
    ).toBeVisible();
    await expect(page.locator(".actor-portrait > a")).toHaveAttribute(
      "href",
      actorTmdbUrl(q)!,
    );
    await page.getByText("Etwas tiefer eintauchen", { exact: true }).click();
    await expect(page.locator(".explanation")).toContainText(q.context);
    await expect(page.locator(".film-data")).toHaveCount(1);
    await page.getByText("Filmdaten", { exact: true }).click();
    await expect(page.locator(".film-data")).toContainText(film);
  });

test.describe("TMDB-Porträts in Auflösung und Rückblick", () => {
  test.use({ acknowledgeIncidentalSuccess: true });
  for (const [personId, person, response] of [
    ["ACTOR-004", "Johnny Depp", "unknown"],
    ["ACTOR-005", "Robert De Niro", "wrong"],
  ] as const)
    test(`Porträt von ${person} erscheint nach ${response} und bleibt mit TMDB-Nachweis nach Neuladen verfügbar`, async ({
      page,
      context,
      browserName,
    }) => {
      await page.clock.install({ time: now });
      const portraitRequests: string[] = [];
      page.on("request", (r) => {
        if (r.url().includes("/actor-tmdb-portraits/"))
          portraitRequests.push(r.url());
      });
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
      expect(portraitRequests).toHaveLength(0);
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
      expect(portraitRequests).toHaveLength(1);
      await expect
        .poll(() =>
          image.evaluate((img) => (img as HTMLImageElement).naturalWidth),
        )
        .toBeGreaterThan(0);
      await page.screenshot({
        path: test.info().outputPath("portrait-closed.png"),
        fullPage: true,
      });
      const credit = page.locator(".actor-portrait figcaption");
      await expect(
        credit.getByRole("link", { name: "Porträt · TMDB ↗" }),
      ).toHaveAttribute("href", actorTmdbUrl(q)!);
      await expect(page.locator(".tmdb-portrait > a")).toHaveAttribute(
        "href",
        actorTmdbUrl(q)!,
      );
      await expect(page.locator(".tmdb-portrait > a")).toHaveAttribute(
        "target",
        "_blank",
      );
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      expect(
        (
          await new AxeBuilder({ page })
            .withTags(["wcag2a", "wcag2aa"])
            .analyze()
        ).violations,
      ).toEqual([]);
      await page.screenshot({
        path: test.info().outputPath("portrait.png"),
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
      await expect(credit).toContainText("Porträt · TMDB ↗");
      await page.getByRole("button", { name: "Runde abschließen" }).click();
      await page.locator(".review > details > summary").click();
      await expect(image).toBeVisible();
    });
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
  await expect(page.locator(".question-genre")).toHaveAccessibleName(
    "Schauspieler",
  );
});

test.describe("Neue Schauspieler mit ausgewählten Porträts", () => {
  test.use({ acknowledgeIncidentalSuccess: true });
  for (const [number, name, local] of [
    [1, "Peter Lorre", true],
    [21, "Heinz Erhardt", false],
  ] as const)
    test(`Neue Person ${name}: ausgewähltes Porträt, Quellen und TMDB-Link erst nach der Antwort`, async ({
      page,
    }) => {
      await page.clock.install({ time: new Date("2026-10-13T12:00:00Z") });
      await page.setViewportSize({ width: 320, height: 740 });
      await page.goto("/");
      await expect(
        page.getByRole("button", { name: "Losspielen" }),
      ).toBeEnabled();
      const state = emptyState();
      addPackages(
        state,
        packages.map((pkg) => ({
          filename: pkg.filename,
          text: readFileSync(`public${pkg.path}`, "utf8"),
        })),
      );
      const q = state.questions.find(
        (q) =>
          q.id ===
          `SCHAUSPIELER-BG-20261013-${String(number).padStart(3, "0")}-L1`,
      )!;
      const catalog = state.questions;
      state.questions = [q];
      startRound(
        state,
        { mode: "ueben", topic: "Schauspieler", difficulty: "leicht" },
        Date.parse("2026-10-13T12:00:00Z"),
      );
      state.questions = catalog;
      await writeState(page, state);
      await page.reload();
      await page.getByRole("button", { name: "Fortsetzen" }).click();
      await expect(page.locator(".actor-portrait")).toHaveCount(0);
      await page
        .getByRole("button", { name: "Keine Ahnung", exact: true })
        .click();
      const image = page.getByRole("img", { name: `Porträt von ${name}` });
      await expect(image).toBeVisible();
      const personId = q.metadata.person_id;
      const expected = local
        ? portraits[personId as keyof typeof portraits].src
        : selectedTmdbPortraits[personId as keyof typeof selectedTmdbPortraits]
            .src;
      await expect(image).toHaveAttribute("src", expected);
      await expect(page.locator(".actor-portrait > a")).toHaveAttribute(
        "href",
        actorTmdbUrl(q)!,
      );
      if (local) {
        await expect(page.locator(".tmdb-portrait")).toHaveCount(0);
        await page.getByText("Bildnachweis", { exact: true }).click();
        await expect(page.locator(".actor-portrait figcaption")).toContainText(
          "1930er/1940er",
        );
        await expect(page.locator(".actor-portrait figcaption")).toContainText(
          "Public domain",
        );
      } else {
        await expect(page.locator(".tmdb-portrait figcaption")).toContainText(
          "Porträt · TMDB",
        );
      }
      await page.getByText("Etwas tiefer eintauchen", { exact: true }).click();
      await expect(page.locator(".explanation")).toContainText(q.context);
      await expect(page.locator(".film-data")).toHaveCount(1);
      await page.getByRole("button", { name: "Pause & Startseite" }).click();
      await page.reload();
      await page.getByRole("button", { name: "Fortsetzen" }).click();
      await expect(image).toHaveAttribute("src", expected);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
    });
});
