import {
  modePreparation,
  openRoundSetup,
  test,
  expect,
  accountBackend,
  readStoredState,
} from "./fixtures";
import { RankedSession } from "../../src/rankedRuns";
import type { Question } from "../../src/model";
import AxeBuilder from "@axe-core/playwright";

test("Leere Online-Highscores und Rekordauswahl bleiben erreichbar; angemeldete Konten sehen die Duellliste", async ({
  page,
}) => {
  await page.clock.install({ time: new Date("2026-10-02T12:00:00+02:00") });
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Losspielen" })).toBeEnabled();
  await page.getByRole("button", { name: "Highscores", exact: true }).click();
  await expect(
    page
      .getByRole("group", { name: "Highscore-Bereiche", exact: true })
      .getByRole("button"),
  ).toHaveCount(3);
  await expect(
    page.getByText("Noch keine abgeschlossenen Läufe in dieser Auswahl."),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Spielen", exact: true })
    .press("Enter");
  await expect(page.locator(".round-setup")).toBeVisible();
  await openRoundSetup(page);
  await page.getByRole("button", { name: "Auf Zeit", exact: true }).click();
  await modePreparation(page, /^10 Fragen 30 Sekunden/).click();
  await openRoundSetup(page);
  await expect(modePreparation(page, /^10 Fragen 30 Sekunden/)).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(page.locator(".question-card")).toHaveCount(0);
  await page.reload();
  await openRoundSetup(page);
  await expect(modePreparation(page, /^10 Fragen 30 Sekunden/)).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page.getByRole("button", { name: "Highscores", exact: true }).click();
  await page
    .getByRole("button", { name: "Duelle", exact: true })
    .press("Enter");
  expect(
    (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze())
      .violations,
  ).toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await expect(
    page.getByText("Noch keine abgeschlossenen Duelle in dieser Auswahl."),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Im Profil anmelden" }),
  ).toHaveCount(0);
});

test("Genre und Schwierigkeit bleiben unabhängig einstellbar und über Neuladen erhalten", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Losspielen" })).toBeEnabled();
  await page.getByRole("button", { name: "Profil", exact: true }).click();
  await page.getByRole("button", { name: "Optionen" }).click();
  await page.getByLabel("Genre anzeigen", { exact: true }).click();
  await expect(
    page.getByLabel("Genre anzeigen", { exact: true }),
  ).not.toBeChecked();
  await page.reload();
  await page.getByRole("button", { name: "Losspielen" }).click();
  await expect(page.locator(".question-genre")).toHaveCount(0);
  await expect(page.locator(".question-difficulty")).toBeVisible();
  await page.getByRole("button", { name: "Pause & Startseite" }).click();
  await page.getByRole("button", { name: "Profil", exact: true }).click();
  await page.getByRole("button", { name: "Optionen" }).click();
  await page.getByLabel("Genre anzeigen", { exact: true }).click();
  await expect(
    page.getByLabel("Genre anzeigen", { exact: true }),
  ).toBeChecked();
  await page.getByLabel("Schwierigkeit anzeigen", { exact: true }).click();
  await expect(
    page.getByLabel("Schwierigkeit anzeigen", { exact: true }),
  ).not.toBeChecked();
  await page.reload();
  await page.getByRole("button", { name: "Fortsetzen" }).click();
  await expect(page.locator(".question-genre")).toBeVisible();
  await expect(page.locator(".question-difficulty")).toHaveCount(0);
  await page.locator(".answer").first().click();
  await expect(page.locator(".feedback")).toBeVisible();
  await expect(page.locator(".question-genre")).toBeVisible();
  await expect(page.locator(".question-difficulty")).toHaveCount(0);
});

test("Alle abgeschlossenen Ergebnisse sind filterbar und nach Neuladen erhalten, ohne späteren Fragenrückblick", async ({
  page,
}) => {
  const now = new Date("2026-10-12T12:00:00+02:00");
  await page.clock.install({ time: now });
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Losspielen" })).toBeEnabled();
  const backend = accountBackend(page);
  await backend.ensureRanked();
  for (const [i, genre] of ["Horror", "Horror", "Fantasy"].entries()) {
    const at = now.getTime() - 3600_000 + i * 100_000;
    backend.api.clockAt(at);
    const session = new RankedSession(backend.api, backend.release.hash);
    await session.start({
      mode: "rekord",
      preset: "genre",
      genre,
      solutionDisplay: "round",
    });
    for (let j = 0; j < 10; j++) {
      const q = (
        await backend.admin(() =>
          backend.db.query<{ question: Question }>(
            "select question from quiz_ranked_internal.questions where run_id=$1 and index=$2",
            [session.run!.id, session.current!.index],
          ),
        )
      ).rows[0].question;
      backend.api.clockAt(at + 3000 + j * 3000);
      await session.answer(
        i === 0 ? q.answers.find((a) => a.id !== q.correctId)!.id : q.correctId,
      );
      if (j < 9) await session.next();
    }
    expect(session.run!.status).toBe("completed");
  }
  await page.reload();
  await page.getByRole("button", { name: "Highscores", exact: true }).click();
  const category = page.getByLabel("Vergleichskategorie", { exact: true });
  await expect(category.locator("option")).toHaveCount(2);
  await category.selectOption({
    label: (await category.locator("option").allTextContents()).find((o) =>
      o.includes("Horror"),
    )!,
  });
  await expect(page.locator(".leaderboard-entry")).toHaveCount(2);
  await expect(page.locator(".leaderboard-entry").first()).toContainText(
    "10/10 richtig",
  );
  await expect(page.locator(".leaderboard-entry").last()).toContainText(
    "0 Punkte · 0/10 richtig",
  );
  await page.setViewportSize({ width: 320, height: 740 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(
    (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze())
      .violations,
  ).toEqual([]);
  await expect(page.getByRole("button", { name: "Spiel ansehen" })).toHaveCount(
    0,
  );
  await page.reload();
  await page.getByRole("button", { name: "Highscores", exact: true }).click();
  await expect(category.locator("option")).toHaveCount(2);
  await category.selectOption({
    label: (await category.locator("option").allTextContents()).find((o) =>
      o.includes("Fantasy"),
    )!,
  });
  await expect(page.locator(".leaderboard-entry")).toHaveCount(1);
  expect(
    (await readStoredState(page)).rounds.filter(
      (r) => r.status === "completed",
    ),
  ).toHaveLength(3);
});
