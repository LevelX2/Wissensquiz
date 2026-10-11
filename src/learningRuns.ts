import { z } from "zod";
import type { SyncRemote } from "./entryRemote";
import {
  questionSchema,
  type State,
  type Round,
  type AnswerChoice,
  type QuizFilters,
} from "./model";
import { stateSchema } from "./backupSchema";
import { LearningRunError } from "./learningErrors";
export type LearningSetup = {
  mode: "entdecken" | "ueben" | "fehler";
  topic: string;
  filters: QuizFilters;
  solutionDisplay: "question" | "round";
  sourceRoundId?: string;
};
export const learningRunSchema = z.object({
  id: z.string().uuid(),
  mode: z.enum(["entdecken", "ueben", "fehler"]),
  topic: z.string(),
  filters: stateSchema.shape.rounds.element.shape.filters.unwrap(),
  solutionDisplay: z.enum(["question", "round"]),
  status: z.enum(["active", "completed", "aborted"]),
  answered: z.number().int().min(0).max(10),
  size: z.number().int().min(1).max(10),
  startedAt: z.number(),
  finishedAt: z.number().nullable(),
});
export type LearningRun = z.infer<typeof learningRunSchema>;
const visible = z
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
const item = z.object({
  question: questionSchema,
  order: z.array(z.string()).length(4),
  event: stateSchema.shape.events.element,
  before: stateSchema.shape.learning.valueType.nullable().optional(),
  progress: z.object({
    previous: stateSchema.shape.learning.valueType.nullable(),
    current: stateSchema.shape.learning.valueType,
    resolvedMistake: z.boolean(),
    firstSolved: z.boolean(),
  }),
});
const response = z.object({
  run: learningRunSchema,
  current: z
    .object({
      index: z.number().int(),
      nonce: z.string().uuid(),
      question: visible,
      order: z.array(z.string()).length(4),
    })
    .optional(),
  item: item.optional(),
  items: z.array(item).max(10).optional(),
});
export class LearningSession {
  run?: LearningRun;
  current?: z.infer<typeof response>["current"];
  items: z.infer<typeof item>[] = [];
  private pending?: string;
  private writing = false;
  constructor(private api: SyncRemote) {}
  get hasPending() {
    return !!this.pending;
  }
  private accept(value: unknown) {
    const result = response.parse(value);
    this.run = result.run;
    if (result.current) this.current = result.current;
    if (result.items) this.items = result.items;
    if (result.item) {
      const i = this.items.findIndex(
        (x) => x.event.id === result.item!.event.id,
      );
      if (i < 0) this.items.push(result.item);
      else this.items[i] = result.item;
    }
    this.pending = undefined;
    return result;
  }
  async retry() {
    if (!this.pending || this.writing)
      throw new Error("Die Anfrage kann gerade nicht wiederholt werden.");
    this.writing = true;
    try {
      return this.accept(
        await this.api.call("quiz_game_call", { request_text: this.pending }),
      );
    } catch (e) {
      if (e instanceof LearningRunError) this.pending = undefined;
      throw e;
    } finally {
      this.writing = false;
    }
  }
  private send(body: object) {
    if (this.writing || this.pending)
      throw new Error(
        "Bestätige zuerst die ausstehende Anfrage mit „Erneut versuchen“.",
      );
    this.pending = JSON.stringify({ ...body, requestId: crypto.randomUUID() });
    return this.retry();
  }
  start(setup: LearningSetup) {
    return this.send({
      action: "start",
      setup,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    });
  }
  async resume(id: string) {
    return this.accept(
      await this.api.call("quiz_game_call", {
        request_text: JSON.stringify({ action: "resume", runId: id }),
      }),
    );
  }
  next() {
    return this.send({
      action: "question",
      runId: this.run!.id,
      index: this.run!.answered,
    });
  }
  answer(choice: AnswerChoice, guessed: boolean) {
    return this.send({
      action: "answer",
      runId: this.run!.id,
      index: this.current!.index,
      nonce: this.current!.nonce,
      answerId: typeof choice === "string" ? choice : null,
      dontKnow: typeof choice === "object" && choice !== null,
      guessed,
    });
  }
  guess() {
    return this.send({
      action: "guess",
      runId: this.run!.id,
      index: this.run!.answered - 1,
    });
  }
  finish() {
    return this.send({ action: "finish", runId: this.run!.id });
  }
  abort() {
    return this.send({ action: "abort", runId: this.run!.id });
  }
  round(): Round {
    const r = this.run!;
    return {
      id: "learn-" + r.id,
      mode: r.mode,
      topic: r.topic,
      filters: r.filters,
      difficulty: "Alle Stufen",
      ruleVersion: "learn-server-v1",
      solutionDisplay: r.solutionDisplay,
      status: r.status,
      startedAt: r.startedAt,
      finishedAt: r.finishedAt,
      questions: this.items.map((x) => x.question),
      order: this.items.map((x) => x.order),
      events: this.items.map((x) => x.event.id),
      before: Object.fromEntries(
        this.items
          .filter((item) => item.before != null)
          .map((item) => [item.question.knowledgeId, item.before!]),
      ),
    };
  }
  screen(base: State) {
    const round = this.round(),
      current = this.current!;
    const q = {
      ...current.question,
      correctId: "unrevealed",
      explanation: "",
      context: "",
      anchor: "",
      sources: [],
      answers: current.question.answers.map((a) => ({ ...a, feedback: "" })),
    };
    if (this.items.length <= current.index) {
      round.questions.push(q);
      round.order.push(current.order);
    }
    while (round.questions.length < this.run!.size) {
      round.questions.push({
        ...q,
        id: "pending-" + round.questions.length,
        knowledgeId: "pending-" + round.questions.length,
      });
      round.order.push(current.order);
    }
    return {
      round,
      index: current.index,
      state: {
        ...base,
        rounds: [...base.rounds.filter((r) => r.id !== round.id), round],
        events: [
          ...base.events.filter((e) => e.roundId !== round.id),
          ...this.items.map((x) => x.event),
        ],
      },
    };
  }
}
