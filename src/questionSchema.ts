import { z } from "zod";
const id = z
  .string()
  .min(1)
  .max(200)
  .refine(
    (value) => !["__proto__", "constructor", "prototype"].includes(value),
    "Reservierte ID",
  );
export const questionSchema = z
  .object({
    id,
    knowledgeId: id,
    version: id,
    language: z.literal("de"),
    domain: id,
    topic: id,
    difficulty: z.enum(["leicht", "mittel", "schwer", "experte"]),
    question: z.string().min(1).max(4000),
    answers: z
      .array(
        z.object({
          id,
          text: z.string().min(1).max(2000),
          feedback: z.string().max(4000),
        }),
      )
      .length(4),
    correctId: id,
    explanation: z.string().min(1).max(10000),
    context: z.string().max(12000),
    anchor: z.string().max(4000),
    sources: z
      .array(
        z
          .string()
          .url()
          .refine((x) => /^https?:\/\//.test(x)),
      )
      .max(20),
    tags: z.array(z.string()),
    badgeTags: z.array(z.string()),
    metadata: z.record(z.string(), z.string()),
    demo: z.boolean(),
  })
  .refine(
    (q) =>
      new Set(q.answers.map((a) => a.id)).size === 4 &&
      q.answers.some((a) => a.id === q.correctId),
    "Ungültige Antwort-IDs",
  );
