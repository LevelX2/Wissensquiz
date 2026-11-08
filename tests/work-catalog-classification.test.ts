import { beforeAll, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { packages, readQuestions } from "../src/packages";
import { prepareQuestionWorks } from "../src/prepareWorkReferences";
import { preparePresentation } from "../src/questionPresentation";
import { actorPresentation } from "../src/actorEditorial";
import { questionSourceOf } from "../src/filters";
import { matchesWorkFilters } from "../src/workAttributes";
import { questionFacetLabels } from "../src/questionFacets";
import type { Question } from "../src/model";

let questions: Question[];
beforeAll(() => {
  questions = prepareQuestionWorks(
    packages.flatMap((p) =>
      readQuestions(
        readFileSync(p.path, "utf8"),
        p.source,
        p.genre,
        p.workType,
      ),
    ),
  );
}, 30000);
const actor = (id: string) =>
  questions.find((q) => q.id === `SCHAUSPIELER-202610-${id}`)!;

it("macht vorhandene Serienrollen in der passenden Werkart und im eigenen Fragenbereich spielbar", () => {
  const trek = actor("P01-034-L-1");
  expect(questionSourceOf(trek)).toBe("actors");
  expect(
    matchesWorkFilters(trek, {
      genres: ["Science-Fiction"],
      workTypes: ["series"],
    }),
  ).toBe(true);
  expect(
    matchesWorkFilters(trek, {
      genres: ["Science-Fiction"],
      workTypes: ["film"],
    }),
  ).toBe(false);
  expect(questionFacetLabels(trek)).toEqual(
    expect.arrayContaining(["Serie", "Science-Fiction", "Schauspieler"]),
  );
  expect(
    matchesWorkFilters(actor("P02-121-L-1"), {
      genres: ["Komödie"],
      workTypes: ["series"],
    }),
  ).toBe(true);
  expect(
    matchesWorkFilters(actor("P01-006-A-2"), {
      genres: ["Fantasy"],
      workTypes: ["series"],
    }),
  ).toBe(true);
});

it("behält bei Serienfragen die vollständigen redigierten Schauspielertexte", () => {
  for (const q of questions.filter((q) =>
    q.works?.some((w) => w.type === "series"),
  )) {
    const editorial = actorPresentation(q);
    if (!editorial) continue;
    const visible = preparePresentation(q);
    expect(visible.questionText).toBe(editorial.question);
    expect(visible.deepContext).toBe(editorial.text);
    expect(visible.sources).toEqual(expect.arrayContaining(editorial.sources));
    if (q.works!.every((w) => w.type === "series")) {
      expect(visible.films).toEqual([]);
      expect(visible.poster).toBeNull();
    }
  }
});

it("behält konkrete Filmbezüge zusätzlich zu ihrer verwandten Serie", () => {
  const q = questions.find((q) => q.id === "SFI-202610-P01-L-003")!;
  expect(questionSourceOf(q)).toBe("film");
  expect(q.works).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        type: "film",
        originalTitle: "Serenity",
        year: 2005,
      }),
      expect.objectContaining({
        type: "series",
        originalTitle: "Firefly",
        year: 2002,
      }),
    ]),
  );
  const golino = questions.find(
    (q) => q.id === "SCHAUSPIELER-BG-20261013-188-E1",
  )!;
  expect(golino.works).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        type: "series",
        originalTitle: "L'arte della gioia",
        year: 2024,
      }),
      expect.objectContaining({
        type: "film",
        originalTitle: "Fuori",
        year: 2025,
      }),
    ]),
  );
  expect(
    golino.works!.filter((w) => w.type === "film").map((w) => w.originalTitle),
  ).not.toContain("L'arte della gioia");
  expect(
    preparePresentation(golino).films.map(({ data }) => data.originalTitle),
  ).not.toContain("L'arte della gioia");
});

it("ergänzt Animation, erhält die Genres und berücksichtigt konkrete Sprechrollen", () => {
  const frozen = questions.filter(
    (q) =>
      q.metadata.film_title_original === "Frozen" &&
      q.metadata.film_year === "2013",
  );
  expect(frozen.length).toBeGreaterThan(0);
  for (const q of frozen)
    expect(
      matchesWorkFilters(q, {
        genres: ["Fantasy"],
        workTypes: ["film"],
        techniques: ["animation"],
      }),
    ).toBe(true);
  const howl = actor("P01-021-A-2");
  expect(
    matchesWorkFilters(howl, {
      genres: ["Fantasy"],
      workTypes: ["film"],
      techniques: ["animation"],
    }),
  ).toBe(true);
  const monsters = questions.find(
    (q) => q.id === "SCHAUSPIELER-BG-20261013-064-L2",
  )!;
  expect(monsters.works).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        originalTitle: "Monsters, Inc.",
        techniques: ["animation"],
      }),
    ]),
  );
});

it("erkennt Mischformen, ohne Effektfilme oder Fernsehfilme pauschal umzudeuten", () => {
  const poppins = questions.find(
    (q) =>
      q.metadata.film_title_original === "Mary Poppins" &&
      q.metadata.film_year === "1964",
  )!;
  expect(poppins.works).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ techniques: ["live-action", "animation"] }),
    ]),
  );
  for (const q of questions.filter(
    (q) => q.metadata.film_title_original === "King Kong",
  ))
    expect(q.works!.every((w) => !w.techniques.includes("animation"))).toBe(
      true,
    );
  const movie = questions.find(
    (q) => q.id === "SCHAUSPIELER-BG-20261013-101-L2",
  )!;
  expect(
    matchesWorkFilters(movie, { genres: null, workTypes: ["series"] }),
  ).toBe(false);
});

it("behandelt allgemeine Karrierefragen weiterhin ohne pauschale Serien- oder Animationszuordnung", () => {
  const career = actor("P01-054-A-1");
  expect(career.works).toEqual([]);
  expect(
    matchesWorkFilters(career, { genres: null, workTypes: ["series"] }),
  ).toBe(false);
  expect(
    matchesWorkFilters(career, { genres: null, techniques: ["animation"] }),
  ).toBe(false);
});
