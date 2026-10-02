import type { Learning, AnswerEvent } from "./model";
export const DAY = 86_400_000;
export const RULES = {
  version: "1",
  intervals: [1, 3, 7, 21],
  wrongMs: 10 * 60_000,
  guessedMs: 6 * 60 * 60_000,
  masteryDays: 4,
  masteryGap: 7 * DAY,
  badgeMinimum: 10,
};
// Learning days use the device's local calendar, independently of the round timer.
export const dayKey = (at: number) => {
  const d = new Date(at);
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
};
export function learn(
  previous: Learning | undefined,
  event: AnswerEvent,
): Learning {
  const p: Learning = previous
    ? structuredClone(previous)
    : {
        knowledgeId: event.knowledgeId,
        stage: 0,
        status: "entdeckt",
        due: 0,
        lastSecure: null,
        lastSeenAt: null,
        lastAdvancedDay: null,
        secureDays: [],
        seen: 0,
      };
  const previousSeenAt = p.lastSeenAt ?? p.lastSecure;
  p.lastSeenAt = event.at;
  p.seen++;
  if (!event.correct || event.guessed) {
    p.stage = 0;
    p.status = "entdeckt";
    p.due = event.at + (event.guessed ? RULES.guessedMs : RULES.wrongMs);
    return p;
  }
  const day = dayKey(event.at);
  if (p.lastAdvancedDay === day || (p.stage > 0 && event.at < p.due)) return p;
  const gap = previousSeenAt === null ? 0 : event.at - previousSeenAt;
  p.secureDays = [...new Set([...p.secureDays, day])];
  p.stage = Math.min(4, p.stage + 1);
  p.status =
    p.status === "gefestigt" ||
    (p.stage === 4 &&
      p.secureDays.length >= RULES.masteryDays &&
      gap >= RULES.masteryGap)
      ? "gefestigt"
      : "geübt";
  p.lastAdvancedDay = day;
  p.lastSecure = event.at;
  p.due = event.at + RULES.intervals[p.stage - 1] * DAY;
  return p;
}
