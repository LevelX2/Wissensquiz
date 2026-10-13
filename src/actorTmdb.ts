import type { Question } from "./model";
import links from "./actorTmdbLinks.json" with { type: "json" };

const people = new Map(Object.entries(links));

export function actorTmdbUrl(q: Question) {
  const person = people.get(q.metadata.person_id);
  if (!person || person.name !== q.metadata.person_name) return undefined;
  return `https://www.themoviedb.org/person/${person.tmdbId}`;
}
