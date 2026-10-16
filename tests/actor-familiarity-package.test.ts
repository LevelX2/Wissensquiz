import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import Papa from "papaparse";
import { expect, it } from "vitest";
import { addPackages, packages } from "../src/packages";
import { emptyState } from "../src/model";
import { questionSourceOf } from "../src/filters";
import { filmData, addFilmFacts } from "../src/filmFacts";
import { actorPresentation } from "../src/actorEditorial";
import { actorTmdbUrl } from "../src/actorTmdb";
import { preparePresentation } from "../src/questionPresentation";
import { presentationSchema } from "../src/questionSchema";
import familiarity from "../src/personFamiliarity.json";
import portraitData from "../src/actorPortraits.json";
import selectedTmdb from "../src/actorFamiliarityTmdbPortraits.json";
import referenceData from "../src/actorFamiliarityFilmFacts.json";
import { assertEditorialSource } from "./editorialSource";

const source = "docs/Schauspieler-Bekanntheit-2026-10-13";
const filename = "Schauspieler-Bekanntheit-2026-10-13.csv";
const publicPath = "public/schauspieler-bekanntheit-20261013-fragen.csv";
const baseline = emptyState();
const packageIndex = packages.findIndex(p => p.filename === filename);
const files = packages.slice(0, packageIndex + 1).map((p) => ({
  filename: p.filename,
  text: readFileSync("public" + p.path, "utf8"),
}));
addPackages(
  baseline,
  files.filter((p) => p.filename !== filename),
);
const state = emptyState();
addPackages(state, files);
const questions = state.questions.filter((q) =>
  q.id.startsWith("SCHAUSPIELER-BG-20261013-"),
);
const rows = Papa.parse<Record<string, string>>(
  readFileSync(publicPath, "utf8"),
  { header: true, skipEmptyLines: true },
).data;
const byId = new Map(state.questions.map((q) => [q.id, q]));
const portraits = portraitData as Record<
  string,
  (typeof portraitData)["ACTOR-BG-20261013-001"]
>;
const online = selectedTmdb as Record<
  string,
  (typeof selectedTmdb)[keyof typeof selectedTmdb]
>;
const evidence = JSON.parse(
  readFileSync(source + "/Portraets.json", "utf8"),
) as Array<{
  personId: string;
  name: string;
  provider: string;
  asset?: string;
  rawMetadata: string;
  rawPageId?: number;
  sha256?: string;
  imageDate: string;
  periodReason: string;
  sourceUrl: string;
  licenseName?: string;
  licenseUrl?: string;
  remoteSrc?: string;
  tmdbId: number;
}>;

it("installiert die geprüften Fragefelder und erhält alle gemeinsamen Wissensziele", () => {
  assertEditorialSource(
    readFileSync(publicPath, "utf8"),
    readFileSync(source + "/Fragen.csv", "utf8"),
    publicPath,
  );
  expect(packages[packageIndex]?.filename).toBe(filename);
  expect(questions).toHaveLength(1664);
  expect(
    state.imports.every(
      (r) => !r.rejected && !r.duplicates && !r.warnings.length,
    ),
  ).toBe(true);
  expect(
    new Set(state.questions.map((q) => q.knowledgeId)).size -
      new Set(baseline.questions.map((q) => q.knowledgeId)).size,
  ).toBe(1560);
  expect(rows.filter((row) => row.variant_of)).toHaveLength(104);
  for (const row of rows) {
    const q = byId.get(row.question_id)!;
    expect(q.knowledgeId, q.id).toBe(row.knowledge_id);
    if (row.variant_of)
      expect(byId.get(row.variant_of)?.knowledgeId, q.id).toBe(q.knowledgeId);
    expect(q.question).toBe(row.question);
    expect(q.context).toBe(row.explanation_context);
    expect(q.sources).toEqual(row.source_urls.split("|"));
    expect(q.answers.map((a) => a.text)).toEqual([
      row.answer_a,
      row.answer_b,
      row.answer_c,
      row.answer_d,
    ]);
    expect(q.answers.map((a) => a.feedback)).toEqual([
      row.feedback_a,
      row.feedback_b,
      row.feedback_c,
      row.feedback_d,
    ]);
    expect(q.answers.find((a) => a.id === q.correctId)?.text).toBe(
      row["answer_" + row.correct_answer.toLowerCase()],
    );
  }
}, 15000);

it("trennt Johnnie Grays Beruf vom Darstellerziel desselben Films", () => {
  const occupation = byId.get("SCHAUSPIELER-BG-20261013-111-L1")!;
  const casting = byId.get("KOM-202609-P02-L-075")!;
  expect(occupation.question).toContain("Welchen Beruf");
  expect(casting.question).toContain("Wer spielt");
  expect(occupation.knowledgeId).not.toBe(casting.knowledgeId);
  expect(occupation.metadata.variant_of).toBe("");
});

