import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  questionSchema,
  type Question,
  type Round,
  type State,
  type AnswerEvent,
} from "./model";
import { rebuild, learnPending } from "./engine";
import { questionSnapshotMatches } from "./filmFacts";
import { learningPathProgress, newlyUnlocked } from "./learningPath";
import { rankingRequest } from "./rankingRequest";
import { roundFact } from "./roundArchive";

export const duelSchema = z.object({
  id: z.string().uuid(),
  opponent: z.string().max(40),
  status: z.enum([
    "preparing",
    "waiting",
    "active",
    "completed",
    "cancelled",
    "forfeit",
  ]),
  kind: z.enum(["random", "invite"]),
  solutionDisplay: z.enum(["question", "round"]),
  round: z.number().int().min(1).max(3),
  myTurn: z.boolean(),
  dueAt: z.number(),
  createdAt: z.number(),
  reason: z.string().nullable(),
  result: z.enum(["win", "loss", "draw"]).nullable(),
  ranked: z.boolean().nullable(),
  invitation: z.string().nullable(),
  rounds: z
    .array(
      z.object({
        number: z.number(),
        answered: z.number().int().min(0).max(10),
        mine: z.number().nullable(),
        opponent: z.number().nullable(),
      }),
    )
    .length(3),
});
const visibleQuestion = z.object({
  id: z.string().min(1).max(200),
  knowledgeId: z.string().min(1).max(200),
  version: z.string().min(1).max(200),
  language: z.literal("de"),
  domain: z.string(),
  topic: z.string(),
  difficulty: z.enum(["leicht", "mittel", "schwer", "experte"]),
  question: z.string().min(1).max(4000),
  answers: z
    .array(
      z.object({
        id: z.string(),
        text: z.string(),
        feedback: z.string().optional(),
      }),
    )
    .length(4),
  correctId: z.string().optional(),
  explanation: z.string().optional(),
  context: z.string().optional(),
  anchor: z.string().optional(),
  sources: z.array(z.string()).optional(),
  tags: z.array(z.string()),
  badgeTags: z.array(z.string()),
  metadata: z.record(z.string(), z.string()),
  demo: z.boolean(),
});
const itemSchema = z.object({
  question: visibleQuestion,
  order: z.array(z.string()).length(4),
  event: z.object({
    answerId: z.string().nullable(),
    dontKnow: z.boolean(),
    correct: z.boolean().nullable(),
    guessed: z.boolean(),
    at: z.number(),
    elapsedMs: z.number().nonnegative(),
  }),
});
export const duelViewSchema = z.object({
  duel: duelSchema,
  number: z.number().int().min(1).max(3),
  answered: z.number().int().min(0).max(10),
  items: z.array(itemSchema).max(10),
  current: z
    .object({
      question: visibleQuestion,
      order: z.array(z.string()).length(4),
      index: z.number().int().min(0).max(9),
      startedAt: z.number().nullable(),
    })
    .nullable(),
  serverNow: z.number(),
});
export type Duel = z.infer<typeof duelSchema>;
export const duelStartSchema = duelViewSchema.omit({ items: true });
export type DuelView = z.infer<typeof duelViewSchema>;
export const openDuel = (d: Duel) =>
  ["preparing", "waiting", "active"].includes(d.status);
export const duelRoundId = (id: string, number: number) =>
  `duel-${id}-${number}`;
export const invitationToken = (hash = location.hash) =>
  /^#duel=([a-f0-9]{64})$/.exec(hash)?.[1] ?? null;
export const invitationUrl = (token: string) =>
  `${location.origin}${location.pathname}#duel=${token}`;
