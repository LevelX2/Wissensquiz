import { test, expect, readStoredState } from "./fixtures";
import AxeBuilder from "@axe-core/playwright";
import { readFileSync } from "node:fs";
import { emptyState, type State } from "../../src/model";
import { addPackages, packages } from "../../src/packages";
import { answer, startRound } from "../../src/engine";
import { validateBackup } from "../../src/storage";

for (const kind of ["year", "director", "original"] as const) {
  test(`${kind}: Filmfrage ohne Lösungshinweis, gespeicherte Antworten und Offline-Fortsetzen`, async ({
    page,
    context,
  }) => {
    await page.clock.install({ time: new Date("2026-09-26T12:00:00+02:00") });
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
    const q = state.questions.find((q) =>
      kind === "original"
        ? q.metadata.film_title_original === "Star Trek: First Contact" &&
          !q.metadata.fact_kind
        : q.id === `FF-001-${kind === "year" ? "YEAR" : "DIRECTOR"}`,
    )!;
    const pool = state.questions;
    state.questions = [q];
    state.settings.allDifficulties = true;
    const round = startRound(
      state,
      { mode: "ueben", topic: q.topic, difficulty: "Alle Stufen" },
      Date.parse("2026-09-26T11:59:00+02:00"),
    );
    state.questions = pool;
    const snapshot = structuredClone(round.questions[0]);
    await page.evaluate(
      (value) =>
        new Promise<void>((resolve, reject) => {
          const req = indexedDB.open("wissensquiz");
          req.onerror = () => reject(req.error);
          req.onsuccess = () => {
            const db = req.result,
              tx = db.transaction("state", "readwrite");
            tx.objectStore("state").put(value, "current");
            tx.oncomplete = () => {
              db.close();
              resolve();
            };
            tx.onerror = () => reject(tx.error);
          };
        }),
      state,
    );
    await page.reload();
    await page.getByRole("button", { name: "Fortsetzen" }).click();
    const heading = page.locator(".question-card h1");
    if (kind === "year") await expect(heading).not.toContainText("1988");
    else if (kind === "director")
      await expect(heading).not.toContainText("John McTiernan");
    await expect(page.locator(".question-genre")).toHaveText(
      kind === "original" ? "Sci-Fi" : "Action",
    );
    await expect(page.locator(".film-data")).toHaveCount(0);
    const before = await page.locator(".answer").allTextContents();
    expect(
      (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze())
        .violations,
    ).toEqual([]);
    await page.screenshot({ path: `test-results/film-${kind}-320.png` });
    await page.getByRole("button", { name: "Pause & Startseite" }).click();
    await page.getByRole("button", { name: "Profil", exact: true }).click();
    await page.getByRole("button", { name: "Optionen" }).click();
    await expect(
      page.getByText("Die App-Dateien sind im Offline-Cache bestätigt.", {
        exact: false,
      }),
    ).toBeVisible();
    await context.setOffline(true);
    await page.reload();
    await page.getByRole("button", { name: "Fortsetzen" }).click();
    expect(await page.locator(".answer").allTextContents()).toEqual(before);
    const correct = snapshot.answers.find((a) => a.id === snapshot.correctId)!;
    await page.locator(".answer").filter({ hasText: correct.text }).click();
    await expect(page.locator(".feedback")).toBeVisible();
    if (kind === "director") {
      await page.getByText("Etwas tiefer eintauchen", { exact: true }).click();
      await expect(page.locator(".explanation")).toContainText("Predator");
      await expect(page.locator(".explanation")).not.toContainText(
        "Gefragt ist die Regie dieses Films",
      );
      await expect(
        page.getByRole("link", { name: /Regiequelle:/ }),
      ).toBeVisible();
    }
    const film = page.locator(".film-data");
    await expect(film).not.toHaveAttribute("open", "");
    await film.locator(":scope > summary").click();
    await expect(film).toContainText(snapshot.metadata.film_title_original);
    await expect(film).toContainText(snapshot.metadata.film_year);
    await expect(film).toContainText("USA");
    await expect(film).toContainText(
      kind === "original" ? "Jonathan Frakes" : "John McTiernan",
    );
    await expect(film).toContainText(kind === "original" ? "Teil 8" : "Teil 1");
    if (kind === "original")
      await expect(film).toContainText("2. Film mit der Next-Generation-Crew");
    await film.screenshot({ path: `test-results/filmdaten-${kind}-320.png` });
    await film.locator(":scope > summary").click();
    await expect(page.locator(".question-history")).toContainText("1 richtig");
    await expect(
      page.getByRole("button", { name: "Runde abschließen" }),
    ).toBeInViewport();
    await page.getByRole("button", { name: "Runde abschließen" }).click();
    const saved = await readStoredState(page);
    expect(validateBackup(saved).rounds.at(-1)?.questions[0]).toEqual(snapshot);
    expect(saved.events.at(-1)?.correct).toBe(true);
    expect(saved.learning[q.knowledgeId].seen).toBe(1);
  });
}

