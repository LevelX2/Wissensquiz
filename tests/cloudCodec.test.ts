import { expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { addPackages, packages } from "../src/packages";
import { emptyState } from "../src/model";
import { encodeCloudState, decodeCloudState } from "../src/cloudCodec";
import { answer, complete, startRound } from "../src/engine";
import { validateBackup } from "../src/storage";
import { fingerprint } from "../src/accountSync";
import { prepareFactQuestion } from "../src/filmFacts";

const state = emptyState();
addPackages(
  state,
  packages.map((p) => ({
    filename: p.filename,
    text: readFileSync(`public${p.path}`, "utf8"),
  })),
);
state.settings.roundSetup = {
  mode: "rekord",
  genres: ["Horror"],
  categories: ["Classics"],
  difficulties: ["leicht"],
};
for (const mode of ["rekord", "entdecken", "ueben"] as const) {
  const r = startRound(
    state,
    { mode, topic: "Alle Themen", difficulty: "Alle Stufen" },
    1700000000000,
  );
  for (const q of r.questions)
    answer(state, r.id, q.id, q.correctId, 1000, 1700000001000);
  complete(state, r.id, 1700000010000);
}
const active = startRound(
  state,
  { mode: "entdecken", topic: "Alle Themen", difficulty: "Alle Stufen" },
  1700000100000,
);
const year = state.questions.find((q) => q.metadata.fact_kind === "year")!;
const variant = prepareFactQuestion(year, year, () => 0.2);
active.questions = [variant];
active.order = [variant.answers.map((a) => a.id)];

it("komprimiert den vollständigen Katalog und Rundensnapshots verlustfrei, inklusive aktiver Runde und Einstellungen", async () => {
  const before = structuredClone(state);
  const packed = await encodeCloudState(validateBackup(state));
  const restored = validateBackup(
    await decodeCloudState(JSON.parse(JSON.stringify(packed))),
  );
  expect(restored).toEqual(validateBackup(state));
  expect(variant.answers).not.toEqual(year.answers);
  expect(restored.rounds.at(-1)!.questions[0].answers).toEqual(variant.answers);
  expect(await fingerprint(restored)).toBe(await fingerprint(state));
  expect(state).toEqual(before);
  const originalBytes = Buffer.byteLength(JSON.stringify(state));
  const compactBytes = Buffer.byteLength(JSON.stringify(packed));
  expect(compactBytes).toBeLessThan(originalBytes * 0.35);
  console.info(
    `Cloud-Größe: ${originalBytes} -> ${compactBytes} Bytes (${((100 * compactBytes) / originalBytes).toFixed(1)} %)`,
  );
});

it("liest alte Vollsicherungen unverändert und verwirft kaputte Kompression oder widersprüchliche Ergebnisverweise", async () => {
  expect(await decodeCloudState(state)).toBe(state);
  const packed: any = await encodeCloudState(state);
  packed.rounds[0].questions[0].correctId = "manipuliert";
  await expect(decodeCloudState(packed)).rejects.toThrow("Ergebnisdaten");
  packed.questions.data = "defekt!";
  await expect(decodeCloudState(packed)).rejects.toThrow();
});