it("ordnet 428 Personen in vier gleich große Gruppen ein und erhält zwei Ziele je Schwierigkeit", () => {
  expect(familiarity.persons).toHaveLength(428);
  const levels = new Map(
    familiarity.persons.map((p) => [p.person_id, p.level]),
  );
  expect(levels.size).toBe(428);
  for (const level of [1, 2, 3, 4])
    expect(familiarity.persons.filter((p) => p.level === level)).toHaveLength(
      107,
    );
  const people = new Set(questions.map((q) => q.metadata.person_id));
  expect(people.size).toBe(208);
  for (const personId of people) {
    const own = questions.filter((q) => q.metadata.person_id === personId);
    expect(own).toHaveLength(8);
    expect(new Set(own.map((q) => q.knowledgeId)).size).toBe(8);
    for (const difficulty of ["leicht", "mittel", "schwer", "experte"])
      expect(own.filter((q) => q.difficulty === difficulty)).toHaveLength(2);
    for (const q of own)
      expect(preparePresentation(q).familiarity).toBe(levels.get(personId));
  }
});

it("löst alle 1121 Referenzen mit geprüften Eckdaten auf und erzeugt keine Filmfragen daraus", () => {
  const references = new Set<string>();
  for (const q of questions) {
    expect(filmData(q)).toBeUndefined();
    const display = preparePresentation(q);
    expect(presentationSchema.safeParse(display).success, q.id).toBe(true);
    expect(display.questionText).toBe(q.question);
    expect(display.deepContext).toBe(q.context);
    const refs = actorPresentation(q)!.films;
    expect(display.films.map((f) => f.reference)).toEqual(refs);
    for (const ref of refs) {
      references.add(ref);
      const data = filmData(q, ref)!;
      expect(data.year, ref).toBe(Number(ref.split("|").at(-1)));
      expect(data.directors, ref).toBeTruthy();
      expect(data.countries.length, ref).toBeGreaterThan(0);
      expect(data.sources.length, ref).toBeGreaterThan(0);
    }
  }
  expect(references.size).toBe(1121);
  expect(referenceData.films).toHaveLength(883);
  expect(state.questions.filter((q) => questionSourceOf(q) === "film")).toEqual(
    baseline.questions.filter((q) => questionSourceOf(q) === "film"),
  );
  expect(
    state.questions.filter((q) => q.metadata.fact_kind === "year"),
  ).toHaveLength(425);
  expect(addFilmFacts(structuredClone(questions)).added).toEqual([]);
});

it("zeigt je Person das ausgewählte unveränderte historische Commons-Porträt mit Nachweis", () => {
  const local = evidence.filter((p) => p.provider === "Wikimedia Commons");
  expect(local).toHaveLength(195);
  for (const image of local) {
    const portrait = portraits[image.personId];
    expect(portrait.name).toBe(image.name);
    expect(
      createHash("sha256")
        .update(readFileSync("public" + portrait.src))
        .digest("hex"),
    ).toBe(image.sha256);
    expect(portrait.license).toBe(image.licenseName);
    expect(portrait.licenseUrl).toBe(image.licenseUrl);
    expect(portrait.sourceUrl).toBe(image.sourceUrl);
    expect(portrait.title).toContain(image.imageDate);
    expect(portrait.changes).toContain(image.periodReason);
    const q = questions.find((q) => q.metadata.person_id === image.personId)!;
    expect(preparePresentation(q).portraits[0]).toMatchObject({
      src: portrait.src,
      name: image.name,
    });
    expect(q.image).toBeUndefined();
    expect(actorTmdbUrl(q)).toBe(
      "https://www.themoviedb.org/person/" + image.tmdbId,
    );
  }
});

it("hält 13 ausgewählte Onlineporträts getrennt vom Commons-Lizenzkatalog", () => {
  const selected = evidence.filter((p) => p.provider === "TMDB");
  expect(selected).toHaveLength(13);
  expect(Object.keys(online)).toHaveLength(13);
  for (const image of selected) {
    const raw = JSON.parse(
      readFileSync(resolve(source, image.rawMetadata), "utf8"),
    );
    expect(online[image.personId]).toMatchObject({
      name: image.name,
      tmdbId: image.tmdbId,
      profilePath: raw.profile_path,
      src: image.remoteSrc,
      sourceUrl: image.sourceUrl,
      imageDate: image.imageDate,
    });
    expect(portraits[image.personId]).toBeUndefined();
    const q = questions.find((q) => q.metadata.person_id === image.personId)!;
    expect(preparePresentation(q).portraits).toEqual([]);
    expect(actorTmdbUrl(q)).toBe(
      "https://www.themoviedb.org/person/" + image.tmdbId,
    );
  }
});
