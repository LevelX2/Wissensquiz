import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";
import { currentQuestions } from "./helpers/current-content";
import { preparePresentation } from "../src/questionPresentation";
import { FilmDataPanel } from "../src/FilmDataPanel";
import { Explanation } from "../src/Explanation";
import { SourceLink, sourceLinkLabel } from "../src/SourceLink";
import { emptyState } from "../src/model";
import { answer, complete, startRound } from "../src/engine";
import { QuestionScreen } from "../src/QuestionScreen";
import { Result } from "../src/RoundResult";
import {
  databaseLinksFor,
  evidenceLinksFor,
  sourceKey,
} from "../src/sourceLinks";
import { QuestionLinks } from "../src/QuestionLinks";
import registeredWorks from "../src/workDatabaseLinks.json";
import registeredPeople from "../src/personDatabaseLinks.json";
import registeredOfdb from "../src/ofdbLinks.json";

const original = currentQuestions().find(
  (q) => q.metadata.film_title_original === "The Prestige",
)!;
const question = {
  ...original,
  presentation: preparePresentation(original),
};
const data = question.presentation.films[0].data;

it.each([
  {
    title: "Bruised",
    year: "2020",
    director: "Halle Berry",
    imdb: "tt8310474",
    wrong: "tt33064920",
  },
  {
    title: "Enemy",
    year: "2013",
    director: "Denis Villeneuve",
    imdb: "tt2316411",
    wrong: "tt3148392",
  },
])(
  "verknüpft $title mit dem konkret behandelten Film und seiner Regie statt einem gleichnamigen Werk",
  ({ title, year, director, imdb, wrong }) => {
    const original =
      title === "Bruised"
        ? currentQuestions("actors")
            .filter((q) => q.metadata.person_name === director)
            .find((q) =>
              preparePresentation(q).films.some(
                ({ data }) =>
                  data.originalTitle === title && String(data.year) === year,
              ),
            )!
        : currentQuestions().find(
            (q) =>
              q.metadata.film_title_original === title &&
              q.metadata.film_year === year,
          )!;
    expect(original).toBeDefined();
    const q = { ...original, presentation: preparePresentation(original) };
    const film = q.presentation.films.find(
      ({ data }) => data.originalTitle === title && String(data.year) === year,
    )!.data;
    expect(film.directors).toContain(director);
    const links = databaseLinksFor(q);
    expect(links).toContainEqual(
      expect.objectContaining({
        source: `https://www.imdb.com/title/${imdb}/`,
      }),
    );
    expect(
      links.some(({ source }) => source.includes(`/title/${wrong}/`)),
    ).toBe(false);
    expect(links).toContainEqual(
      expect.objectContaining({ label: `IMDb – ${director}` }),
    );
  },
);

it("unterscheidet die vier gleich aussehenden Regiebelege aus dem gemeldeten Prestige-Beispiel nach ihrem tatsächlichen Ziel", () => {
  const before = structuredClone(question);
  expect(
    data.directorSources.map((url) => sourceLinkLabel(url, question)),
  ).toEqual([
    "Film: The Prestige",
    "Film: Prestige – Die Meister der Magie",
    "Film: The Illusionist (2006)",
    "Regie: Christopher Nolan",
  ]);
  expect(question).toEqual(before);
});

it("benennt Personen- und Bildquellen und erhält unterscheidende Filmjahre", () => {
  const actor = {
    ...question,
    metadata: { ...question.metadata, person_name: "Christian Bale" },
  };
  expect(
    sourceLinkLabel("https://en.wikipedia.org/wiki/Christian_Bale", actor),
  ).toBe("Schauspieler: Christian Bale");
  expect(
    sourceLinkLabel(
      "https://en.wikipedia.org/wiki/The_Illusionist_(2010_film)",
      question,
    ),
  ).toBe("Film: The Illusionist (2010)");
  expect(
    sourceLinkLabel(
      "https://commons.wikimedia.org/wiki/File:Christian_Bale.jpg",
      actor,
    ),
  ).toBe("Bild: Christian Bale.jpg");
  expect(
    sourceLinkLabel(
      "https://de.wikipedia.org/w/index.php?title=Prestige_%E2%80%93_Die_Meister_der_Magie",
      question,
    ),
  ).toBe("Film: Prestige – Die Meister der Magie");
});

