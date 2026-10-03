import { z } from "zod";
import { questionSchema } from "./questionSchema";

const time = z.number().finite().nonnegative();
const id = z.string().min(1).max(200);
const sources = z.array(z.enum(["film", "awards", "actors"])).max(3);
const familiarityList = z
  .array(z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]))
  .max(4);
export const learningSchema = z.object({
  knowledgeId: id,
  stage: z.number().int().min(0).max(4),
  status: z.enum(["entdeckt", "geübt", "gefestigt"]),
  due: time,
  lastSecure: time.nullable(),
  lastSeenAt: time.nullable().default(null),
  lastAdvancedDay: z.string().nullable(),
  secureDays: z.array(z.string()),
  seen: z.number().int().nonnegative(),
});
export const roundSchema = z.object({
  id,
  mode: z.enum(["entdecken", "ueben", "rekord", "fehler"]),
  topic: id,
  difficulty: id,
  filters: z
    .object({
      genres: z.array(id).max(20000),
      sources: sources.optional(),
      familiarities: familiarityList.optional(),
      difficulties: z
        .array(z.enum(["leicht", "mittel", "schwer", "experte"]))
        .min(1)
        .max(4),
    })
    .refine(
      (f) => f.genres.length > 0 || f.sources?.some((s) => s !== "film"),
      "Eine Runde braucht Filmgenres oder einen eigenständigen Fragenbereich.",
    )
    .optional(),
  ruleVersion: id,
  unlocks: z
    .array(
      z.union([
        z.object({ genre: id, difficulty: z.enum(["mittel", "schwer"]) }),
        z.object({
          genre: id,
          familiarity: z.union([
            z.literal(1),
            z.literal(2),
            z.literal(3),
            z.literal(4),
          ]),
        }),
      ]),
    )
    .optional(),
  familiaritySnapshot: z.record(id, z.number().int().min(0).max(4)).optional(),
  questions: z.array(questionSchema).min(1).max(10),
  order: z.array(z.array(id).length(4)),
  events: z.array(id).max(10),
  startedAt: time,
  finishedAt: time.nullable(),
  status: z.enum(["active", "completed", "aborted"]),
  before: z.record(z.string(), learningSchema),
  solutionDisplay: z.enum(["question", "round"]).optional(),
  duel: z
    .object({ id: z.string().uuid(), number: z.number().int().min(1).max(3) })
    .optional(),
});
export const stateSchema = z.object({
  schemaVersion: z.literal(1),
  questions: z.array(questionSchema).max(20000),
  rounds: z.array(roundSchema).max(100000),
  events: z
    .array(
      z.object({
        id,
        roundId: id,
        questionId: id,
        knowledgeId: id,
        version: id,
        answerId: id.nullable(),
        dontKnow: z.literal(true).optional(),
        correct: z.boolean(),
        guessed: z.boolean(),
        at: time,
        knowledgePoints: z.number().int().min(0).max(100),
        timeBonus: z.number().int().min(0).max(60),
        elapsedMs: time,
      }),
    )
    .max(1000000),
  learning: z.record(z.string(), learningSchema),
  badges: z.array(z.enum(["sci-fi-10-v1"])),
  favorites: z.array(id).max(3),
  reports: z.array(
    z.object({
      id,
      questionId: id,
      version: id,
      comment: z.string().max(4000),
      at: time,
    }),
  ),
  imports: z.array(
    z.object({
      at: time,
      filename: z.string(),
      accepted: z.number().int().nonnegative(),
      rejected: z.number().int().nonnegative(),
      duplicates: z.number().int().nonnegative(),
      delimiter: z.string(),
      columns: z.array(z.string()),
      issues: z.array(z.string()),
      warnings: z.array(z.string()),
    }),
  ),
  settings: z.object({
    spoilers: z.boolean(),
    sound: z.boolean().optional(),
    haptics: z.boolean().optional(),
    showGenre: z.boolean().optional(),
    showDifficulty: z.boolean().optional(),
    questionHistory: z.enum(["after", "always", "hidden"]).optional(),
    solutionDisplay: z.enum(["question", "round"]).optional(),
    learningPath: z.boolean().optional(),
    allDifficulties: z.boolean().optional(),
    roundSetup: z
      .object({
        mode: z.enum(["entdecken", "ueben", "rekord", "fehler"]),
        genres: z.array(id).max(20000).nullable(),
        categories: z
          .array(
            z.enum(["Classics", "Arthouse", "Preisträger", "Schauspieler"]),
          )
          .max(4),
        difficulties: z
          .array(z.enum(["leicht", "mittel", "schwer", "experte"]))
          .max(4),
        familiarities: familiarityList.optional(),
        sources: sources.optional(),
      })
      .optional(),
  }),
  experience: z.number().int().nonnegative(),
  career: z
    .object({
      version: z.literal(1),
      legacyBonus: z.number().int().nonnegative().max(2_500_750_000),
    })
    .optional(),
  journey: z
    .object({
      version: z.literal(1),
      earned: z.record(
        id,
        z.object({
          difficulty: z.number().int().min(0).max(2),
          familiarity: z.number().int().min(0).max(4),
        }),
      ),
    })
    .optional(),
  records: z.record(
    z.string(),
    z.object({ points: z.number().nonnegative(), roundId: id }),
  ),
});
