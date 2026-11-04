import { z } from "zod";
const id = z
  .string()
  .min(1)
  .max(200)
  .refine(
    (value) => !["__proto__", "constructor", "prototype"].includes(value),
    "Reservierte ID",
  );
export const questionMetadataSchema = z
  .record(z.string(), z.string())
  .transform((metadata) =>
    Object.fromEntries(
      Object.entries(metadata).filter(([key]) => key !== "memory_anchor"),
    ),
  );
export const filmDisplaySchema = z.object({
  originalTitle: z.string(),
  alternativeTitles: z
    .array(
      z.object({
        title: z.string().min(1),
        kind: z.enum(["de", "international"]),
      }),
    )
    .optional(),
  year: z.number(),
  directors: z.string(),
  countries: z.array(z.string()),
  countryNote: z.string(),
  series: z
    .object({
      name: z.string(),
      position: z.number().nullable().optional(),
      note: z.string().optional(),
    })
    .nullable()
    .optional(),
  releaseNote: z.string().optional(),
  directorNote: z.string().optional(),
  directorContext: z.string().optional(),
  directorSources: z.array(z.string()),
  sources: z.array(z.string()),
});
export const questionImageSchema = z.object({
  src: z.string(),
  width: z.number(),
  height: z.number(),
  crop: z
    .object({
      x: z.number(),
      y: z.number(),
      width: z.number(),
      height: z.number(),
    })
    .optional(),
});
export const portraitSchema = questionImageSchema.extend({
  name: z.string(),
  photographer: z.string(),
  photographerUrl: z.string(),
  license: z.string(),
  licenseUrl: z.string(),
  sourceUrl: z.string(),
  title: z.string(),
  changes: z.string(),
});
export const presentationSchema = z.object({
  questionText: z.string(),
  deepContext: z.string(),
  sources: z.array(z.string()),
  familiarity: z.number().int().min(0).max(4),
  film: z.object({ text: z.string(), sources: z.array(z.string()) }).optional(),
  director: z
    .object({ text: z.string(), sources: z.array(z.string()) })
    .optional(),
  films: z.array(
    z.object({ reference: z.string().optional(), data: filmDisplaySchema }),
  ),
  portraits: z.array(portraitSchema),
  poster: z
    .object({
      title: z.string(),
      year: z.number().int(),
      src: z
        .string()
        .regex(
          /^https:\/\/image\.tmdb\.org\/t\/p\/w342\/[a-zA-Z0-9]+\.(jpg|png)$/,
        ),
      sourceUrl: z
        .string()
        .regex(/^https:\/\/www\.themoviedb\.org\/movie\/[1-9][0-9]*$/),
      expiresAt: z.string().datetime(),
    })
    .nullable()
    .optional(),
});
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
    metadata: questionMetadataSchema,
    demo: z.boolean(),
    presentation: presentationSchema.optional(),
    image: questionImageSchema.optional(),
  })
  .refine(
    (q) =>
      new Set(q.answers.map((a) => a.id)).size === 4 &&
      q.answers.some((a) => a.id === q.correctId),
    "Ungültige Antwort-IDs",
  );
