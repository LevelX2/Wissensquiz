import { z } from "zod";
import type { SyncRemote } from "./entryRemote";
import { questionSchema } from "./questionSchema";
import { HotSeatError, hotSeatMessages } from "./hotSeatErrors";

export const hotSeatModes = {
  quiz: { name: "Quizabend", text: "Reihum spielen · gleiche Stufen für alle" },
  hunt: {
    name: "Genre-Jagd",
    text: "Themen wählen · verschiedene Abzeichen sammeln",
  },
  risk: { name: "Risiko", text: "Schwierigkeit wählen · Punkte wagen" },
  all: { name: "Alle tippen", text: "Dieselbe Frage · alle raten mit" },
} as const;
export const hotSeatSetupSchema = z.object({
  mode: z.enum(["quiz", "hunt", "risk", "all"]),
  rounds: z.union([z.literal(3), z.literal(6), z.literal(9)]),
  seconds: z.union([z.literal(0), z.literal(30)]),
  input: z.enum(["moderated", "hidden"]),
  teams: z.boolean(),
  double: z.boolean(),
  steal: z.boolean(),
  tieBreak: z.boolean(),
  sound: z.boolean(),
  explanations: z.boolean(),
  topics: z.array(z.string().min(1).max(160)).min(1).max(16),
  filters: z.object({
    sources: z
      .array(z.enum(["film", "actors", "awards"]))
      .min(1)
      .max(3),
    familiarities: z
      .array(z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]))
      .min(1)
      .max(4),
    workTypes: z
      .array(z.enum(["film", "series"]))
      .min(1)
      .max(2)
      .optional(),
    techniques: z
      .array(z.enum(["animation", "live-action"]))
      .min(1)
      .max(2)
      .optional(),
  }),
});
export type HotSeatSetup = z.infer<typeof hotSeatSetupSchema>;
export const defaultHotSeatSetup = (): HotSeatSetup => ({
  mode: "quiz",
  rounds: 6,
  seconds: 0,
  input: "moderated",
  teams: false,
  double: false,
  steal: false,
  tieBreak: false,
  sound: true,
  explanations: false,
  topics: ["mix"],
  filters: { sources: ["film", "actors", "awards"], familiarities: [1, 2] },
});
const participant = z.object({
  name: z.string().trim().min(1).max(28),
  members: z.array(z.string().trim().min(1).max(40)).min(1).max(7),
});
export type HotSeatParticipant = z.infer<typeof participant>;
const player = participant.extend({
  score: z.number().int(),
  hits: z.number().int().nonnegative(),
  answered: z.number().int().nonnegative(),
  badges: z.array(z.string()),
  doubleUsed: z.boolean(),
  stealUsed: z.boolean(),
  streak: z.number().int().nonnegative(),
  bestStreak: z.number().int().nonnegative(),
  tieScore: z.number().int().nonnegative(),
});
export const hotSeatTopicSchema = z.object({
  id: z.string(),
  label: z.string(),
  counts: z.record(z.string(), z.number().int().nonnegative()),
});
export type HotSeatTopic = z.infer<typeof hotSeatTopicSchema>;
const visibleQuestion = z
  .object({ ...questionSchema.shape })
  .omit({
    correctId: true,
    explanation: true,
    context: true,
    sources: true,
    answers: true,
    presentation: true,
    works: true,
  })
  .extend({
    answers: z.array(z.object({ id: z.string(), text: z.string() })).length(4),
  });
export const hotSeatPartySchema = z
  .object({
    id: z.string().uuid(),
    setup: hotSeatSetupSchema,
    players: z.array(player).min(2).max(8),
    roster: z.array(z.number().int().min(0).max(7)).min(1).max(8),
    round: z.number().int().nonnegative(),
    turn: z.number().int().nonnegative(),
    tieRound: z.number().int().min(0).max(3),
    phase: z.enum([
      "ready",
      "question",
      "handoff",
      "offer-steal",
      "stealing",
      "moderate",
      "reveal",
      "interval",
      "result",
    ]),
    status: z.enum(["active", "completed", "aborted"]),
    revision: z.number().int().nonnegative(),
    player: z.number().int().min(0).max(7),
    theme: z.string(),
    difficulty: z.enum(["leicht", "mittel", "schwer"]),
    current: z
      .object({
        position: z.number().int().nonnegative(),
        theme: z.string(),
        difficulty: z.enum(["leicht", "mittel", "schwer"]),
        question: z.union([questionSchema, visibleQuestion]),
        order: z.array(z.string()).length(4),
        deadline: z.number().nullable(),
        doublePlayers: z.array(z.number().int()),
        answers: z.array(
          z.object({
            player: z.number().int(),
            answerId: z.string().nullable(),
            correct: z.boolean(),
            points: z.number().int(),
            kind: z.enum(["regular", "steal"]),
          }),
        ),
      })
      .nullable(),
    choices: z.array(hotSeatTopicSchema),
    winners: z.array(z.number().int()),
    createdAt: z.number(),
    finishedAt: z.number().nullable(),
    serverNow: z.number(),
  })
  .superRefine((party, ctx) => {
    const shouldReveal = party.phase === "moderate" || party.phase === "reveal";
    if (party.current && shouldReveal !== "correctId" in party.current.question)
      ctx.addIssue({
        code: "custom",
        message: "Frage und Auflösungsphase passen nicht zusammen",
      });
    if (party.current && !shouldReveal && party.current.answers.length > 0)
      ctx.addIssue({
        code: "custom",
        message: "Verdeckte Antworten wurden vorzeitig ausgegeben",
      });
    if (
      party.player >= party.players.length ||
      [...party.roster, ...party.winners].some((i) => i >= party.players.length)
    )
      ctx.addIssue({ code: "custom", message: "Unbekannter Spielplatz" });
    if (
      party.current &&
      (new Set(party.current.order).size !== 4 ||
        party.current.order.some(
          (id) => !party.current!.question.answers.some((a) => a.id === id),
        ))
    )
      ctx.addIssue({ code: "custom", message: "Ungültige Antwortreihenfolge" });
  });
