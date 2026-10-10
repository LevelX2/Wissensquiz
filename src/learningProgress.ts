import type { AnswerEvent, Learning, State } from "./model";
import { DAY, dayKey, learn } from "./learning";

export function learningOverview(ids: string[], learning: State["learning"]) {
  const goals = [...new Set(ids)];
  const stages = [0, 0, 0, 0];
  let unseen = 0,
    discovered = 0,
    mastered = 0,
    steps = 0;
  for (const id of goals) {
    const p = learning[id];
    if (!p) unseen++;
    else if (p.stage === 0) discovered++;
    else {
      stages[p.stage - 1]++;
      steps += p.stage;
    }
    if (p?.status === "gefestigt") mastered++;
  }
  const maximum = goals.length * 4;
  return {
    unseen,
    discovered,
    stages,
    mastered,
    steps,
    maximum,
    percent: maximum ? Math.round((10_000 * steps) / maximum) / 100 : 0,
  };
}

export function repetitionOverview(
  ids: string[],
  learning: State["learning"],
  now: number,
) {
  let due = 0;
  let later = 0;
  let nextAt: number | null = null;
  for (const id of new Set(ids)) {
    const progress = learning[id];
    if (!progress) continue;
    const repeatAt = nextLearningAt(progress, now);
    if (repeatAt <= now) due++;
    else {
      later++;
      nextAt = Math.min(nextAt ?? Infinity, repeatAt);
    }
  }
  return { due, later, nextAt };
}

export function learningAtAnswer(events: AnswerEvent[], event: AnswerEvent) {
  let previous: Learning | undefined;
  let openMistake = false;
  for (const e of events
    .filter((e) => e.knowledgeId === event.knowledgeId)
    .sort((a, b) => a.at - b.at)) {
    if (e.id === event.id) break;
    previous = learn(previous, e);
    if (!e.correct) openMistake = true;
    else if (!e.guessed) openMistake = false;
  }
  return {
    previous,
    current: learn(previous, event),
    resolvedMistake: openMistake && event.correct && !event.guessed,
  };
}

export function nextLearningAt(p: Learning, now: number) {
  if (p.lastAdvancedDay !== dayKey(now)) return p.due;
  const tomorrow = new Date(now);
  tomorrow.setHours(24, 0, 0, 0);
  return Math.max(p.due, tomorrow.getTime());
}

export function learningDueText(at: number, now: number) {
  if (at <= now) return "jetzt fällig";
  const ms = at - now;
  const relative =
    ms >= DAY
      ? `in ${Math.ceil(ms / DAY)} ${Math.ceil(ms / DAY) === 1 ? "Tag" : "Tagen"}`
      : ms >= 3_600_000
        ? `in ${Math.ceil(ms / 3_600_000)} ${Math.ceil(ms / 3_600_000) === 1 ? "Stunde" : "Stunden"}`
        : `in ${Math.ceil(ms / 60_000)} ${Math.ceil(ms / 60_000) === 1 ? "Minute" : "Minuten"}`;
  const date = new Date(at).toLocaleString("de-DE", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${relative} · ${date}`;
}

export function learningAnswerNote(
  previous: Learning | undefined,
  current: Learning,
  event: AnswerEvent,
) {
  if (!event.correct)
    return "Die Lernstufe beginnt wieder bei 0. Nach zehn Minuten ist dieses Ziel zur Wiederholung fällig.";
  if (event.guessed)
    return "Als geraten markiert: Die Lernstufe beginnt wieder bei 0. Ein vorhandener Fehler bleibt offen.";
  if (current.stage > (previous?.stage ?? 0))
    return current.status === "gefestigt"
      ? "Alle vier Lernstufen erreicht. Dein Wissen ist nach Abstand bestätigt."
      : "Eine Lernstufe erreicht. Jede erreichte Stufe zählt zu Deinem Lernfortschritt.";
  if (current.status === "gefestigt")
    return "Dein gefestigtes Wissen ist erneut bestätigt.";
  if (previous?.lastAdvancedDay === dayKey(event.at))
    return "Heute hast Du bereits eine Lernstufe erreicht. Pro Tag zählt eine neue Stufe; Dein Wiederholungstermin bleibt bestehen.";
  return "Richtig wiederholt. Die nächste Lernstufe ist noch nicht fällig; Dein Wiederholungstermin bleibt bestehen.";
}
