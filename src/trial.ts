import { emptyState, type State } from "./model";
import { validateBackup } from "./backupValidation";
import { rebuild, startRound } from "./engine";
import { genreOf, questionSourceOf } from "./filters";

export const TRIAL_KEY = "wissensquiz-trial:v1";
export const TRIAL_USED_KEY = "wissensquiz-trial-used:v1";
export const TRIAL_LIFETIME = 24 * 60 * 60 * 1000;
export type Trial = {
  expiresAt: number;
  state: State;
  recipient?: string;
};

// Only this one round is retained until takeover, never the full catalog or
// an account's progress. The separate used marker contains no game data.
export function readTrial(storage: Storage, now = Date.now()): Trial | null {
  try {
    const text = storage.getItem(TRIAL_KEY);
    if (!text) return null;
    const raw = JSON.parse(text) as Trial;
    if (
      !Number.isFinite(raw.expiresAt) ||
      raw.expiresAt <= now ||
      raw.expiresAt > now + TRIAL_LIFETIME ||
      (raw.recipient !== undefined && typeof raw.recipient !== "string")
    )
      throw new Error("Abgelaufene Proberunde");
    const state = validateBackup(raw.state);
    const round = state.rounds[0];
    if (
      state.rounds.length !== 1 ||
      round.mode !== "ueben" ||
      round.questions.length !== 10 ||
      state.questions.length !== 10 ||
      round.duel ||
      round.archive ||
      round.run
    )
      throw new Error("Ungültige Proberunde");
    return { expiresAt: raw.expiresAt, state, recipient: raw.recipient };
  } catch {
    try {
      storage.removeItem(TRIAL_KEY);
    } catch {
      /* No draft is available. */
    }
    return null;
  }
}

export function trialUsed(): boolean {
  try {
    return localStorage.getItem(TRIAL_USED_KEY) !== null;
  } catch {
    return true;
  }
}

export function writeTrial(storage: Storage, trial: Trial) {
  const round = trial.state.rounds[0];
  const selected = new Set(round.questions.map((q) => q.id));
  storage.setItem(TRIAL_USED_KEY, "yes");
  storage.setItem(
    TRIAL_KEY,
    JSON.stringify({
      ...trial,
      state: {
        ...trial.state,
        questions: trial.state.questions.filter((q) => selected.has(q.id)),
      },
    }),
  );
}

export function createTrial(
  state: State,
  genre: string,
  now = Date.now(),
): Trial {
  const next = emptyState(state.questions);
  const genres = genre
    ? [genre]
    : [
        ...new Set(
          state.questions
            .filter((q) => questionSourceOf(q) === "film")
            .map(genreOf),
        ),
      ];
  const round = startRound(
    next,
    {
      mode: "ueben",
      topic: "Alle Themen",
      difficulty: "Alle Stufen",
      filters: {
        genres,
        sources: ["film"],
        difficulties: ["leicht", "mittel"],
      },
    },
    now,
    10,
  );
  if (round.questions.length !== 10)
    throw new Error(
      "Für diese Proberunde fehlen Fragen. Wähle ein anderes Genre.",
    );
  const selected = new Set(round.questions.map((q) => q.id));
  next.questions = state.questions.filter((q) => selected.has(q.id));
  return { expiresAt: now + TRIAL_LIFETIME, state: next };
}

export function mergeTrial(state: State, trial: Trial) {
  const round = trial.state.rounds[0];
  if (round.status !== "completed")
    throw new Error("Die Proberunde ist noch nicht abgeschlossen.");
  // Round IDs and answer IDs survive retries, reloads and a lost server receipt.
  if (state.rounds.some((r) => r.id === round.id)) return;
  const existing = new Set(state.questions.map((q) => q.id));
  state.questions.push(
    ...structuredClone(trial.state.questions.filter((q) => !existing.has(q.id))),
  );
  state.rounds.push(structuredClone(round));
  state.events.push(...structuredClone(trial.state.events));
  rebuild(state, true);
}

export async function trialLock<T>(action: () => Promise<T> | T): Promise<T> {
  return await navigator.locks.request(
    "wissensquiz-trial",
    async () => await action(),
  );
}

export function notifyTrial() {
  window.dispatchEvent(new Event("wissensquiz-trial-changed"));
}

export async function authorizeTrial(email: string) {
  await trialLock(() => {
    const trial = readTrial(localStorage);
    if (!trial || trial.state.rounds[0].status !== "completed")
      throw new Error(
        "Die Proberunde ist nicht mehr verfügbar. Bitte lade die Seite erneut.",
      );
    writeTrial(localStorage, {
      ...trial,
      recipient: email.trim().toLowerCase(),
    });
    notifyTrial();
  });
}

export async function transferTrial(
  email: string,
  save: (mutate: (state: State) => void) => Promise<unknown>,
) {
  let storage: Storage;
  try {
    storage = localStorage;
    if (!storage.getItem(TRIAL_KEY)) return false;
  } catch {
    return false;
  }
  return await trialLock(async () => {
    const trial = readTrial(storage);
    if (!trial?.recipient || trial.recipient !== email.trim().toLowerCase())
      return false;
    await save((state) => mergeTrial(state, trial));
    // Remove progress only after confirmed online storage. Keep the used marker.
    storage.removeItem(TRIAL_KEY);
    notifyTrial();
    return true;
  });
}
