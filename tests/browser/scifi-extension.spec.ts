import { writeStoredState } from "./fixtures";
import { test, expect } from "./fixtures";
import { readFileSync } from "node:fs";
import { emptyState } from "../../src/model";
import { packages, addPackages } from "../../src/packages";
import { startRound } from "../../src/engine";
import facts from "../../src/filmFacts.json" with { type: "json" };

test("Sci-Fi-Ergänzung: Regiehintergrund erst nach Antwort und nach Neuladen verfügbar", async ({
  page,
  context,
}) => {
  await page.clock.install({ time: new Date("2026-09-29T12:00:00+02:00") });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Losspielen" })).toBeEnabled();
  await page.getByRole("button", { name: "Profil", exact: true }).click();
  await page.getByRole("button", { name: "Optionen" }).click();
  const state = emptyState();
  addPackages(
    state,
    packages.map((p) => ({
      filename: p.filename,
      text: readFileSync(`public${p.path}`, "utf8"),
    })),
  );
  const q = state.questions.find((q) => q.id === "FF-326-DIRECTOR")!;
  const pool = state.questions;
  state.questions = [q];
  startRound(
    state,
    { mode: "ueben", topic: q.topic, difficulty: "Alle Stufen" },
    Date.parse("2026-09-29T11:59:00+02:00"),
  );
  state.questions = pool;
  await writeStoredState(page, state);
  await page.reload();
  await page.getByRole("button", { name: "Fortsetzen" }).click();
  await expect(page.locator(".question-genre")).toHaveAccessibleName("Sci-Fi");
  await expect(page.locator(".film-data")).toHaveCount(0);
  await expect(page.getByText("Über die Regie", { exact: true })).toHaveCount(
    0,
  );
  await page.locator(".answer").filter({ hasText: "Stanley Kubrick" }).click();
  await page.getByText("Etwas tiefer eintauchen", { exact: true }).click();
  const deepContext = page.locator(".explanation > details").filter({
    has: page.getByText("Etwas tiefer eintauchen", { exact: true }),
  });
  await expect(deepContext.locator(":scope > p").first()).toHaveText(
    facts.find((f) => f.id === "FF-326")!.directorContext!,
  );
  await expect(deepContext).not.toContainText("Gefragt ist die Regie");
  await expect(deepContext).not.toContainText("Originaltitel:");
  await expect(deepContext).not.toContainText("Erste Veröffentlichung:");
  await page.locator(".film-data > summary").click();
  await expect(page.locator(".film-data")).toContainText("Stanley Kubrick");
  await expect(page.locator(".film-data")).toContainText("Teil 1");
  await expect(page.locator(".film-director-context")).not.toHaveAttribute(
    "open",
    "",
  );
  await page.locator(".film-director-context summary").click();
  await expect(page.locator(".film-director-context p")).toBeVisible();
  await page.screenshot({
    path: "test-results/scifi-regiehintergrund-390.png",
  });
  await page.reload();
  await page.getByRole("button", { name: "Fortsetzen" }).click();
  await expect(page.locator(".explanation")).toBeVisible();
  await page.getByText("Etwas tiefer eintauchen", { exact: true }).click();
  await expect(deepContext).not.toContainText("Gefragt ist die Regie");
  await page.locator(".film-data > summary").click();
  await expect(page.locator(".film-data")).toContainText(
    "2001: A Space Odyssey",
  );
  const available = await page.evaluate(async () =>
    (await fetch("/scifi-ergaenzung-fragen.csv")).text(),
  );
  expect(available).toContain("SF-202609-P02-L-001");
});
