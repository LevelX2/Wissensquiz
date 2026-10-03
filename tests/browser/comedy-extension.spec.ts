import { test, expect } from "./fixtures";
import { readFileSync } from "node:fs";
import { emptyState } from "../../src/model";
import { packages, addPackages } from "../../src/packages";
import { startRound } from "../../src/engine";
import facts from "../../src/filmFacts.json" with { type: "json" };

test("Komödie-Ergänzung: Regiehintergrund erst nach Antwort und offline verfügbar", async ({
  page,
  context,
}) => {
  await page.clock.install({ time: new Date("2026-09-29T12:00:00+02:00") });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Losspielen" })).toBeEnabled();
  await page.getByRole("button", { name: "Profil", exact: true }).click();
  await page.getByRole("button", { name: "Optionen" }).click();
  await expect(
    page.getByText("Die App-Dateien sind im Offline-Cache bestätigt.", {
      exact: false,
    }),
  ).toBeVisible();
  const state = emptyState();
  addPackages(
    state,
    packages.map((p) => ({
      filename: p.filename,
      text: readFileSync(`public${p.path}`, "utf8"),
    })),
  );
  const q = state.questions.find((q) => q.id === "FF-376-DIRECTOR")!;
  const pool = state.questions;
  state.questions = [q];
  startRound(
    state,
    { mode: "ueben", topic: q.topic, difficulty: "Alle Stufen" },
    Date.parse("2026-09-29T11:59:00+02:00"),
  );
  state.questions = pool;
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
  await context.setOffline(true);
  await page.reload();
  await page.getByRole("button", { name: "Fortsetzen" }).click();
  await expect(page.locator(".question-genre")).toHaveText("Komödie");
  await expect(page.locator(".film-data")).toHaveCount(0);
  await expect(page.getByText("Über die Regie", { exact: true })).toHaveCount(
    0,
  );
  await page.locator(".answer").filter({ hasText: "Adam McKay" }).click();
  await page.getByText("Etwas tiefer eintauchen", { exact: true }).click();
  const deepContext = page.locator(".explanation > details").filter({
    has: page.getByText("Etwas tiefer eintauchen", { exact: true }),
  });
  await expect(deepContext.locator(":scope > p").first()).toHaveText(
    facts.find((f) => f.id === "FF-376")!.directorContext!,
  );
  await expect(deepContext).not.toContainText("Gefragt ist die Regie");
  await expect(deepContext).not.toContainText("Originaltitel:");
  await expect(deepContext).not.toContainText("Erste Veröffentlichung:");
  await page.locator(".film-data > summary").click();
  await expect(page.locator(".film-data")).toContainText("Adam McKay");
  await expect(page.locator(".film-data")).toContainText("Teil 1");
  await expect(page.locator(".film-director-context")).not.toHaveAttribute(
    "open",
    "",
  );
  await page.locator(".film-director-context summary").click();
  await expect(page.locator(".film-director-context p")).toBeVisible();
  await page.screenshot({
    path: "test-results/komoedie-regiehintergrund-390.png",
  });
  await page.reload();
  await page.getByRole("button", { name: "Fortsetzen" }).click();
  await expect(page.locator(".explanation")).toBeVisible();
  await page.getByText("Etwas tiefer eintauchen", { exact: true }).click();
  await expect(deepContext).not.toContainText("Gefragt ist die Regie");
  await page.locator(".film-data > summary").click();
  await expect(page.locator(".film-data")).toContainText(
    "Anchorman: The Legend of Ron Burgundy",
  );
  const available = await page.evaluate(async () =>
    (await fetch("/komoedie-ergaenzung-fragen.csv")).text(),
  );
  expect(available).toContain("KOM-202609-P02-L-001");
});
