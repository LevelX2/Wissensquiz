import { expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { importCsv } from "../src/importer";
import { packages } from "../src/packages";
import { emptyState, type Mode } from "../src/model";
import { recordKey, selectQuestions, startRound } from "../src/engine";
import { genreOf } from "../src/filters";
import { validateBackup } from "../src/storage";

const questions = packages.flatMap(
  (p) => importCsv(readFileSync(`public${p.path}`, "utf8")).questions,
);
const filters = {
  genres: ["Horror", "Science-Fiction"],
  difficulties: ["leicht", "mittel"] as ("leicht" | "mittel")[],
};
const options = { topic: "Alle Themen", difficulty: "Alle Stufen", filters };

it("erhält Ton-/Vibrationseinstellungen und liest Sicherungen ohne diese Felder", () => {
  const state = emptyState(questions);
  state.settings.sound = false;
  state.settings.haptics = true;
  expect(validateBackup(JSON.parse(JSON.stringify(state))).settings).toEqual(
    state.settings,
  );
  state.settings = { spoilers: false };
  expect(validateBackup(state).settings).toEqual({ spoilers: false });
});

it.each<Mode>(["entdecken", "ueben", "rekord"])(
  "begrenzt %s auf die gewählten Genres und Stufen",
  (mode) => {
    const picked = selectQuestions(
      questions,
      {},
      { ...options, mode, size: 1000, now: 1000 },
      () => 0.4,
    );
    expect(picked.length).toBeGreaterThan(0);
    expect(new Set(picked.map(genreOf))).toEqual(new Set(filters.genres));
    expect(new Set(picked.map((q) => q.difficulty))).toEqual(
      new Set(filters.difficulties),
    );
    expect(new Set(picked.map((q) => q.knowledgeId)).size).toBe(picked.length);
  },
);
it("interpretiert eine leere Auswahl nicht als alle Fragen", () => {
  for (const empty of [
    { ...filters, genres: [] },
    { ...filters, difficulties: [] },
  ]) {
    expect(
      selectQuestions(
        questions,
        {},
        { ...options, filters: empty, mode: "rekord", size: 10, now: 1000 },
      ),
    ).toEqual([]);
    expect(() =>
      startRound(
        emptyState(questions),
        { ...options, filters: empty, mode: "rekord" },
        1000,
      ),
    ).toThrow("keine Fragen");
  }
});
it("erkennt neue importierte Genres und berücksichtigt die optionale Filmreihe", () => {
  const fantasy = {
    ...questions[0],
    metadata: { ...questions[0].metadata, subdomain: "Fantasy" },
  };
  expect(genreOf(fantasy)).toBe("Fantasy");
  const picked = selectQuestions(
    questions,
    {},
    { ...options, topic: "Halloween", mode: "rekord", size: 10, now: 1000 },
  );
  expect(picked.length).toBeGreaterThan(0);
  expect(
    picked.every((q) => q.topic === "Halloween" && q.difficulty !== "schwer"),
  ).toBe(true);
});
it("speichert die Auswahl unabhängig von Klickreihenfolge und trennt Rekorde", () => {
  const r = startRound(
    emptyState(questions),
    { ...options, mode: "rekord" },
    1000,
  );
  expect(recordKey(r)).toBe(
    recordKey({
      ...r,
      filters: {
        genres: [...filters.genres].reverse(),
        difficulties: [...filters.difficulties].reverse(),
      },
    }),
  );
  expect(recordKey(r)).not.toBe(
    recordKey({ ...r, filters: { ...filters, genres: ["Horror"] } }),
  );
  expect(recordKey(r)).not.toBe(
    recordKey({ ...r, filters: { ...filters, difficulties: ["leicht"] } }),
  );
  const { filters: _filters, ...legacy } = r;
  expect(recordKey(legacy)).toBe(
    JSON.stringify([
      "records-v3",
      legacy.mode,
      null,
      legacy.topic,
      legacy.questions.length,
      legacy.ruleVersion,
    ]),
  );
  expect(recordKey(r)).not.toBe(recordKey(legacy));
});
it("erhält neue und alte Runden im Backup und lehnt falsche Filter ab", () => {
  const state = emptyState(questions);
  const round = startRound(state, { ...options, mode: "entdecken" }, 1000);
  expect(
    validateBackup(JSON.parse(JSON.stringify(state))).rounds[0].filters,
  ).toEqual(round.filters);
  const invalid = structuredClone(state);
  invalid.rounds[0].filters!.genres = ["Action"];
  expect(() => validateBackup(invalid)).toThrow("Rundenauswahl");
  delete state.rounds[0].filters;
  expect(validateBackup(state).rounds[0].filters).toBeUndefined();
});
