import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import { addPackages, packages } from "../src/packages";
import { emptyState } from "../src/model";
import portraits from "../src/actorPortraits.json";
import evidence from "../KI-Wissen-Wissensquiz/01 Rohquellen/Schauspielerportraets-2026-10-04/Nachweis.json";

it("ordnet 25 unveränderte, frei lizenzierte JPEG-Porträts den vorhandenen Personen zu", () => {
  const state = emptyState();
  addPackages(
    state,
    packages.map((p) => ({
      filename: p.filename,
      text: readFileSync(`public${p.path}`, "utf8"),
    })),
  );
  expect(Object.keys(portraits)).toHaveLength(25);
  expect(evidence.images).toHaveLength(25);
  for (const portrait of Object.values(portraits)) {
    const questions = state.questions.filter(
      (q) => q.metadata.person_id === portrait.personId,
    );
    expect(questions).toHaveLength(8);
    expect(
      questions.every((q) => q.metadata.person_name === portrait.name),
    ).toBe(true);
    expect(portrait.license).toMatch(/^CC BY(?:-SA)? (?:2\.0|3\.0|4\.0)$/);
    expect(new URL(portrait.sourceUrl).hostname).toBe("commons.wikimedia.org");
    expect(new URL(portrait.licenseUrl).hostname).toBe("creativecommons.org");
    expect(portrait.photographer).not.toMatch(/<[^>]*>/);
    const source = evidence.images.find(
      (p) => p.personId === portrait.personId,
    )!;
    const bytes = readFileSync(`public${portrait.src}`);
    expect(bytes.subarray(0, 2)).toEqual(Buffer.from([0xff, 0xd8]));
    expect(createHash("sha256").update(bytes).digest("hex")).toBe(
      source.sha256,
    );
  }
});
