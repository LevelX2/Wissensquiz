import { z } from "zod";
import { emptyState, questionSchema, type State } from "./model";
import { rebuild } from "./engine";
import { matchesFilters } from "./filters";
const time = z.number().finite().nonnegative();
const id = z.string().min(1).max(200);
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
  mode: z.enum(["entdecken", "ueben", "rekord"]),
  topic: id,
  difficulty: id,
  filters: z
    .object({
      genres: z.array(id).min(1).max(20000),
      difficulties: z
        .array(z.enum(["leicht", "mittel", "schwer"]))
        .min(1)
        .max(3),
    })
    .optional(),
  ruleVersion: id,
  questions: z.array(questionSchema).min(1).max(10),
  order: z.array(z.array(id).length(4)),
  events: z.array(id).max(10),
  startedAt: time,
  finishedAt: time.nullable(),
  status: z.enum(["active", "completed", "aborted"]),
  before: z.record(z.string(), learningSchema),
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
  settings: z.object({ spoilers: z.boolean() }),
  experience: z.number().int().nonnegative(),
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
        (!matchesFilters(q, r.filters) ||
          (r.topic !== "Alle Themen" && q.topic !== r.topic))
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
            JSON.stringify(stored) === JSON.stringify(q),
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
): Promise<State> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("state", "readwrite");
    const store = tx.objectStore("state");
    const req = store.get("current");
    let result: State;
    let failure: unknown;
    req.onsuccess = () => {
      try {
        result = req.result ?? initial ?? emptyState();
        mutator(result);
        store.put(result, "current");
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
export async function read(): Promise<State | undefined> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const req = db.transaction("state").objectStore("state").get("current");
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
export async function restore(value: unknown) {
  const checked = validateBackup(value);
  for (const r of checked.rounds)
    if (r.status === "active" && r.mode === "rekord") {
      r.status = "aborted";
      r.finishedAt = Date.now();
    }
  return update((s) => Object.assign(s, checked));
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
