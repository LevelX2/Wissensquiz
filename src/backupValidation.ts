import type { State } from "./model";
import { stateSchema } from "./backupSchema";
import { rebuild } from "./engine";
import { matchesFilters, usesFilmFilters } from "./filters";
import { matchesTopic } from "./categories";
import { questionSnapshotMatches } from "./filmFacts";

export function validateBackup(value: unknown): State {
  const s = stateSchema.parse(value);
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
  const roundsById = new Map(s.rounds.map((r) => [r.id, r]));
  const eventsById = new Map(s.events.map((e) => [e.id, e]));
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
        e.id !== `${r.id}:${q.knowledgeId}`
      )
        throw new Error("Antwort gehört nicht zur Frage.");
    });
  }
  for (const e of s.events) {
    const r = roundsById.get(e.roundId);
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
