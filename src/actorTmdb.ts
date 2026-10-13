import type { Question } from "./model";
import links from "./actorTmdbLinks.json" with { type: "json" };

const people = new Map(Object.entries(links));

export function actorTmdbPerson(q: Pick<Question, "metadata">) {
  const person = people.get(q.metadata.person_id);
  if (!person || person.name !== q.metadata.person_name) return undefined;
  return person;
}

export function actorTmdbUrl(q: Pick<Question, "metadata">) {
  const person = actorTmdbPerson(q);
  if (!person) return undefined;
  return `https://www.themoviedb.org/person/${person.tmdbId}`;
}
