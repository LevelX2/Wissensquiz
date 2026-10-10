import { beforeEach, afterEach, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { emptyState } from "../src/model";
import { importCsv } from "../src/importer";
import { answer, complete, startRound } from "../src/engine";
import { validateBackup } from "../src/backupValidation";
import {
  createTrial,
  mergeTrial,
  readTrial,
  transferTrial,
  writeTrial,
  TRIAL_KEY,
  TRIAL_USED_KEY,
  TRIAL_LIFETIME,
} from "../src/trial";

const questions = importCsv(
  readFileSync("public/fragen.csv", "utf8"),
).questions;
const now = new Date("2026-10-10T10:00:00Z").getTime();
let storage: Storage;
beforeEach(() => {
  vi.spyOn(Date, "now").mockReturnValue(now);
  const values = new Map<string, string>();
  storage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => {
      values.set(key, value);
    },
    removeItem: (key) => {
      values.delete(key);
    },
    clear: () => values.clear(),
    key: (index) => [...values.keys()][index] ?? null,
    get length() {
      return values.size;
    },
  };
  vi.stubGlobal("localStorage", storage);
  vi.stubGlobal("navigator", {
    locks: {
      request: async (_: string, action: () => unknown) => await action(),
    },
  });
  vi.stubGlobal("window", { dispatchEvent: vi.fn() });
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function finishedTrial() {
  const trial = createTrial(emptyState(questions), "", now);
  const round = trial.state.rounds[0];
  for (const q of round.questions)
    answer(trial.state, round.id, q.id, q.correctId, 1000, now + 1000);
  complete(trial.state, round.id, now + 2000);
  return { ...trial, recipient: "quiz@example.test" };
}

it("bietet zehn Fragen ohne Zeitdruck, beschränkt auf das gewählte Filmgenre", () => {
  const trial = createTrial(emptyState(questions), "Science-Fiction", now);
  expect(trial.state.questions).toHaveLength(10);
  expect(
    trial.state.questions.every(
      (q) =>
        JSON.stringify(q) ===
        JSON.stringify(questions.find((original) => original.id === q.id)),
    ),
  ).toBe(true);
  expect(trial.state.rounds[0].mode).toBe("ueben");
  expect(
    trial.state.questions.every(
      (q) => q.metadata.subdomain === "Science-Fiction",
    ),
  ).toBe(true);
  expect(() => validateBackup(trial.state)).not.toThrow();
});

it("behält beim Fortsetzen dieselbe Runde und löscht abgelaufenen Fortschritt, aber nicht die Nutzung", () => {
  const trial = finishedTrial();
  writeTrial(storage, trial);
  expect(readTrial(storage, now + 5000)?.state.rounds[0].id).toBe(
    trial.state.rounds[0].id,
  );
  expect(readTrial(storage, now + TRIAL_LIFETIME)).toBeNull();
  expect(storage.getItem(TRIAL_KEY)).toBeNull();
  expect(storage.getItem(TRIAL_USED_KEY)).toBe("yes");
});

it("übernimmt eine Proberunde nur einmal und erhält vorhandene Antworten, Einstellungen und aktive Runde", () => {
  const trial = finishedTrial();
  const state = emptyState(questions);
  state.settings.sound = false;
  const active = startRound(
    state,
    { mode: "ueben", topic: "Alle Themen", difficulty: "Alle Stufen" },
    now + 3000,
  );
  answer(
    state,
    active.id,
    active.questions[0].id,
    active.questions[0].correctId,
    1500,
    now + 4000,
  );
  const event = structuredClone(state.events[0]);
  mergeTrial(state, trial);
  const once = structuredClone(state);
  mergeTrial(state, trial);
  expect(state).toEqual(once);
  expect(state.rounds).toHaveLength(2);
  expect(state.events).toHaveLength(11);
  expect(state.events).toContainEqual(event);
  expect(state.rounds[0].status).toBe("active");
  expect(state.settings.sound).toBe(false);
  expect(state.experience).toBe(trial.state.experience);
  expect(() => validateBackup(state)).not.toThrow();
});

it("übernimmt weder unfertige Runden noch Fortschritt in ein anderes Konto", async () => {
  const trial = createTrial(emptyState(questions), "", now);
  expect(() => mergeTrial(emptyState(), trial)).toThrow(/nicht abgeschlossen/);
  writeTrial(storage, finishedTrial());
  const save = vi.fn();
  await transferTrial("anders@example.test", save);
  expect(save).not.toHaveBeenCalled();
  expect(readTrial(storage)).not.toBeNull();
});

it("behält die Runde bei Speicherfehlern und entfernt sie erst nach bestätigter Übernahme", async () => {
  writeTrial(storage, finishedTrial());
  const state = emptyState(questions);
  await expect(
    transferTrial("quiz@example.test", async () => {
      throw new Error("Offline");
    }),
  ).rejects.toThrow("Offline");
  expect(readTrial(storage)).not.toBeNull();
  await transferTrial("quiz@example.test", async (mutate) => {
    mutate(state);
  });
  expect(state.events).toHaveLength(10);
  expect(readTrial(storage)).toBeNull();
  expect(storage.getItem(TRIAL_USED_KEY)).toBe("yes");
});

it("zählt nach verlorener Speicherbestätigung auch bei erneutem Öffnen keine Antwort doppelt", async () => {
  writeTrial(storage, finishedTrial());
  const state = emptyState(questions);
  await expect(
    transferTrial("quiz@example.test", async (mutate) => {
      mutate(state);
      throw new Error("Bestätigung verloren");
    }),
  ).rejects.toThrow();
  await transferTrial("quiz@example.test", async (mutate) => {
    mutate(state);
  });
  expect(state.rounds).toHaveLength(1);
  expect(state.events).toHaveLength(10);
  expect(readTrial(storage)).toBeNull();
});

it("sperrt beschädigte oder mehr als eine vorgemerkte Runde", () => {
  const trial = finishedTrial();
  trial.state.rounds.push(structuredClone(trial.state.rounds[0]));
  writeTrial(storage, trial);
  expect(readTrial(storage)).toBeNull();
  expect(storage.getItem(TRIAL_USED_KEY)).toBe("yes");
});
