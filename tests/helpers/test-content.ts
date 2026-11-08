import { createHash } from "node:crypto";
import { questionSchema } from "../../src/questionSchema";
import type { Question } from "../../src/model";
import { resolveQuestionWorks } from "../../src/workAttributes";
import { withCategoryTags } from "../../src/categories";
export type TestContent = { hash: string; questions: Question[] };
// Operator-only fixture content. No catalog archive, compression or client fetch.
export async function prepareTestContent(
  input: Question[],
): Promise<TestContent> {
  const questions = resolveQuestionWorks(
    input.map((q) => withCategoryTags(questionSchema.parse(q))),
  );
  return {
    hash: createHash("sha256").update(JSON.stringify(questions)).digest("hex"),
    questions,
  };
}
