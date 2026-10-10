import type { Question, Round } from "./model";

type RoundFacts = NonNullable<Round["archive"]>["questions"];
const immutableCatalogs = new WeakSet<Question[]>();
const immutableRoundFacts = new WeakSet<RoundFacts>();
export const isImmutableCatalog = (questions: Question[]) =>
  immutableCatalogs.has(questions);
function freeze(value: object) {
  for (const child of Object.values(value))
    if (child && typeof child === "object" && !Object.isFrozen(child))
      freeze(child);
  Object.freeze(value);
}
export function freezeCatalog(questions: Question[]) {
  if (immutableCatalogs.has(questions)) return questions;
  freeze(questions);
  immutableCatalogs.add(questions);
  return questions;
}
export function freezeRoundFacts(questions: RoundFacts) {
  if (immutableRoundFacts.has(questions)) return questions;
  freeze(questions);
  immutableRoundFacts.add(questions);
  return questions;
}
