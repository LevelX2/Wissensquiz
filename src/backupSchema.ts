import { z } from "zod";
import { questionSchema } from "./questionSchema";
import { BANK_START } from "./recordModes";
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
// Technical scoring/learning facts, without question text, choices or explanations.
export const roundFactSchema = z.object({
  id,
  knowledgeId: id,
  version: id,
  domain: id,
  difficulty: z.enum(["leicht", "mittel", "schwer", "experte"]),
  correctId: id,
  answerIds: z.array(id).length(4),
  metadata: z.object({ subdomain: id.optional(), person_id: id.optional() }),
  tags: z.array(z.literal("Preisträger")).max(1),
});
export const roundSchema = z.object({
  id,
  mode: z.enum([
    "entdecken",
    "ueben",
    "rekord",
    "fehler",
    "fehlerfrei",
    "zeitkonto",
  ]),
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
        z.object({
          genre: id,
          difficulty: z.enum(["mittel", "schwer", "experte"]),
        }),
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
  questions: z.array(questionSchema).max(100000),
  archive: z
    .object({
      version: z.literal(1),
      questions: z.array(roundFactSchema).min(1).max(100000),
    })
    .optional(),
  order: z.array(z.array(id).length(4)),
  events: z.array(z.string().min(1).max(500)).max(100000),
  recordPreset: z.enum(["standard", "genre", "custom"]).optional(),
  run: z
    .object({
      version: z.literal(1),
      pool: z.array(id).max(20000),
      queue: z.array(id).max(20000),
      cycle: z.number().int().positive(),
      bankMs: z.number().finite().min(0).max(BANK_START),
      ended: z.boolean(),
    })
    .optional(),
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
  bundledQuestionIds: z.array(id).max(20000).optional(),
  rounds: z.array(roundSchema).max(100000),
  events: z
    .array(
      z.object({
        id: z.string().min(1).max(500),
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
    playGroup: z.enum(["learn", "timed", "duel"]).optional(),
    lastLearningMode: z.enum(["entdecken", "ueben", "fehler"]).optional(),
    lastTimedMode: z.enum(["rekord", "fehlerfrei", "zeitkonto"]).optional(),
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
        mode: z.enum([
          "entdecken",
          "ueben",
          "rekord",
          "fehler",
          "fehlerfrei",
          "zeitkonto",
        ]),
        recordPreset: z.enum(["standard", "genre", "custom"]).optional(),
        recordGenre: id.optional(),
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
      independentAreas: z.literal(true).optional(),
      earned: z.record(
        id,
        z.object({
          difficulty: z.number().int().min(0).max(3),
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
