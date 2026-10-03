import type { Question } from "./model";

const immutableCatalogs = new WeakSet<Question[]>();
export const isImmutableCatalog = (questions: Question[]) =>
  immutableCatalogs.has(questions);
export function freezeCatalog(questions: Question[]) {
  if (immutableCatalogs.has(questions)) return questions;
  function freeze(value: object) {
    for (const child of Object.values(value))
      if (child && typeof child === "object" && !Object.isFrozen(child))
        freeze(child);
    Object.freeze(value);
  }
  freeze(questions);
  immutableCatalogs.add(questions);
  return questions;
}
