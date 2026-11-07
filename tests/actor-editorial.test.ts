import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import { addPackages, packages } from "../src/packages";
import { emptyState } from "../src/model";
import { actorPresentation, presentedQuestion } from "../src/actorEditorial";
import { filmData } from "../src/filmFacts";

const state = emptyState();
addPackages(
  state,
  packages.map((p) => ({
    filename: p.filename,
    text: readFileSync(`${p.path}`, "utf8"),
  })),
);
const actors = state.questions.filter(
  (q) => q.metadata.person_id && !q.metadata.question_image_id,
);
it("nennt bei vorgegebenen Personen den vollen Namen und schützt gesuchte Namen", () => {
  const normalized = (s: string) => s.normalize("NFKC").replace(/[’‘]/g, "'");
  for (const q of actors) {
    const before = structuredClone(q),
      presentation = actorPresentation(q)!;
    expect(presentation, q.id).toBeDefined();
    if (q.metadata.person_name_before_answer === "false")
      expect(presentedQuestion(q), q.id).not.toContain(q.metadata.person_name);
    else
      expect(normalized(presentedQuestion(q)), q.id).toContain(
        normalized(q.metadata.person_name),
      );
    expect(new Set(presentation.films).size, q.id).toBe(
      presentation.films.length,
    );
    expect(presentation.text.length, q.id).toBeGreaterThan(0);
    expect(q).toEqual(before);
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
