import { createHash } from "node:crypto";
import { questionSchema } from "../../src/questionSchema";
import type { Question } from "../../src/model";
export type TestContent = { hash: string; questions: Question[] };
// Operator-only fixture content. No catalog archive, compression or client fetch.
export async function prepareTestContent(
  input: Question[],
): Promise<TestContent> {
  const questions = input.map((q) => questionSchema.parse(q));
  return {
    hash: createHash("sha256").update(JSON.stringify(questions)).digest("hex"),
    questions,
  };
}
