import type { Mode, Round } from "./model";
import { roundQuestionCount } from "./roundArchive";

export const recordModes = ["rekord", "fehlerfrei", "zeitkonto"] as const;
export type RecordMode = (typeof recordModes)[number];
export const isRecordMode = (mode: Mode): mode is RecordMode =>
  (recordModes as readonly string[]).includes(mode);
export const isEndlessMode = (mode: Mode) =>
  mode === "fehlerfrei" || mode === "zeitkonto";
export const allowsSolutionChoice = (mode: Mode) =>
  isRecordMode(mode) || mode === "ueben";
export const modeNames: Record<Mode, string> = {
  entdecken: "Filmreise",
  ueben: "Freies Spiel",
  fehler: "Wiederholen",
  rekord: "10 Fragen",
  fehlerfrei: "Fehlerfrei",
  zeitkonto: "Zeitkonto",
};
export const BANK_START = 120_000;
export const BANK_BONUS = 15_000;
export const BANK_PENALTY = 45_000;
export const QUESTION_LIMIT = 30_000;
export const questionLimit = (round: Round) =>
  round.mode === "zeitkonto"
    ? Math.min(QUESTION_LIMIT, round.run?.bankMs ?? BANK_START)
    : QUESTION_LIMIT;
export const bankAfterAnswer = (
  bank: number,
  correct: boolean,
  spent: number,
) => {
  const left = Math.max(0, bank - spent);
  return left === 0
    ? 0
    : Math.max(
        0,
        Math.min(BANK_START, left + (correct ? BANK_BONUS : -BANK_PENALTY)),
      );
};
export const eventIdFor = (round: Round, index: number) =>
  `${round.id}:${round.questions[index].knowledgeId}${round.run ? `:${index}` : ""}`;
export const runRule = (mode: Mode, preset: "standard" | "genre" | "custom") =>
  `solo-v1.${mode}.${preset}`;
export const isRankedRecord = (round: Round) => {
  const preset = round.recordPreset,
    filters = round.filters;
  return (
    isRecordMode(round.mode) &&
    (preset === "standard" || preset === "genre") &&
    round.ruleVersion === runRule(round.mode, preset) &&
    round.topic === "Alle Themen" &&
    !!filters &&
    JSON.stringify([...filters.difficulties].sort()) ===
      '["leicht","mittel","schwer"]' &&
    JSON.stringify(filters.familiarities) === "[1,2,3,4]" &&
    JSON.stringify(filters.sources) ===
      (preset === "genre" ? '["film"]' : '["film","awards","actors"]') &&
    (preset === "genre"
      ? filters.genres.length === 1
      : filters.genres.length > 0) &&
    (round.mode !== "rekord" || roundQuestionCount(round) === 10)
  );
};
export const recordSelectionLabel = (round: Round) =>
  round.recordPreset === "genre"
    ? `Genre · ${round.filters?.genres[0] ?? "Filmfragen"}`
    : "Königsklasse";

export type RecordPeriod = "week" | "month" | "year" | "all";
export const periodNames: Record<RecordPeriod, string> = {
  week: "Woche",
  month: "Monat",
  year: "Jahr",
  all: "Allzeit",
};
const berlinDate = (at: number) => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Berlin",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(at);
  const value = (name: string) =>
    Number(parts.find((p) => p.type === name)!.value);
  return new Date(Date.UTC(value("year"), value("month") - 1, value("day")));
};
export function inPeriod(at: number, period: RecordPeriod, now = Date.now()) {
  if (period === "all") return true;
  const date = berlinDate(at),
    current = berlinDate(now);
  if (period === "year")
    return date.getUTCFullYear() === current.getUTCFullYear();
  if (period === "month")
    return (
      date.getUTCFullYear() === current.getUTCFullYear() &&
      date.getUTCMonth() === current.getUTCMonth()
    );
  const monday = (d: Date) =>
    d.getTime() - ((d.getUTCDay() + 6) % 7) * 86_400_000;
  return monday(date) === monday(current);
}
