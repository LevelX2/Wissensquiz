import "fake-indexeddb/auto";
import { beforeAll, afterAll, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { syncFixture } from "./helpers/sync-fixture";
import { importCsv } from "../src/importer";
import { emptyState, type State } from "../src/model";
import { startRound, answer } from "../src/engine";
import { validateBackup } from "../src/backupValidation";
import { EntrySync, createAccountSync } from "../src/entrySync";
import {
  prepareRelease,
  stableStringify,
  jsonEqual,
  SYNC_FORMAT,
  type PreparedRelease,
} from "../src/syncCodec";
import { read, update, restore } from "../src/storage";
import {
  readOutbox,
  readEntryHead,
  readEntryDocument,
} from "../src/entryStorage";
import { getMetadata, MissingSyncProtocol } from "../src/entryRemote";
import type { SyncStore } from "../src/accountSync";
import { importDuelView, type DuelView } from "../src/duels";

let fixture: Awaited<ReturnType<typeof syncFixture>>, release: PreparedRelease;
const now = 1700000000000;
beforeAll(async () => {
  fixture = await syncFixture();
  release = await prepareRelease(
    importCsv(readFileSync("public/fragen.csv", "utf8")).questions.slice(0, 12),
  );
  await fixture.seed(release);
}, 30000);
afterAll(() => fixture?.db.close());
async function setup(active = false) {
  const { owner, api } = await fixture.client(),
    key = `account:test:${owner}`,
    state = emptyState(structuredClone(release.questions));
  if (active)
    startRound(
      state,
      { mode: "ueben", topic: "Alle Themen", difficulty: "Alle Stufen" },
      now,
    );
  await update(() => {}, validateBackup(state), key);
  const legacy: SyncStore = {
    local: () => read(key),
    receipt: async () => undefined,
    legacyRevision: async () => 0,
    remote: async () => null,
    replace: async (s) => restore(s, key),
    acknowledge: async () => {},
    save: async () => {
      throw new Error("Alter Writer darf nicht verwendet werden");
    },
  };
  const engine = () =>
    new EntrySync(
      api,
      owner,
      key,
      legacy,
      () => {},
      async () => release,
    );
  return { owner, api, key, engine, legacy };
}
it("übernimmt den lokalen Stand nach geprüftem Rücklesen und öffnet unveränderte Konten nur über Metadaten", async () => {
  const { api, key, engine } = await setup(true),
    sync = engine();
  await sync.prepare();
  expect(sync.status).toBe("saved");
  expect(await readOutbox(key)).toHaveLength(0);
  expect((await read(key))!.rounds).toHaveLength(1);
  sync.stop();
  api.calls.length = 0;
  const reopened = engine();
  await reopened.prepare();
  expect(api.calls.map((c) => c.name)).toEqual(["quiz_sync_metadata"]);
  expect(reopened.status).toBe("saved");
  reopened.stop();
});
it("nimmt ein verlorenes bestätigtes Paket nach Neustart wieder auf und schützt danach hinzugekommene Änderungen", async () => {
  const { api, key, engine } = await setup(true),
    sync = engine();
  await sync.prepare();
  const initial = (await read(key))!,
    r = initial.rounds[0],
    q = r.questions[0];
  await update(
    (s) => answer(s, r.id, q.id, q.correctId, 1000, now + 1000),
    undefined,
    key,
    { progressOnly: true },
  );
  api.lost("quiz_sync_apply");
  await sync.flush();
  expect(sync.status).toBe("offline");
  const frozen = (await readOutbox(key))[0].packet!;
  await update(
    (s) => {
      s.settings.sound = false;
    },
    undefined,
    key,
    { progressOnly: true },
  );
  sync.stop();
  const reopened = engine();
  await reopened.prepare();
  expect(reopened.status).toBe("saved");
  expect(await readOutbox(key)).toHaveLength(0);
  const sent = api.calls
    .filter((c) => c.name === "quiz_sync_apply")
    .map((c) => c.args.packet_text);
  expect(sent[0]).toBe(frozen);
  expect(sent[1]).toBe(frozen);
  const result = (await read(key))!;
  expect(result.events).toHaveLength(1);
  expect(result.settings.sound).toBe(false);
  expect(Buffer.byteLength(frozen)).toBeLessThan(12000);
  reopened.stop();
});
it("erkennt die eigene Aktivierung trotz verlorener Bestätigung und sendet spätere lokale Absichten anschließend", async () => {
  const { api, key, engine } = await setup();
  api.lost("quiz_sync_activate");
  const sync = engine();
  await sync.prepare();
  expect(sync.status).toBe("offline");
  await update(
    (s) => {
      s.settings.sound = false;
    },
    undefined,
    key,
    { progressOnly: true },
  );
  sync.stop();
  const reopened = engine();
  await reopened.prepare();
  expect(reopened.status).toBe("saved");
  expect(await readOutbox(key)).toHaveLength(0);
  expect((await read(key))!.settings.sound).toBe(false);
  reopened.stop();
});
it("erhält Offlineänderungen und macht konkurrierende Spielabsichten sichtbar; ausdrückliche Übernahme erhält eine Rückfallkopie", async () => {
  const { owner, api, key, engine } = await setup(),
    sync = engine();
  await sync.prepare();
  await update(
    (s) => {
      s.settings.sound = false;
    },
    undefined,
    key,
    { progressOnly: true },
  );
  api.unavailable("quiz_sync_apply");
  await sync.flush();
  expect(sync.status).toBe("offline");
  const head = (await readEntryHead(key))!;
  await api.call("quiz_sync_apply", {
    packet_text: stableStringify({
      format: SYNC_FORMAT,
      protocol: 1,
      id: crypto.randomUUID(),
      owner,
      generation: head.generation,
      expectedRevision: head.revision,
      objects: [],
      changes: [
        {
          op: "put",
          row: {
            kind: "field",
            id: "settings",
            position: 0,
            value: {
              ...(await read(key))!.settings,
              haptics: true,
              sound: true,
            },
          },
        },
      ],
    }),
  });
  sync.stop();
  const reopened = engine();
  await reopened.prepare();
  expect(reopened.status).toBe("conflict");
  expect((await read(key))!.settings.sound).toBe(false);
  await reopened.acceptRemote();
  await reopened.prepare();
  expect(reopened.status).toBe("saved");
  expect((await read(key))!.settings.haptics).toBe(true);
  expect((await read(key))!.settings.sound).toBe(true);
  reopened.stop();
});
it("lädt saubere Fremdänderungen gezielt nach, nutzt bei abgelaufenem Cursor einen vollständigen Abruf und ersetzt entfernte Runden", async () => {
  const { owner, api, key, engine } = await setup(true),
    sync = engine();
  await sync.prepare();
  sync.stop();
  const head = (await readEntryHead(key))!;
  const send = async () =>
    api.call("quiz_sync_apply", {
      packet_text: stableStringify({
        format: SYNC_FORMAT,
        protocol: 1,
        id: crypto.randomUUID(),
        owner,
        generation: head.generation,
        expectedRevision: head.revision,
        objects: [],
        changes: [
          {
            op: "put",
            row: {
              kind: "field",
              id: "settings",
              position: 0,
              value: { ...(await read(key))!.settings, sound: false },
            },
          },
        ],
      }),
    });
  await send();
  api.calls.length = 0;
  const second = engine();
  await second.prepare();
  expect(second.status).toBe("saved");
  expect(
    api.calls.find((c) => c.name === "quiz_sync_page")!.args.after_revision,
  ).toBe(head.revision);
  expect((await read(key))!.settings.sound).toBe(false);
  second.stop();
  // A replacement uses a new generation; no upsert can leave removed history.
  await restore(emptyState(release.questions), key);
  const third = engine();
  await third.prepare();
  expect(third.status).toBe("saved");
  expect((await read(key))!.rounds).toHaveLength(0);
  expect((await getMetadata(api, owner)).generation).not.toBe(head.generation);
  third.stop();
  const remote = (await readEntryHead(key))!;
  await fixture.db.query(
    "update public.quiz_account_heads set revision=revision+1,cursor_floor=revision+1 where owner_id=$1",
    [owner],
  );
  const fourth = engine();
  api.calls.length = 0;
  await fourth.prepare();
  expect(fourth.status).toBe("saved");
  expect(
    api.calls.find((c) => c.name === "quiz_sync_page")!.args.after_revision,
  ).toBe(-1);
  expect((await readEntryHead(key))!.revision).toBe(remote.revision + 1);
  fourth.stop();
});
it("prüft große ursprüngliche before-Maps samt Unicode und privaten Kataloginhalten ohne Kürzung", async () => {
  const { key, engine } = await setup(true);
  await update(
    (s) => {
      const r = s.rounds[0];
      for (let i = 0; i < 5000; i++)
        r.before[`historisch-${i}-🎬`] = {
          knowledgeId: `historisch-${i}-🎬`,
          stage: 0,
          status: "entdeckt",
          due: 0,
          lastSecure: 0,
          lastSeenAt: null,
          lastAdvancedDay: "",
          secureDays: [],
          seen: 0,
        };
      const q = s.questions.find((q) => q.id === r.questions[0].id)!;
      q.question += " – persönliche Ergänzung 🎬";
      r.questions[0] = structuredClone(q);
    },
    undefined,
    key,
  );
  const before = validateBackup((await read(key))!),
    sync = engine();
  await sync.prepare();
  expect(sync.status).toBe("saved");
  expect(jsonEqual(await read(key), before)).toBe(true);
  expect(Object.keys((await read(key))!.rounds[0].before)).toHaveLength(
    Object.keys(before.rounds[0].before).length,
  );
  sync.stop();
});

it("übernimmt Duellteilimporte und Rate-Korrekturen ohne Kürzen ursprünglicher großer before-Maps", async () => {
  const { key, engine } = await setup(),
    duelId = crypto.randomUUID();
  const view: DuelView = {
    duel: {
      id: duelId,
      opponent: "Synthetisch",
      status: "active",
      kind: "invite",
      solutionDisplay: "question",
      round: 1,
      myTurn: true,
      dueAt: now + 86400000,
      createdAt: now,
      reason: null,
      result: null,
      invitation: null,
      rounds: [1, 2, 3].map((number) => ({
        number,
        answered: 0,
        mine: null,
        opponent: null,
      })),
    },
    number: 1,
    answered: 10,
    current: null,
    serverNow: now + 10000,
    items: [
      ...new Map(
        importCsv(readFileSync("public/fragen.csv", "utf8")).questions.map(
          (q) => [q.knowledgeId, q],
        ),
      ).values(),
    ]
      .slice(0, 10)
      .map((question, i) => ({
        question: structuredClone(question),
        order: question.answers.map((a) => a.id),
        event: {
          answerId: question.correctId,
          dontKnow: false,
          correct: true,
          guessed: false,
          at: now + i * 1000,
          elapsedMs: 1000,
        },
      })),
  };
  view.items[9].question.version = "historisches-duell-v0";
  await update(
    (s) => {
      for (let i = 0; i < 2000; i++)
        s.learning[`alt-${i}`] = {
          knowledgeId: `alt-${i}`,
          stage: 0,
          status: "entdeckt",
          due: 0,
          lastSecure: null,
          lastSeenAt: null,
          lastAdvancedDay: null,
          secureDays: [],
          seen: 0,
        };
      importDuelView(s, { ...view, items: view.items.slice(0, 3) });
    },
    undefined,
    key,
  );
  const sync = engine();
  await sync.prepare();
  expect(sync.status).toBe("saved");
  const before = structuredClone((await read(key))!.rounds[0].before);
  expect(Object.keys(before)).toHaveLength(2000);
  view.items[0].event.guessed = true;
  await update(
    (s) => importDuelView(s, { ...view, items: view.items.slice(0, 6) }),
    undefined,
    key,
    { progressOnly: false },
  );
  await sync.flush();
  expect(sync.status).toBe("saved");
  expect((await read(key))!.events).toHaveLength(6);
  expect((await read(key))!.events[0].guessed).toBe(true);
  expect((await read(key))!.rounds[0].before).toEqual(before);
  await update((s) => importDuelView(s, view), undefined, key, {
    progressOnly: false,
  });
  await sync.flush();
  expect(sync.status).toBe("saved");
  const result = (await read(key))!;
  expect(result.events).toHaveLength(10);
  expect(result.rounds[0].status).toBe("completed");
  expect(result.rounds[0].before).toEqual(before);
  expect(result.rounds[0].questions[9].version).toBe("historisches-duell-v0");
  await update((s) => importDuelView(s, view), undefined, key, {
    progressOnly: false,
  });
  await sync.flush();
  expect(await readOutbox(key)).toHaveLength(0);
  sync.stop();
});

it("bestätigt mehrseitige Erstabrufe konsistent und erhält während eines Downloads neu entstandene lokale Änderungen", async () => {
  const { owner, key, api, engine, legacy } = await setup();
  await update(
    (s) => {
      s.questions = s.questions.slice(0, 1);
      for (let i = 0; i < 210; i++) {
        const r = startRound(
          s,
          { mode: "ueben", topic: "Alle Themen", difficulty: "Alle Stufen" },
          now + i * 86400000,
        );
        answer(
          s,
          r.id,
          r.questions[0].id,
          r.questions[0].correctId,
          1000,
          r.startedAt + 1000,
        );
        r.status = "completed";
        r.finishedAt = r.startedAt + 2000;
      }
    },
    undefined,
    key,
  );
  const sync = engine();
  await sync.prepare();
  expect(sync.status).toBe("saved");
  sync.stop();
  const foreign = async () => {
    const meta = await getMetadata(api, owner);
    return api.call("quiz_sync_apply", {
      packet_text: stableStringify({
        format: SYNC_FORMAT,
        protocol: 1,
        id: crypto.randomUUID(),
        owner,
        generation: meta.generation,
        expectedRevision: meta.revision,
        objects: [],
        changes: [
          {
            op: "put",
            row: {
              kind: "field",
              id: "settings",
              position: 0,
              value: { ...(await read(key))!.settings, sound: false },
            },
          },
        ],
      }),
    });
  };
  api.calls.length = 0;
  api.hook(async (name) => {
    if (name === "quiz_sync_page") {
      api.hook(undefined);
      await foreign();
    }
  });
  const secondKey = `${key}:new-device`,
    newDevice = new EntrySync(
      api,
      owner,
      secondKey,
      { ...legacy, local: async () => undefined },
      () => {},
      async () => release,
    );
  await newDevice.prepare();
  expect(newDevice.status).toBe("saved");
  expect((await read(secondKey))!.events).toHaveLength(210);
  expect((await read(secondKey))!.settings.sound).toBe(false);
  expect(
    api.calls.filter((c) => c.name === "quiz_sync_page").length,
  ).toBeGreaterThan(3);
  newDevice.stop();
  api.hook(async (name) => {
    if (name === "quiz_sync_page") {
      api.hook(undefined);
      await update(
        (s) => {
          s.settings.haptics = true;
        },
        undefined,
        key,
        { progressOnly: true },
      );
    }
  });
  const reopened = engine();
  await reopened.prepare();
  expect(reopened.status).toBe("conflict");
  expect((await read(key))!.settings.haptics).toBe(true);
  expect(await readOutbox(key)).toHaveLength(1);
  reopened.stop();
}, 15000);

it("lässt bei Kontowechsel einen schon versandten Stand unverändert in dessen eigener Outbox", async () => {
  const first = await setup(),
    second = await setup(),
    sync = first.engine();
  await sync.prepare();
  await update(
    (s) => {
      s.settings.sound = false;
    },
    undefined,
    first.key,
    { progressOnly: true },
  );
  let releaseCall!: () => void, entered!: () => void;
  const gate = new Promise<void>((resolve) => (releaseCall = resolve)),
    started = new Promise<void>((resolve) => (entered = resolve)),
    original = first.api.call;
  first.api.call = async (name, args, timeout) => {
    if (name === "quiz_sync_apply") {
      entered();
      await gate;
    }
    return original(name, args, timeout);
  };
  const sending = sync.flush();
  await started;
  sync.stop();
  const other = second.engine();
  await other.prepare();
  expect(other.status).toBe("saved");
  releaseCall();
  await sending;
  expect(await readOutbox(first.key)).toHaveLength(1);
  expect(await readOutbox(second.key)).toHaveLength(0);
  expect((await read(second.key))!.settings.sound).toBe(true);
  first.api.call = original;
  const resumed = first.engine();
  await resumed.prepare();
  expect(resumed.status).toBe("saved");
  expect(await readOutbox(first.key)).toHaveLength(0);
  resumed.stop();
  other.stop();
});
it("verwendet bei Netzwerkfehlern keinen alten Writer und begrenzt hängende Paketaufrufe", async () => {
  const { key, legacy, api, engine } = await setup();
  await expect(
    createAccountSync(
      {
        ...api,
        call: async () => {
          throw new Error("Offline");
        },
      },
      "x",
      key,
      legacy,
      () => {},
    ),
  ).rejects.toThrow("Offline");
  const fallback = await createAccountSync(
    {
      ...api,
      call: async () => {
        throw new MissingSyncProtocol();
      },
    },
    "x",
    key,
    legacy,
    () => {},
  );
  fallback.stop();
  const sync = engine();
  await sync.prepare();
  await update(
    (s) => {
      s.settings.sound = false;
    },
    undefined,
    key,
    { progressOnly: true },
  );
  const original = api.call;
  api.call = async (name, args, timeout) =>
    name === "quiz_sync_apply"
      ? new Promise(() => {})
      : original(name, args, timeout);
  let entered = false;
  api.call = async (name, args, timeout) => {
    if (name === "quiz_sync_apply") {
      entered = true;
      return new Promise(() => {});
    }
    return original(name, args, timeout);
  };
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
  const pending = sync.flush();
  await vi.waitFor(() => expect(entered).toBe(true));
  await vi.advanceTimersByTimeAsync(30001);
  await pending;
  expect(sync.status).toBe("offline");
  expect(await readOutbox(key)).toHaveLength(1);
  vi.useRealTimers();
  api.call = original;
  await sync.flush();
  expect(sync.status).toBe("saved");
  sync.stop();
});

it("synchronisiert lange Rekordläufe und zählt wiederholte Wissensziele pro Antwortvorkommen", async () => {
  const { owner, key, engine } = await setup();
  await update(
    (s) => {
      s.questions = s.questions.slice(0, 1);
      s.bundledQuestionIds = s.questions.map((q) => q.id);
    },
    undefined,
    key,
  );
  const sync = engine();
  await sync.prepare();
  expect(sync.status).toBe("saved");
  await update(
    (s) => {
      const r = startRound(
        s,
        {
          mode: "fehlerfrei",
          topic: "Alle Themen",
          difficulty: "Alle Stufen",
          recordPreset: "custom",
        },
        now,
      );
      for (let i = 0; i < 12; i++) {
        const q = r.questions[r.events.length];
        answer(s, r.id, q.id, q.correctId, 1000, now + i * 2000, i);
      }
      const q = r.questions[r.events.length];
      answer(
        s,
        r.id,
        q.id,
        q.answers.find((a) => a.id !== q.correctId)!.id,
        1000,
        now + 26000,
        12,
      );
      validateBackup(s);
    },
    undefined,
    key,
    { progressOnly: true },
  );
  await sync.flush();
  expect(sync.status).toBe("saved");
  const rows = await fixture.db.query<{
    mode: string;
    correct: number;
    points: number;
  }>(
    "select mode,correct,points from public.quiz_shared_scores where owner_id=$1",
    [owner],
  );
  expect(rows.rows).toEqual([
    { mode: "fehlerfrei", correct: 12, points: 1896 },
  ]);
  const totals = await fixture.db.query<{
    completed: number;
    answered: number;
    correct: number;
  }>(
    "select completed::int,answered::int,correct::int from public.quiz_player_totals where owner_id=$1 and genre='' and difficulty=''",
    [owner],
  );
  expect(totals.rows).toEqual([{ completed: 1, answered: 13, correct: 12 }]);
  await update(
    (s) => {
      const r = startRound(
        s,
        {
          mode: "zeitkonto",
          topic: "Alle Themen",
          difficulty: "Alle Stufen",
          recordPreset: "custom",
        },
        now + 30000,
      );
      for (let i = 0; r.status === "active"; i++) {
        const q = r.questions[r.events.length];
        answer(
          s,
          r.id,
          q.id,
          q.answers.find((a) => a.id !== q.correctId)!.id,
          3000,
          now + 33000 + i * 4000,
          i,
        );
      }
      validateBackup(s);
    },
    undefined,
    key,
    { progressOnly: true },
  );
  await sync.flush();
  expect(sync.status).toBe("saved");
  const all = await fixture.db.query<{ mode: string; points: number }>(
    "select mode,points from public.quiz_shared_scores where owner_id=$1 order by mode",
    [owner],
  );
  expect(all.rows).toEqual([
    { mode: "fehlerfrei", points: 1896 },
    { mode: "zeitkonto", points: 0 },
  ]);
  expect((await read(key))!.bundledQuestionIds).toHaveLength(1);
  sync.stop();
  const reopened = engine();
  await reopened.prepare();
  expect(reopened.status).toBe("saved");
  reopened.stop();
});
