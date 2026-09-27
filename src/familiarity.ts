import catalog from "./filmFamiliarity.json" with { type: "json" };
import type { Question, Round } from "./model";

export const familiarities = [1, 2, 3, 4] as const;
export type Familiarity = (typeof familiarities)[number];
export const familiarityNames: Record<Familiarity, string> = {
  1: "Film-Ikonen",
  2: "Bekannte Filme",
  3: "Kennerfilme",
  4: "Entdeckungen",
};
const byFilm = new Map(
  catalog.films.map((f) => [f.film, f.level as Familiarity]),
);
export const filmIdentity = (q: Question) =>
  `${q.metadata.film_title_original}|${q.metadata.film_year}`;
// Unclassified imports remain available in free modes, explicitly separate from the four classes.
export const familiarityOf = (q: Question): Familiarity | undefined =>
  byFilm.get(filmIdentity(q));
export const familiarityLabel = (level: number | undefined) =>
  level
    ? `${level} · ${familiarityNames[level as Familiarity]}`
    : "Noch nicht eingeordnet";
export const roundFamiliarities = (r: Round) =>
  r.filters?.familiarities?.map(familiarityLabel).join(" + ") ??
  "Frühere Auswahl";

export function selectionRule(
  questions: Question[],
  levels: readonly number[],
) {
  const mix = new Map<string, number>();
  for (const q of questions) {
    const key = `${["leicht", "mittel", "schwer"].indexOf(q.difficulty)}${familiarityOf(q) ?? 0}`;
    mix.set(key, (mix.get(key) ?? 0) + 1);
  }
  return `2.B${[...levels].sort().join("")}.M${[...mix]
    .sort()
    .map(([k, n]) => `${k}:${n}`)
    .join(",")}`;
}
export function ruleLabel(version: string) {
  const match = /^2\.B([1-4]*)\.M([0-9:,]+)$/.exec(version);
  if (!match) return version;
  return `2 · Bekanntheit ${match[1].split("").join(" + ")} · Mischung ${match[2]
    .split(",")
    .map((part) => {
      const [cell, count] = part.split(":");
      return `${count}× ${["Leicht", "Mittel", "Schwer"][Number(cell[0])]} / ${cell[1] === "0" ? "offen" : `Gruppe ${cell[1]}`}`;
    })
    .join(", ")}`;
}