it("nennt bei anderen Quellen den Artikel oder bei reinen Kennungen den konkreten Bezug", () => {
  expect(
    sourceLinkLabel(
      "https://www.slashfilm.com/559508/die-hard-interviews/",
      question,
    ),
  ).toBe("Artikel: die hard interviews");
  expect(
    sourceLinkLabel(
      "https://catalog.afi.com/Film/12345",
      question,
      "The Prestige (2006)",
    ),
  ).toBe("Quelle zu The Prestige (2006)");
  const html = renderToStaticMarkup(
    createElement(SourceLink, {
      source: "https://catalog.afi.com/Film/12345",
      q: question,
      subject: "The Prestige (2006)",
    }),
  );
  expect(html).toContain("Quelle zu The Prestige (2006)");
  expect(html).toContain("catalog.afi.com");
  expect(html).toContain('href="https://catalog.afi.com/Film/12345"');
  expect(html).toContain('target="_blank"');
  expect(html).toContain('rel="noreferrer"');
});

it("bündelt sämtliche Belege mit sprechenden Zielen einmalig unter Quellen und Links", () => {
  const filmHtml = renderToStaticMarkup(
    createElement(FilmDataPanel, { q: question }),
  );
  expect(filmHtml).not.toContain("<a ");

  const state = emptyState([question]);
  const now = Date.parse("2026-11-08T12:00:00+01:00");
  const round = startRound(
    state,
    {
      mode: "ueben",
      topic: question.topic,
      difficulty: "Alle Stufen",
    },
    now,
  );
  answer(state, round.id, question.id, question.correctId, 1000, now + 1000, 0);
  const html = renderToStaticMarkup(
    createElement(Explanation, {
      q: question,
      event: state.events[0],
    }),
  );
  const sources = html.slice(html.indexOf('<details class="answer-sources">'));
  expect(sources).toContain('class="source-link"');
  expect(sources).toContain("Artikel: lords of illusion the prestige");
  expect(sources).toContain("theasc.com");
  expect(sources).toContain("Wikipedia (EN) – Film: The Illusionist (2006)");
  expect(sources).toContain("Wikipedia (EN) – Regie: Christopher Nolan");
  expect(sources).toContain("Quellen und Links");
  expect(sources).toContain("Belegquellen");
  expect(sources).toContain("Weiterführende Datenbanken");
  const links = [...sources.matchAll(/href="([^"]+)"/g)].map((match) =>
    sourceKey(match[1]),
  );
  expect(new Set(links).size).toBe(links.length);
  for (const url of [
    ...question.sources,
    ...data.sources,
    ...data.directorSources,
  ])
    expect(links).toContain(sourceKey(url));
});

it("trennt gleiche Ziele von Beleg-Unterseiten und behält beide Wikipedia-Sprachfassungen", () => {
  expect(sourceKey("https://www.imdb.com/title/tt0482571/?ref_=x")).toBe(
    sourceKey("https://imdb.com/title/tt0482571"),
  );
  expect(
    sourceKey("https://www.imdb.com/title/tt0482571/plotsummary/"),
  ).not.toBe(sourceKey("https://www.imdb.com/title/tt0482571/"));
  expect(sourceKey("https://de.wikipedia.org/wiki/Film")).not.toBe(
    sourceKey("https://en.wikipedia.org/wiki/Film"),
  );
  const q = structuredClone(question);
  q.sources.push(
    "https://www.imdb.com/title/tt0482571/",
    "https://www.imdb.com/title/tt0482571/plotsummary/",
  );
  q.presentation.films[0].data.sources.push(
    "https://imdb.com/title/tt0482571?ref_=x",
  );
  const html = renderToStaticMarkup(createElement(QuestionLinks, { q }));
  expect(
    evidenceLinksFor(q).filter(
      ({ source }) => sourceKey(source) === "imdb.com/title/tt0482571",
    ),
  ).toHaveLength(1);
  expect(html).toContain(
    "IMDb – Prestige – Die Meister der Magie (2006) – Handlung",
  );
  expect(
    html.match(/href="https:\/\/www.imdb.com\/title\/tt0482571\/"/g),
  ).toHaveLength(1);
});

it("ordnet Datenbanklinks exakt der Person und jedem einzelnen Filmverweis zu", () => {
  const actorOriginal = currentQuestions("actors").find(
    (q) =>
      q.metadata.person_id === "ACTOR-001" &&
      preparePresentation(q).films.length > 1,
  )!;
  const actor = {
    ...actorOriginal,
    presentation: preparePresentation(actorOriginal),
  };
  const before = structuredClone(actor);
  const links = databaseLinksFor(actor);
  expect(links).toContainEqual(
    expect.objectContaining({
      label: "IMDb – Tom Hanks",
      kind: "Schauspieler",
    }),
  );
  for (const { data } of actor.presentation.films) {
    const work = (
      registeredWorks as Record<string, { title: string; imdb: string }>
    )[`${data.originalTitle}|${data.year}`];
    if (work)
      expect(links).toContainEqual(
        expect.objectContaining({
          source: `https://www.imdb.com/title/${work.imdb}/`,
          label: `IMDb – ${work.title} (${data.year})`,
        }),
      );
  }
  actor.metadata.person_name = "Andere Person";
  expect(
    databaseLinksFor(actor).some(
      (link) => link.source === registeredPeople["ACTOR-001"].imdb,
    ),
  ).toBe(false);
  expect(before.metadata.person_name).toBe("Tom Hanks");
  const unknown = {
    ...question,
    metadata: { film_title_original: "Ungeklärtes Werk", film_year: "2026" },
    presentation: { ...question.presentation, films: [] },
  };
  expect(databaseLinksFor(unknown)).toEqual([]);
  expect(
    databaseLinksFor({
      ...unknown,
      metadata: { person_id: "constructor", person_name: "Object" },
    }),
  ).toEqual([]);
});

