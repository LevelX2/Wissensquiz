import type { State } from "./model";
import { stateSchema } from "./backupSchema";
import { rebuild } from "./engine";
import { matchesFilters, usesFilmFilters } from "./filters";
import { matchesTopic } from "./categories";
import { questionSnapshotMatches } from "./filmFacts";
import { roundFacts } from "./roundArchive";
import {
  isRecordMode,
  isEndlessMode,
  BANK_START,
  bankAfterAnswer,
  eventIdFor,
  runRule,
  isServerRun,
} from "./recordModes";
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
  const questionByEvent = new Map<
    string,
    ReturnType<typeof roundFacts>[number]
  >();
  const limitByEvent = new Map<string, number>();
  for (const r of s.rounds) {
    const facts = roundFacts(r);
    if (
      r.recordPreset === "genre" &&
      (!r.filters ||
        r.filters.genres.length !== 1 ||
        r.topic !== "Alle Themen" ||
        JSON.stringify(r.filters.sources) !== '["film"]' ||
        JSON.stringify([...r.filters.difficulties].sort()) !==
          '["leicht","mittel","schwer"]' ||
        JSON.stringify(r.filters.familiarities) !== "[1,2,3,4]")
    )
      throw new Error(
        "Genre-Rekorde brauchen genau ein Genre und den festen Schwierigkeitsmix.",
      );
    if (
      !facts.length ||
      (r.archive &&
        (r.status === "active" ||
          r.questions.length ||
          r.order.length ||
          Object.keys(r.before).length ||
          r.familiaritySnapshot ||
          r.run?.pool.length ||
          r.run?.queue.length))
    )
      throw new Error("Ungültiges Ergebnisarchiv.");
    if (
      (!r.run && !unique(facts.map((q) => q.knowledgeId))) ||
      (!r.archive && r.order.length !== facts.length) ||
      r.events.length > facts.length
    )
      throw new Error("Ungültige Rundenzuordnung.");
    if (!!r.run !== isEndlessMode(r.mode) || (!r.run && facts.length > 10))
      throw new Error("Ungültiger Endloslauf.");
    if (
      r.recordPreset &&
      (!isRecordMode(r.mode) ||
        (r.run &&
          r.ruleVersion !== runRule(r.mode, r.recordPreset) &&
          !isServerRun(r)))
    )
      throw new Error("Ungültiger Rekordmodus.");
    if (
      r.recordPreset &&
      r.ruleVersion !== runRule(r.mode, r.recordPreset) &&
      r.ruleVersion !== runRule(r.mode, r.recordPreset) + ".L" &&
      !isServerRun(r)
    )
      throw new Error("Ungültige Rekordregel.");
    if (r.run && !r.archive) {
      const pool = new Set(r.run.pool);
      const goals = new Set(
        r.run.pool.map((id) => questionsById.get(id)?.knowledgeId),
      );
      if (
        !r.recordPreset ||
        !pool.size ||
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
      r.archive &&
      facts.some(
        (q) =>
          !("answerIds" in q) ||
          !unique(q.answerIds) ||
          !q.answerIds.includes(q.correctId),
      )
    )
      throw new Error("Ungültige Wertungsdaten im Ergebnisarchiv.");
    if (
      (r.status === "completed" &&
        (r.events.length !== facts.length || r.finishedAt === null)) ||
      (r.status === "active" && r.finishedAt !== null)
    )
      throw new Error("Ungültiger Rundenabschluss.");
    r.events.forEach((eventId, i) => {
      const e = eventsById.get(eventId);
      const q = facts[i];
      if (
        !e ||
        e.roundId !== r.id ||
        e.questionId !== q.id ||
        e.knowledgeId !== q.knowledgeId ||
        e.version !== q.version ||
        e.id !==
          (r.archive
            ? `${r.id}:${q.knowledgeId}${r.run ? `:${i}` : ""}`
            : eventIdFor(r, i))
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
        (ended && r.events.length !== facts.length) ||
        (!ended &&
          facts.length !== r.events.length + 1 &&
          !(
            isServerRun(r) &&
            r.status === "aborted" &&
            facts.length === r.events.length
          ))
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
      (e.answerId !== null &&
        !("answerIds" in q
          ? q.answerIds.includes(e.answerId)
          : q.answers.some((a) => a.id === e.answerId)))
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
