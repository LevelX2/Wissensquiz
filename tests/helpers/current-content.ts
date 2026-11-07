import { readFileSync } from "node:fs";
import Papa from "papaparse";
import { packages, readQuestions } from "../../src/packages";
import { genreOf, questionSourceOf } from "../../src/filters";
import type { QuestionSource } from "../../src/model";
import type { Question } from "../../src/model";

const samples = new Map<string, string>();
const content = new Map<QuestionSource, Question[]>();

// Representative parser/engine input is selected from current attributes.
// No retained delivery file or historic catalog stage is a test dependency.
export function currentCsv(
  options: {
    source?: QuestionSource;
    genre?: string;
    film?: string;
    recognition?: boolean;
    limit?: number;
  } = {},
) {
  const sampleKey = JSON.stringify(options);
  if (samples.has(sampleKey)) return samples.get(sampleKey)!;
  const source = options.source ?? "film";
  const definition = packages.find((p) => p.source === source)!;
  if (!content.has(source))
    content.set(
      source,
      readQuestions(readFileSync(definition.path, "utf8"), source),
    );
  let questions = content
    .get(source)!
    .filter(
      (q) =>
        questionSourceOf(q) === source &&
        !q.metadata.fact_kind &&
        (!options.genre || genreOf(q) === options.genre) &&
        (!options.film ||
          `${q.metadata.film_title_original}|${q.metadata.film_year}` ===
            options.film) &&
        (!options.recognition || !!q.metadata.question_image_id),
    );
  if (options.limit) questions = questions.slice(0, options.limit);
  const selectedIds = new Set(questions.map((q) => q.id));
  const rows = questions.map((q) => ({
    ...q.metadata,
    question_id: q.id,
    knowledge_id: q.knowledgeId,
    variant_of: selectedIds.has(q.metadata.variant_of)
      ? q.metadata.variant_of
      : "",
    language: q.language,
    domain: q.domain,
    difficulty: q.difficulty,
    question: q.question,
    ...Object.fromEntries(
      q.answers.map((a, i) => [`answer_${"abcd"[i]}`, a.text]),
    ),
    ...Object.fromEntries(
      q.answers.map((a, i) => [`feedback_${"abcd"[i]}`, a.feedback]),
    ),
    correct_answer: "ABCD"[q.answers.findIndex((a) => a.id === q.correctId)],
    explanation_short: q.explanation,
    explanation_context: q.context,
    topic_tags: q.tags.join("|"),
    badge_tags: q.badgeTags.join("|"),
    source_urls: q.sources.join("|"),
  }));
  const fields = [...new Set(rows.flatMap((row) => Object.keys(row)))];
  const csv = Papa.unparse({ fields, data: rows }, { quotes: true });
  samples.set(sampleKey, csv);
  return csv;
}
