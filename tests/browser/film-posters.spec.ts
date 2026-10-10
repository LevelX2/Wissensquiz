import {
  test,
  expect,
  accountBackend,
  writeStoredState,
  type Page,
} from "./fixtures";
import { emptyState } from "../../src/model";
import { startRound } from "../../src/engine";
import AxeBuilder from "@axe-core/playwright";

test("Bildquellen zeigen offizielles TMDB-Logo und Anbieterhinweis", async ({
  page,
}) => {
  await page.clock.install({ time: new Date("2026-10-10T12:00:00Z") });
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Losspielen" })).toBeEnabled();
  await page
    .locator("footer")
    .getByRole("button", { name: "So funktioniert’s", exact: true })
    .click();
  await expect(page.locator(".image-credits img")).toBeVisible();
  await expect
    .poll(() =>
      page
        .locator(".image-credits img")
        .evaluate((image) =>
          image instanceof HTMLImageElement ? image.naturalWidth : 0,
        ),
    )
    .toBeGreaterThan(100);
  await expect(page.locator(".image-credits")).toContainText(
    "This website uses TMDB and the TMDB APIs but is not endorsed, certified, or otherwise approved by TMDB.",
  );
  expect(
    (
      await new AxeBuilder({ page })
        .include(".image-credits")
        .withTags(["wcag2a", "wcag2aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
});

async function prepare(
  page: Page,
  genre = "Science-Fiction",
  deferred = false,
  failImage = false,
) {
  await page.clock.install({ time: new Date("2026-10-10T12:00:00Z") });
  const requests = { manifest: 0, image: 0 };
  const pool = accountBackend(page).release.questions;
  let q = pool.find(
    (question) =>
      question.domain === "Film" &&
      question.metadata.subdomain === genre &&
      (genre !== "Science-Fiction" ||
        (question.metadata.film_title_original === "Dune" &&
          question.metadata.film_year === "2021")),
  )!;
  await page.route("**/film-posters.json", (route) => {
    requests.manifest++;
    return route.fulfill({
      json: {
        checkedAt: "2026-10-10",
        expiresAt: "2027-03-10",
        films: {
          [`${q.metadata.film_title_original}|${q.metadata.film_year}`]: {
            title: q.metadata.film_title_de,
            originalTitle: q.metadata.film_title_original,
            year: Number(q.metadata.film_year),
            tmdbId: 123,
            posterPath: "/Example.png",
          },
        },
      },
    });
  });
  await page.route("https://image.tmdb.org/**", (route) => {
    requests.image++;
    return failImage
      ? route.abort()
      : route.fulfill({
          contentType: "image/png",
          body: Buffer.from(
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aX1sAAAAASUVORK5CYII=",
            "base64",
          ),
        });
  });
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Losspielen" })).toBeEnabled();
  const qs = deferred
    ? [
        q,
        pool.find(
          (other) =>
            other.metadata.film_title_original ===
              q.metadata.film_title_original &&
            other.metadata.film_year === q.metadata.film_year &&
            other.knowledgeId !== q.knowledgeId,
        )!,
      ]
    : [q];
  const state = emptyState(qs);
  state.settings.sound = false;
  state.settings.answerRevealMs = 500;
  state.settings.solutionDisplay = deferred ? "round" : "question";
  const round = startRound(state, {
    mode: "ueben",
    topic: q.topic,
    difficulty: "Alle Stufen",
  });
  q = round.questions[0];
  state.questions = pool;
  await writeStoredState(page, state);
  await page.reload();
  await page.getByRole("button", { name: "Fortsetzen" }).click();
  await expect(page.locator(".question-card h1")).toBeVisible();
  expect(requests).toEqual({ manifest: 0, image: 0 });
  await expect(page.locator(".film-poster")).toHaveCount(0);
  return { q, requests, questions: round.questions };
}
async function answer(page: Page, text: string) {
  await page.locator(".answer").filter({ hasText: text }).click();
}
test("SciFi-Poster erst nach der Antwort, auch nach Neuladen und im Rückblick", async ({
  page,
}, info) => {
  const { q, requests } = await prepare(page);
  await answer(page, q.answers.find((a) => a.id === q.correctId)!.text);
  await expect(page.locator(".film-poster img")).toBeVisible();
  await expect(page.locator(".question-new")).toHaveText("Neu");
  await expect(page.locator(".feedback-outcome")).toContainText("Richtig");
  expect(
    await page
      .locator(".feedback-outcome")
      .evaluate((node) => parseFloat(getComputedStyle(node).fontSize)),
  ).toBeLessThanOrEqual(14);
  await expect(page.locator(".explanation")).not.toContainText(
    "DIE IDEE DAHINTER",
  );
  expect(
    await page.locator(".film-poster").evaluate((poster) => {
      const explanation = poster.parentElement?.querySelector(
        ":scope > p:not(.actor-name)",
      );
      return (
        !!explanation &&
        !!(
          explanation.compareDocumentPosition(poster) &
          Node.DOCUMENT_POSITION_FOLLOWING
        )
      );
    }),
  ).toBe(true);
  await expect(page.locator(".film-poster img")).toHaveAttribute(
    "src",
    "https://image.tmdb.org/t/p/w342/Example.png",
  );
  await expect(page.locator(".film-poster a")).toHaveAttribute(
    "href",
    "https://www.themoviedb.org/movie/123",
  );
  expect(requests.manifest).toBe(1);
  await page.reload();
  await page.getByRole("button", { name: "Fortsetzen" }).click();
  await expect(page.locator(".film-poster img")).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page
    .locator(".feedback")
    .evaluate((node) =>
      Promise.all(
        node
          .getAnimations({ subtree: true })
          .map((animation) => animation.finished),
      ),
    );
  expect(
    (
      await new AxeBuilder({ page })
        .include(".film-poster")
        .withTags(["wcag2a", "wcag2aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
  await page
    .locator(".explanation")
    .screenshot({ path: `test-results/poster-${info.project.name}.png` });
  await page.getByRole("button", { name: "Runde abschließen" }).click();
  await page.locator(".review > details > summary").click();
  await expect(page.locator(".film-poster img")).toBeVisible();
});
test("Gesammelte Lösungen laden das Poster erst im Rundenrückblick", async ({
  page,
}) => {
  const { q, requests, questions } = await prepare(
    page,
    "Science-Fiction",
    true,
  );
  await answer(page, q.answers.find((a) => a.id === q.correctId)!.text);
  await expect(page.locator("h1[data-question-id]")).toHaveAttribute(
    "data-question-id",
    questions[1].id,
  );
  expect(requests).toEqual({ manifest: 0, image: 0 });
  await answer(
    page,
    questions[1].answers.find((a) => a.id === questions[1].correctId)!.text,
  );
  await page.locator(".review > details > summary").first().click();
  await expect(page.locator(".film-poster img").first()).toBeVisible();
  await expect(page.locator(".question-card")).toHaveCount(0);
});
test("Action-Filme zeigen ebenfalls erst nach der Antwort ihr verlinktes Poster", async ({
  page,
}) => {
  const { q, requests } = await prepare(page, "Action");
  await answer(page, q.answers.find((a) => a.id === q.correctId)!.text);
  await expect(page.locator(".film-poster img")).toBeVisible();
  await expect(page.locator(".film-poster a")).toHaveAttribute(
    "href",
    "https://www.themoviedb.org/movie/123",
  );
  expect(requests).toEqual({ manifest: 1, image: 1 });
});
test("Nicht erreichbares Cover verhindert Erklärung und Weiterspielen nicht", async ({
  page,
}) => {
  const { q, requests } = await prepare(page, "Science-Fiction", false, true);
  await answer(page, q.answers.find((a) => a.id === q.correctId)!.text);
  await expect.poll(() => requests.image).toBe(1);
  await expect(page.locator(".film-poster")).toHaveCount(0);
  await expect(page.locator(".explanation")).toContainText(q.explanation);
  await page.getByRole("button", { name: "Runde abschließen" }).click();
  await expect(page.locator(".question-card")).toHaveCount(0);
});
