import {
  fingerprintState,
  encodeValidatedState,
  type ProcessingRequest,
  type ProcessingResponse,
} from "./stateProcessingCore";
import type { State } from "./model";

let catalog: { key: number; questions: State["questions"] } | undefined;
self.onmessage = async ({ data }: MessageEvent<ProcessingRequest>) => {
  let response: ProcessingResponse;
  try {
    if (data.questions)
      catalog = { key: data.catalogKey, questions: data.questions };
    if (catalog?.key !== data.catalogKey)
      throw new Error("Fragenkatalog für die Kontosicherung fehlt.");
    // Capture this catalog before awaiting: a later account or import may
    // replace the worker's cache while this operation finishes.
    const state: State = { ...data.state, questions: catalog.questions };
    const value =
      data.operation === "fingerprint"
        ? await fingerprintState(state)
        : await encodeValidatedState(state);
    response = { id: data.id, value };
  } catch (error) {
    response = {
      id: data.id,
      error: error instanceof Error ? error.message : "Spielstand abgelehnt.",
    };
  }
  self.postMessage(response);
};
