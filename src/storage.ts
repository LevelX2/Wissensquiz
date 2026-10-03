import { z } from "zod";
import { emptyState, questionSchema, type State } from "./model";
import { rebuild } from "./engine";
import { matchesFilters, usesFilmFilters } from "./filters";
import { matchesTopic } from "./categories";
import { questionSnapshotMatches } from "./filmFacts";
import { catalogKey, decodeLocalState, encodeLocalState } from "./localCatalog";
import { encodeQuestionCatalog } from "./catalogCodec";
import {
  isRecordMode,
  isEndlessMode,
  BANK_START,
  bankAfterAnswer,
  eventIdFor,
  runRule,
} from "./recordModes";
const time = z.number().finite().nonnegative();
const id = z.string().min(1).max(200);
const sources = z.array(z.enum(["film", "awards", "actors"])).max(3);
const familiarityList = z
  .array(z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]))
  .max(4);
const learningSchema = z.object({
  knowledgeId: id,
  stage: z.number().int().min(0).max(4),
  status: z.enum(["entdeckt", "geübt", "gefestigt"]),
  due: time,
  lastSecure: time.nullable(),
  lastSeenAt: time.nullable().default(null),
  lastAdvancedDay: z.string().nullable(),
  secureDays: z.array(z.string()),
  seen: z.number().int().nonnegative(),
});
const roundSchema = z.object({
  id,
  mode: z.enum([
    "entdecken",
    "ueben",
    "rekord",
    "fehler",
    "fehlerfrei",
    "zeitkonto",
  ]),
  topic: id,
  difficulty: id,
  filters: z
    .object({
      genres: z.array(id).max(20000),
      sources: sources.optional(),
      familiarities: familiarityList.optional(),
      difficulties: z
        .array(z.enum(["leicht", "mittel", "schwer", "experte"]))
        .min(1)
        .max(4),
    })
    .refine(
      (f) => f.genres.length > 0 || f.sources?.some((s) => s !== "film"),
      "Eine Runde braucht Filmgenres oder einen eigenständigen Fragenbereich.",
    )
    .optional(),
  ruleVersion: id,
  unlocks: z
    .array(
      z.union([
        z.object({ genre: id, difficulty: z.enum(["mittel", "schwer"]) }),
        z.object({
          genre: id,
          familiarity: z.union([
            z.literal(1),
            z.literal(2),
            z.literal(3),
            z.literal(4),
          ]),
        }),
      ]),
    )
    .optional(),
  familiaritySnapshot: z.record(id, z.number().int().min(0).max(4)).optional(),
  questions: z.array(questionSchema).min(1).max(100000),
  order: z.array(z.array(id).length(4)),
  events: z.array(z.string().min(1).max(500)).max(100000),
  recordPreset: z.enum(["standard", "custom"]).optional(),
  run: z
    .object({
      version: z.literal(1),
      pool: z.array(id).min(1).max(20000),
      queue: z.array(id).max(20000),
      cycle: z.number().int().positive(),
      bankMs: z.number().finite().min(0).max(BANK_START),
      ended: z.boolean(),
    })
    .optional(),
  startedAt: time,
  finishedAt: time.nullable(),
  status: z.enum(["active", "completed", "aborted"]),
  before: z.record(z.string(), learningSchema),
  solutionDisplay: z.enum(["question", "round"]).optional(),
  duel: z
    .object({ id: z.string().uuid(), number: z.number().int().min(1).max(3) })
    .optional(),
});
const stateSchema = z.object({
  schemaVersion: z.literal(1),
  questions: z.array(questionSchema).max(20000),
  bundledQuestionIds: z.array(id).max(20000).optional(),
  rounds: z.array(roundSchema).max(100000),
  events: z
    .array(
      z.object({
        id: z.string().min(1).max(500),
        roundId: id,
        questionId: id,
        knowledgeId: id,
        version: id,
        answerId: id.nullable(),
        dontKnow: z.literal(true).optional(),
        correct: z.boolean(),
        guessed: z.boolean(),
        at: time,
        knowledgePoints: z.number().int().min(0).max(100),
        timeBonus: z.number().int().min(0).max(60),
        elapsedMs: time,
      }),
    )
    .max(1000000),
  learning: z.record(z.string(), learningSchema),
  badges: z.array(z.enum(["sci-fi-10-v1"])),
  favorites: z.array(id).max(3),
  reports: z.array(
    z.object({
      id,
      questionId: id,
      version: id,
      comment: z.string().max(4000),
      at: time,
    }),
  ),
  imports: z.array(
    z.object({
      at: time,
      filename: z.string(),
      accepted: z.number().int().nonnegative(),
      rejected: z.number().int().nonnegative(),
      duplicates: z.number().int().nonnegative(),
      delimiter: z.string(),
      columns: z.array(z.string()),
      issues: z.array(z.string()),
      warnings: z.array(z.string()),
    }),
  ),
  settings: z.object({
    playGroup: z.enum(["learn", "timed", "duel"]).optional(),
    lastLearningMode: z.enum(["entdecken", "ueben", "fehler"]).optional(),
    lastTimedMode: z.enum(["rekord", "fehlerfrei", "zeitkonto"]).optional(),
    spoilers: z.boolean(),
    sound: z.boolean().optional(),
    haptics: z.boolean().optional(),
    showGenre: z.boolean().optional(),
    showDifficulty: z.boolean().optional(),
    questionHistory: z.enum(["after", "always", "hidden"]).optional(),
    solutionDisplay: z.enum(["question", "round"]).optional(),
    learningPath: z.boolean().optional(),
    allDifficulties: z.boolean().optional(),
    roundSetup: z
      .object({
        mode: z.enum([
          "entdecken",
          "ueben",
          "rekord",
          "fehler",
          "fehlerfrei",
          "zeitkonto",
        ]),
        recordPreset: z.enum(["standard", "custom"]).optional(),
        genres: z.array(id).max(20000).nullable(),
        categories: z
          .array(
            z.enum(["Classics", "Arthouse", "Preisträger", "Schauspieler"]),
          )
          .max(4),
        difficulties: z
          .array(z.enum(["leicht", "mittel", "schwer", "experte"]))
          .max(4),
        familiarities: familiarityList.optional(),
        sources: sources.optional(),
      })
      .optional(),
  }),
  experience: z.number().int().nonnegative(),
  career: z
    .object({
      version: z.literal(1),
      legacyBonus: z.number().int().nonnegative().max(2_500_750_000),
    })
    .optional(),
  journey: z
    .object({
      version: z.literal(1),
      earned: z.record(
        id,
        z.object({
          difficulty: z.number().int().min(0).max(2),
          familiarity: z.number().int().min(0).max(4),
        }),
      ),
    })
    .optional(),
  records: z.record(
    z.string(),
    z.object({ points: z.number().nonnegative(), roundId: id }),
  ),
});
export function validateBackup(value: unknown): State {
  const s = stateSchema.parse(value) as State;
  const unique = (ids: string[]) => new Set(ids).size === ids.length;
  if (
    !unique(s.questions.map((q) => q.id)) ||
    !unique(s.rounds.map((r) => r.id)) ||
    !unique(s.events.map((e) => e.id)) ||
    !unique(s.reports.map((r) => r.id)) ||
    !unique(s.favorites)
  )
    throw new Error("Doppelte IDs in Sicherung.");
  if (s.rounds.filter((r) => r.status === "active").length > 1)
    throw new Error("Mehrere aktive Runden.");
  const questionsById = new Map(s.questions.map((q) => [q.id, q]));
  if (
    s.bundledQuestionIds &&
    (!unique(s.bundledQuestionIds) ||
      s.bundledQuestionIds.some((id) => !questionsById.has(id)))
  )
    throw new Error("Ungültige Zuordnung der mitgelieferten Fragen.");
  const roundsById = new Map(s.rounds.map((r) => [r.id, r]));
  const eventsById = new Map(s.events.map((e) => [e.id, e]));
  const questionByEvent = new Map<string, State["questions"][number]>();
  const limitByEvent = new Map<string, number>();
  for (const r of s.rounds) {
    if (
      (!r.run && !unique(r.questions.map((q) => q.knowledgeId))) ||
      r.order.length !== r.questions.length ||
      r.events.length > r.questions.length
    )
      throw new Error("Ungültige Rundenzuordnung.");
    if (
      !!r.run !== isEndlessMode(r.mode) ||
      (!r.run && r.questions.length > 10)
    )
      throw new Error("Ungültiger Endloslauf.");
    if (
      r.recordPreset &&
      (!isRecordMode(r.mode) ||
        (r.run && r.ruleVersion !== runRule(r.mode, r.recordPreset)))
    )
      throw new Error("Ungültiger Rekordmodus.");
    if (
      r.recordPreset &&
      r.ruleVersion !== runRule(r.mode, r.recordPreset) &&
      r.ruleVersion !== runRule(r.mode, r.recordPreset) + ".L"
    )
      throw new Error("Ungültige Rekordregel.");
    if (r.run) {
      const pool = new Set(r.run.pool);
      const goals = new Set(
        r.run.pool.map((id) => questionsById.get(id)?.knowledgeId),
      );
      if (
        !r.recordPreset ||
        r.solutionDisplay === "round" ||
        goals.has(undefined) ||
        r.run.pool.some((id) => {
          const q = questionsById.get(id);
          return (
            !q ||
            !matchesTopic(q, r.topic) ||
            (r.filters && !matchesFilters(q, r.filters)) ||
            (r.recordPreset === "standard" &&
              s.bundledQuestionIds &&
              !s.bundledQuestionIds.includes(id))
          );
        }) ||
        pool.size !== r.run.pool.length ||
        !unique(r.run.queue) ||
        r.run.queue.some((id) => !pool.has(id)) ||
        r.questions.some((q) => !pool.has(q.id)) ||
        r.run.cycle !== Math.ceil(r.questions.length / goals.size)
      )
        throw new Error("Ungültiger Fragenpool im Lauf.");
      for (let i = 0; i < r.questions.length; i += goals.size)
        if (
          !unique(
            r.questions.slice(i, i + goals.size).map((q) => q.knowledgeId),
          )
        )
          throw new Error("Wissensziel innerhalb eines Durchgangs wiederholt.");
      const currentGoals = new Set(
        r.questions
          .slice((r.run.cycle - 1) * goals.size)
          .map((q) => q.knowledgeId),
      );
      const queueGoals = r.run.queue.map(
        (id) => questionsById.get(id)?.knowledgeId,
      );
      if (
        !unique(queueGoals as string[]) ||
        queueGoals.some((id) => currentGoals.has(id!)) ||
        queueGoals.length + currentGoals.size !== goals.size
      )
        throw new Error("Ungültige Restfolge im Lauf.");
    }
    r.questions.forEach((q, i) => {
      if (
        r.filters &&
        (!matchesFilters(
          q,
          r.familiaritySnapshot
            ? { ...r.filters, familiarities: undefined }
            : r.filters,
        ) ||
          !matchesTopic(q, r.topic) ||
          (r.familiaritySnapshot &&
            r.filters.familiarities &&
            usesFilmFilters(q, r.filters) &&
            !(r.familiaritySnapshot[q.id] === 0
              ? r.filters.familiarities.length === 4
              : r.filters.familiarities.some(
                  (level) => level === r.familiaritySnapshot![q.id],
                ))))
      )
        throw new Error("Frage passt nicht zur gespeicherten Rundenauswahl.");
      if (
        !unique(r.order[i]) ||
        r.order[i].some((id) => !q.answers.some((a) => a.id === id))
      )
        throw new Error("Ungültige Antwortreihenfolge.");
      const stored = questionsById.get(q.id);
      if (
        !stored ||
        stored.version !== q.version ||
        !questionSnapshotMatches(stored, q)
      )
        throw new Error(
          "Inhaltssnapshot stimmt nicht mit dem Fragenbestand überein.",
        );
    });
    if (
      (r.status === "completed" &&
        (r.events.length !== r.questions.length || r.finishedAt === null)) ||
      (r.status === "active" && r.finishedAt !== null)
    )
      throw new Error("Ungültiger Rundenabschluss.");
    r.events.forEach((eventId, i) => {
      const e = eventsById.get(eventId);
      const q = r.questions[i];
      if (
        !e ||
        e.roundId !== r.id ||
        e.questionId !== q.id ||
        e.knowledgeId !== q.knowledgeId ||
        e.version !== q.version ||
        e.id !== eventIdFor(r, i)
      )
        throw new Error("Antwort gehört nicht zur Frage.");
      questionByEvent.set(e.id, q);
    });
    if (r.run) {
      let bank = BANK_START;
      let ended = false;
      for (const eventId of r.events) {
        const e = eventsById.get(eventId)!;
        if (ended) throw new Error("Antwort nach beendetem Lauf.");
        const limit = r.mode === "zeitkonto" ? Math.min(30000, bank) : 30000;
        limitByEvent.set(e.id, limit);
        if (e.elapsedMs > limit)
          throw new Error("Antwortzeit über Laufgrenze.");
        if (r.mode === "zeitkonto")
          bank = bankAfterAnswer(bank, e.correct, e.elapsedMs);
        ended = r.mode === "fehlerfrei" ? !e.correct : bank === 0;
      }
      if (
        r.run.bankMs !== bank ||
        r.run.ended !== ended ||
        (r.status === "completed" && !ended) ||
        (ended && r.events.length !== r.questions.length) ||
        (!ended && r.questions.length !== r.events.length + 1)
      )
        throw new Error("Inkonsistenter Zeitvorrat oder Laufabschluss.");
    }
  }
  for (const e of s.events) {
    const r = roundsById.get(e.roundId);
    const q = questionByEvent.get(e.id);
    if (
      !r ||
      !q ||
      !r.events.includes(e.id) ||
      (e.answerId !== null && !q.answers.some((a) => a.id === e.answerId))
    )
      throw new Error("Verwaiste Antwort.");
    const correct =
      e.answerId === q.correctId &&
      (!isRecordMode(r.mode) ||
        e.elapsedMs < (limitByEvent.get(e.id) ?? 30000));
    const base = isRecordMode(r.mode) && correct ? 100 : 0;
    const bonus = base ? Math.floor((30000 - e.elapsedMs) / 1000) * 2 : 0;
    if (
      e.correct !== correct ||
      (e.guessed && !e.correct) ||
      (e.dontKnow &&
        (e.answerId !== null ||
          (isRecordMode(r.mode) &&
            e.elapsedMs >= (limitByEvent.get(e.id) ?? 30000)))) ||
      e.knowledgePoints !== base ||
      e.timeBonus !== bonus ||
      e.at < r.startedAt
    )
      throw new Error("Inkonsistente Antwortwertung.");
  }
  rebuild(s);
  return s;
}
let database: Promise<IDBDatabase> | undefined;
export function openDatabase() {
  return (database ??= new Promise<IDBDatabase>((resolve, reject) => {
    // Old builds open version 1 and cannot write the separated catalog layout.
    const req = indexedDB.open("wissensquiz", 2);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains("state"))
        req.result.createObjectStore("state");
    };
    req.onsuccess = () => {
      req.result.onversionchange = () => {
        req.result.close();
        database = undefined;
      };
      resolve(req.result);
    };
    req.onerror = () => {
      database = undefined;
      reject(req.error);
    };
    req.onblocked = () =>
      reject(new Error("Bitte andere Wissensquiz-Fenster schließen."));
  }));
}
export async function update(
  mutator: (state: State) => void,
  initial?: State,
  key = "current",
): Promise<State> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("state", "readwrite");
    const store = tx.objectStore("state");
    const req = store.get(key);
    const catalog = store.get(catalogKey(key));
    let result: State;
    let failure: unknown;
    catalog.onsuccess = () => {
      try {
        result =
          decodeLocalState(req.result, catalog.result, key) ??
          initial ??
          emptyState();
        mutator(result);
        // Compare exact content, not a hash: in-place edits and imports must be
        // detected too. JSON avoids IndexedDB cloning thousands of nested objects.
        const serialized = encodeQuestionCatalog(result.questions);
        if (serialized !== catalog.result)
          store.put(serialized, catalogKey(key));
        store.put(encodeLocalState(result, key), key);
      } catch (error) {
        failure = error;
        tx.abort();
      }
    };
    tx.oncomplete = () => resolve(result);
    tx.onerror = () => reject(failure ?? tx.error);
    tx.onabort = () =>
      reject(failure ?? tx.error ?? new Error("Speichern abgebrochen."));
  });
}
export async function read(key = "current"): Promise<State | undefined> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("state");
    const store = tx.objectStore("state");
    const req = store.get(key);
    const catalog = store.get(catalogKey(key));
    tx.oncomplete = () => {
      try {
        resolve(decodeLocalState(req.result, catalog.result, key));
      } catch (error) {
        reject(error);
      }
    };
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error ?? new Error("Lesen abgebrochen."));
  });
}
export async function restore(value: unknown, key = "current") {
  const checked = validateBackup(value);
  for (const r of checked.rounds)
    if (r.status === "active" && isRecordMode(r.mode)) {
      r.status = "aborted";
      r.finishedAt = Date.now();
    }
  return update((s) => Object.assign(s, checked), undefined, key);
}
export function download(filename: string, value: unknown) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(value, null, 2)], { type: "application/json" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
