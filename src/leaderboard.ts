import { ruleLabel } from "./familiarity";
import { points, recordKey } from "./engine";
import {
  canonicalFilters,
  genreOf,
  genreLabel,
  roundDifficulties,
  roundGenres,
} from "./filters";
import type { Round, State } from "./model";

export const genreSelection = (r: Round) =>
  [...new Set(r.filters?.genres ?? r.questions.map(genreOf))].sort();
export const genreSelectionKey = (r: Round) =>
  JSON.stringify(genreSelection(r));
export const genreSelectionLabel = (r: Round) =>
  genreSelection(r).map(genreLabel).join(" + ");
export const levelSelectionKey = (r: Round) =>
  r.filters
    ? JSON.stringify(canonicalFilters(r.filters).difficulties)
    : `historisch:${r.difficulty}`;
export const categoryLabel = (r: Round) =>
  `${roundGenres(r)} · ${roundDifficulties(r)} · ${r.questions.length} Fragen · Regel ${ruleLabel(r.ruleVersion)}${r.filters ? "" : " · frühere Themenauswahl"}`;

export function leaderboard(state: State) {
  const groups = new Map<
    string,
    {
      key: string;
      round: Round;
      entries: {
        round: Round;
        points: number;
        correct: number;
        elapsedMs: number;
        rank: number;
      }[];
    }
  >();
  const byRound = new Map<string, State["events"]>();
  for (const event of state.events) {
    const events = byRound.get(event.roundId) ?? [];
    events.push(event);
    byRound.set(event.roundId, events);
  }
  for (const round of state.rounds) {
    if (round.mode !== "rekord" || round.status !== "completed") continue;
    const key = recordKey(round);
    const group = groups.get(key) ?? { key, round, entries: [] };
    const events = byRound.get(round.id) ?? [];
    group.entries.push({
      round,
      points: points(events),
      correct: events.filter((e) => e.correct).length,
      elapsedMs: events.reduce((sum, e) => sum + e.elapsedMs, 0),
      rank: 0,
    });
    groups.set(key, group);
  }
  for (const group of groups.values()) {
    group.entries.sort(
      (a, b) =>
        b.points - a.points ||
        (a.round.finishedAt ?? 0) - (b.round.finishedAt ?? 0) ||
        a.round.id.localeCompare(b.round.id),
    );
    group.entries.forEach((entry, i) => {
      entry.rank =
        i && entry.points === group.entries[i - 1].points
          ? group.entries[i - 1].rank
          : i + 1;
    });
  }
  return [...groups.values()].sort((a, b) =>
    categoryLabel(a.round).localeCompare(categoryLabel(b.round), "de"),
  );
}
