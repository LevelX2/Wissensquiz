import { catalogCounts } from "./catalog-counts";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { expect, it } from "vitest";
import { importCsv } from "../src/importer";
import { addPackages, packages } from "../src/packages";
import { emptyState } from "../src/model";
import {
  ActorPortrait,
  recognitionPortrait,
  recognitionVariants,
} from "../src/ActorPortrait";
import { filmData } from "../src/filmFacts";
import portraits from "../src/actorRecognitionPortraits.json";
import source from "../docs/Schauspieler-Bilderkennung-2026-10-07/Schauspieler_Bilderkennung_200_Fragen.json";
import evidence from "../KI-Wissen-Wissensquiz/01 Rohquellen/Schauspieler-Bilderkennung-2026-10-07/Nachweis.json";
import alternates from "../src/actorRecognitionAlternatePortraits.json";
import alternateEvidence from "../KI-Wissen-Wissensquiz/01 Rohquellen/Schauspieler-Bildvarianten-2026-10-07/Nachweis.json";

const filename = "Schauspieler_Bilderkennung_200_Fragen.csv";
const csv = readFileSync("public/schauspieler-bilder-fragen.csv", "utf8");
const imported = importCsv(csv, [], filename);

it("importiert genau 200 eigenständige Gesichtsziele mit belegten Bildern und vollständiger Redaktion", () => {
  expect(imported.report).toMatchObject({
    accepted: 200,
    rejected: 0,
    duplicates: 0,
    warnings: [],
    issues: [],
  });
  expect(csv).toBe(
    readFileSync(`KI-Wissen-Wissensquiz/01 Rohquellen/${filename}`, "utf8"),
  );
  expect(source.actors).toHaveLength(200);
  expect(new Set(imported.questions.map((q) => q.knowledgeId)).size).toBe(200);
  expect(
    new Set(imported.questions.map((q) => q.metadata.person_id)).size,
  ).toBe(200);
  for (const [i, q] of imported.questions.entries()) {
    const native = source.questions[i];
    expect(q.id).toBe(native.question_id);
    expect(q.question).toBe(native.question);
    expect(q.context).toBe(native.additional_info);
    expect(q.metadata.person_name_before_answer).toBe("false");
    expect(q.question).not.toContain(q.metadata.person_name);
    expect(q.answers.map((a) => a.text)).toEqual(
      native.answers.map((a) => a.text),
    );
    expect(q.answers.every((a) => a.feedback.length > 0)).toBe(true);
    expect(q.answers.find((a) => a.id === q.correctId)?.text).toBe(
      q.metadata.person_name,
    );
    expect(q.context).toContain(q.metadata.person_name);
    expect(q.sources).toContain(recognitionPortrait(q)!.sourceUrl);
    for (const reference of native.film_refs) {
      const film = filmData(q, reference);
      expect(film, reference).toBeDefined();
      expect(film!.directors).not.toBe("");
      expect(film!.countries.length).toBeGreaterThan(0);
    }
  }
  for (const letter of "abcd")
    expect(
      imported.questions.filter((q) => q.correctId.endsWith(`:${letter}`)),
    ).toHaveLength(50);
});

