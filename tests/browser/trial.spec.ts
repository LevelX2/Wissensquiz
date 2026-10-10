import {
  test,
  expect,
  accountBackend,
  readStoredState,
  type Page,
  testOwner,
  fixCalendarTime,
} from "./fixtures";
import AxeBuilder from "@axe-core/playwright";
import type { Trial } from "../../src/trial";
import { TRIAL_KEY, TRIAL_USED_KEY } from "../../src/trial";
test.use({ autoLogin: false });
const testTime = new Date("2026-10-10T10:00:00Z");
test.beforeEach(async ({ page }) => {
  await fixCalendarTime(page, testTime);
});

async function draft(page: Page): Promise<Trial> {
  return page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)!),
    TRIAL_KEY,
  );
}
async function start(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "Eine Runde ausprobieren" }).click();
  await expect(page.getByLabel("Genre", { exact: true })).toBeEnabled();
  await page
    .getByLabel("Genre", { exact: true })
    .selectOption("Science-Fiction");
  await page
    .getByRole("button", { name: "Proberunde starten", exact: true })
    .click();
  await expect(page.getByText("FRAGE 1 VON 10")).toBeVisible();
}
async function finish(page: Page) {
  for (let i = 0; i < 10; i++) {
    const round = (await draft(page)).state.rounds[0];
    await page
      .locator(".answer")
      .nth(round.order[i].indexOf(round.questions[i].correctId))
      .click();
    await page
      .getByRole("button", {
        name: i === 9 ? "Runde abschließen" : "Nächste Frage",
      })
      .click();
  }
  await expect(
    page.getByRole("heading", { name: "Deine erste Runde zählt schon." }),
  ).toBeVisible();
}

