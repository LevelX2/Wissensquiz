import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import { addPackages, packages } from "../src/packages";
import { emptyState } from "../src/model";
import { actorPresentation, presentedQuestion } from "../src/actorEditorial";
import { filmData } from "../src/filmFacts";
import original from "../docs/Schauspieler-Fragenpaket/Schauspieler_100_Personen_800_Fragen.json";
import editorial from "../src/actorEditorial.json";

const state = emptyState();
addPackages(
  state,
  packages.map((p) => ({
    filename: p.filename,
    text: readFileSync(`public${p.path}`, "utf8"),
  })),
);
const actors = state.questions.filter((q) => q.metadata.person_id);
it("nennt bei allen vorgegebenen Personen den vollen Namen und schützt die Erkennungsfragen", () => {
  const originalActors = actors.filter(q => q.id.startsWith("SCHAUSPIELER-202610-P01-"));
  expect(originalActors).toHaveLength(800);
  expect(Object.keys(editorial.questions)).toHaveLength(800);
  for (const q of originalActors) {
    const source = original.questions.find(
      (source) => source.question_id === q.id,
    )!;
    const presentation = actorPresentation(q)!;
    expect(presentation).toBeDefined();
    if (source.actor_name_before_answer) {
      expect(presentedQuestion(q)).toContain(q.metadata.person_name);
      expect(presentedQuestion(q)).not.toContain(
        `${q.metadata.person_name} ${q.metadata.person_name}`,
      );
    } else expect(presentedQuestion(q)).toBe(q.question);
    expect(presentation.text.length).toBeGreaterThan(q.context!.length);
    expect(new Set(presentation.films).size).toBe(presentation.films.length);
    expect(q.question).toBe(source.question);
    expect(q.context).toBe(source.additional_info);
  }
});
it("löst alle Filmverweise mit Eckdaten auf, ohne Biografien an einen Film zu binden", () => {
  for (const q of actors) {
    expect(filmData(q)).toBeUndefined();
    for (const reference of actorPresentation(q)!.films) {
      const data = filmData(q, reference)!;
      expect(data).toBeDefined();
      expect(data.year).toBe(Number(reference.split("|").at(-1)));
      expect(data.directors).toBeTruthy();
      expect(data.countries.length).toBeGreaterThan(0);
      expect(
        data.sources.every((source) => new URL(source).protocol === "https:"),
      ).toBe(true);
    }
  }
  expect(
    actorPresentation(actors.find((q) => q.id.endsWith("001-M-1"))!)!.films,
  ).toEqual([]);
  expect(filmData(actors[0], "Run Lola Run|1998")?.originalTitle).toBe(
    "Lola rennt",
  );
});
it("verbessert alte Rundensnapshots, erhält ihre Inhalte und überschreibt keine eigenen Fragen", () => {
  const q = structuredClone(actors.find((q) => q.id.endsWith("001-L-2"))!);
  const before = JSON.stringify(q);
  expect(presentedQuestion(q)).toContain("Tom Hanks");
  expect(JSON.stringify(q)).toBe(before);
  expect(actorPresentation({ ...q, question: "Eigene Frage" })).toBeUndefined();
  expect(
    actorPresentation({ ...q, context: "Eigene Vertiefung" }),
  ).toBeUndefined();
  expect(
    actorPresentation({
      ...q,
      metadata: { ...q.metadata, person_id: "andere-person" },
    }),
  ).toBeUndefined();
});
