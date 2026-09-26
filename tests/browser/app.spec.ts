import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { importCsv } from "../../src/importer";
const imported = importCsv(readFileSync("public/fragen.csv", "utf8")).questions;
async function launch(page: Page) {
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Losspielen" })).toBeEnabled();
}
async function answerCurrent(page: Page, correct = true) {
  const prompt = await page.locator(".question-card h1").innerText();
  const q = imported.find((q) => q.question === prompt)!;
  const a = q.answers.find((a) =>
    correct ? a.id === q.correctId : a.id !== q.correctId,
  )!;
  const button = page.getByRole("button", {
    name: new RegExp(a.text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
  });
  await expect(button).toBeEnabled();
  await button.click();
  await expect(page.locator(".feedback")).toBeVisible();
  return q;
}
test("Einstiegsrunde, Feedback, Meldung, Sammlung und Wiederherstellung", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await launch(page);
  await page.screenshot({
    path: "test-results/desktop-home.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Losspielen" }).click();
  await expect(page.locator(".round-progress")).toContainText("FRAGE 1 VON 5");
  await answerCurrent(page, true);
  await page.getByRole("button", { name: "War geraten", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Als geraten markiert" }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Frage melden" }).click();
  await page
    .getByLabel("Was ist Dir aufgefallen?")
    .fill("Testmeldung im isolierten Browserprofil");
  await page.getByRole("button", { name: "Meldung lokal speichern" }).click();
  await expect(
    page.getByText("Lokal gespeichert. Nicht versendet."),
  ).toBeVisible();
  await page.getByRole("button", { name: "Nächste Frage" }).click();
  await answerCurrent(page, false);
  await expect(
    page.getByText("Die richtige Antwort:", { exact: false }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Nächste Frage" }).click();
  for (let i = 2; i < 5; i++) {
    await answerCurrent(page, true);
    await page
      .getByRole("button", {
        name: i === 4 ? "Runde abschließen" : "Nächste Frage",
      })
      .click();
  }
  await expect(
    page.getByRole("heading", { name: "Eine Runde weiter." }),
  ).toBeVisible();
  await expect(page.locator(".result-score")).toContainText("4 / 5");
  await page.screenshot({ path: "test-results/result.png", fullPage: true });
  await page.reload();
  await expect(page.getByText("10 Erfahrung · Level 1")).toBeVisible();
  await page
    .getByRole("button", { name: "Meine Sammlung", exact: true })
    .click();
  await expect(page.locator(".history").first()).toContainText("4/5 richtig");
  await page
    .getByRole("button", { name: /Als Favorit markieren: Alien/ })
    .click();
  await expect(
    page.getByRole("button", { name: "Favorit entfernen: Alien" }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Einstellungen & Daten" }).click();
  await expect(
    page.getByText("180 Fragen · 150 Wissensziele · 0 Demo-Fragen"),
  ).toBeVisible();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Alles als JSON sichern" }).click();
  const file = await download;
  await file.saveAs("test-results/backup.json");
  await page
    .getByLabel("Sicherung auswählen")
    .setInputFiles("test-results/backup.json");
  await page
    .getByRole("button", { name: "Lokalen Stand durch Sicherung ersetzen" })
    .click();
  await expect(
    page.getByText("Sicherung vollständig wiederhergestellt."),
  ).toBeVisible();
  await page.getByLabel("CSV auswählen").setInputFiles("public/fragen.csv");
  await expect(page.locator(".import-preview")).toContainText(
    "180 vorhandene IDs übersprungen",
  );
  await expect(
    page.getByRole("button", { name: "Gültige Fragen importieren" }),
  ).toBeDisabled();
  expect(errors).toEqual([]);
});
test("Mobile Bedienung bei 390 und 320 Pixeln ohne horizontalen Überlauf", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await launch(page);
  await page.screenshot({
    path: "test-results/mobile-home.png",
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "Losspielen" }).click();
  await expect(page.locator(".answer").first()).toBeEnabled();
  await page.screenshot({
    path: "test-results/mobile-question.png",
    fullPage: true,
  });
  await answerCurrent(page, false);
  await expect(page.locator(".specific-feedback")).toBeVisible();
  await page.screenshot({
    path: "test-results/mobile-feedback.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 320, height: 740 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  for (const b of await page.locator(".answer").all()) {
    const box = await b.boundingBox();
    expect(box!.height).toBeGreaterThanOrEqual(44);
    expect(box!.x + box!.width).toBeLessThanOrEqual(320);
  }
  await page.getByRole("button", { name: "Pause & Startseite" }).click();
  await expect(page.getByRole("button", { name: "Fortsetzen" })).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: "Fortsetzen" }).click();
  await expect(page.locator(".feedback")).toBeVisible();
});
test("Rekordtimer läuft ab, Erklärung hält an, Neuladen bricht ab", async ({
  page,
}) => {
  await page.clock.install();
  await launch(page);
  await page.getByRole("button", { name: "Rekordrunde", exact: false }).click();
  await page.getByRole("button", { name: "Losspielen" }).click();
  await page.clock.runFor(100);
  await expect(page.locator(".answer").first()).toBeEnabled();
  await page.clock.fastForward(31_000);
  await expect(
    page.getByRole("heading", { name: "Die Zeit ist um." }),
  ).toBeVisible();
  await expect(page.getByText("+0 Punkte")).toBeVisible();
  await page.clock.fastForward(60000);
  await expect(page.locator(".round-progress")).toContainText("FRAGE 1 VON 5");
  await page.getByRole("button", { name: "Nächste Frage" }).click();
  await page.clock.runFor(100);
  await page.reload();
  await expect(page.getByRole("button", { name: "Losspielen" })).toBeEnabled();
  await expect(page.getByRole("button", { name: "Fortsetzen" })).toHaveCount(0);
});
test("Offline-Neuladen mit gespeichertem Paket und Spielfortschritt", async ({
  page,
  context,
}) => {
  await launch(page);
  await expect(page.getByText("Paket bereit", { exact: false })).toBeVisible({
    timeout: 20000,
  });
  await page.getByRole("button", { name: "Losspielen" }).click();
  await answerCurrent(page, true);
  await page.getByRole("button", { name: "Pause & Startseite" }).click();
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator(".connection")).toContainText("Offline");
  await page.getByRole("button", { name: "Fortsetzen" }).click();
  await expect(page.locator(".feedback")).toBeVisible();
  await page.getByRole("button", { name: "Nächste Frage" }).click();
  await answerCurrent(page, true);
  await context.setOffline(false);
});
test("Ungültige Sicherung, gültiger Zusatzimport und ausdrückliches Zurücksetzen", async ({
  page,
}) => {
  await launch(page);
  await page.getByRole("button", { name: "Einstellungen & Daten" }).click();
  await page.getByLabel("Sicherung auswählen").setInputFiles({
    name: "kaputt.json",
    mimeType: "application/json",
    buffer: Buffer.from('{"schemaVersion":999}'),
  });
  await expect(
    page.getByText("Datei abgelehnt:", { exact: false }),
  ).toBeVisible();
  await page
    .getByLabel("CSV auswählen")
    .setInputFiles("public/demo-fragen.csv");
  await expect(page.locator(".import-preview")).toContainText("12 gültig");
  await page
    .getByRole("button", { name: "Gültige Fragen importieren" })
    .click();
  await expect(
    page.getByText("192 Fragen · 162 Wissensziele · 12 Demo-Fragen"),
  ).toBeVisible();
  await expect(
    page.getByRole("button", {
      name: "Fortschritt jetzt endgültig zurücksetzen",
    }),
  ).toBeDisabled();
  await page.getByLabel("Zum Bestätigen LÖSCHEN eingeben").fill("LÖSCHEN");
  await page
    .getByRole("button", { name: "Fortschritt jetzt endgültig zurücksetzen" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Neugier? Film ab." }),
  ).toBeVisible();
});
