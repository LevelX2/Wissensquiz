import { z } from "zod";
import type { SyncRemote } from "./entryRemote";
import {
  questionSchema,
  type AnswerChoice,
  type Question,
  type Round,
  type State,
} from "./model";
import { stateSchema, roundFactSchema } from "./backupSchema";
import { rebuild, learnPending } from "./engine";
import { roundFact } from "./roundArchive";
import { isEndlessMode } from "./recordModes";
import { RankedRunError } from "./rankedErrors";

export const rankedSummarySchema = z.object({
  id: z.string().uuid(),
  mode: z.enum(["rekord", "fehlerfrei", "zeitkonto"]),
  recordPreset: z.enum(["standard", "genre"]),
  filters: z.object({
    genres: z.array(z.string()),
    sources: z.array(z.enum(["film", "awards", "actors"])),
    difficulties: z.array(z.enum(["leicht", "mittel", "schwer"])),
    familiarities: z.array(
      z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
    ),
  }),
  ruleVersion: z.string(),
  solutionDisplay: z.enum(["question", "round"]),
  status: z.enum(["active", "completed", "aborted"]),
  answered: z.number().int().nonnegative(),
  points: z.number().int().nonnegative(),
  hits: z.number().int().nonnegative(),
  bankMs: z.number().int().min(0).max(120000),
  startedAt: z.number(),
  finishedAt: z.number().nullable(),
});
export type RankedSummary = z.infer<typeof rankedSummarySchema>;
const visibleSchema = z
  .object({ ...questionSchema.shape })
  .omit({
    correctId: true,
    explanation: true,
    context: true,
    anchor: true,
    sources: true,
    answers: true,
  })
  .extend({
    answers: z.array(z.object({ id: z.string(), text: z.string() })).length(4),
  });
const currentSchema = z.object({
  index: z.number().int().nonnegative(),
  nonce: z.string().uuid(),
  question: visibleSchema,
  order: z.array(z.string()).length(4),
  issuedAt: z.number(),
  deadline: z.number(),
});
const itemSchema = z.object({
  question: questionSchema,
  order: z.array(z.string()).length(4),
  event: stateSchema.shape.events.element,
});
export type RankedItem = z.infer<typeof itemSchema>;
export const rankedResponseSchema = z.object({
  run: rankedSummarySchema,
  current: currentSchema.optional(),
  item: itemSchema.optional(),
  serverNow: z.number(),
});
export type RankedResponse = z.infer<typeof rankedResponseSchema>;
export const rankedHistorySchema = z.object({
  run: rankedSummarySchema,
  items: z.array(itemSchema).max(50),
});
export type RankedHistory = { run: RankedSummary; items: RankedItem[] };
export type RankedSetup = {
  mode: RankedSummary["mode"];
  preset: RankedSummary["recordPreset"];
  genre?: string;
  solutionDisplay: "question" | "round";
};
export const rankedRoundId = (id: string) => `ranked-${id}`;

export async function rankedRead<T>(
  api: SyncRemote,
  body: object,
  schema: z.ZodType<T>,
): Promise<T> {
  return schema.parse(
    await api.call("quiz_ranked_call", { request_text: JSON.stringify(body) }),
  );
}
export async function rankedHistory(
  api: SyncRemote,
  runId: string,
): Promise<RankedHistory> {
  const items: RankedItem[] = [];
  let run: RankedSummary;
  for (let offset = 0; ; offset += 50) {
    const page = await rankedRead(
      api,
      { action: "history", runId, offset },
      rankedHistorySchema,
    );
    run = page.run;
    items.push(...page.items);
    if (page.items.length < 50 || items.length >= run.answered) break;
  }
  return { run: run!, items };
}
export function rankedRound(history: RankedHistory): Round {
  const { run, items } = history;
  return {
    id: rankedRoundId(run.id),
    mode: run.mode,
    recordPreset: run.recordPreset,
    ruleVersion: run.ruleVersion,
    filters: run.filters,
    topic: "Alle Themen",
    difficulty: "Alle Stufen",
    solutionDisplay: run.solutionDisplay,
    questions: items.map((i) => i.question),
    order: items.map((i) => i.order),
    events: items.map((i) => i.event.id),
    before: {},
    startedAt: run.startedAt,
    finishedAt: run.finishedAt,
    status: run.status,
    ...(isEndlessMode(run.mode)
      ? {
          run: {
            version: 1 as const,
            pool: [],
            queue: [],
            cycle: 1,
            bankMs: run.bankMs,
            ended: run.status === "completed",
          },
        }
      : {}),
  };
}
// Persist only answered facts and events. Future order never enters the normal
// save. Ranking authority stays on the server even if this history is edited.
export function importRankedHistory(s: State, history: RankedHistory) {
  importRankedFacts(s, {
    run: history.run,
    items: history.items.map((i) => ({
      fact: roundFact(i.question),
      event: i.event,
    })),
  });
}
const rankedFactsSchema = z.object({
  run: rankedSummarySchema,
  items: z
    .array(
      z.object({
        fact: roundFactSchema,
        event: stateSchema.shape.events.element,
      }),
    )
    .max(50),
});
export type RankedFacts = {
  run: RankedSummary;
  items: z.infer<typeof rankedFactsSchema>["items"];
};
export async function rankedFacts(
  api: SyncRemote,
  runId: string,
): Promise<RankedFacts> {
  const items: RankedFacts["items"] = [];
  let run: RankedSummary;
  for (let offset = 0; ; offset += 50) {
    const page = await rankedRead(
      api,
      { action: "history", runId, offset, factsOnly: true },
      rankedFactsSchema,
    );
    run = page.run;
    items.push(...page.items);
    if (page.items.length < 50 || items.length >= run.answered) break;
  }
  return { run: run!, items };
}
export function importRankedFacts(s: State, history: RankedFacts) {
  if (!history.items.length || history.run.status === "active") return;
  const round = rankedRound({ run: history.run, items: [] });
  if (s.rounds.some((r) => r.id === round.id)) return;
  round.archive = { version: 1, questions: history.items.map((i) => i.fact) };
  round.events = history.items.map((i) => i.event.id);
  s.rounds.push(round);
  s.events.push(...history.items.map((i) => i.event));
  rebuild(s, true);
}

