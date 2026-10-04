import { it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { emptyState, type Mode } from "../src/model";
import { importCsv } from "../src/importer";
import { startRound, answer, complete, recordKey } from "../src/engine";
import { validateBackup } from "../src/storage";
import { encodeCloudState, decodeCloudState } from "../src/cloudCodec";
import { readRoundSetup } from "../src/roundSetup";
const qs = importCsv(
  readFileSync("public/horror-fragen.csv", "utf8"),
).questions;
it.each<Mode>([
  "entdecken",
  "fehler",
  "ueben",
  "rekord",
  "fehlerfrei",
  "zeitkonto",
])(
  "%s verwendet die Lösungswahl nur für Zeitspiele und Freies Spiel",
  (mode) => {
    const state = emptyState(qs);
    const seed = startRound(state, {
      mode: "ueben",
      topic: "Alle Themen",
      difficulty: "Alle Stufen",
    });
    for (const q of seed.questions)
      answer(state, seed.id, q.id, { dontKnow: true }, 1000);
    complete(state, seed.id);
    state.settings.solutionDisplay = "round";
    const round = startRound(state, {
      mode,
      topic: "Alle Themen",
      difficulty: "Alle Stufen",
    });
    expect(round.solutionDisplay).toBe(
      mode === "entdecken" || mode === "fehler" ? undefined : "round",
    );
    state.settings.solutionDisplay = "question";
    expect(round.solutionDisplay).toBe(
      mode === "entdecken" || mode === "fehler" ? undefined : "round",
    );
  },
);
it("friert die Lösungsanzeige pro Runde ein, erhält alte Standards und trennt Rekordkategorien", async () => {
  const direct = emptyState(qs),
    collected = emptyState(qs);
  collected.settings.solutionDisplay = "round";
  const r = startRound(
    collected,
    { mode: "rekord", topic: "Alle Themen", difficulty: "Alle Stufen" },
    1700000000000,
  );
  const normal = startRound(
    direct,
    { mode: "rekord", topic: "Alle Themen", difficulty: "Alle Stufen" },
    1700000000000,
  );
  expect(r.solutionDisplay).toBe("round");
  expect(normal.solutionDisplay).toBeUndefined();
  normal.questions = r.questions;
  normal.order = r.order;
  normal.ruleVersion = r.ruleVersion.slice(0, -2);
  expect(recordKey(r)).not.toBe(recordKey(normal));
  collected.settings.solutionDisplay = "question";
  expect(r.solutionDisplay).toBe("round");
  for (const q of r.questions)
    answer(collected, r.id, q.id, q.correctId, 1000, 1700000001000);
  complete(collected, r.id, 1700000002000);
  expect(validateBackup(collected).rounds[0].solutionDisplay).toBe("round");
  expect(
    validateBackup(await decodeCloudState(await encodeCloudState(collected)))
      .rounds[0].solutionDisplay,
  ).toBe("round");
  expect(readRoundSetup(direct).mode).toBe("entdecken");
});
