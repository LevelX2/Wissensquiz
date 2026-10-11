import { prepareTestContent, type TestContent } from "../helpers/test-content";
import { preparePresentation } from "../../src/questionPresentation";
import { recognitionPortrait } from "../../src/portraitCatalog";
import { test as base, type BrowserContext, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { emptyState, type State } from "../../src/model";
import { packages, addPackages } from "../../src/packages";
import { reconstructState } from "../../src/syncCodec";
import { getMetadata, downloadDocument } from "../../src/entryRemote";
import {
  rankedRound,
  type RankedSummary,
  type RankedItem,
} from "../../src/rankedRuns";
import { rebuild } from "../../src/engine";
import { OnlineGameStore } from "../../src/onlineGameStore";
import { type LearningRun } from "../../src/learningRuns";
import { syncFixture } from "../helpers/sync-fixture";
export { expect, chromium, type Page } from "@playwright/test";
export const testBaseUrl = `http://localhost:${process.env.WISSENSQUIZ_BROWSER_PORT ?? 4173}`;

// Illustrated variants select the mode; only Losspielen starts a game.
export function modePreparation(page: Page, name: string | RegExp) {
  return page
    .getByRole("button", { name, includeHidden: true })
    .and(page.locator(".mode-card"));
}

// Performance cases need native timers and rendering frames. Playwright's
// setFixedTime also installs its timer/RAF scheduler, adding measurement jitter.
// Keep only the calendar date fixed, including after navigation and reload.
export async function fixCalendarTime(page: Page, time: Date) {
  await page.addInitScript((fixedTime) => {
    const NativeDate = Date;
    window.Date = new Proxy(NativeDate, {
      apply() {
        return new NativeDate(fixedTime).toString();
      },
      construct(target, args, newTarget) {
        return Reflect.construct(
          target,
          args.length ? args : [fixedTime],
          newTarget,
        );
      },
      get(target, key, receiver) {
        return key === "now"
          ? () => fixedTime
          : Reflect.get(target, key, receiver);
      },
    });
  }, time.getTime());
}

// Existing filter/game checks open the preparation panels through their UI.
// Compact-home checks deliberately leave the default collapsed state intact.
export async function openRoundSetup(page: Page) {
  await base.expect(page.locator(".loading")).toHaveCount(0);
  await base.expect(page.locator(".round-setup")).toBeVisible();
  // A selection saves asynchronously and closes its panel after the write.
  // Wait for that write before opening the preparation again.
  await base
    .expect(page.locator(".round-setup"))
    .toHaveAttribute("aria-busy", "false");
  for (const summary of await page
    .locator(".round-setup .setup-section > summary")
    .all()) {
    if (
      !(await summary.evaluate(
        (node) => (node.parentElement as HTMLDetailsElement).open,
      ))
    )
      await summary.click();
  }
}

// Every browser gets a synthetic authenticated server with the real SQL protocol.
// Browser tests never access production accounts or device game databases.
export const testOwner = "11111111-1111-4111-8111-111111111111";
export const testServiceUrl = "https://quiz-test.supabase.co";
const user = {
  id: testOwner,
  aud: "authenticated",
  role: "authenticated",
  email: "quiz@example.test",
  email_confirmed_at: "2026-09-26T10:00:00Z",
  created_at: "2026-09-26T10:00:00Z",
  app_metadata: { provider: "email", providers: ["email"] },
  user_metadata: { display_name: "Quiztest" },
};
const session = {
  access_token: [
    { alg: "HS256", typ: "JWT" },
    { sub: testOwner, exp: 2000000000, role: "authenticated" },
    "test",
  ]
    .map((v) =>
      Buffer.from(typeof v === "string" ? v : JSON.stringify(v)).toString(
        "base64url",
      ),
    )
    .join("."),
  refresh_token: "synthetic-refresh",
  token_type: "bearer",
  expires_in: 3600,
  expires_at: 2000000000,
  user,
};
let preparedRelease: Promise<TestContent> | undefined;
export async function createAccountBackend() {
  const fixture = await syncFixture(),
    { api } = await fixture.client(testOwner);
  // Calendar views use the same controlled clock as synthetic server runs.
  // This override exists only in the isolated browser backend.
  await fixture.db.exec(`do $patch$declare f record;begin
    for f in select p.oid::regprocedure as name from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public' and p.proname in ('quiz_period_start','quiz_own_record_runs','quiz_own_record_location')
    loop execute replace(pg_get_functiondef(f.name),'now()','quiz_ranked_internal.test_clock()');end loop;
  end$patch$;`);
  const release = await (preparedRelease ??= (async () => {
    const state = emptyState();
    addPackages(
      state,
      packages.map((pkg) => ({
        filename: pkg.filename,
        text: readFileSync("public" + pkg.path, "utf8"),
      })),
    );
    return prepareTestContent(state.questions);
  })());
  const rankedReady = fixture.seedRanked(release);
  await rankedReady;
  const ensureRanked = () => rankedReady;
  return {
    ...fixture,
    api,
    release,
    ensureRanked,
    serverTime: undefined as number | undefined,
    close: () => fixture.db.close(),
  };
}
export type AccountBackend = Awaited<ReturnType<typeof createAccountBackend>>;
const backends = new WeakMap<BrowserContext, AccountBackend>();
export function accountBackend(page: Page) {
  const backend = backends.get(page.context());
  if (!backend) throw new Error("Isolierter Testserver fehlt");
  return backend;
}
export async function isolateAccountService(
  context: BrowserContext,
  options: { autoLogin?: boolean; backend?: AccountBackend } = {},
) {
  const backend = options.backend ?? (await createAccountBackend());
  backends.set(context, backend);
  await context.route("**/account-config.json", (route) =>
    route.fulfill({
      json: {
        enabled: true,
        supabaseUrl: testServiceUrl,
        publishableKey: "sb_publishable_test",
      },
    }),
  );
  await context.route(`${testServiceUrl}/**`, async (route) => {
    const path = new URL(route.request().url()).pathname,
      body = route.request().postDataJSON() ?? {};
    if (path.endsWith("/user")) return route.fulfill({ json: user });
    if (path.endsWith("/token")) return route.fulfill({ json: session });
    if (path.endsWith("/logout")) return route.fulfill({ json: {} });
    const name = path.split("/").at(-1)!;
    if (
      !name.startsWith("quiz_sync_") &&
      !name.startsWith("quiz_game_") &&
      !name.startsWith("quiz_trial_") &&
      !name.startsWith("quiz_own_record_") &&
      name !== "quiz_ranked_call"
    )
      return route.fulfill({ json: [] });
    try {
      if (name === "quiz_ranked_call" || name.startsWith("quiz_game_")) {
        await backend.ensureRanked();
        backend.api.clockAt(
          backend.serverTime ??
            (await route
              .request()
              .frame()
              .evaluate(() => Date.now())),
        );
      }
      return route.fulfill({ json: await backend.api.call(name, body) });
    } catch (error) {
      if (/Bestätigung verloren|Offlinephase/.test((error as Error).message))
        return route.abort("failed");
      return route.fulfill({
        status: 409,
        json: {
          code: "P0001",
          message:
            (error as Error).constructor.name === "CloudConflict"
              ? "revision_conflict"
              : (error as Error).message,
        },
      });
    }
  });
  if (options.autoLogin !== false)
    await context.addInitScript((value) => {
      if (!sessionStorage.getItem("test-auth-initialized")) {
        localStorage.setItem(
          "wissensquiz-auth:quiz-test.supabase.co",
          JSON.stringify(value),
        );
        sessionStorage.setItem("test-auth-initialized", "yes");
      }
    }, session);
  return backend;
}
export async function readStoredState(
  page: Page,
  _key?: string,
): Promise<State> {
  const { api, release, db, admin } = accountBackend(page);
  const metadata = await getMetadata(api, testOwner);
  const downloaded = await downloadDocument(
    api,
    testOwner,
    metadata.generation!,
    metadata.revision,
  );
  const state = reconstructState(downloaded.document);
  // Test authoring may inspect the operator catalog. It is never sent to the UI.
  state.questions = structuredClone(release.questions);
  // Read authoritative server histories without triggering any recovery write.
  // This admin visibility exists only in the synthetic test server.
  await admin(async () => {
    const learning = await db.query<{
      run: LearningRun;
      queue: string[];
      release_hash: string;
    }>(
      `select quiz_game_internal.summary(r) run,queue,release_hash from quiz_game_internal.runs r where owner_id=$1 and status='active' order by started_at`,
      [testOwner],
    );
    for (const { run, queue, release_hash } of learning.rows) {
      const rows = await db.query<{
        question: RankedItem["question"];
        order: string[];
        event: RankedItem["event"] | null;
        before: State["learning"][string] | null;
      }>(
        `select coalesce(q.question,c.question)||jsonb_build_object('tags',c.question->'tags','metadata',c.question->'metadata') question,q.answer_order as "order",q.event,q.learning_before as before from unnest($2::text[]) with ordinality selected(id,n) join quiz_ranked_internal.catalog c on c.release_hash=$3 and c.id=selected.id left join quiz_game_internal.questions q on q.run_id=$1 and q.index=selected.n-1 order by selected.n`,
        [run.id, queue, release_hash],
      );
      const answered = rows.rows.filter((x) => x.event !== null);
      const round: State["rounds"][number] = {
        id: "learn-" + run.id,
        mode: run.mode,
        topic: run.topic,
        filters: run.filters,
        difficulty: "Alle Stufen",
        ruleVersion: "learn-server-v1",
        solutionDisplay: run.solutionDisplay,
        status: run.status,
        startedAt: run.startedAt,
        finishedAt: run.finishedAt,
        questions: [],
        order: [],
        events: answered.map((x) => x.event!.id),
        before: Object.fromEntries(
          answered
            .filter((x) => x.before)
            .map((x) => [x.question.knowledgeId, x.before!]),
        ),
      };
      round.questions = rows.rows.map((x) => x.question);
      round.order = rows.rows.map(
        (x) => x.order ?? x.question.answers.map((a) => a.id),
      );
      state.rounds.push(round);
      state.events.push(...answered.map((x) => x.event!));
    }
    const runs = await db.query<{ run: RankedSummary }>(
      "select quiz_ranked_internal.summary(r) as run from quiz_ranked_internal.runs r where owner_id=$1 order by created_at",
      [testOwner],
    );
    for (const { run } of runs.rows) {
      if (state.rounds.some((r) => r.id === `ranked-${run.id}`)) continue;
      const rows = await db.query<{
        question: RankedItem["question"];
        order: string[];
        event: RankedItem["event"] | null;
      }>(
        'select question,answer_order as "order",event from quiz_ranked_internal.questions where run_id=$1 order by index',
        [run.id],
      );
      const answered = rows.rows.filter(
        (i): i is RankedItem => i.event !== null,
      );
      const round = rankedRound({ run, items: answered });
      round.questions = rows.rows.map((i) => i.question);
      round.order = rows.rows.map((i) => i.order);
      state.rounds.push(round);
      state.events.push(...answered.map((i) => i.event));
    }
  });
  const actual = new Map(
    state.rounds.flatMap((r) => r.questions).map((q) => [q.id, q]),
  );
  state.questions = state.questions.map((q) => actual.get(q.id) ?? q);
  rebuild(state);
  return state;
}
export async function writeStoredState(page: Page, state: State) {
  const backend = accountBackend(page);
  const { api, release } = backend;
  const active = state.rounds.find(
    (r) =>
      r.status === "active" &&
      ["entdecken", "ueben", "fehler"].includes(r.mode),
  );
  const activeEvents = active
    ? state.events.filter((e) => e.roundId === active.id)
    : [];
  const savedState = active
    ? {
        ...state,
        rounds: state.rounds.filter((r) => r !== active),
        events: state.events.filter((e) => e.roundId !== active.id),
      }
    : state;
  const store = new OnlineGameStore(api, testOwner);
  await store.open();
  await store.update((s) => Object.assign(s, savedState), { replace: true });
  // Test administration authors native private runs, never a client fallback.
  if (active) {
    const id = crypto.randomUUID(),
      oldId = active.id;
    active.id = "learn-" + id;
    const presentations = await backend.admin(() =>
      backend.db.query<{
        id: string;
        version: string;
        question: string;
        context: string;
        value: NonNullable<State["questions"][number]["presentation"]>;
      }>(
        "select id,version,question,context,value from quiz_game_internal.presentations where id=any($1::text[])",
        [active.questions.map((q) => q.id)],
      ),
    );
    const questions = active.questions.map((q) => {
      const prepared = presentations.rows.find(
        (p) =>
          p.id === q.id &&
          p.version === q.version &&
          p.question === q.question &&
          p.context === q.context,
      );
      const p = recognitionPortrait(q, oldId + ":" + q.knowledgeId);
      return {
        ...q,
        presentation: prepared?.value ?? preparePresentation(q),
        ...(p
          ? {
              image: {
                src: p.src,
                width: p.width,
                height: p.height,
                ...(p.crop ? { crop: p.crop } : {}),
              },
            }
          : {}),
      };
    });
    for (const event of activeEvents) {
      event.roundId = active.id;
      event.id = active.id + ":" + event.knowledgeId;
    }
    active.events = activeEvents.map((e) => e.id);
    await backend.admin(async () => {
      const head = (
        await backend.db.query<{ generation: string; revision: number }>(
          "select generation,revision from public.quiz_account_heads where owner_id=$1",
          [testOwner],
        )
      ).rows[0];
      await backend.db.query(
        "insert into quiz_game_internal.runs(id,owner_id,generation,release_hash,setup,timezone,queue,answered,started_at) values($1,$2,$3,$4,$5::jsonb,'Europe/Berlin',$6,$7,to_timestamp($8/1000.0))",
        [
          id,
          testOwner,
          head.generation,
          release.hash,
          JSON.stringify({
            mode: active.mode,
            topic: active.topic,
            filters: active.filters ?? {
              genres: store.info!.genres,
              sources: ["film", "actors", "awards"],
              difficulties: ["leicht", "mittel", "schwer", "experte"],
              familiarities: [1, 2, 3, 4],
            },
            solutionDisplay: active.solutionDisplay ?? "question",
          }),
          questions.map((q) => q.id),
          activeEvents.length,
          active.startedAt,
        ],
      );
      for (let i = 0; i < Math.max(1, activeEvents.length); i++)
        await backend.db.query(
          "insert into quiz_game_internal.questions(run_id,index,question,answer_order,event,issued_at,learning_before) values($1,$2,$3::jsonb,$4::jsonb,$5::jsonb,to_timestamp($6/1000.0),case when $5::jsonb is null then (select value from public.quiz_sync_entries where owner_id=$8 and generation=$9 and kind='learning' and id=$10 and not deleted) else $7::jsonb end)",
          [
            id,
            i,
            JSON.stringify(questions[i]),
            JSON.stringify(active.order[i]),
            activeEvents[i] ? JSON.stringify(activeEvents[i]) : null,
            active.startedAt,
            JSON.stringify(active.before[questions[i].knowledgeId] ?? null),
            testOwner,
            head.generation,
            questions[i].knowledgeId,
          ],
        );
      for (const event of activeEvents)
        await backend.db.query(
          "select quiz_game_internal.project_goal($1,$2,$3,$4,'Europe/Berlin')",
          [testOwner, head.generation, event.knowledgeId, head.revision],
        );
    });
  }
  store.stop();
}
export const test = base.extend<{ autoLogin: boolean }>({
  autoLogin: [true, { option: true }],
  context: async ({ context, autoLogin }, use) => {
    const backend = await isolateAccountService(context, { autoLogin });
    try {
      await use(context);
    } finally {
      await backend.close();
    }
  },
});
