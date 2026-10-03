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
export type Question = z.infer<typeof questionSchema>;
export type Mode = "entdecken" | "ueben" | "rekord" | "fehler";
export type Difficulty = Question["difficulty"];
export type SolutionDisplay = "question" | "round";
export type QuestionSource = "film" | "awards" | "actors";
export interface RoundSetup {
  mode: Mode;
  genres: string[] | null;
  categories: ("Classics" | "Arthouse" | "Preisträger" | "Schauspieler")[];
  difficulties: Difficulty[];
  familiarities?: (1 | 2 | 3 | 4)[];
  sources?: QuestionSource[];
}
export interface QuizFilters {
  genres: string[];
  difficulties: Difficulty[];
  familiarities?: (1 | 2 | 3 | 4)[];
  sources?: QuestionSource[];
}
export interface Learning {
  knowledgeId: string;
  stage: number;
  status: "entdeckt" | "geübt" | "gefestigt";
  due: number;
  lastSecure: number | null;
  lastSeenAt: number | null;
  lastAdvancedDay: string | null;
  secureDays: string[];
  seen: number;
}
export interface AnswerEvent {
  id: string;
  roundId: string;
  questionId: string;
  knowledgeId: string;
  version: string;
  answerId: string | null;
  dontKnow?: true;
  correct: boolean;
  guessed: boolean;
  at: number;
  knowledgePoints: number;
  timeBonus: number;
  elapsedMs: number;
}
export type AnswerChoice = string | null | { dontKnow: true };
export const hasAnswer = (event: AnswerEvent) =>
  event.answerId !== null || event.dontKnow === true;
export interface Round {
  id: string;
  mode: Mode;
  topic: string;
  difficulty: string;
  filters?: QuizFilters;
  ruleVersion: string;
  familiaritySnapshot?: Record<string, number>;
  unlocks?: (
    | { genre: string; difficulty: "mittel" | "schwer" | "experte" }
    | { genre: string; familiarity: 1 | 2 | 3 | 4 }
  )[];
  questions: Question[];
  order: string[][];
  events: string[];
  startedAt: number;
  finishedAt: number | null;
  status: "active" | "completed" | "aborted";
  before: Record<string, Learning>; // New solo rounds keep their targets; legacy/duel rounds may hold the full map.
  solutionDisplay?: SolutionDisplay;
  duel?: { id: string; number: number };
}
export interface Report {
  id: string;
  questionId: string;
  version: string;
  comment: string;
  at: number;
}
export interface ImportReport {
  at: number;
  filename: string;
  accepted: number;
  rejected: number;
  duplicates: number;
  delimiter: string;
  columns: string[];
  issues: string[];
  warnings: string[];
}
export interface State {
  schemaVersion: 1;
  questions: Question[];
  rounds: Round[];
  events: AnswerEvent[];
  learning: Record<string, Learning>;
  badges: string[];
  favorites: string[]; // Legacy backup field; no longer used by the app.
  reports: Report[];
  imports: ImportReport[];
  settings: {
    spoilers: boolean;
    sound?: boolean;
    haptics?: boolean;
    showGenre?: boolean;
    showDifficulty?: boolean;
    questionHistory?: "after" | "always" | "hidden";
    learningPath?: boolean; // Legacy preference retained for old backups.
    allDifficulties?: boolean;
    roundSetup?: RoundSetup;
    solutionDisplay?: SolutionDisplay;
  };
  experience: number;
  career?: { version: 1; legacyBonus: number };
  records: Record<string, { points: number; roundId: string }>;
  journey?: {
    version: 1;
    independentAreas?: true;
    earned: Record<string, { difficulty: number; familiarity: number }>;
  };
}
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
