import type { RoundSetup, State } from "./model";
import { difficulties, genreOf } from "./filters";

export function readRoundSetup(state: State): RoundSetup {
  const saved = state.settings.roundSetup;
  if (!saved)
    return {
      mode: "entdecken",
      genres: null,
      categories: [],
      difficulties: [...difficulties],
    };
  const available = new Set(state.questions.map(genreOf));
  const genres =
    saved.genres === null
      ? null
      : [...new Set(saved.genres)].filter((g) => available.has(g));
  return {
    ...saved,
    // An intentionally empty selection stays empty; obsolete imports fall back to all.
    genres: saved.genres?.length && !genres?.length ? null : genres,
    categories: [...new Set(saved.categories)],
    difficulties: [...new Set(saved.difficulties)],
  };
}
