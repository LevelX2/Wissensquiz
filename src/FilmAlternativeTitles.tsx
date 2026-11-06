import type { Question } from "./model";
import { questionTitleParts } from "./questionTitle";

const normalize = (text: string) =>
  text
    .toLocaleLowerCase("de")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();

export function FilmAlternativeTitles({ q }: { q: Question }) {
  if (q.metadata.person_id) return null;
  const data = q.presentation?.films.find((film) => !film.reference)?.data;
  const alternatives = data?.alternativeTitles;
  const hint = alternatives?.find(({ showInQuestion }) => showInQuestion);
  if (!data || !alternatives || !hint) return null;
  const named = questionTitleParts(q);
  if (!named || normalize(named.title) === normalize(hint.title)) return null;
  // Only identify a film already named in the question. Hide the whole hint
  // when a title or part of an alias occurs in an answer (including year/name).
  const titles = [
    q.metadata.film_title_de,
    data.originalTitle,
    ...alternatives.map(({ title }) => title),
  ]
    .filter(Boolean)
    .map(normalize);
  if (
    q.answers.some(({ text }) => {
      const answer = normalize(text);
      return (
        answer &&
        titles.some(
          (title) =>
            ` ${title} `.includes(` ${answer} `) ||
            ` ${answer} `.includes(` ${title} `),
        )
      );
    })
  )
    return null;
  return (
    <p className="film-alternative-titles">Auch bekannt als „{hint.title}“</p>
  );
}
