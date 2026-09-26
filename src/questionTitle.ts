import type { Question } from "./model";

// Only remove quotes enclosing a known film title; never rewrite source content.
export function questionTitleParts(q: Question) {
  const titles = [q.metadata.film_title_de, q.metadata.film_title_original]
    .filter((title): title is string => !!title)
    .sort((a, b) => b.length - a.length);
  for (const title of titles) {
    for (const [open, close] of [
      ["„", "“"],
      ["“", "”"],
      ['"', '"'],
      ["»", "«"],
      ["«", "»"],
    ]) {
      const quoted = `${open}${title}${close}`;
      const position = q.question.indexOf(quoted);
      if (position >= 0)
        return {
          before: q.question.slice(0, position),
          title,
          after: q.question.slice(position + quoted.length),
        };
    }
  }
  return null;
}