export const duelDeadline = (at: number) =>
  new Date(at).toLocaleString("de-DE", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
export function duelMessage(d: Duel) {
  if (d.status === "completed")
    return d.result === "win"
      ? "Du gewinnst!"
      : d.result === "loss"
        ? "Dein Gegner gewinnt."
        : "Unentschieden.";
  if (d.status === "forfeit")
    return `${d.result === "win" ? "Du gewinnst" : "Du verlierst"} durch ${d.reason === "timeout" ? "Zeitablauf" : "Aufgabe"}.`;
  if (d.status === "cancelled")
    return d.reason === "no_opponent"
      ? "Keinen Gegner gefunden."
      : d.reason === "withdrawn"
        ? "Herausforderung zurückgenommen."
        : "Nicht zustande gekommen.";
  if (d.status === "waiting") return "Gegner wird gesucht";
  return d.myTurn ? "Du bist dran" : "Warten auf Gegner";
}
export async function duelRpc<T>(
  client: SupabaseClient,
  owner: string,
  name: string,
  args: Record<string, unknown>,
  schema: z.ZodType<T>,
): Promise<T> {
  const controller = new AbortController();
  try {
    const current = await rankingRequest(
      (signal) =>
        client.auth.getUser().then((value) => {
          if (signal.aborted) throw new Error();
          return value;
        }),
      controller,
    );
    if (current.error || current.data.user?.id !== owner)
      throw new Error("account_changed");
    const result = await rankingRequest(
      (signal) => client.rpc(name, args).abortSignal(signal),
      controller,
    );
    if (result.error) throw result.error;
    return schema.parse(result.data);
  } catch (error) {
    const value =
      error && typeof error === "object" && "message" in error
        ? String(error.message)
        : "";
    const messages: Record<string, string> = {
      duel_limit:
        "Alle fünf Spielplätze sind belegt. Beende zuerst ein Duell oder warte auf seinen Abschluss.",
      waiting_limit:
        "Du hast bereits eine Herausforderung ohne Gegner. Du findest sie in Deinen offenen Spielen.",
      duel_catalog_missing:
        "Die Duellfragen sind noch nicht freigeschaltet. Versuche es später erneut.",
      invalid_invitation: "Dieser Einladungslink ist ungültig.",
      invitation_unavailable:
        "Diese Einladung ist noch nicht bereit, bereits angenommen oder abgelaufen.",
      self_duel: "Du kannst Deine eigene Herausforderung nicht annehmen.",
      not_your_turn:
        "Dieser Zug ist nicht mehr verfügbar. Aktualisiere Deine Duellübersicht.",
      account_changed:
        "Deine Anmeldung hat sich geändert. Lade die App erneut.",
      question_not_expired:
        "Die Fragezeit ist noch nicht abgelaufen. Versuche es erneut.",
    };
    throw new Error(
      Object.entries(messages).find(([key]) => value.includes(key))?.[1] ??
        (value.includes("PGRST202") || value.includes("quiz_duel_")
          ? "Die Duelle sind im Kontodienst noch nicht freigeschaltet."
          : "Der Duellstand konnte nicht bestätigt werden. Prüfe Deine Verbindung und versuche es erneut."),
    );
  }
}
export function viewQuestion(q: z.infer<typeof visibleQuestion>): Question {
  return {
    ...q,
    correctId: q.correctId ?? "unrevealed",
    explanation: q.explanation ?? "",
    context: q.context ?? "",
    anchor: q.anchor ?? "",
    sources: q.sources ?? [],
    answers: q.answers.map((a) => ({ ...a, feedback: a.feedback ?? "" })),
  };
}
export function duelEvent(
  item: DuelView["items"][number],
  id: string,
  q: Question,
): AnswerEvent {
  return {
    id: `${id}:${q.knowledgeId}`,
    roundId: id,
    questionId: q.id,
    knowledgeId: q.knowledgeId,
    version: q.version,
    answerId: item.event.answerId,
    ...(item.event.dontKnow ? { dontKnow: true as const } : {}),
    correct: item.event.correct ?? false,
    guessed: item.event.guessed,
    at: item.event.at,
    elapsedMs: item.event.elapsedMs,
    knowledgePoints: 0,
    timeBonus: 0,
  };
}
// Only confirmed, revealed own answers enter the private learning history.
// Stable event IDs make retries and device changes idempotent.
export function importDuelView(s: State, v: DuelView, finish = true) {
  const id = duelRoundId(v.duel.id, v.number);
  const available = v.items.filter((item) => item.event.correct !== null);
  if (!available.length) return;
  let r = s.rounds.find((r) => r.id === id);
  if (r?.archive && r.status === "completed") return;
  if (!r) {
    r = {
      id,
      mode: "ueben",
      topic: "Alle Themen",
      difficulty: "Alle Stufen",
      ruleVersion: "duel-v1",
      questions: [],
      order: [],
      events: [],
      before: structuredClone(s.learning),
      startedAt: available[0].event.at,
      finishedAt: available[0].event.at,
      status: "aborted",
      solutionDisplay: v.duel.solutionDisplay,
      duel: { id: v.duel.id, number: v.number },
    };
    s.rounds.push(r);
  }
  const added: AnswerEvent[] = [];
  let changedGuess = false;
  let catalogChanged = false;
  for (const item of available) {
    let q = questionSchema.parse(viewQuestion(item.question));
    const existing = s.questions.find((base) => base.id === q.id);
    if (
      existing &&
      (existing.version !== q.version || !questionSnapshotMatches(existing, q))
    )
      q = {
        ...q,
        id: `DUEL-${v.duel.id}-${v.number}-${r.events.length}`,
        metadata: { ...q.metadata, duel_question_id: q.id },
      };
    else if (existing)
      // Keep canonical metadata after a value-identical jsonb round trip;
      // the server's validated year choices stay in the historical snapshot.
      q = { ...structuredClone(existing), answers: q.answers };
    const prior = r.questions.find((old) => old.knowledgeId === q.knowledgeId);
    const fact = r.archive?.questions.find(
      (old) => old.knowledgeId === q.knowledgeId,
    );
    if (prior) q = prior;
    else if (fact) q = { ...q, id: fact.id };
    if (!r.archive && !s.questions.some((base) => base.id === q.id)) {
      s.questions = [...s.questions, structuredClone(q)];
      catalogChanged = true;
    }
    const event = duelEvent(item, id, q);
    const saved = s.events.find((e) => e.id === event.id);
    if (saved) {
      if (event.guessed && !saved.guessed) {
        saved.guessed = true;
        changedGuess = true;
      }
      continue;
    }
    if (r.archive) r.archive.questions.push(roundFact(q));
    else {
      r.questions.push(q);
      r.order.push(item.order);
    }
    r.events.push(event.id);
    s.events.push(event);
    added.push(event);
    r.finishedAt = event.at;
  }
  if (finish && r.events.length === 10 && r.status !== "completed") {
    const before = learningPathProgress(s);
    r.status = "completed";
    rebuild(s, true);
    r.unlocks = newlyUnlocked(before, s);
  } else if (changedGuess || catalogChanged || r.status === "completed") {
    if (added.length || changedGuess || catalogChanged) rebuild(s);
  } else learnPending(s, added);
}
// An unfinished duel can continue after its local results were compacted.
// Only the immediate review uses the server's revealed text, held in memory.
export function duelReviewRound(v: DuelView, round: Round): Round {
  if (!round.archive) return round;
  const items = new Map(
    v.items.map((item) => [item.question.knowledgeId, item]),
  );
  return {
    ...round,
    archive: undefined,
    questions: round.archive.questions.map((fact) => {
      const item = items.get(fact.knowledgeId);
      if (!item || item.event.correct === null)
        throw new Error("Die Duelllösung fehlt.");
      return { ...viewQuestion(item.question), id: fact.id };
    }),
    order: round.archive.questions.map(
      (fact) => items.get(fact.knowledgeId)!.order,
    ),
  };
}
export function duelScreen(
  v: DuelView,
  questionIndex: number,
  s: State,
): { round: Round; state: State } {
  const id = duelRoundId(v.duel.id, v.number);
  const rendered = [...v.items.map((i) => viewQuestion(i.question))];
  if (v.current) rendered.push(viewQuestion(v.current.question));
  const empty = rendered[questionIndex] ?? rendered[0];
  if (!empty) throw new Error("Keine Duellfrage verfügbar.");
  const qs = Array.from(
    { length: 10 },
    (_, i) =>
      rendered[i] ?? {
        ...empty,
        id: `pending-${i}`,
        knowledgeId: `pending-${i}`,
      },
  );
  const events = v.items.map((item, i) => duelEvent(item, id, qs[i]));
  const round: Round = {
    id,
    mode: "ueben",
    topic: "Alle Themen",
    difficulty: "Alle Stufen",
    ruleVersion: "duel-v1",
    duel: { id: v.duel.id, number: v.number },
    solutionDisplay: v.duel.solutionDisplay,
    questions: qs,
    order: Array.from(
      { length: 10 },
      (_, i) =>
        v.items[i]?.order ??
        (i === v.current?.index
          ? v.current.order
          : qs[i].answers.map((a) => a.id)),
    ),
    events: events.map((e) => e.id),
    startedAt: events[0]?.at ?? v.serverNow,
    finishedAt: null,
    status: "active",
    before: {},
  };
  return {
    round,
    state: {
      ...s,
      events: [...s.events.filter((e) => e.roundId !== id), ...events],
    },
  };
}