test("zehn echte Fragen, Ergebnis vor Anmeldung und Übernahme in ein Konto genau einmal", async ({
  page,
  context,
}) => {
  await start(page);
  const other = await context.newPage();
  await fixCalendarTime(other, testTime);
  await other.goto("/");
  await expect(
    other.getByRole("button", { name: "Eine Runde ausprobieren" }),
  ).toHaveCount(0);
  await expect(
    other.getByRole("button", { name: "Proberunde fortsetzen" }),
  ).toBeVisible();
  await other.close();
  await finish(page);
  const before = await draft(page);
  expect(before.state.events).toHaveLength(10);
  expect(accountBackend(page).api.calls).toHaveLength(0);
  await expect(
    page.getByRole("heading", { name: "Dein Rundenrückblick" }),
  ).toBeVisible();
  await expect(
    page.getByText(/Auf PC, Handy und Tablet weiterspielen/),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(
    (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze())
      .violations,
  ).toEqual([]);
  await page.screenshot({ path: test.info().outputPath("trial-result.png") });
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Deine erste Runde zählt schon." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Nächste Runde" }).click();
  await expect(
    page.getByRole("heading", { name: "Konto erstellen", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Zur Anmeldung", exact: true })
    .click();
  await page.getByLabel("E-Mail-Adresse").fill("quiz@example.test");
  await page
    .getByLabel("Passwort", { exact: true })
    .fill("synthetisches-passwort");
  await page
    .getByRole("button", { name: "Anmelden & Runde übernehmen" })
    .click();
  await expect(page.getByRole("button", { name: "Losspielen" })).toBeEnabled();
  const state = await readStoredState(page);
  await expect(
    page.getByText(/Deine erste Runde wurde übernommen/),
  ).toBeVisible();
  expect(state.events).toEqual(before.state.events);
  expect(state.rounds).toHaveLength(1);
  expect(state.experience).toBe(before.state.experience);
  expect(
    await page.evaluate((key) => localStorage.getItem(key), TRIAL_KEY),
  ).toBeNull();
  expect(
    await page.evaluate((key) => localStorage.getItem(key), TRIAL_USED_KEY),
  ).toBe("yes");
  await page.reload();
  await expect(page.getByRole("button", { name: "Losspielen" })).toBeEnabled();
  expect((await readStoredState(page)).events).toHaveLength(10);
  expect(await page.evaluate(() => indexedDB.databases())).toEqual([]);
});

test("E-Mail-Bestätigung in neuem Fenster übernimmt die vorgemerkte Runde", async ({
  page,
  context,
}) => {
  await start(page);
  await finish(page);
  await page.route("**/auth/v1/signup**", (route) =>
    route.fulfill({
      json: {
        user: {
          id: testOwner,
          email: "quiz@example.test",
          identities: [{ id: testOwner }],
        },
        session: null,
      },
    }),
  );
  await page
    .getByRole("button", {
      name: "Konto erstellen & Runde übernehmen",
      exact: true,
    })
    .click();
  await page.getByLabel("Spielername").fill("Proberunde");
  await page.getByLabel("E-Mail-Adresse").fill("quiz@example.test");
  await page
    .getByLabel("Passwort", { exact: true })
    .fill("synthetisches-passwort");
  await page
    .getByRole("button", {
      name: "Konto erstellen & Runde übernehmen",
      exact: true,
    })
    .click();
  await expect(
    page.getByText(/erhältst Du eine Bestätigungsmail/),
  ).toBeVisible();
  expect(accountBackend(page).api.calls).toHaveLength(0);
  // Existing mail template uses an explicit signup token, never a production mail.
  const session = await page.evaluate(async () => {
    const response = await fetch(
      "https://quiz-test.supabase.co/auth/v1/token",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      },
    );
    return response.json();
  });
  await context.route("**/auth/v1/verify", (route) =>
    route.fulfill({ json: session }),
  );
  const confirmed = await context.newPage();
  await fixCalendarTime(confirmed, testTime);
  await confirmed.goto("/#auth?token_hash=synthetic-signup-token&type=signup");
  await confirmed
    .getByRole("button", { name: "E-Mail bestätigen und Konto aktivieren" })
    .click();
  await expect(
    confirmed.getByRole("button", { name: "Losspielen" }),
  ).toBeEnabled();
  expect((await readStoredState(confirmed)).events).toHaveLength(10);
  await expect(page.getByRole("button", { name: "Losspielen" })).toBeEnabled();
  await confirmed.close();
});

for (const failure of ["unavailable", "lost"] as const) {
  test(`Kontoübernahme bei ${failure}: Entwurf bleibt bis zur bestätigten Speicherung erhalten`, async ({
    page,
  }) => {
    await start(page);
    await finish(page);
    const before = await draft(page);
    accountBackend(page).api[failure]("quiz_sync_apply");
    await page
      .getByRole("button", { name: "Ich habe schon ein Konto" })
      .click();
    await page.getByLabel("E-Mail-Adresse").fill("quiz@example.test");
    await page
      .getByLabel("Passwort", { exact: true })
      .fill("synthetisches-passwort");
    await page
      .getByRole("button", { name: "Anmelden & Runde übernehmen" })
      .click();
    await expect(
      page.getByText(
        /Deine Proberunde konnte noch nicht online übernommen werden/,
      ),
    ).toBeVisible();
    expect((await draft(page)).state.events).toEqual(before.state.events);
    expect((await readStoredState(page)).events).toHaveLength(
      failure === "lost" ? 10 : 0,
    );
    await page.reload();
    await expect(
      page.getByRole("button", { name: "Losspielen" }),
    ).toBeEnabled();
    expect((await readStoredState(page)).events).toEqual(before.state.events);
    expect(
      await page.evaluate((key) => localStorage.getItem(key), TRIAL_KEY),
    ).toBeNull();
    await expect(
      page.getByText(/Deine erste Runde wurde übernommen/),
    ).toBeVisible();
  });
}

test("abgelaufene Proberunde gibt keine zweite Runde frei", async ({
  page,
}) => {
  await start(page);
  await page.evaluate((key) => {
    const trial = JSON.parse(localStorage.getItem(key)!);
    trial.expiresAt = Date.now() - 1;
    localStorage.setItem(key, JSON.stringify(trial));
  }, TRIAL_KEY);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Bereit für die nächste Runde?" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Eine Runde ausprobieren" }),
  ).toHaveCount(0);
  expect(
    await page.evaluate((key) => localStorage.getItem(key), TRIAL_KEY),
  ).toBeNull();
  expect(accountBackend(page).api.calls).toHaveLength(0);
});
