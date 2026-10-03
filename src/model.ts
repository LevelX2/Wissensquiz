import type { z } from "zod";
import type { stateSchema, roundSchema, learningSchema } from "./backupSchema";
import { questionSchema } from "./questionSchema";
export { questionSchema } from "./questionSchema";

export type Question = z.infer<typeof questionSchema>;
export type Mode = Round["mode"];
export type Difficulty = Question["difficulty"];
export type SolutionDisplay = NonNullable<Round["solutionDisplay"]>;
export type QuestionSource = NonNullable<QuizFilters["sources"]>[number];
export type RoundSetup = NonNullable<State["settings"]["roundSetup"]>;
export type QuizFilters = NonNullable<Round["filters"]>;
export type Learning = z.infer<typeof learningSchema>;
export type AnswerEvent = State["events"][number];
export type AnswerChoice = string | null | { dontKnow: true };
export const hasAnswer = (event: AnswerEvent) =>
  event.answerId !== null || event.dontKnow === true;
// New solo rounds keep their targets in before; legacy/duel rounds may hold the full map.
export type Round = z.infer<typeof roundSchema>;
export type Report = State["reports"][number];
export type ImportReport = State["imports"][number];
// favorites and settings.learningPath remain accepted legacy backup fields.
export type State = z.infer<typeof stateSchema>;
export const DEFAULT_ANSWER_REVEAL_MS = 1100;
export const emptyState = (questions: Question[] = []): State => ({
  schemaVersion: 1,
  questions,
  rounds: [],
  events: [],
  learning: {},
  badges: [],
  favorites: [],
  reports: [],
  imports: [],
  settings: {
    spoilers: false,
    sound: true,
    haptics: false,
    showGenre: true,
    showDifficulty: true,
    questionHistory: "after",
  },
  experience: 0,
  career: { version: 1, legacyBonus: 0 },
  records: {},
});
export const uid = () =>
  typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : Array.from(crypto.getRandomValues(new Uint32Array(4)), (x) =>
        x.toString(16).padStart(8, "0"),
      ).join("-");
