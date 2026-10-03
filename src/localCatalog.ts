import type { State } from "./model";
import { decodeQuestionCatalog } from "./catalogCodec";

const FORMAT = "quiz-local-catalog-v1";
export const catalogKey = (stateKey: string) => `catalog:${stateKey}`;
export type StoredState = Omit<State, "questions"> & {
  storageFormat: typeof FORMAT;
  questions: { key: string; encoding: "json-field-refs-v1"; revision?: string };
};

// Keep the public State/backup contract complete. Only the IndexedDB layout
// separates the rarely changed catalog from progress and historical snapshots.
export function encodeLocalState(
  state: State,
  key: string,
  revision?: string,
): StoredState {
  return {
    ...state,
    storageFormat: FORMAT,
    questions: {
      key: catalogKey(key),
      encoding: "json-field-refs-v1",
      ...(revision ? { revision } : {}),
    },
  };
}

export function decodeLocalState(
  value: State | StoredState | undefined,
  catalog: unknown,
  key: string,
): State | undefined {
  if (!value || !("storageFormat" in value)) return value;
  if (
    value.storageFormat !== FORMAT ||
    value.questions.encoding !== "json-field-refs-v1" ||
    value.questions.key !== catalogKey(key) ||
    typeof catalog !== "string"
  )
    throw new Error("Der lokale Fragenkatalog fehlt oder ist ungültig.");
  const questions = decodeQuestionCatalog(catalog);
  const { storageFormat: _, ...state } = value;
  return { ...state, questions };
}
