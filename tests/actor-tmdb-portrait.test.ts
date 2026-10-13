import { afterEach, expect, it, vi } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { actorTmdbPortrait } from "../src/tmdbActorPortrait";
import links from "../src/actorTmdbLinks.json";

const q = {
  metadata: { person_id: "ACTOR-001", person_name: "Tom Hanks" },
};
const now = Date.parse("2026-10-13T12:00:00Z");
const data = {
  tmdbId: 31,
  name: "Tom Hanks",
  profilePath: "/Example.jpg",
  checkedAt: "2026-10-13T00:00:00Z",
  expiresAt: "2027-03-13T00:00:00Z",
};
afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

it("erzeugt Porträt- und Personenadresse nur für die passende, aktuelle Zuordnung", () => {
  expect(actorTmdbPortrait(q, data, now)).toEqual({
    name: "Tom Hanks",
    src: "https://image.tmdb.org/t/p/w185/Example.jpg",
    sourceUrl: "https://www.themoviedb.org/person/31",
  });
  for (const changed of [
    null,
    { ...data, tmdbId: 500 },
    { ...data, name: "Tom Cruise" },
    { ...data, profilePath: "https://example.test/image.jpg" },
    { ...data, profilePath: "/../image.jpg" },
    { ...data, expiresAt: "2026-10-13T12:00:00Z" },
    { ...data, expiresAt: "2027-10-13T00:00:00Z" },
    { ...data, expiresAt: "2026-10-12T00:00:00Z" },
    { ...data, checkedAt: "2026-10-14T00:00:00Z" },
  ])
    expect(actorTmdbPortrait(q, changed, now)).toBeUndefined();
  expect(actorTmdbPortrait({ ...q, metadata: {} }, data, now)).toBeUndefined();
});

it("lädt nur die einzelne Person, teilt gleichzeitige Abrufe und lädt bei Filmfragen nichts", async () => {
  vi.resetModules();
  vi.useFakeTimers();
  vi.setSystemTime(now);
  const fetcher = vi
    .fn()
    .mockResolvedValue({ ok: true, json: async () => data });
  vi.stubGlobal("fetch", fetcher);
  const { loadActorTmdbPortrait } = await import("../src/tmdbActorPortrait");
  const [a, b] = await Promise.all([
    loadActorTmdbPortrait(q),
    loadActorTmdbPortrait(q),
  ]);
  expect(a).toEqual(b);
  expect(a?.name).toBe("Tom Hanks");
  expect(fetcher).toHaveBeenCalledExactlyOnceWith(
    "/actor-tmdb-portraits/31.json",
  );
  expect(await loadActorTmdbPortrait({ ...q, metadata: {} })).toBeUndefined();
  expect(fetcher).toHaveBeenCalledTimes(1);
});

it("lässt nach einem fehlgeschlagenen Abruf einen erneuten Versuch zu", async () => {
  vi.resetModules();
  vi.useFakeTimers();
  vi.setSystemTime(now);
  const fetcher = vi
    .fn()
    .mockRejectedValueOnce(new Error("offline"))
    .mockResolvedValue({ ok: true, json: async () => data });
  vi.stubGlobal("fetch", fetcher);
  const { loadActorTmdbPortrait } = await import("../src/tmdbActorPortrait");
  expect(await loadActorTmdbPortrait(q)).toBeUndefined();
  expect((await loadActorTmdbPortrait(q))?.name).toBe("Tom Hanks");
  expect(fetcher).toHaveBeenCalledTimes(2);
});

it.skipIf(!existsSync("public/actor-tmdb-portraits/31.json"))(
  "prüft alle lokal vorbereiteten Porträtdateien gegen die 220 Identitäten",
  () => {
    for (const [id, person] of Object.entries(links)) {
      const prepared = JSON.parse(
        readFileSync(
          `public/actor-tmdb-portraits/${person.tmdbId}.json`,
          "utf8",
        ),
      );
      const question = {
        metadata: { person_id: id, person_name: person.name },
      };
      expect(
        actorTmdbPortrait(question, prepared, Date.parse(prepared.checkedAt)),
        person.name,
      ).toBeDefined();
    }
  },
);
