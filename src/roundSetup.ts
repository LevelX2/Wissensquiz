import type { RoundSetup, State } from "./model";
import {
  difficulties,
  genreOf,
  questionSources,
  questionSourceOf,
} from "./filters";
import { ACTORS, AWARD_WINNERS, filmCategories } from "./categories";
import { familiarities } from "./familiarity";

export function readRoundSetup(state: State): RoundSetup {
  const saved = state.settings.roundSetup;
  if (!saved)
    return {
      mode: state.settings.allDifficulties ? "ueben" : "entdecken",
      genres: null,
      categories: [],
      difficulties: [...difficulties],
      familiarities: [...familiarities],
      sources: ["film"],
    };
  const available = new Set(
    state.questions.filter((q) => questionSourceOf(q) === "film").map(genreOf),
  );
  const genres =
    saved.genres === null
      ? null
      : [...new Set(saved.genres)].filter((g) => available.has(g));
  return {
    ...saved,
    recordGenre:
      saved.recordGenre && available.has(saved.recordGenre)
        ? saved.recordGenre
        : [...available].sort()[0],
    // An intentionally empty selection stays empty; obsolete imports fall back to all.
    genres: saved.genres?.length && !genres?.length ? null : genres,
    categories: saved.categories.filter((c) =>
      filmCategories.includes(c as (typeof filmCategories)[number]),
    ),
    sources: saved.sources
      ? questionSources.filter((s) => saved.sources!.includes(s))
      : [
          ...(!saved.categories.length ||
          saved.categories.some((c) =>
            filmCategories.includes(c as (typeof filmCategories)[number]),
          )
            ? ["film" as const]
            : []),
          ...(saved.categories.includes(AWARD_WINNERS)
            ? ["awards" as const]
            : []),
          ...(saved.categories.includes(ACTORS) ? ["actors" as const] : []),
        ],
    difficulties: [...new Set(saved.difficulties)],
    familiarities: [...new Set(saved.familiarities ?? familiarities)],
  };
}
