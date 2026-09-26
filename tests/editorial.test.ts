import { expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { packages } from "../src/packages";
import { fingerprint, importCsv } from "../src/importer";
import { filmDetails } from "../src/filmDetails";
import audit from "../docs/Darstellerpruefung.json";
import { emptyState } from "../src/model";
import { validateBackup } from "../src/storage";

const questions = packages.flatMap(
  (p) => importCsv(readFileSync(`public${p.path}`, "utf8")).questions,
);
const reviewed = audit.questions as Record<
  string,
  (typeof audit.questions)["HOR-L-045"]
>;
it("deckt alle 720 Originalfragen versionsgenau ab und erhält deren Inhalt", () => {
  const before = JSON.stringify(questions);
  expect(Object.keys(reviewed).sort()).toEqual(
    questions.map((q) => q.id).sort(),
  );
  expect(Object.keys(audit.films)).toHaveLength(125);
  for (const q of questions) {
    const entry = reviewed[q.id];
    expect(entry.version, q.id).toBe(q.version);
    expect(entry.content, q.id).toBe(
      fingerprint(JSON.stringify([q.question, q.explanation, q.context])),
    );
    expect(filmDetails(q)?.text ?? "", q.id).toBe(entry.text);
    expect(entry.decision).toBeTruthy();
  }
  expect(JSON.stringify(questions)).toBe(before);
});
it("verhindert falsche Ergänzungen bei fremden Importen und geänderten Snapshots", () => {
  const q = questions.find((q) => q.id === "HOR-L-045")!;
  expect(filmDetails(q)?.text).toContain("Patrick Wilson");
  for (const changed of [
    { ...q, version: "anders" },
    { ...q, context: q.context + " geändert" },
    { ...q, metadata: { ...q.metadata, film_year: "2016" } },
  ])
    expect(filmDetails(changed)).toBeUndefined();
});
it("unterscheidet Fortsetzungen, Lebensalter, Maskenspiel und Originalstimmen", () => {
  const text = (id: string) => {
    const q = questions.find((q) => q.id === id)!;
    return q.context + " " + (filmDetails(q)?.text ?? "");
  };
  expect(text("HOR-L-002")).toContain("Nick Castle");
  expect(text("HOR-L-003")).toContain("Dick Warlock");
  expect(text("HOR-L-011")).toContain("Warrington Gillette");
  expect(text("FAN-M-013")).toContain("Richard Harris");
  expect(text("FAN-S-023")).toContain("Michael Gambon");
  expect(text("FAN-L-032")).toContain("Eddie Izzard");
  expect(text("FAN-M-034")).toContain("Simon Pegg");
  expect(text("FAN-L-001")).toContain("Ian Holm");
  expect(text("FAN-L-007")).toContain("Martin Freeman");
  expect(text("FAN-S-030")).toContain("Rachael Henley");
});
it("sichert die unabhängigen Fragehinweise und akzeptiert frühere Einstellungen", () => {
  const state = emptyState(questions);
  state.settings.showGenre = false;
  state.settings.showDifficulty = true;
  expect(validateBackup(state).settings).toEqual(state.settings);
  state.settings = { spoilers: false };
  expect(validateBackup(state).settings).toEqual({ spoilers: false });
});
