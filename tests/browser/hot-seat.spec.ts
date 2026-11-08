import {
  test,
  expect,
  accountBackend,
  readStoredState,
  type Page,
} from "./fixtures";
import AxeBuilder from "@axe-core/playwright";
import type { Question } from "../../src/model";

async function open(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: /Gemeinsam spielen/ }).click();
  await expect(
    page.getByRole("button", { name: "Neue Partie einrichten" }),
  ).toBeVisible();
}
async function setup(page: Page) {
  await open(page);
  await page.getByRole("button", { name: "Neue Partie einrichten" }).click();
  await page.getByLabel("Name 1", { exact: true }).fill("Anna");
  await page.getByLabel("Name 2", { exact: true }).fill("Ben");
  await page.getByText(/Partie anpassen ·/).click();
  await page
    .getByRole("combobox", { name: "Partielänge", exact: true })
    .selectOption("3");
  await expect(
    page.getByRole("button", { name: "Partie starten" }),
  ).toBeEnabled();
}
async function startQuestion(page: Page) {
  const interval = page.getByRole("button", {
    name: "Nächsten Durchgang starten",
  });
  await expect(
    page.getByRole("button", { name: "Frage starten" }).or(interval),
  ).toBeVisible();
  if (await interval.isVisible()) await interval.click();
  await page.getByRole("button", { name: "Frage starten" }).click();
  await expect(page.locator(".hot-question [data-question-id]")).toBeVisible();
}
async function choose(page: Page, right = true) {
  const backend = accountBackend(page);
  const q = await backend.admin(
    async () =>
      (
        await backend.db.query<{ question: Question }>(
          "select q.question from quiz_hot_seat_internal.questions q join quiz_hot_seat_internal.parties p on p.id=q.party_id and p.item_index=q.position where p.status='active'",
        )
      ).rows[0].question,
  );
  const id = right
    ? q.correctId
    : q.answers.find((a) => a.id !== q.correctId)!.id;
  await page.locator(`.hot-answer[data-answer-id="${id}"]`).click();
}

test("Quizabend: vollständige Partie, Ergebnis und Revanche ohne Lernfortschritt", async ({
  page,
}, info) => {
  await setup(page);
  const before = await readStoredState(page);
  await page.getByRole("button", { name: "Partie starten" }).click();
  for (let i = 0; i < 6; i++) {
    await startQuestion(page);
    await choose(page);
    await expect(page.getByText("Richtige Antwort:")).toBeVisible();
    await page.getByRole("button", { name: "Weiter →", exact: true }).click();
  }
  await expect(
    page.getByRole("heading", { name: "Gemeinsame Sieger" }),
  ).toBeVisible();
  await expect(
    page.getByLabel("Punktestand").getByText("6 Punkte", { exact: true }),
  ).toHaveCount(2);
  await page.screenshot({
    path: info.outputPath("hot-seat-ergebnis.png"),
    fullPage: true,
  });
  const after = await readStoredState(page);
  expect(after.experience).toBe(before.experience);
  expect(after.events).toEqual(before.events);
  expect(after.learning).toEqual(before.learning);
  await page.getByRole("button", { name: "Revanche vorbereiten" }).click();
  await expect(page.getByLabel("Name 1", { exact: true })).toHaveValue("Anna");
});

test("Verdeckte Antworten: Übergabe, gemeinsame Auflösung, mobile Darstellung", async ({
  page,
}, info) => {
  await setup(page);
  await page.getByRole("button", { name: /Alle tippen Dieselbe/ }).click();
  await page
    .getByRole("combobox", { name: "Antworten erfassen", exact: true })
    .selectOption("hidden");
  await page.getByRole("button", { name: "Partie starten" }).click();
  await startQuestion(page);
  const id = await page
    .locator("[data-question-id]")
    .getAttribute("data-question-id");
  await choose(page);
  await expect(
    page.getByRole("heading", { name: "Ben ist dran" }),
  ).toBeVisible();
  await expect(page.locator("[data-question-id]")).toHaveCount(0);
  await page.getByText("Punktestand ansehen", { exact: true }).click();
  await expect(
    page.getByLabel("Punktestand").getByText("0 Punkte", { exact: true }),
  ).toHaveCount(2);
  await page.getByRole("button", { name: "Bereit · Frage zeigen" }).click();
  await expect(page.locator("[data-question-id]")).toHaveAttribute(
    "data-question-id",
    id!,
  );
  await page.getByRole("button", { name: "Große Ansicht" }).click();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: info.outputPath("hot-seat-frage.png"),
    fullPage: true,
  });
  await choose(page, false);
  await expect(page.getByText("Richtige Antwort:")).toBeVisible();
  await expect(page.getByLabel("Frageergebnis")).toContainText("Anna: Richtig");
  await expect(page.getByLabel("Frageergebnis")).toContainText(
    "Ben: Nicht richtig",
  );
});

