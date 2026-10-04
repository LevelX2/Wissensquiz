import facts from "./filmFacts.json" with { type: "json" };
import awardFacts from "./awardFilmFacts.json" with { type: "json" };
import actorFacts from "./actorFilmFacts.json" with { type: "json" };
import actorSupplementFacts from "./actorSupplementFilmFacts.json" with { type: "json" };
import directorContexts from "./directorContexts.json" with { type: "json" };
import allGenres from "../KI-Wissen-Wissensquiz/01 Rohquellen/Alle_Genres_120_Filme_Filmdaten.json" with { type: "json" };
import allGenresDirectorContexts from "./allGenresDirectorContexts.json" with { type: "json" };
import allGenresCountryNotes from "./allGenresCountryNotes.json" with { type: "json" };
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
const awardData = new Map(awardFacts.map((f) => [f.film, f]));
const actorData = new Map(
  [...actorSupplementFacts, ...actorFacts].map((f) => [f.film, f]),
);
const allGenresByFilm = new Map(
  allGenres.films.map((f) => [`${f.film_title_original}|${f.film_year}`, f]),
);

// Read-only enrichment: also works for historical snapshots without modifying them.
export function filmData(q: Question, reference?: string) {
  if (q.metadata.person_id && !reference) return undefined;
  const key = reference ?? filmKey(q);
  // Keep established film metadata when award questions reuse the same film.
  const f =
    byFilm.get(key) ??
    (allGenresByFilm.has(key)
      ? undefined
      : (awardData.get(key) ?? actorData.get(key)));
  if (f) {
    const background = directorBackgrounds[f.id];
    return {
      originalTitle:
        "originalTitle" in f && typeof f.originalTitle === "string"
          ? f.originalTitle
          : key.slice(0, key.lastIndexOf("|")),
      year: f.year,
      directors: names(f.directors),
      countries: f.productionCountries,
      countryNote: "",
      series: f.series,
      releaseNote: f.releaseNote,
      directorNote: f.directorNote,
      directorContext: background?.text ?? f.directorContext,
      directorSources: background?.sources ?? [],
      sources: [...new Set([f.source, ...(f.additionalSources ?? [])])],
    };
  }
  const newer = allGenresByFilm.get(key);
  if (!newer) return undefined;
  const background = (
    allGenresDirectorContexts as Record<
      string,
      { text: string; sources: string[] }
    >
  )[key];
  return {
    originalTitle: newer.film_title_original,
    year: newer.film_year,
    directors: names(newer.directors),
    countries: newer.production_countries,
    countryNote: (allGenresCountryNotes as Record<string, string>)[key] ?? "",
    series: newer.series,
    releaseNote: newer.release_note,
    directorNote: newer.director_note,
    directorContext: background?.text ?? "",
    directorSources: background?.sources ?? [],
    sources: [...new Set(newer.sources.map((source) => source.url))],
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
  const [min, max] = {
    leicht: [8, 25],
    mittel: [3, 10],
    schwer: [3, 8],
    experte: [3, 8],
  }[q.difficulty];
  return yearPool(q, min, max);
}
// Frozen template generation and old round validation must retain their pool.
function legacyYearChoices(q: Question) {
  const [min, max] = {
    leicht: [8, 25],
    mittel: [2, 10],
    schwer: [1, 4],
    experte: [1, 3],
  }[q.difficulty];
  return yearPool(q, min, max);
}
function yearPool(q: Question, min: number, max: number) {
  const year = questionYear(q) ?? Number(q.metadata.film_year);
  const choices: number[] = [];
  for (let offset = -max; offset <= max; offset++) {
    if (
      Math.abs(offset) >= min &&
      year + offset >= (isYearQuestion(q) ? 1895 : 1000) &&
      year + offset <= 2026
    )
      choices.push(year + offset);
  }
  return choices;
}
function yearAnswer(q: Question, year: number, id = `${q.id}:y${year}`) {
  const correctYear = questionYear(q)!;
  const correct = year === correctYear;
  if (!isYearQuestion(q))
    return correct
      ? q.answers.find((a) => a.id === q.correctId)!
      : {
          id,
          text: String(year),
          feedback: `${year} ist hier nicht gesucht. Das gesuchte Jahr ist ${correctYear}.`,
        };
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

// CSV metadata retains the immutable original options. Use the actual answer,
// which can be an award or other historical year rather than the film's year.
function questionYear(q: Question): number | undefined {
  if (isYearQuestion(q)) return Number(q.metadata.film_year);
  if (q.metadata.question_id !== q.id) return undefined;
  const letters = ["a", "b", "c", "d"];
  const values = letters.map((letter) => q.metadata[`answer_${letter}`]);
  if (
    new Set(values).size !== 4 ||
    values.some(
      (value) =>
        !/^\d{4}$/.test(value ?? "") ||
        Number(value) < 1000 ||
        Number(value) > 2026,
    )
  )
    return undefined;
  const raw = q.metadata.correct_answer?.toLowerCase().replace(/^answer_/, "");
  const letter = letters.includes(raw)
    ? raw
    : letters[values.indexOf(q.metadata.correct_answer)];
  if (!letter || q.correctId !== `${q.id}:${letter}`) return undefined;
  const value = q.metadata[`answer_${letter}`];
  if (q.answers.find((a) => a.id === q.correctId)?.text !== value)
    return undefined;
  return Number(value);
}

export function prepareFactQuestion(
  q: Question,
  previous?: Question,
  random = Math.random,
): Question {
  const year = questionYear(q);
  if (year === undefined) return q;
  const pool = yearChoices(q);
  const lower = pool.filter((candidate) => candidate < year);
  const upper = pool.filter((candidate) => candidate > year);
  // Choose the chronological rank first, not a mixed trio that favors the
  // middle. Near the frozen year limits only feasible ranks participate.
  const ranks = [0, 1, 2, 3].filter(
    (rank) => lower.length >= rank && upper.length >= 3 - rank,
  );
  if (!ranks.length) return q;
  const rank = ranks[Math.floor(random() * ranks.length)];
  const below = mix(lower, random),
    above = mix(upper, random);
  const selected = [...below.slice(0, rank), ...above.slice(0, 3 - rank)];
  if (
    previous &&
    selected.every((year) =>
      previous.answers.some((a) => a.text === String(year)),
    )
  ) {
    // Change a candidate on the same side so avoiding a repeat never changes
    // the drawn rank. A side with exactly the required size cannot vary.
    if (rank > 0 && below.length > rank) selected[rank - 1] = below[rank];
    else if (rank < 3 && above.length > 3 - rank) selected[2] = above[3 - rank];
  }
  return {
    ...q,
    answers: [year, ...selected].map((year, i) =>
      yearAnswer(
        q,
        year,
        isYearQuestion(q) || i === 0
          ? undefined
          : q.answers.filter((a) => a.id !== q.correctId)[i - 1].id,
      ),
    ),
  };
}

// Only bounded, fully checked answer variations may differ from the template.
export function questionSnapshotMatches(stored: Question, snapshot: Question) {
  let comparable = snapshot;
  const year = questionYear(stored);
  if (year !== undefined && questionYear(snapshot) === year) {
    const valid = [
      year,
      ...yearChoices(stored),
      ...legacyYearChoices(stored),
    ].map((year) => yearAnswer(stored, year));
    if (!isYearQuestion(stored))
      for (const candidate of yearChoices(stored))
        for (const answer of stored.answers.filter(
          (a) => a.id !== stored.correctId,
        ))
          valid.push(yearAnswer(stored, candidate, answer.id));
    // Keep original CSV answer objects valid for historical rounds, too.
    valid.push(...stored.answers);
    const validAnswers = new Set(valid.map(snapshotJson));
    if (
      snapshot.answers.length !== 4 ||
      new Set(snapshot.answers.map((a) => a.id)).size !== 4 ||
      new Set(snapshot.answers.map((a) => a.text)).size !== 4 ||
      !snapshot.answers.some((a) => a.id === stored.correctId) ||
      snapshot.answers.some((a) => !validAnswers.has(snapshotJson(a)))
    )
      return false;
    comparable = { ...snapshot, answers: stored.answers };
  }
  const base = withCategoryTags(stored),
    target = withCategoryTags(comparable);
  return (
    JSON.stringify(base) === JSON.stringify(target) ||
    snapshotJson(base) === snapshotJson(target)
  );
}

// PostgreSQL jsonb can reorder object keys. Snapshot identity depends on values
// and array order, never the order of metadata keys received from the server.
function snapshotJson(question: unknown) {
  return JSON.stringify(question, (_key, value) =>
    value && typeof value === "object" && !Array.isArray(value)
      ? Object.fromEntries(
          Object.keys(value)
            .sort()
            .map((key) => [key, value[key]]),
        )
      : value,
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
  const byFilm = new Map<string, Question[]>();
  for (const q of questions) {
    const key = filmKey(q);
    if (!byFilm.has(key)) byFilm.set(key, []);
    byFilm.get(key)!.push(q);
  }
  const genres = new Map(facts.map((f) => [f.film, normalizeGenre(f.genre)]));
  const added: string[] = [],
    missing: string[] = [];
  for (const f of facts) {
    const ref = references.get(f.referenceId);
    if (!ref || filmKey(ref) !== f.film) {
      missing.push(f.id);
      continue;
    }
    const siblings = byFilm.get(f.film) ?? [];
    const tags = categories
      .filter((c) => c !== "Preisträger")
      .filter((c) => siblings.some((q) => isCategory(q, c)));
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
            ? f.yearContext
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
              ...legacyYearChoices(q)
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
