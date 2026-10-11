import { withCategoryTags } from "./categories";
import type { Question } from "./model";
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
  return (
    q.metadata.fact_kind === "year" &&
    q.id === q.metadata.fact_catalog_id + "-YEAR" &&
    /^\d{4}$/.test(q.metadata.film_year ?? "")
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
