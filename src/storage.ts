import { z } from "zod";
import { emptyState, questionSchema, type State, type Question } from "./model";
import { rebuild } from "./engine";
import { matchesFilters } from "./filters";
import { matchesTopic } from "./categories";
import { questionSnapshotMatches } from "./filmFacts";
const time = z.number().finite().nonnegative();
const id = z.string().min(1).max(200);
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
  mode: z.enum(["entdecken", "ueben", "rekord", "fehler"]),
  topic: id,
  difficulty: id,
  filters: z
    .object({
      genres: z.array(id).min(1).max(20000),
      familiarities: familiarityList.optional(),
      difficulties: z
        .array(z.enum(["leicht", "mittel", "schwer", "experte"]))
        .min(1)
        .max(4),
    })
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
  questions: z.array(questionSchema).min(1).max(10),
  order: z.array(z.array(id).length(4)),
  events: z.array(id).max(10),
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
  rounds: z.array(roundSchema).max(100000),
  events: z
    .array(
      z.object({
        id,
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
        mode: z.enum(["entdecken", "ueben", "rekord", "fehler"]),
        genres: z.array(id).max(20000).nullable(),
        categories: z
          .array(z.enum(["Classics", "Arthouse", "Preisträger"]))
          .max(3),
        difficulties: z
          .array(z.enum(["leicht", "mittel", "schwer", "experte"]))
          .max(4),
        familiarities: familiarityList.optional(),
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
  for (const r of s.rounds) {
    if (
      !unique(r.questions.map((q) => q.knowledgeId)) ||
      r.order.length !== r.questions.length ||
      r.events.length > r.questions.length
    )
      throw new Error("Ungültige Rundenzuordnung.");
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
      if (
        !s.questions.some(
          (stored) =>
            stored.id === q.id &&
            stored.version === q.version &&
            questionSnapshotMatches(stored, q),
        )
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
      const e = s.events.find((e) => e.id === eventId);
      const q = r.questions[i];
      if (
        !e ||
        e.roundId !== r.id ||
        e.questionId !== q.id ||
        e.knowledgeId !== q.knowledgeId ||
        e.version !== q.version ||
        e.id !== `${r.id}:${q.knowledgeId}`
      )
        throw new Error("Antwort gehört nicht zur Frage.");
    });
  }
  for (const e of s.events) {
    const r = s.rounds.find((r) => r.id === e.roundId);
    const q = r?.questions.find((q) => q.id === e.questionId);
    if (
      !r ||
      !q ||
      !r.events.includes(e.id) ||
      (e.answerId !== null && !q.answers.some((a) => a.id === e.answerId))
    )
      throw new Error("Verwaiste Antwort.");
    const correct =
      e.answerId === q.correctId &&
      (r.mode !== "rekord" || e.elapsedMs < 30000);
    const base = r.mode === "rekord" && correct ? 100 : 0;
    const bonus = base ? Math.floor((30000 - e.elapsedMs) / 1000) * 2 : 0;
    if (
      e.correct !== correct ||
      (e.guessed && !e.correct) ||
      (e.dontKnow &&
        (e.answerId !== null ||
          (r.mode === "rekord" && e.elapsedMs >= 30000))) ||
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
const CATALOG_FORMAT = "quiz-local-catalog-v1";
type CatalogRef = { storageFormat: typeof CATALOG_FORMAT; key: string };
type StoredState = Omit<State, "questions"> & {
  questions: Question[] | CatalogRef;
};
const catalogs = new Map<string, { key: string; questions: Question[] }>();
const immutableCatalogs = new WeakSet<Question[]>();
export const isImmutableCatalog = (questions: Question[]) =>
  immutableCatalogs.has(questions);
export type UpdateOptions = { reuseCatalog?: boolean };

function freezeCatalog(questions: Question[]) {
  function freeze(value: object) {
    for (const child of Object.values(value))
      if (child && typeof child === "object" && !Object.isFrozen(child))
        freeze(child);
    Object.freeze(value);
  }
  freeze(questions);
  immutableCatalogs.add(questions);
  return questions;
}

// Historical snapshots stay complete. Intern equal snapshots so IndexedDB's
// structured clone stores shared objects once, even after hundreds of rounds.
function compactRounds(state: State) {
  const seen = new WeakMap<Question, Question>();
  const content = new Map<string, Question>();
  return state.rounds.map((round) => ({
    ...round,
    questions: round.questions.map((question) => {
      const known = seen.get(question);
      if (known) return known;
      const signature = JSON.stringify(question);
      const canonical = content.get(signature) ?? question;
      content.set(signature, canonical);
      seen.set(question, canonical);
      return canonical;
    }),
  }));
}

function loadCatalog(
  store: IDBObjectStore,
  key: string,
  value: StoredState,
  accept: (questions: Question[], ref?: CatalogRef) => void,
) {
  if (Array.isArray(value.questions)) {
    accept(value.questions);
    return;
  }
  const ref = value.questions;
  if (
    ref?.storageFormat !== CATALOG_FORMAT ||
    !ref.key.startsWith(`catalog:${key}:`)
  )
    throw new Error("Ungültiger lokaler Fragenkatalog.");
  const cached = catalogs.get(key);
  if (cached?.key === ref.key) {
    accept(cached.questions, ref);
    return;
  }
  const request = store.get(ref.key);
  request.onsuccess = () => {
    // A missing catalog must never be replaced with an empty game state.
    if (!Array.isArray(request.result)) {
      store.transaction.abort();
      return;
    }
    const questions = freezeCatalog(request.result as Question[]);
    catalogs.set(key, { key: ref.key, questions });
    accept(questions, ref);
  };
}
export function openDatabase() {
  return (database ??= new Promise<IDBDatabase>((resolve, reject) => {
    const req = indexedDB.open("wissensquiz", 1);
    req.onupgradeneeded = () => req.result.createObjectStore("state");
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
  options: UpdateOptions = {},
): Promise<State> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("state", "readwrite");
    const store = tx.objectStore("state");
    const req = store.get(key);
    let result: State;
    let failure: unknown;
    let nextCatalog: { key: string; questions: Question[] } | undefined;
    req.onsuccess = () => {
      try {
        const stored: StoredState = req.result ?? initial ?? emptyState();
        loadCatalog(store, key, stored, (catalog, prior) => {
          try {
            const questions =
              options.reuseCatalog && prior
                ? catalog
                : structuredClone(catalog);
            result = { ...stored, questions };
            mutator(result);
            // Reusing a frozen catalog is opt-in for answer/guess mutations.
            // A duel with a new snapshot replaces its array and writes it atomically.
            const reuse = prior && result.questions === catalog;
            const ref: CatalogRef = reuse
              ? prior
              : {
                  storageFormat: CATALOG_FORMAT,
                  key: `catalog:${key}:${crypto.randomUUID()}`,
                };
            if (!reuse) {
              store.put(result.questions, ref.key);
              if (prior) store.delete(prior.key);
            }
            store.put(
              { ...result, questions: ref, rounds: compactRounds(result) },
              key,
            );
            if (!reuse)
              nextCatalog = { key: ref.key, questions: result.questions };
          } catch (error) {
            failure = error;
            tx.abort();
          }
        });
      } catch (error) {
        failure = error;
        tx.abort();
      }
    };
    tx.oncomplete = () => {
      if (nextCatalog) {
        freezeCatalog(nextCatalog.questions);
        catalogs.set(key, nextCatalog);
      }
      resolve(result);
    };
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
    let result: State | undefined;
    let failure: unknown;
    req.onsuccess = () => {
      try {
        if (!req.result) return;
        loadCatalog(store, key, req.result, (questions) => {
          result = { ...req.result, questions: structuredClone(questions) };
        });
      } catch (error) {
        failure = error;
        tx.abort();
      }
    };
    tx.oncomplete = () => resolve(result);
    tx.onerror = tx.onabort = () =>
      reject(
        failure ??
          tx.error ??
          new Error("Fragenkatalog konnte nicht geladen werden."),
      );
  });
}
export async function restore(value: unknown, key = "current") {
  const checked = validateBackup(value);
  for (const r of checked.rounds)
    if (r.status === "active" && r.mode === "rekord") {
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