export class RankedSession {
  readonly sessionId = crypto.randomUUID();
  run?: RankedSummary;
  current?: RankedResponse["current"];
  items: RankedItem[] = [];
  private receivedAt = 0;
  private serverNow = 0;
  private pending?: string;
  private writing = false;
  constructor(
    private api: SyncRemote,
    private releaseHash: string,
  ) {}
  get hasPending() {
    return !!this.pending;
  }
  get isWriting() {
    return this.writing;
  }
  private accept(value: unknown) {
    const result = rankedResponseSchema.parse(value);
    this.run = result.run;
    if (result.current) this.current = result.current;
    if (result.item) {
      const index = this.items.findIndex(
        (i) => i.event.id === result.item!.event.id,
      );
      if (index < 0) this.items.push(result.item);
      else this.items[index] = result.item;
    }
    this.serverNow = result.serverNow;
    this.receivedAt = performance.now();
    this.pending = undefined;
    return result;
  }
  private async send(body: object) {
    if (this.writing || this.pending)
      throw new Error(
        "Bestätige zuerst die ausstehende Anfrage mit „Erneut versuchen“.",
      );
    this.pending = JSON.stringify({ ...body, requestId: crypto.randomUUID() });
    return this.retry();
  }
  async retry() {
    if (this.writing || !this.pending)
      throw new Error("Es gibt keine ausstehende Anfrage.");
    this.writing = true;
    try {
      return this.accept(
        await this.api.call("quiz_ranked_call", { request_text: this.pending }),
      );
    } catch (error) {
      if (error instanceof RankedRunError) this.pending = undefined;
      throw error;
    } finally {
      this.writing = false;
    }
  }
  start(setup: RankedSetup) {
    return this.send({
      action: "start",
      ...setup,
      sessionId: this.sessionId,
      releaseHash: this.releaseHash,
    });
  }
  next() {
    if (!this.run) throw new Error("Die Zeitrunde fehlt.");
    return this.send({
      action: "question",
      runId: this.run.id,
      sessionId: this.sessionId,
      index: this.run.answered,
    });
  }
  answer(choice: AnswerChoice, guessed = false) {
    if (!this.run || !this.current)
      throw new Error("Die aktuelle Frage fehlt.");
    return this.send({
      action: "answer",
      runId: this.run.id,
      sessionId: this.sessionId,
      index: this.current.index,
      nonce: this.current.nonce,
      answerId: typeof choice === "string" ? choice : null,
      dontKnow: choice !== null && typeof choice === "object",
      guessed,
    });
  }
  markGuessed() {
    return this.send({
      action: "guess",
      runId: this.run!.id,
      sessionId: this.sessionId,
      index: this.run!.answered - 1,
    });
  }
  async abort() {
    if (!this.run || this.run.status !== "active") return;
    return this.send({ action: "abort", runId: this.run.id });
  }
  elapsed() {
    return this.current
      ? Math.max(
          0,
          this.serverNow -
            this.current.issuedAt +
            performance.now() -
            this.receivedAt,
        )
      : 0;
  }
  screen(base: State): { round: Round; state: State; index: number } {
    if (!this.run || !this.current) throw new Error("Die Zeitfrage fehlt.");
    const items = [...this.items];
    const current = this.current;
    const q: Question = {
      ...current.question,
      correctId: "unrevealed",
      explanation: "",
      context: "",
      anchor: "",
      sources: [],
      answers: current.question.answers.map((a) => ({ ...a, feedback: "" })),
    };
    const round = rankedRound({ run: this.run, items });
    if (items.length <= current.index) {
      round.questions.push(q);
      round.order.push(current.order);
    }
    // Fixed length for ten-question progress; placeholders contain no future IDs.
    if (this.run.mode === "rekord")
      while (round.questions.length < 10) {
        round.questions.push({
          ...q,
          id: `pending-${round.questions.length}`,
          knowledgeId: `pending-${round.questions.length}`,
        });
        round.order.push(current.order);
      }
    const state = {
      ...base,
      learning: { ...base.learning },
      rounds: [...base.rounds.filter((r) => r.id !== round.id), round],
      events: [
        ...base.events.filter((e) => e.roundId !== round.id),
        ...items.map((i) => i.event),
      ],
    };
    learnPending(
      state,
      items.map((i) => i.event),
    );
    return { round, state, index: current.index };
  }
}
