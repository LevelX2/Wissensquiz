import {
  test,
  expect,
  accountBackend,
  readStoredState,
  openRoundSetup,
  modePreparation,
} from "./fixtures";
test.use({ serviceWorkers: "block" });

test("große Zeitrunde überträgt keine wiederholten Listen und erhält Antworten beim Neuladen", async ({
  page,
}) => {
  await page.clock.install({ time: new Date("2026-10-10T10:00:00Z") });
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Losspielen" })).toBeEnabled();
  await openRoundSetup(page);
  await page.getByRole("button", { name: "Auf Zeit", exact: true }).click();
  await modePreparation(page, /^Zeitkonto /).click();
  await page.getByRole("button", { name: "Losspielen" }).click();
  await expect(page.locator(".answer").first()).toBeEnabled();
  const initial = (await readStoredState(page)).rounds.at(-1)!;
  expect(initial.run!.pool.length).toBeGreaterThan(10000);
  const q = initial.questions[0];
  await expect(page.locator("h1[data-question-id]")).toHaveAttribute(
    "data-question-id",
    q.id,
  );
  const backend = accountBackend(page);
  backend.api.calls.length = 0;
  await page
    .locator(".answer")
    .filter({
      has: page.getByText(q.answers.find((a) => a.id === q.correctId)!.text, {
        exact: true,
      }),
    })
    .click();
  await expect(page.locator(".feedback")).toBeVisible();
  const writes = backend.api.calls.filter((c) => c.name === "quiz_sync_apply");
  expect(writes).toHaveLength(1);
  expect(Buffer.byteLength(JSON.stringify(writes[0].args))).toBeLessThan(15000);
  const packet = JSON.parse(writes[0].args.packet_text as string);
  const change = packet.changes.find(
    (c: { op: string }) => c.op === "round-run",
  );
  expect(change.queue).toEqual({ drop: 1 });
  expect(change.row.value.run).not.toHaveProperty("pool");
  expect(change.row.value.run).not.toHaveProperty("queue");
  const saved = await readStoredState(page);
  expect(saved.rounds.at(-1)!.run!.queue).toEqual(initial.run!.queue.slice(1));
  await page.reload();
  // Existing timed-mode rule: reloading aborts and archives the active run.
  await expect
    .poll(async () => (await readStoredState(page)).rounds.at(-1)!.status)
    .toBe("aborted");
  const reloaded = await readStoredState(page);
  expect(reloaded.events).toEqual(saved.events);
  expect(reloaded.learning).toEqual(saved.learning);
  expect(reloaded.rounds.at(-1)!.run).toMatchObject({ pool: [], queue: [] });
});
test("Rundenstart und Antwort übertragen nur ein kleines Änderungspaket", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Losspielen" })).toBeEnabled();
  const backend = accountBackend(page);
  backend.api.calls.length = 0;
  await page.getByRole("button", { name: "Losspielen" }).click();
  await expect(page.locator(".answer").first()).toBeEnabled();
  expect(backend.api.calls.map((c) => c.name)).toEqual(["quiz_sync_apply"]);
  expect(
    Buffer.byteLength(JSON.stringify(backend.api.calls[0].args)),
  ).toBeLessThan(20000);
  backend.api.calls.length = 0;
  await page.locator(".answer").first().click();
  await expect(page.locator(".feedback")).toBeVisible();
  expect(backend.api.calls.map((c) => c.name)).toEqual(["quiz_sync_apply"]);
  expect(
    Buffer.byteLength(JSON.stringify(backend.api.calls[0].args)),
  ).toBeLessThan(15000);
});
test("fehlende Online-Speicherung zeigt keine Lösung; explizite Wiederholung speichert genau einmal", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Losspielen" }).click();
  await expect(page.locator(".answer").first()).toBeEnabled();
  const backend = accountBackend(page);
  backend.api.calls.length = 0;
  backend.api.unavailable("quiz_sync_apply");
  await page.locator(".answer").first().click();
  await expect(page.getByText(/Nicht gespeichert:/)).toBeVisible();
  await expect(page.locator(".feedback")).toHaveCount(0);
  expect((await readStoredState(page)).events).toHaveLength(0);
  await page
    .getByRole("button", { name: "Erneut versuchen", exact: true })
    .click();
  await expect(page.locator(".feedback")).toBeVisible();
  expect((await readStoredState(page)).events).toHaveLength(1);
  const packets = backend.api.calls
    .filter((c) => c.name === "quiz_sync_apply")
    .map((c) => c.args.packet_text);
  expect(packets).toHaveLength(2);
  expect(packets[1]).toBe(packets[0]);
  expect(await page.evaluate(() => indexedDB.databases())).toEqual([]);
});
test("verlorene Bestätigung lässt sich wiederholen; auf einem frischen Gerät liegt dieselbe Antwort online", async ({
  page,
  browser,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Losspielen" }).click();
  await expect(page.locator(".answer").first()).toBeEnabled();
  const backend = accountBackend(page);
  backend.api.lost("quiz_sync_apply");
  await page.locator(".answer").first().click();
  await expect(page.getByText(/Nicht gespeichert:/)).toBeVisible();
  await page
    .getByRole("button", { name: "Erneut versuchen", exact: true })
    .click();
  await expect(page.locator(".feedback")).toBeVisible();
  const saved = await readStoredState(page);
  const context = await browser.newContext();
  const { isolateAccountService, testBaseUrl } = await import("./fixtures");
  await isolateAccountService(context, { backend });
  const second = await context.newPage();
  try {
    await second.goto(testBaseUrl);
    await second.getByRole("button", { name: "Fortsetzen" }).click();
    await expect(second.locator(".feedback")).toBeVisible();
    expect(await readStoredState(second)).toEqual(saved);
    expect(await second.evaluate(() => indexedDB.databases())).toEqual([]);
  } finally {
    await context.close();
  }
});
test("ein zweites Fenster überschreibt keinen neueren Serverstand", async ({
  page,
  context,
}) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Losspielen" })).toBeEnabled();
  const second = await context.newPage();
  await second.goto("/");
  await expect(
    second.getByRole("button", { name: "Losspielen" }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "Losspielen" }).click();
  await expect(page.locator(".answer").first()).toBeEnabled();
  await second.getByRole("button", { name: "Losspielen" }).click();
  await expect(second.getByText(/in einem anderen Fenster/)).toBeVisible();
  await second
    .getByRole("button", { name: "Online-Spielstand erneut laden" })
    .click();
  await expect(
    second.getByRole("button", { name: "Fortsetzen" }),
  ).toBeEnabled();
  expect((await readStoredState(second)).rounds).toHaveLength(1);
});
