import {
  test,
  expect,
  openRoundSetup,
  modePreparation,
  accountBackend,
  isolateAccountService,
  readStoredState,
} from "./fixtures";
test.use({ serviceWorkers: "block" });
async function begin(page: import("@playwright/test").Page) {
  await expect(page.getByRole("button", { name: "Losspielen" })).toBeEnabled();
  await openRoundSetup(page);
  await page.getByRole("button", { name: "Auf Zeit", exact: true }).click();
  await modePreparation(page, /^Fehlerfrei /).click();
  await page.getByRole("button", { name: "Losspielen" }).click();
}
test("zweites Gerät und Neuladen verraten keine Folgefrage und beenden den laufenden Zeitlauf nicht", async ({
  page,
  browser,
}) => {
  await page.goto("/");
  await begin(page);
  await expect(page.locator(".answer").first()).toBeEnabled();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: test.info().outputPath("serverzeit-frage.png"),
    fullPage: true,
  });
  const backend = accountBackend(page),
    first = (await readStoredState(page)).rounds.at(-1)!;
  const other = await browser.newContext({ serviceWorkers: "block" });
  try {
    await isolateAccountService(other, { backend });
    const p2 = await other.newPage();
    await p2.goto("/");
    await expect(p2.getByRole("button", { name: "Losspielen" })).toBeEnabled();
    await p2.getByRole("button", { name: "Losspielen" }).click();
    await expect(
      p2.getByRole("button", {
        name: "Bestehende Zeitrunde beenden und neu starten",
      }),
    ).toBeVisible();
    expect((await readStoredState(page)).rounds.at(-1)!.id).toBe(first.id);
    expect((await readStoredState(page)).rounds.at(-1)!.status).toBe("active");
    const q = first.questions[0],
      wrong = q.answers.find((a) => a.id !== q.correctId)!;
    await page
      .locator(".answer")
      .filter({ has: page.getByText(wrong.text, { exact: true }) })
      .click();
    await expect(page.locator(".feedback")).toBeVisible();
    expect((await readStoredState(page)).rounds.at(-1)!.status).toBe(
      "completed",
    );
    await page.reload();
    await expect(
      page.getByRole("button", { name: "Losspielen" }),
    ).toBeEnabled();
    const recovered = (await readStoredState(page)).rounds.find(
      (r) => r.id === first.id,
    )!;
    expect(recovered.archive).toBeDefined();
    expect(recovered.events).toHaveLength(1);
  } finally {
    await other.close();
  }
});
test("verlorene Antwort- und Lernstandbestätigungen lassen sich ohne Doppelzählung wiederholen", async ({
  page,
}) => {
  await page.goto("/");
  await begin(page);
  await expect(page.locator(".answer").first()).toBeEnabled();
  const backend = accountBackend(page),
    q = (await readStoredState(page)).rounds.at(-1)!.questions[0];
  backend.api.lost("quiz_ranked_call");
  await page
    .locator(".answer")
    .filter({
      has: page.getByText(q.answers.find((a) => a.id !== q.correctId)!.text, {
        exact: true,
      }),
    })
    .click();
  await expect(
    page.getByRole("button", { name: "Erneut versuchen", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".feedback")).toHaveCount(0);
  await page
    .getByRole("button", { name: "Erneut versuchen", exact: true })
    .click();
  await expect(page.locator(".feedback")).toBeVisible();
  backend.api.lost("quiz_sync_apply");
  await page.getByRole("button", { name: /^Runde abschließen/ }).click();
  await expect(
    page.getByRole("button", { name: "Erneut versuchen", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Erneut versuchen", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Bestenliste ansehen" }),
  ).toBeVisible();
  const saved = await readStoredState(page);
  expect(saved.events).toHaveLength(1);
  expect(saved.rounds.at(-1)!.archive!.questions).toHaveLength(1);
  const packets = backend.api.calls
    .filter((c) => c.name === "quiz_sync_apply")
    .slice(-2);
  expect(packets).toHaveLength(2);
  expect(packets[1].args).toEqual(packets[0].args);
});
test("Browseruhr beeinflusst die gewertete Antwortzeit nicht und Antwortverkehr enthält keine Listen", async ({
  page,
}) => {
  const backend = accountBackend(page),
    base = Date.now();
  backend.serverTime = base;
  const packets: Record<string, unknown>[] = [];
  page.on("request", (r) => {
    if (r.url().endsWith("/quiz_ranked_call"))
      packets.push(JSON.parse(r.postDataJSON().request_text));
  });
  await page.goto("/");
  await begin(page);
  await expect(page.locator(".answer").first()).toBeEnabled();
  const q = (await readStoredState(page)).rounds.at(-1)!.questions[0];
  backend.serverTime = base + 7000;
  await page.evaluate(() => {
    Date.now = () => 0;
  });
  const wrong = q.answers.find((a) => a.id !== q.correctId)!;
  await page
    .locator(".answer")
    .filter({ has: page.getByText(wrong.text, { exact: true }) })
    .click();
  await expect(page.locator(".feedback")).toBeVisible();
  const event = (await readStoredState(page)).events.at(-1)!;
  expect(event.elapsedMs).toBe(7000);
  const answer = packets.find((p) => p.action === "answer")!;
  expect(answer).not.toHaveProperty("elapsedMs");
  expect(answer).not.toHaveProperty("queue");
  expect(answer).not.toHaveProperty("pool");
  expect(Buffer.byteLength(JSON.stringify(answer))).toBeLessThan(700);
});
test("verlorene Abbruchbestätigung sperrt die Oberfläche nicht dauerhaft", async ({
  page,
}) => {
  await page.goto("/");
  await begin(page);
  await expect(page.locator(".answer").first()).toBeEnabled();
  const backend = accountBackend(page);
  backend.api.lost("quiz_ranked_call");
  await page.getByRole("button", { name: /Runde beenden$/ }).click();
  await page
    .getByRole("button", { name: "Erneut versuchen", exact: true })
    .click();
  await expect(page.getByRole("alert")).toHaveCount(0);
  await page.getByRole("button", { name: /Runde beenden$/ }).click();
  await expect(page.getByRole("button", { name: "Losspielen" })).toBeEnabled();
  expect((await readStoredState(page)).rounds.at(-1)!.status).toBe("aborted");
});
