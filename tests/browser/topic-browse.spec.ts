import { test, expect, readStoredState } from "./fixtures";
import AxeBuilder from "@axe-core/playwright";
import { readFileSync } from "node:fs";
import { addPackages, packages } from "../../src/packages";
import { emptyState } from "../../src/model";
import { questionSourceOf } from "../../src/filters";
import { categories } from "../../src/categories";
import { workReferencesOf } from "../../src/workAttributes";
import { prepareQuestionWorks } from "../../src/prepareWorkReferences";

test("Themen öffnen passende Filmblöcke ohne Fortschrittsänderung ohne einzelne Filmauswahl", async ({
  page,
}) => {
  await page.clock.install({ time: new Date("2026-09-27T12:00:00+02:00") });
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Losspielen" })).toBeEnabled();
  await expect(page.locator(".topic-card")).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Wohin führt Deine Neugier?" }),
  ).toHaveCount(0);
  const state = emptyState();
  addPackages(
    state,
    packages.map((p) => ({
      filename: p.filename,
      text: readFileSync(`${p.path}`, "utf8"),
    })),
  );
  state.questions = prepareQuestionWorks(state.questions);
  const readState = () => readStoredState(page);
  const before = await readState();
  for (const [name, film] of [
    ["Horror", "Conjuring"],
    ["Classics", "Casablanca"],
    ["Arthouse", "Die fabelhafte Welt der Amélie"],
    ["Preisträger", "Nomadland"],
  ] as const) {
    await page.getByRole("button", { name: "Themen", exact: true }).click();
    const card = page
      .locator(".topic-card")
      .filter({ has: page.getByRole("heading", { name, exact: true }) });
    await card.getByRole("button", { name: "Filme & Reihen ansehen" }).click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      `${name}: Filme & Reihen`,
    );
    const qs = state.questions.filter((q) =>
      name === "Horror"
        ? workReferencesOf(q).some(
            (work) => work.type === "film" && work.genres.includes(name),
          )
        : name === "Preisträger"
          ? questionSourceOf(q) === "awards"
          : workReferencesOf(q).some((work) =>
              work.collections?.includes(name),
            ),
    );
    const expectedTopics = [...new Set(qs.map((q) => q.topic))].sort();
    expect(await page.locator(".topic-card h3").allTextContents()).toEqual(
      expectedTopics.slice(0, 40),
    );
    const filmCard = page
      .locator(".topic-card")
      .filter({ has: page.getByRole("heading", { name: film, exact: true }) });
    while (!(await filmCard.count())) {
      const first = page.locator(".topic-card h3").first();
      const previous = await first.textContent();
      await page.getByRole("button", { name: "Weitere Themen →" }).click();
      await expect(first).not.toHaveText(previous!);
    }
    await expect(filmCard.locator(".eyebrow")).toHaveText(
      `${new Set(qs.filter((q) => q.topic === film).map((q) => q.knowledgeId)).size} Filmfakten`,
    );
    expect(await readState()).toEqual(before);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    if (name === "Horror") {
      await page.screenshot({ path: "test-results/themen-filme-320.png" });
      expect(
        (
          await new AxeBuilder({ page })
            .withTags(["wcag2a", "wcag2aa"])
            .analyze()
        ).violations,
      ).toEqual([]);
      await page.getByRole("button", { name: "Zur Themenübersicht" }).click();
      const genreCount = new Set(
        state.questions.flatMap((q) =>
          workReferencesOf(q).flatMap((work) =>
            work.genres.map((genre) =>
              work.type === "series" ? `Serien · ${genre}` : genre,
            ),
          ),
        ),
      ).size;
      await expect(page.locator(".topic-card")).toHaveCount(
        genreCount + categories.length,
      );
      await card
        .getByRole("button", { name: "Filme & Reihen ansehen" })
        .click();
    }
    await expect(filmCard.getByRole("button")).toHaveCount(0);
  }
  await page.getByRole("button", { name: "Spielen", exact: true }).click();
  await expect(page.getByLabel("Thema wählen")).toHaveCount(0);
  const after = await readState();
  expect(after).toEqual(before);
  expect(after.events).toEqual(before.events);
  expect(after.favorites).toEqual(before.favorites);
});