test("Moderation: gemeinsame Antwortkärtchen und gespeicherte Auswertung", async ({
  page,
}) => {
  await setup(page);
  await page.getByRole("button", { name: /Alle tippen Dieselbe/ }).click();
  await page.getByRole("button", { name: "Partie starten" }).click();
  await startQuestion(page);
  await expect(page.locator(".hot-answer:enabled")).toHaveCount(0);
  await page
    .getByRole("button", { name: "Alle festgelegt · Lösung aufdecken" })
    .click();
  await page.getByRole("checkbox", { name: "Ben", exact: true }).check();
  await page.getByRole("button", { name: "Auswertung speichern" }).click();
  await expect(page.getByLabel("Frageergebnis")).toContainText(
    "Ben: Richtig · +1 Punkte",
  );
  await page.getByRole("button", { name: "Unterbrechen", exact: true }).click();
  await page.getByRole("button", { name: "Partie fortsetzen" }).click();
  await expect(page.getByLabel("Frageergebnis")).toContainText(
    "Ben: Richtig · +1 Punkte",
  );
});

test("Joker: Lösungsschutz, Stehlen und einmalige Bestätigung nach Netzfehler", async ({
  page,
}) => {
  await setup(page);
  await page.getByRole("checkbox", { name: /Doppelpunkt-Joker ·/ }).check();
  await page.getByRole("checkbox", { name: /Stehljoker ·/ }).check();
  await page.getByRole("button", { name: "Partie starten" }).click();
  await page
    .getByRole("checkbox", { name: "Doppelpunkt-Joker einsetzen" })
    .check();
  await startQuestion(page);
  await choose(page, false);
  await expect(
    page.getByText("Stehlchance für Ben", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Richtige Antwort:")).toHaveCount(0);
  await expect(page.locator(".hot-answer.correct")).toHaveCount(0);
  await page
    .getByRole("button", { name: "Stehljoker einsetzen", exact: true })
    .click();
  await expect(page.locator(".hot-answer:enabled")).toHaveCount(4);
  accountBackend(page).api.lost("quiz_hot_seat_call");
  await choose(page);
  await expect(
    page.getByRole("button", { name: "Erneut versuchen", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Richtige Antwort:")).toHaveCount(0);
  await page
    .getByRole("button", { name: "Erneut versuchen", exact: true })
    .click();
  await expect(page.getByLabel("Frageergebnis")).toContainText(
    "Ben · Stehlversuch: Richtig · +1 Punkte",
  );
});

test("Neuladen und Abbruch: Teilstand bleibt, neuer Start wird sofort möglich", async ({
  page,
}) => {
  await setup(page);
  await page.getByRole("button", { name: "Partie starten" }).click();
  await startQuestion(page);
  const id = await page
    .locator("[data-question-id]")
    .getAttribute("data-question-id");
  await open(page);
  await page.getByRole("button", { name: "Partie fortsetzen" }).click();
  await expect(page.locator("[data-question-id]")).toHaveAttribute(
    "data-question-id",
    id!,
  );
  await page
    .getByRole("button", { name: "Partie abbrechen", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Zurück", exact: true })
    .click();
  await expect(page.locator("[data-question-id]")).toHaveAttribute(
    "data-question-id",
    id!,
  );
  await page
    .getByRole("button", { name: "Partie abbrechen", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Partie abbrechen", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Partie abgebrochen" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Zur Partienübersicht" }).click();
  await expect(
    page.getByRole("button", { name: "Neue Partie einrichten" }),
  ).toBeEnabled();
  await expect(page.getByText("Abgebrochen ·", { exact: false })).toBeVisible();
  await page.getByRole("button", { name: "Neue Partie einrichten" }).click();
  await expect(
    page.getByRole("group", { name: "Hot-Seat-Spielmodi" }),
  ).toBeVisible();
});

test("Teams, Vorlagen und Themenwahl bleiben verständlich und zugänglich", async ({
  page,
}, info) => {
  await setup(page);
  await page.getByRole("checkbox", { name: "Als Teams spielen" }).check();
  await page
    .getByLabel("Mitglieder, durch Komma getrennt")
    .nth(0)
    .fill("Anna, Clara");
  await page
    .getByLabel("Mitglieder, durch Komma getrennt")
    .nth(1)
    .fill("Ben, David");
  await page.getByRole("button", { name: /Risiko Schwierigkeit/ }).click();
  await page.getByLabel("Eigene Regelvorlage").fill("Unser Filmabend");
  await page
    .getByRole("button", { name: "Vorlage speichern", exact: true })
    .click();
  await expect(
    page
      .getByRole("status")
      .filter({ hasText: "Vorlage „Unser Filmabend“ gespeichert" }),
  ).toBeVisible();
  const axe = await new AxeBuilder({ page }).include(".hot-seat").analyze();
  expect(axe.violations).toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: info.outputPath("hot-seat-einrichtung.png"),
    fullPage: true,
  });
  await page.getByRole("button", { name: "Partie starten" }).click();
  await expect(
    page.getByRole("combobox", { name: "Welches Risiko gehst Du ein?" }),
  ).toBeVisible();
  await page
    .getByRole("combobox", { name: "Welches Risiko gehst Du ein?" })
    .selectOption("schwer");
  await expect(
    page.getByRole("combobox", { name: "Welches Risiko gehst Du ein?" }),
  ).toHaveValue("schwer");
  const issued = page.waitForRequest(
    (request) =>
      request.url().includes("/quiz_hot_seat_call") &&
      JSON.parse(request.postDataJSON().request_text).action ===
        "start-question",
  );
  await startQuestion(page);
  expect(
    JSON.parse((await issued).postDataJSON().request_text).difficulty,
  ).toBe("schwer");
  await choose(page, false);
  await expect(page.getByLabel("Frageergebnis")).toContainText(
    "−2".replace("−", "-"),
  );
});

test("Genre-Jagd bietet ausgewählte Themen und vergibt ein Abzeichen", async ({
  page,
}) => {
  await setup(page);
  await page.getByRole("button", { name: /Genre-Jagd Themen/ }).click();
  await page.getByRole("button", { name: "Partie starten" }).click();
  await expect(
    page.getByRole("combobox", { name: "Dein Thema", exact: true }),
  ).toBeVisible();
  const theme = await page
    .getByRole("combobox", { name: "Dein Thema", exact: true })
    .locator("option:enabled")
    .last()
    .getAttribute("value");
  await page
    .getByRole("combobox", { name: "Dein Thema", exact: true })
    .selectOption(theme!);
  const issued = page.waitForRequest(
    (request) =>
      request.url().includes("/quiz_hot_seat_call") &&
      JSON.parse(request.postDataJSON().request_text).action ===
        "start-question",
  );
  await startQuestion(page);
  expect(JSON.parse((await issued).postDataJSON().request_text).theme).toBe(
    theme,
  );
  await choose(page);
  await page.getByText("Punktestand ansehen", { exact: true }).click();
  await expect(page.getByLabel("Punktestand")).toContainText("1 Abzeichen");
});

test("Acht Personen können eine lange Partie starten und sofort wieder abbrechen", async ({
  page,
}) => {
  await setup(page);
  for (let i = 3; i <= 8; i++) {
    await page
      .getByRole("button", { name: "Person hinzufügen", exact: true })
      .click();
    await page.getByLabel(`Name ${i}`, { exact: true }).fill(`Person ${i}`);
  }
  await expect(
    page.getByRole("button", { name: "Person hinzufügen", exact: true }),
  ).toHaveCount(0);
  await page
    .getByRole("combobox", { name: "Partielänge", exact: true })
    .selectOption("9");
  await page.getByRole("button", { name: "Partie starten" }).click();
  await expect(
    page.getByRole("button", { name: "Frage starten" }),
  ).toBeVisible();
  const backend = accountBackend(page);
  const reserved = await backend.admin(
    async () =>
      (
        await backend.db.query<{ count: number }>(
          "select count(*)::integer count from quiz_hot_seat_internal.questions",
        )
      ).rows[0].count,
  );
  expect(reserved).toBe(72);
  await page
    .getByRole("button", { name: "Partie abbrechen", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Partie abbrechen", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Partie abgebrochen" }),
  ).toBeVisible();
});

test("Der Countdown beendet eine Antwort ohne Zeitneustart beim Wiederöffnen", async ({
  page,
}) => {
  const backend = accountBackend(page),
    stamp = Date.parse("2026-11-08T12:00:00Z");
  backend.serverTime = stamp;
  await page.clock.install({ time: new Date(stamp) });
  await setup(page);
  await page
    .getByRole("combobox", { name: "Antwortzeit", exact: true })
    .selectOption("30");
  await page.getByRole("button", { name: "Partie starten" }).click();
  await startQuestion(page);
  await expect(page.getByRole("timer")).toBeVisible();
  await page.getByRole("button", { name: "Unterbrechen", exact: true }).click();
  backend.serverTime = stamp + 31000;
  await page.clock.fastForward(31000);
  await page.getByRole("button", { name: "Partie fortsetzen" }).click();
  await expect(page.getByLabel("Frageergebnis")).toContainText(
    "Ausgelassen oder Zeit abgelaufen · 0 Punkte",
  );
});

test("Der gemeinsame Einstieg lässt den Solostart auf kleinen und großen Bildschirmen sichtbar", async ({
  page,
}) => {
  for (const width of [320, 1440]) {
    await page.setViewportSize({ width, height: 850 });
    await page.goto("/");
    const start = page.getByRole("button", { name: /^Losspielen/ });
    await expect(start).toBeEnabled();
    const startBox = (await start.boundingBox())!;
    const navBox = (await page
      .getByRole("navigation", { name: "Hauptnavigation" })
      .boundingBox())!;
    expect(startBox.y + startBox.height).toBeLessThan(
      width <= 760 ? navBox.y : 850,
    );
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.getByRole("button", { name: /Gemeinsam spielen/ }).click();
    await expect(
      page.getByRole("button", { name: "Neue Partie einrichten" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Zurück zum Solospiel" }).click();
    await expect(start).toBeEnabled();
  }
});
