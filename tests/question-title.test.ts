import { expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { importCsv } from "../src/importer";
import { questionTitleParts } from "../src/questionTitle";
const q = importCsv(
  readFileSync("public/western-fragen.csv", "utf8"),
).questions.find((q) => q.metadata.film_title_de === "Tombstone")!;
it("hebt ausschließlich bekannte, zitierte Filmtitel hervor und erhält Jahr und Fragetext", () => {
  const original = q.question;
  const parts = questionTitleParts(q)!;
  expect(parts.title).toBe("Tombstone");
  expect(parts.before + `„${parts.title}“` + parts.after).toBe(original);
  expect(q.question).toBe(original);
  const english = {
    ...q,
    metadata: {
      ...q.metadata,
      film_title_de: "Anderer Titel",
      film_title_original: "Tombstone",
    },
    question: 'Im Film "Tombstone" (1993): Was passiert?',
  };
  expect(questionTitleParts(english)).toEqual({
    before: "Im Film ",
    title: "Tombstone",
    after: " (1993): Was passiert?",
  });
});
it("lässt unbekannte Zitate und Fragen ohne Filmtitel unverändert", () => {
  expect(
    questionTitleParts({ ...q, question: "Was bedeutet „Wilder Westen“?" }),
  ).toBeNull();
  expect(
    questionTitleParts({ ...q, metadata: {}, question: q.question }),
  ).toBeNull();
});