export type HotSeatParty = z.infer<typeof hotSeatPartySchema>;
export const hotSeatLobbySchema = z.object({
  active: hotSeatPartySchema.nullable(),
  history: z.array(hotSeatPartySchema).max(10),
  hasMore: z.boolean(),
  templates: z
    .array(z.object({ name: z.string(), setup: hotSeatSetupSchema }))
    .max(20),
});
export type HotSeatLobby = z.infer<typeof hotSeatLobbySchema>;
const responseSchema = z.object({
  party: hotSeatPartySchema.optional(),
  ok: z.boolean().optional(),
});
export const hotSeatTheme = (id: string) =>
  id === "mix"
    ? "Bunter Mix"
    : id === "actors"
      ? "Schauspieler"
      : id === "awards"
        ? "Preise"
        : id.replace(/^genre:/, "");
export function hotSeatStandings(party: HotSeatParty) {
  return party.players
    .map((p, i) => ({ ...p, index: i }))
    .sort(
      (a, b) =>
        Number(party.winners.includes(b.index)) -
          Number(party.winners.includes(a.index)) ||
        (party.setup.mode === "hunt" ? b.badges.length - a.badges.length : 0) ||
        b.score - a.score ||
        a.index - b.index,
    );
}

export class HotSeatSession {
  party?: HotSeatParty;
  private pending?: string;
  private writing = false;
  constructor(private api: SyncRemote) {}
  get hasPending() {
    return this.pending !== undefined;
  }
  get pendingAction(): string | undefined {
    return this.pending
      ? (JSON.parse(this.pending) as { action: string }).action
      : undefined;
  }
  private async call(body: string) {
    try {
      return await this.api.call<unknown>("quiz_hot_seat_call", {
        request_text: body,
      });
    } catch (error) {
      if (error instanceof HotSeatError) throw error;
      const message = error instanceof Error ? error.message : String(error);
      const code = Object.keys(hotSeatMessages).find((key) =>
        message.includes(key),
      );
      if (code) throw new HotSeatError(code, message);
      throw error;
    }
  }
  async lobby(page = 0) {
    return hotSeatLobbySchema.parse(
      await this.call(JSON.stringify({ action: "lobby", page })),
    );
  }
  async reloadLobby(page = 0) {
    if (this.writing) throw new Error("Eine Anfrage wird noch bestätigt.");
    const value = await this.lobby(page);
    this.pending = undefined;
    return value;
  }
  async options(setup: HotSeatSetup) {
    return z
      .object({ options: z.array(hotSeatTopicSchema) })
      .parse(await this.call(JSON.stringify({ action: "options", setup })))
      .options;
  }
  async resume(id: string) {
    if (this.writing) throw new Error("Eine Anfrage wird noch bestätigt.");
    const result = responseSchema.parse(
      await this.call(JSON.stringify({ action: "resume", partyId: id })),
    );
    if (!result.party) throw new Error("Die Partie fehlt in der Antwort.");
    this.party = result.party;
    this.pending = undefined;
    return this.party;
  }
  async retry() {
    if (!this.pending || this.writing)
      throw new Error("Die Anfrage kann gerade nicht wiederholt werden.");
    this.writing = true;
    try {
      const value = responseSchema.parse(await this.call(this.pending));
      if (value.party) this.party = value.party;
      this.pending = undefined;
      return value;
    } catch (error) {
      if (error instanceof HotSeatError) this.pending = undefined;
      throw error;
    } finally {
      this.writing = false;
    }
  }
  send(action: string, payload: Record<string, unknown> = {}) {
    if (this.pending || this.writing)
      throw new Error("Bestätige zuerst die ausstehende Anfrage.");
    this.pending = JSON.stringify({
      action,
      ...(this.party
        ? { partyId: this.party.id, revision: this.party.revision }
        : {}),
      ...payload,
      requestId: crypto.randomUUID(),
    });
    return this.retry();
  }
  create(setup: HotSeatSetup, players: HotSeatParticipant[]) {
    hotSeatSetupSchema.parse(setup);
    z.array(participant).min(2).max(8).parse(players);
    this.party = undefined;
    return this.send("create", { setup, players });
  }
}