it("enthält ausschließlich bestätigte IMDb-Identitäten und unterscheidet Remakes und Serien", () => {
  for (const [key, work] of Object.entries(registeredWorks)) {
    expect(work.imdb, key).toMatch(/^tt\d{7,}$/);
    expect(work.title, key).not.toBe("");
    expect(["film", "series"], key).toContain(work.kind);
  }
  for (const person of Object.values(registeredPeople))
    expect(person.imdb).toMatch(/^https:\/\/www\.imdb\.com\/name\/nm\d{7,}\/$/);
  expect(registeredWorks["Dune|1984"].imdb).not.toBe(
    registeredWorks["Dune|2021"].imdb,
  );
  for (const [key, link] of Object.entries(registeredOfdb)) {
    expect(
      (registeredWorks as Record<string, { imdb: string }>)[key]?.imdb,
      key,
    ).toBe(link.imdb);
    expect(link.url, key).toMatch(/^https:\/\/www\.ofdb\.de\/film\/\d+[,/]/);
  }
});

it("kann alle aktuellen Frage-, Vertiefungs- und Filmdatenquellen ohne Verlust verständlich anzeigen", () => {
  for (const area of ["film", "actors", "awards"] as const) {
    for (const original of currentQuestions(area)) {
      const q = { ...original, presentation: preparePresentation(original) };
      const evidence = evidenceLinksFor(q);
      const keys = evidence.map(({ source }) => sourceKey(source));
      expect(new Set(keys).size, q.id).toBe(keys.length);
      for (const { source, subject } of evidence)
        expect(
          sourceLinkLabel(source, q, subject).length,
          `${q.id}: ${source}`,
        ).toBeGreaterThan(0);
      for (const source of q.sources)
        expect(keys, q.id).toContain(sourceKey(source));
    }
  }
});

it.each(["question", "round"] as const)(
  "schützt sämtliche Linkziele bei Lösungswahl %s bis zur vorgesehenen Auflösung",
  (solutionDisplay) => {
    const now = Date.parse("2026-11-08T12:00:00+01:00");
    vi.useFakeTimers();
    vi.setSystemTime(now + 10_000);
    try {
      const state = emptyState([question]);
      state.settings.solutionDisplay = solutionDisplay;
      const round = startRound(
        state,
        { mode: "ueben", topic: question.topic, difficulty: "Alle Stufen" },
        now,
      );
      const screen = () =>
        renderToStaticMarkup(
          createElement(QuestionScreen, {
            round,
            index: 0,
            state,
            mutate: async () => null,
            busy: false,
            onExit: () => {},
            onNext: () => {},
          }),
        );
      const hidden = screen();
      expect(hidden).not.toContain("Quellen und Links");
      expect(hidden).not.toContain("imdb.com");
      expect(hidden).not.toContain("ofdb.de");
      answer(
        state,
        round.id,
        question.id,
        question.correctId,
        1000,
        now + 1000,
        0,
      );
      const answered = screen();
      if (solutionDisplay === "round") {
        expect(answered).not.toContain("Quellen und Links");
        expect(answered).not.toContain("imdb.com");
        expect(answered).not.toContain("ofdb.de");
      } else {
        expect(answered).toContain("Quellen und Links");
        expect(answered).toContain("imdb.com/title/tt0482571/");
      }
      complete(state, round.id, now + 2000);
      const result = renderToStaticMarkup(
        createElement(Result, {
          round,
          state,
          busy: false,
          celebrate: false,
          onHome: () => {},
          onLeaderboard: () => {},
          onRetry: () => {},
        }),
      );
      expect(result).toContain("Quellen und Links");
      expect(result).toContain("imdb.com/title/tt0482571/");
      expect(result).toContain("ofdb.de/film/107720");
    } finally {
      vi.useRealTimers();
    }
  },
);
