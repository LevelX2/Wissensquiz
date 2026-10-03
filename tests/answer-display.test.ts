import { expect, it } from "vitest";
import { emptyState } from "../src/model";
import { validateBackup } from "../src/backupValidation";
import {
  compileState,
  reconstructState,
  difference,
  applyDifference,
} from "../src/syncCodec";

it("alte Sicherungen bleiben ohne Anzeigezeit-Einstellung lesbar", () => {
  const state = emptyState();
  expect(
    validateBackup(JSON.parse(JSON.stringify(state))).settings.answerRevealMs,
  ).toBeUndefined();
});

it.each([500, 1100, 4000])(
  "erhält die Anzeigezeit %i ms beim JSON-Rückweg",
  (duration) => {
    const state = emptyState();
    state.settings.answerRevealMs = duration;
    expect(validateBackup(JSON.parse(JSON.stringify(state)))).toEqual(state);
  },
);

it.each([499, 4001, 550, NaN, Infinity])(
  "weist ungültige Anzeigezeit %s zurück",
  (duration) => {
    const state = emptyState();
    state.settings.answerRevealMs = duration;
    expect(() => validateBackup(state)).toThrow();
  },
);

it("sichert eine geänderte Anzeigezeit als private Einstellung ohne Lernänderungen", async () => {
  const state = emptyState();
  const before = await compileState(structuredClone(state));
  state.settings.answerRevealMs = 4000;
  const after = await compileState(state);
  const delta = difference(before, after);
  expect(delta.changes).toHaveLength(1);
  expect(delta.changes[0]).toMatchObject({
    op: "put",
    row: { kind: "field", id: "settings" },
  });
  expect(reconstructState(applyDifference(before, delta))).toEqual(state);
});
