import { z } from "zod";
import { learningSchema } from "./backupSchema";

const count = z.number().int().nonnegative();
const percent = z.number().min(0).max(100);
const time = z.number().finite().nonnegative();
const counts = z.record(z.string(), count);
export const contentInfoSchema = z.object({
  hash: z.string().min(1),
  questions: count,
  goals: count,
  genres: z.array(z.string()),
  areas: count,
});
export const learningOverviewSchema = z.object({
  unseen: count,
  discovered: count,
  stages: z.array(count).length(4),
  mastered: count,
  steps: count,
  maximum: count,
  percent,
});
const journeySchema = z.record(
  z.string(),
  z.object({
    easy: count,
    medium: count,
    hard: count,
    easyTarget: count,
    mediumTarget: count,
    hardTarget: count,
    mediumUnlocked: z.boolean(),
    hardUnlocked: z.boolean(),
    expertUnlocked: z.boolean(),
    independent: z.boolean(),
    first: count.max(4),
    familiarity: count.max(4),
    groups: z.array(
      z.object({
        level: z.union([
          z.literal(1),
          z.literal(2),
          z.literal(3),
          z.literal(4),
        ]),
        difficulty: z.literal("leicht"),
        target: count,
        answered: count,
        total: count,
        unlocked: z.boolean(),
      }),
    ),
  }),
);
const topicSchema = z.object({
  topic: z.string(),
  genres: z.array(z.string()),
  goals: count,
  learning: learningOverviewSchema,
});
const historyCount = z.object({
  seen: count,
  answered: count,
  correct: count,
  wrong: count,
  unanswered: count,
  guessedCorrect: count,
});
const achievementsSchema = z.object({ counts, available: counts });
export const viewSchemas = {
  info: contentInfoSchema,
  selection: z.object({
    poolSize: count,
    selectionSize: count,
    repetitions: z.object({
      due: count,
      later: count,
      nextAt: time.nullable(),
    }),
    journey: journeySchema,
  }),
  summary: learningOverviewSchema.extend({
    badge: z.object({ available: count, mastered: count }),
    perfectTens: count,
  }),
  topics: z.object({
    items: z.array(topicSchema),
    nextCursor: z.string().nullable(),
  }),
  areas: z.array(topicSchema),
  "question-history": z.object({ question: historyCount, goal: historyCount }),
  "profile-progress": z.object({
    statistics: z.object({
      played: count,
      completed: count,
      answered: count,
      correct: count,
      encountered: count,
      recordRounds: count,
      accuracy: percent.nullable(),
      perfectTens: count,
      zeroTens: count,
      mastered: count,
    }),
    achievements: achievementsSchema,
  }),
  "round-experience": z
    .object({
      xp: z
        .object({
          participation: count,
          correct: count,
          discovered: count,
          recovered: count,
          mastered: count,
        })
        .optional(),
      learning: z
        .array(
          z.object({
            eventId: z.string(),
            previous: learningSchema.nullish(),
            current: learningSchema,
            resolvedMistake: z.boolean(),
            firstSolved: z.boolean(),
          }),
        )
        .optional(),
      before: count.optional(),
      after: count.optional(),
      perfectTens: count,
      achievements: z.object({
        completed: count,
        perfectTens: count,
        zeroTens: count,
      }),
      learningAchievements: z
        .object({ before: counts, after: achievementsSchema })
        .nullish(),
    })
    .nullable(),
  "round-repetitions": z.object({ due: count, nextAt: time.nullable() }),
};
export type ViewAction = keyof typeof viewSchemas;
export type ViewResult<K extends ViewAction> = z.infer<(typeof viewSchemas)[K]>;
export type ViewRequest<K extends ViewAction> = {
  action: K;
  [key: string]: unknown;
};
export type ContentInfo = z.infer<typeof contentInfoSchema>;
export type LearningOverview = z.infer<typeof learningOverviewSchema>;
export type Journey = z.infer<typeof journeySchema>;
export type SelectionView = ViewResult<"selection">;
export type TopicSummary = z.infer<typeof topicSchema>;

export function parseServerView<K extends ViewAction>(
  action: K,
  value: unknown,
): ViewResult<K> {
  const result = viewSchemas[action].safeParse(value);
  if (!result.success)
    throw new Error(
      "Die Serverübersicht ist unvollständig oder ungültig. Bitte erneut laden.",
    );
  return result.data as ViewResult<K>;
}