test("Fortschrittsbalken unterscheiden richtig, falsch, ohne Antwort, aktuell und offen auf 320 Pixeln", async ({
  page,
}) => {
  await page.clock.install({ time: new Date("2026-09-26T12:00:00+02:00") });
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Losspielen" })).toBeEnabled();
  const state = emptyState();
  addPackages(
    state,
    packages.map((p) => ({
      filename: p.filename,
      text: readFileSync(`public${p.path}`, "utf8"),
    })),
  );
  const now = Date.parse("2026-09-26T11:59:00+02:00");
  const round = startRound(
    state,
    { mode: "ueben", topic: "Alle Themen", difficulty: "Alle Stufen" },
    now,
  );
  round.questions = [
    ...new Map(
      state.questions
        .filter((q) => !q.metadata.fact_kind)
        .map((q) => [q.knowledgeId, q]),
    ).values(),
  ].slice(0, 10);
  round.order = round.questions.map((q) => q.answers.map((a) => a.id));
  answer(
    state,
    round.id,
    round.questions[0].id,
    round.questions[0].correctId,
    0,
    now + 1000,
  );
  answer(
    state,
    round.id,
    round.questions[1].id,
    round.questions[1].answers.find(
      (a) => a.id !== round.questions[1].correctId,
    )!.id,
    0,
    now + 2000,
  );
  answer(state, round.id, round.questions[2].id, null, 30000, now + 33000);
  await page.evaluate(
    (value) =>
      new Promise<void>((resolve, reject) => {
        const req = indexedDB.open("wissensquiz");
        req.onerror = () => reject(req.error);
        req.onsuccess = () => {
          const db = req.result,
            tx = db.transaction("state", "readwrite");
          tx.objectStore("state").put(value, "current");
          tx.oncomplete = () => {
            db.close();
            resolve();
          };
          tx.onerror = () => reject(tx.error);
        };
      }),
    state,
  );
  await page.reload();
  await page.getByRole("button", { name: "Fortsetzen" }).click();
  const progress = page.getByRole("group", { name: "Fragenfortschritt" });
  await expect(
    progress.getByRole("img", {
      name: "Frage 3: ohne Antwort, aktuell",
      exact: true,
    }),
  ).toHaveText("–");
  await page.getByRole("button", { name: "Nächste Frage" }).click();
  await expect(progress.locator(".progress-step")).toHaveCount(10);
  const right = progress.getByRole("img", {
    name: "Frage 1: richtig beantwortet",
    exact: true,
  });
  await expect(right).toHaveText("✓");
  await expect(right).toHaveCSS("background-color", "rgb(33, 107, 69)");
  const wrong = progress.getByRole("img", {
    name: "Frage 2: falsch beantwortet",
    exact: true,
  });
  await expect(wrong).toHaveText("×");
  await expect(wrong).toHaveCSS("background-color", "rgb(176, 51, 51)");
  await expect(
    progress.getByRole("img", { name: "Frage 3: ohne Antwort", exact: true }),
  ).toHaveText("–");
  const current = progress.getByRole("img", {
    name: "Frage 4: noch offen, aktuell",
    exact: true,
  });
  await expect(current).toHaveClass(/current/);
  await expect(
    progress.getByRole("img", { name: "Frage 5: noch offen", exact: true }),
  ).toHaveCSS("background-color", "rgb(214, 221, 217)");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(
    (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze())
      .violations,
  ).toEqual([]);
  await page.screenshot({ path: "test-results/fragenfortschritt-320.png" });
  const correct = round.questions[3].answers.find(
    (a) => a.id === round.questions[3].correctId,
  )!;
  await page.locator(".answer").filter({ hasText: correct.text }).click();
  await expect(
    progress.getByRole("img", {
      name: "Frage 4: richtig beantwortet, aktuell",
      exact: true,
    }),
  ).toHaveClass(/correct current/);
});
