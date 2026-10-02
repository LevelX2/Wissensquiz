import facts from "./filmFacts.json" with { type: "json" };
import directorContexts from "./directorContexts.json" with { type: "json" };
import type { Difficulty, Question } from "./model";
import { fingerprint } from "./importer";
import { categories, isCategory, withCategoryTags } from "./categories";
import { normalizeGenre } from "./filters";

type FilmFact = (typeof facts)[number];
const directorBackgrounds: Record<string, { text: string; sources: string[] }> =
  directorContexts;
const byId = new Map(facts.map((f) => [f.id, f]));
const names = (people: string[]) =>
  people.length < 2
    ? people[0]
    : `${people.slice(0, -1).join(", ")} und ${people.at(-1)}`;
const filmKey = (q: Question) =>
  `${q.metadata.film_title_original}|${q.metadata.film_year}`;
const byFilm = new Map(facts.map((f) => [f.film, f]));

// Read-only enrichment: also works for historical snapshots without modifying them.
export function filmData(q: Question) {
  const f = byFilm.get(filmKey(q));
  if (!f) return undefined;
  const background = directorBackgrounds[f.id];
  return {
    originalTitle: q.metadata.film_title_original,
    year: f.year,
    directors: names(f.directors),
    countries: f.productionCountries,
    series: f.series,
    releaseNote: f.releaseNote,
    directorNote: f.directorNote,
    directorContext: background?.text ?? f.directorContext,
    directorSources: background?.sources ?? [],
    sources: [...new Set([f.source, ...(f.additionalSources ?? [])])],
  };
}

// Historical rounds keep their original question snapshot and version. The
// editorial text is resolved only for display after the answer.
export function directorExplanation(q: Question) {
  if (q.metadata.fact_kind !== "director") return undefined;
  const f = byFilm.get(filmKey(q));
  if (!f || q.id !== `${f.id}-DIRECTOR`) return undefined;
  const background = directorBackgrounds[f.id];
  if (background) return background;
  if (!f.directorContext) return undefined;
  return {
    text: [f.directorContext, f.directorNote].filter(Boolean).join(" "),
    sources: [...new Set([f.source, ...(f.additionalSources ?? [])])],
  };
}

function mix<T>(items: T[], random = Math.random) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// The interval belongs to the difficulty, not to the player's progress.
export function yearChoices(q: Question) {
  const year = Number(q.metadata.film_year);
  const [min, max] = { leicht: [8, 25], mittel: [2, 10], schwer: [1, 4] }[
    q.difficulty
  ];
  const choices: number[] = [];
  for (let offset = -max; offset <= max; offset++) {
    if (
      Math.abs(offset) >= min &&
      year + offset >= 1895 &&
      year + offset <= 2026
    )
      choices.push(year + offset);
  }
  return choices;
}
function yearAnswer(q: Question, year: number) {
  const correct = year === Number(q.metadata.film_year);
  return {
    id: `${q.id}:y${year}`,
    text: String(year),
    feedback: correct
      ? `Richtig: Die erste Veröffentlichung war ${year}.`
      : `${year} ist hier nicht gesucht. Die erste Veröffentlichung war ${q.metadata.film_year}.`,
  };
}
function isYearQuestion(q: Question) {
  const fact = byId.get(q.metadata.fact_catalog_id);
  return (
    !!fact &&
    q.id === `${fact.id}-YEAR` &&
    q.metadata.fact_kind === "year" &&
    q.metadata.film_year === String(fact.year)
  );
}

export function prepareFactQuestion(
  q: Question,
  previous?: Question,
  random = Math.random,
): Question {
  if (!isYearQuestion(q)) return q;
  const pool = mix(yearChoices(q), random);
  const selected = pool.slice(0, 3);
  if (
    previous &&
    selected.every((year) =>
      previous.answers.some((a) => a.text === String(year)),
    )
  )
    selected[2] = pool[3];
  return {
    ...q,
    answers: [Number(q.metadata.film_year), ...selected].map((year) =>
      yearAnswer(q, year),
    ),
  };
}

// Only bounded, fully checked answer variations may differ from the template.
export function questionSnapshotMatches(stored: Question, snapshot: Question) {
  let comparable = snapshot;
  if (isYearQuestion(stored) && isYearQuestion(snapshot)) {
    const valid = [
      Number(stored.metadata.film_year),
      ...yearChoices(stored),
    ].map((year) => yearAnswer(stored, year));
    if (
      snapshot.answers.length !== 4 ||
      new Set(snapshot.answers.map((a) => a.id)).size !== 4 ||
      !snapshot.answers.some((a) => a.id === stored.correctId) ||
      snapshot.answers.some(
        (a) => !valid.some((v) => JSON.stringify(v) === JSON.stringify(a)),
      )
    )
      return false;
    comparable = { ...snapshot, answers: stored.answers };
  }
  return (
    JSON.stringify(withCategoryTags(stored)) ===
    JSON.stringify(withCategoryTags(comparable))
  );
}

