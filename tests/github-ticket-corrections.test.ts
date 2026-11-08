import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import { addPackages, packages } from "../src/packages";
import { emptyState } from "../src/model";
import { preparePresentation } from "../src/questionPresentation";
import { filmData } from "../src/filmFacts";
import { selectFilmPosterPath } from "../scripts/film-poster-selection";
import reviewedPosters from "../src/reviewedFilmPosters.json";

const state = emptyState();
addPackages(
  state,
  packages.map((pkg) => ({
    filename: pkg.filename,
    text: readFileSync(`${pkg.path}`, "utf8"),
  })),
);
const presentation = (id: string) => {
  const q = state.questions.find((question) => question.id === id);
  expect(q, id).toBeDefined();
  return preparePresentation(q!);
};

it("liefert die gemeldeten Reihenpositionen bis in die vorbereiteten Filmdaten", () => {
  for (const [id, name, position] of [
    ["F240-20261006-001-L2", "Indiana Jones", 2],
    ["F240-20261006-001-L1", "Indiana Jones", 2],
    ["E20261007-A-009-L", "Rocky", 1],
    ["G100-20261008-ACTION-015-L1", "Bourne", 2],
  ] as const) {
    expect(presentation(id).films[0].data.series, id).toMatchObject({
      name,
      position,
    });
  }
  const actorQuestion = state.questions.find(
    (question) => question.metadata.person_name === "Sylvester Stallone",
  )!;
  expect(filmData(actorQuestion, "Rocky|1976")?.series).toMatchObject({
    name: "Rocky",
    position: 1,
  });
});

it("macht Musikwechsel, Filmfassung und Figurenkontext in den gemeldeten Fragen verständlich", () => {
  const shaun = presentation("Q-20261016-KOMOEDIE-008");
  expect(shaun.questionText).toContain("Musikstück „The Blue Wrath“");
  expect(shaun.deepContext).toContain("Weil das Tempo übereinstimmte");
  const woman = presentation("G150-20261103-ROMCOM-048-S1");
  expect(woman.questionText).toContain(
    "(1942) mit Katharine Hepburn und Spencer Tracy",
  );
  expect(woman.questionText).not.toContain("Frühstück");
  const karate = presentation("ASI-202610-P01-L-004");
  expect(karate.questionText).toContain("Daniel (Ralph Macchio)");
  expect(karate.questionText).not.toContain("Miyagi");
});

it("liefert deutsche Filmtitel in allen vier Taylor-Antworten und im Filmverweis", () => {
  const q = state.questions.find(
    (question) => question.id === "SCHAUSPIELER-202610-P01-064-S-2",
  )!;
  const display = presentation(q.id);
  expect(q.answers.map((answer) => answer.text)).toEqual([
    "Velvet Brown in „Kleines Mädchen, großes Herz“",
    "Priscilla in „Heimweh“",
    "Amy in „Kleine tapfere Jo“",
    "Susan in „Das Wunder von Manhattan“",
  ]);
  expect(q.correctId).toBe(`${q.id}:a`);
  expect(display.questionText).not.toContain("Velvet");
  expect(display.deepContext).toContain("„Kleines Mädchen, großes Herz“");
  expect(display.films[0].reference).toBe("National Velvet|1944");
  expect(display.films[0].data.alternativeTitles).toContainEqual({
    title: "Kleines Mädchen, großes Herz",
    kind: "de",
  });
});

it("zeigt den Elvis-Titel und die verbesserten Fragen ohne die Lösung vorwegzunehmen", () => {
  const elvis = presentation("SCHAUSPIELER-202610-P03-129-L-2");
  expect(elvis.deepContext).toContain("„Elvis“ (1979)");
  expect(elvis.questionText).not.toContain("Elvis");
  const terminator = presentation("SCHAUSPIELER-202610-P01-015-L-1");
  expect(terminator.questionText).toContain("Killer-Cyborg");
  expect(terminator.questionText).not.toContain("Schwarzenegger");
  const nomadland = presentation("PRZ-202610-P01-L-018");
  expect(nomadland.questionText).toContain("Fern (Frances McDormand)");
  expect(nomadland.questionText).not.toContain("Nomadland");
});

it("ordnet das Schwarzenegger-Porträt den in der aktuellen Biografie genannten Filmen zu", () => {
  const portrait = presentation("SCHAUSPIELER-BILD-20261007-015");
  expect(portrait.deepContext).toContain("Gouverneur");
  expect(portrait.deepContext).toContain("„Pumping Iron“");
  expect(portrait.deepContext).toContain("„Terminator“");
  expect(portrait.films.map((film) => film.reference)).toEqual([
    "Pumping Iron|1977",
    "The Terminator|1984",
  ]);
});

it("ersetzt das gemeldete Rambo-Motiv nur durch das für diese Filmfassung geprüfte Poster", () => {
  const selection = reviewedPosters["First Blood|1982"];
  const movie = { id: 1368, poster_path: "/UnpassendesMotiv.jpg" };
  const images = [{ file_path: selection.posterPath }];
  expect(selectFilmPosterPath("First Blood|1982", movie, images)).toBe(
    selection.posterPath,
  );
  expect(() => selectFilmPosterPath("First Blood|1982", movie, [])).toThrow(
    "erneut prüfen",
  );
  expect(() =>
    selectFilmPosterPath("First Blood|1982", { ...movie, id: 1369 }, images),
  ).toThrow("erneut prüfen");
  expect(selectFilmPosterPath("Anderer Film|1982", movie)).toBe(
    movie.poster_path,
  );
});