it("schützt die Lösung im Bild, nennt Bildrechte danach und prüft sämtliche unveränderten Dateien", () => {
  expect(Object.keys(portraits)).toHaveLength(200);
  expect(Object.keys(alternates)).toHaveLength(200);
  expect(evidence.images).toHaveLength(200);
  expect(alternateEvidence.images).toHaveLength(200);
  for (const q of imported.questions) {
    const variants = recognitionVariants(q);
    expect(variants).toHaveLength(2);
    expect(new Set(variants.map((p) => p.src)).size).toBe(2);
    expect(new Set(variants.map((p) => p.title)).size).toBe(2);
    for (const portrait of variants) {
      const proof = [...evidence.images, ...alternateEvidence.images].find(
        (p) =>
          p.personId === portrait.personId &&
          p.sourceUrl === portrait.sourceUrl,
      )!;
      const bytes = readFileSync(`public${portrait.src}`);
      expect(createHash("sha256").update(bytes).digest("hex")).toBe(
        proof.sha256,
      );
      expect(bytes.length).toBe(proof.bytes);
      if (portrait.crop) {
        expect(portrait.crop.x).toBeGreaterThanOrEqual(0);
        expect(portrait.crop.y).toBeGreaterThanOrEqual(0);
        expect(portrait.crop.width).toBeGreaterThan(0);
        expect(portrait.crop.height).toBeGreaterThan(0);
        expect(portrait.crop.x + portrait.crop.width).toBeLessThanOrEqual(
          portrait.width,
        );
        expect(portrait.crop.y + portrait.crop.height).toBeLessThanOrEqual(
          portrait.height,
        );
      }
      expect(portrait.license).toMatch(
        /^CC BY(?:-SA)? (?:2\.0|2\.5|3\.0|4\.0)(?: de| kr)?$|^CC0$|^Public domain$/,
      );
    }
    const portrait = recognitionPortrait(q)!;
    const proof = evidence.images.find(
      (p) => p.personId === portrait.personId,
    )!;
    const bytes = readFileSync(`public${portrait.src}`);
    expect(createHash("sha256").update(bytes).digest("hex")).toBe(proof.sha256);
    expect(bytes.length).toBe(proof.bytes);
    expect(portrait.license).toMatch(
      /^CC BY(?:-SA)? (?:2\.0|3\.0|4\.0)$|^CC0$|^Public domain$/,
    );
    const hidden = renderToStaticMarkup(
      createElement(ActorPortrait, { q, beforeAnswer: true }),
    );
    expect(hidden).not.toContain(portrait.name);
    expect(hidden).not.toContain(portrait.title);
    expect(hidden).not.toContain(portrait.sourceUrl);
    expect(hidden).toContain('alt="Schauspielerporträt für die Namensfrage"');
    const revealed = renderToStaticMarkup(createElement(ActorPortrait, { q }));
    expect(revealed).toContain(portrait.photographer.replaceAll("&", "&amp;"));
    expect(revealed).toContain(portrait.licenseUrl.replaceAll("&", "&amp;"));
    expect(
      recognitionPortrait({
        ...q,
        metadata: { ...q.metadata, question_image_id: "ACTOR-999" },
      }),
    ).toBeUndefined();
  }
});

it("wechselt zwischen Runden und behält dasselbe Bild und denselben Nachweis innerhalb einer Begegnung", () => {
  for (const q of imported.questions) {
    const chosen = new Set<string>();
    for (let i = 0; i < 8; i++) {
      const key = `round-${i}:${q.knowledgeId}`;
      const portrait = recognitionPortrait(q, key)!;
      chosen.add(portrait.src);
      expect(recognitionPortrait(structuredClone(q), key)).toEqual(portrait);
      const hidden = renderToStaticMarkup(
        createElement(ActorPortrait, {
          q,
          beforeAnswer: true,
          selectionKey: key,
        }),
      );
      const revealed = renderToStaticMarkup(
        createElement(ActorPortrait, { q, selectionKey: key }),
      );
      expect(hidden).toContain(`src="${portrait.src}"`);
      expect(revealed).toContain(`src="${portrait.src}"`);
      expect(revealed).toContain(portrait.sourceUrl.replaceAll("&", "&amp;"));
      for (const variant of recognitionVariants(q)) {
        expect(hidden).not.toContain(variant.title);
        expect(hidden).not.toContain(variant.sourceUrl);
      }
    }
    expect(chosen.size).toBe(2);
  }
});

it("liefert für normale Fragen ohne Bildzuordnung eine leere Fotoquellenliste", () => {
  const q = imported.questions[0];
  const metadataCases: Record<string, string>[] = [
    {},
    { person_id: q.metadata.person_id, person_name: q.metadata.person_name },
    { question_image_id: "ACTOR-999", person_id: "ACTOR-999" },
  ];
  for (const metadata of metadataCases) {
    const ordinary = { ...q, metadata };
    expect(recognitionVariants(ordinary)).toEqual([]);
    expect(recognitionPortrait(ordinary)).toBeUndefined();
    expect(
      renderToStaticMarkup(
        createElement(ActorPortrait, { q: ordinary, beforeAnswer: true }),
      ),
    ).toBe("");
  }
});

it("ergänzt den offiziellen Katalog einmal und erhält sämtliche vorhandenen Fragen und Lernidentitäten", () => {
  const state = emptyState();
  const contents = packages.map((p) => ({
    filename: p.filename,
    text: readFileSync(`public${p.path}`, "utf8"),
  }));
  addPackages(
    state,
    contents.filter((p) => p.filename !== filename),
  );
  const before = structuredClone(state.questions);
  const oldGoals = new Set(before.map((q) => q.knowledgeId));
  expect(imported.questions.every((q) => !oldGoals.has(q.knowledgeId))).toBe(
    true,
  );
  addPackages(state, contents);
  expect(state.questions.slice(0, before.length)).toEqual(before);
  expect(state.questions).toHaveLength(catalogCounts.questions);
  expect(new Set(state.questions.map((q) => q.knowledgeId)).size).toBe(
    catalogCounts.goals,
  );
  const once = structuredClone(state.questions);
  addPackages(state, contents);
  expect(state.questions).toEqual(once);
});
