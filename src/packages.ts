// Operator-only current content. The browser loads individual server questions.
import type { Question, QuestionSource, State } from "./model";
import { questionSchema } from "./questionSchema";
import { genreOf, questionSourceOf } from "./filters";

type QuestionPackage = {
  path: string;
  filename: string;
  source: QuestionSource;
  genre?: string;
};

export const packages: readonly QuestionPackage[] = [
  ...[
    ["abenteuer", "Abenteuer"],
    ["action", "Action"],
    ["drama", "Drama"],
    ["fantasy", "Fantasy"],
    ["horror", "Horror"],
    ["komoedie", "Komödie"],
    ["martial-arts-asia", "Martial Arts & Asia-Film"],
    ["musik", "Musik"],
    ["rom-com", "Rom-Com"],
    ["science-fiction", "Science-Fiction"],
    ["thriller", "Thriller"],
    ["western", "Western"],
  ].map(([slug, genre]) => ({
    path: `content/filmfragen/${slug}.jsonl`,
    filename: `Filmfragen · ${genre}`,
    source: "film" as const,
    genre,
  })),
  {
    path: "content/schauspielerfragen.jsonl",
    filename: "Schauspielerfragen",
    source: "actors",
  },
  {
    path: "content/preisfragen.jsonl",
    filename: "Preisfragen",
    source: "awards",
  },
];

export function packageForQuestion(q: Question) {
  const source = questionSourceOf(q);
  const definition = packages.find(
    (p) => p.source === source && (!p.genre || p.genre === genreOf(q)),
  );
  if (!definition) throw new Error(`${q.id}: kein aktueller Fachbestand.`);
  return definition;
}

export type PackageContent = { filename: string; text: string };

export function readQuestions(
  text: string,
  source?: QuestionSource,
  genre?: string,
): Question[] {
  const questions = text
    .split(/\r?\n/)
    .filter((line) => line.trim())
    .map((line) => questionSchema.parse(JSON.parse(line)));
  const ids = new Set<string>();
  for (const q of questions) {
    if (ids.has(q.id)) throw new Error(`Doppelte Fragen-ID: ${q.id}`);
    ids.add(q.id);
    if (source && questionSourceOf(q) !== source)
      throw new Error(`${q.id}: Frage gehört nicht zum Bereich ${source}.`);
    if (genre && genreOf(q) !== genre)
      throw new Error(`${q.id}: Frage gehört nicht zum Genre ${genre}.`);
  }
  return questions;
}

export function hasPackage(state: State, filename: string) {
  return state.imports.some((r) => r.filename === filename);
}

export function addPackages(state: State, incoming: PackageContent[]) {
  const existing = new Map(state.questions.map((q) => [q.id, q]));
  const next: Question[] = [];
  const reports: State["imports"] = [];
  const incomingIds = new Set<string>();
  for (const input of incoming) {
    const definition = packages.find((p) => p.filename === input.filename);
    if (!definition)
      throw new Error(`Unbekannter aktueller Fragenbereich: ${input.filename}`);
    const questions = readQuestions(
      input.text,
      definition.source,
      definition.genre,
    );
    let duplicates = 0;
    for (const q of questions) {
      if (incomingIds.has(q.id))
        throw new Error(`Doppelte Fragen-ID im Katalog: ${q.id}`);
      incomingIds.add(q.id);
      if (existing.has(q.id)) {
        duplicates++;
        continue;
      }
      existing.set(q.id, q);
      next.push(q);
    }
    if (!hasPackage(state, input.filename))
      reports.push({
        filename: input.filename,
        accepted: questions.length - duplicates,
        rejected: 0,
        duplicates,
        warnings: [],
        issues: [],
        at: Date.now(),
        delimiter: "jsonl",
        columns: [],
      });
  }
  // Resolve against the complete current catalog, independently of input order.
  for (const q of next) {
    const target = q.metadata.variant_of && existing.get(q.metadata.variant_of);
    if (
      q.metadata.variant_of &&
      (!target || target.knowledgeId !== q.knowledgeId)
    )
      throw new Error(`${q.id}: ungültiger Wissenszielbezug.`);
    const seen = new Set([q.id]);
    let current = q;
    while (current.metadata.variant_of) {
      const target = existing.get(current.metadata.variant_of);
      if (
        !target ||
        target.knowledgeId !== q.knowledgeId ||
        seen.has(target.id)
      )
        throw new Error(`${q.id}: ungültige Variantenkette.`);
      seen.add(target.id);
      current = target;
    }
  }
  state.questions.push(...next);
  state.imports.push(...reports);
  state.bundledQuestionIds = [
    ...new Set([...(state.bundledQuestionIds ?? []), ...next.map((q) => q.id)]),
  ];
}
