import catalog from "./runtimeMetadata.json" with { type: "json" };
import type { Question, Round } from "./model";
import { workReferencesOf, type WorkReference } from "./workAttributes";

export const familiarities = [1, 2, 3, 4] as const;
export type Familiarity = (typeof familiarities)[number];
export const familiarityNames: Record<Familiarity, string> = {
  1: "Sehr bekannt",
  2: "Bekannt",
  3: "Für Filmkenner",
  4: "Entdeckungen",
};
const byFilm = new Map<string, Familiarity>(
  catalog.films.map(([film, level]) => [film as string, level as Familiarity]),
);
const byPerson = new Map<string, Familiarity>(
  catalog.persons.map(([person, level]) => [
    person as string,
    level as Familiarity,
  ]),
);
export const filmIdentity = (q: Question) =>
  `${q.metadata.film_title_original}|${q.metadata.film_year}`;
export const workFamiliarityOf = (
  work: WorkReference,
): Familiarity | undefined =>
  (work.type === "film"
    ? byFilm.get(`${work.originalTitle}|${work.year}`)
    : undefined) ?? work.familiarity;
// Unclassified imports remain available in free modes, explicitly separate from the four classes.
export const familiarityOf = (
  q: Pick<Question, "metadata" | "domain" | "works">,
): Familiarity | undefined =>
  q.metadata.person_id
    ? byPerson.get(q.metadata.person_id)
    : workReferencesOf(q)[0]
      ? workFamiliarityOf(workReferencesOf(q)[0])
      : undefined;
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
    const key = `${["leicht", "mittel", "schwer", "experte"].indexOf(q.difficulty)}${familiarityOf(q) ?? 0}`;
    mix.set(key, (mix.get(key) ?? 0) + 1);
  }
  return `2.B${[...levels].sort().join("")}.M${[...mix]
    .sort()
    .map(([k, n]) => `${k}:${n}`)
    .join(",")}`;
}
export function ruleLabel(version: string): string {
  if (version.startsWith("solo-server-v1."))
    return `Serverwertung 1 · ${version.endsWith(".genre") ? "Genre-Rekord · " : ""}Standardmix 3 / 4 / 3`;
  if (version.endsWith(".L"))
    return `${ruleLabel(version.slice(0, -2))} · Lösungen nach der Runde`;
  if (version.startsWith("solo-v1."))
    return `1 · ${version.endsWith(".standard") ? "Standardmix 3 / 4 / 3" : version.endsWith(".genre") ? "Genre-Rekord · Standardmix 3 / 4 / 3" : "Eigene Auswahl"}`;
  const match = /^2\.B([1-4]*)\.M([0-9:,]+)$/.exec(version);
  if (!match) return version;
  return `2 · Bekanntheit ${match[1].split("").join(" + ")} · Mischung ${match[2]
    .split(",")
    .map((part) => {
      const [cell, count] = part.split(":");
      return `${count}× ${["Leicht", "Mittel", "Schwer", "Experte"][Number(cell[0])]} / ${cell[1] === "0" ? "offen" : `Gruppe ${cell[1]}`}`;
    })
    .join(", ")}`;
}
