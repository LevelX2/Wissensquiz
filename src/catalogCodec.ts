import type { Question } from "./model";

type PackedQuestion = Omit<Question, "metadata"> & {
  metadata: Record<string, string | number>;
};

// CSV metadata preserves every original column, including text already present
// in the normalized question. These positions are a versioned storage contract.
const fieldValues = (q: Omit<Question, "metadata">) => [
  q.id,
  q.knowledgeId,
  q.language,
  q.domain,
  q.difficulty,
  q.question,
  q.explanation,
  q.context,
  q.anchor,
  ...q.answers.flatMap((a) => [a.text, a.feedback]),
];

export function encodeQuestionCatalog(questions: Question[]): string {
  return JSON.stringify(
    questions.map((q): PackedQuestion => {
      const refs = new Map(
        fieldValues(q).map((value, index) => [value, index]),
      );
      const metadata: PackedQuestion["metadata"] = Object.create(null);
      for (const key of Object.keys(q.metadata))
        metadata[key] = refs.get(q.metadata[key]) ?? q.metadata[key];
      return {
        ...q,
        metadata,
      };
    }),
  );
}

export function decodeQuestionCatalog(serialized: string): Question[] {
  const packed: PackedQuestion[] = JSON.parse(serialized);
  if (!Array.isArray(packed))
    throw new Error("Der lokale Fragenkatalog ist ungültig.");
  for (const q of packed) {
    const values = fieldValues(q);
    // Entry order is retained too: snapshot identity checks compare JSON.
    for (const key of Object.keys(q.metadata)) {
      const value = q.metadata[key];
      if (typeof value === "string") continue;
      if (!Number.isInteger(value) || value < 0 || value >= values.length)
        throw new Error("Ein Metadatenverweis im Fragenkatalog ist ungültig.");
      q.metadata[key] = values[value];
    }
  }
  return packed as Question[];
}