function directorOptions(
  f: FilmFact,
  genre: string,
  genres: Map<string, string>,
) {
  const blocked = [...f.directors, ...(f.blockedDirectors ?? [])];
  // Existing answer templates must not change when more films are imported.
  // The initial 300 films used this frozen pool; each later batch pins its size.
  const candidates = facts
    .slice(0, f.optionCatalogSize ?? 300)
    .filter((other) => !other.directors.some((d) => blocked.includes(d)))
    .sort(
      (a, b) =>
        Number(genres.get(b.film) === genre) -
          Number(genres.get(a.film) === genre) ||
        Math.abs(a.year - f.year) - Math.abs(b.year - f.year) ||
        a.id.localeCompare(b.id),
    );
  if (f.directors.length > 1) {
    const teams = candidates.filter(
      (c) => c.directors.length === f.directors.length,
    );
    const distinct = [...new Set(teams.map((c) => names(c.directors)))];
    // Equally sized alternative teams avoid revealing the only group option.
    const people = [...new Set(candidates.flatMap((c) => c.directors))];
    for (let i = 0; distinct.length < 3; i += f.directors.length) {
      const alternative = names(people.slice(i, i + f.directors.length));
      if (alternative && !distinct.includes(alternative))
        distinct.push(alternative);
    }
    return distinct.slice(0, 3);
  }
  return [
    ...new Set(
      candidates
        .filter((c) => c.directors.length === 1)
        .map((c) => names(c.directors)),
    ),
  ].slice(0, 3);
}

export function addFilmFacts(questions: Question[]) {
  const existing = new Set(questions.map((q) => q.id));
  const references = new Map(questions.map((q) => [q.id, q]));
  const genres = new Map(facts.map((f) => [f.film, normalizeGenre(f.genre)]));
  const added: string[] = [],
    missing: string[] = [];
  for (const f of facts) {
    const ref = references.get(f.referenceId);
    if (!ref || filmKey(ref) !== f.film) {
      missing.push(f.id);
      continue;
    }
    const siblings = questions.filter((q) => filmKey(q) === f.film);
    const tags = categories.filter((c) =>
      siblings.some((q) => isCategory(q, c)),
    );
    for (const kind of ["year", "director"] as const) {
      // Existing director questions already teach this fact; keep their progress.
      if (kind === "director" && f.existingDirectorId) continue;
      const id = `${f.id}-${kind === "year" ? "YEAR" : "DIRECTOR"}`;
      if (existing.has(id)) continue;
      const directors = names(f.directors);
      const explanation =
        kind === "year"
          ? `„${f.title}“ wurde erstmals ${f.year} veröffentlicht.`
          : `Die Regienennung für „${f.title}“ (${f.year}) lautet: ${directors}.`;
      const q: Question = {
        id,
        knowledgeId: `K-${id}`,
        version: "film-facts-v1",
        language: "de",
        domain: ref.domain,
        topic: ref.topic,
        difficulty: (kind === "year"
          ? f.yearDifficulty
          : f.directorDifficulty) as Difficulty,
        question:
          kind === "year"
            ? f.yearQuestion ||
              `„${f.title}“: In welchem Jahr erschien der Film von ${directors} erstmals?`
            : `„${f.title}“ (${f.year}): Wer ist für die Regie genannt?`,
        answers: [],
        correctId: kind === "year" ? `${id}:y${f.year}` : `${id}:a`,
        explanation,
        context:
          kind === "year"
            ? `${f.releaseNote || "Gemeint ist die erste Veröffentlichung, einschließlich einer Premiere oder Festivalaufführung, nicht ein späterer deutscher Kinostart."} Originaltitel: ${ref.metadata.film_title_original}. Regie: ${directors}.`
            : `${f.directorContext ? f.directorContext + " " : ""}${f.directorNote || (f.directors.length > 1 ? "Die richtige Antwort umfasst das gesamte genannte Regieteam." : "Gefragt ist die Regie dieses Films, nicht Drehbuch, Produktion oder die Regie einer anderen Folge.")} Originaltitel: ${ref.metadata.film_title_original}. Erste Veröffentlichung: ${f.year}.`,
        anchor:
          kind === "year"
            ? `${f.title} → ${f.year}`
            : `${f.title} → ${directors}`,
        sources: [...new Set([f.source, ...(f.additionalSources ?? [])])],
        tags,
        badgeTags: [...tags],
        demo: false,
        metadata: {
          film_title_de: f.title,
          film_title_original: ref.metadata.film_title_original,
          film_year: String(f.year),
          subdomain: ref.metadata.subdomain,
          franchise: ref.metadata.franchise || "",
          fact_kind: kind,
          fact_catalog_id: f.id,
          question_type: kind === "year" ? "Erscheinungsjahr" : "Regie",
          verification_status:
            f.verificationStatus ?? "Quellenabgleich 2026-09-26",
          reference_question_id: f.referenceId,
        },
      };
      q.answers =
        kind === "year"
          ? [
              f.year,
              ...yearChoices(q)
                .filter((_, i) => i % 2 === 0)
                .slice(0, 3),
            ].map((year) => yearAnswer(q, year))
          : [
              directors,
              ...directorOptions(f, ref.metadata.subdomain, genres),
            ].map((text, i) => ({
              id: `${id}:${String.fromCharCode(97 + i)}`,
              text,
              feedback:
                i === 0
                  ? `Richtig: ${directors}.`
                  : `Hier ist ${directors} die gesuchte Regienennung.`,
            }));
      q.version = `film-facts-v1-${fingerprint(JSON.stringify(q))}`;
      questions.push(q);
      existing.add(id);
      added.push(id);
    }
  }
  return { added, missing };
}
