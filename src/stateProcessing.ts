import type { State } from "./model";
import { isImmutableCatalog } from "./immutableCatalog";
import {
  fingerprintState,
  encodeValidatedState,
  type ProcessingOperation,
  type ProcessingRequest,
  type ProcessingResponse,
  type ProcessingResult,
} from "./stateProcessingCore";

let worker: Worker | undefined;
let unavailable = false;
let sequence = 0;
let catalogKey = 0;
let lastCatalog: State["questions"] | undefined;
const pending = new Map<
  number,
  {
    resolve: (value: string | ProcessingResult) => void;
    reject: (error: Error) => void;
    fallback: () => Promise<string | ProcessingResult>;
  }
>();

function backgroundWorker() {
  if (unavailable || typeof Worker === "undefined") return;
  if (worker) return worker;
  try {
    worker = new Worker(
      new URL("./stateProcessing.worker.ts", import.meta.url),
      {
        type: "module",
      },
    );
    worker.onmessage = ({ data }: MessageEvent<ProcessingResponse>) => {
      const task = pending.get(data.id);
      if (!task) return;
      pending.delete(data.id);
      if ("error" in data) task.reject(new Error(data.error));
      else task.resolve(data.value);
    };
    worker.onerror = (event) => {
      event.preventDefault();
      worker?.terminate();
      worker = undefined;
      lastCatalog = undefined;
      unavailable = true;
      // Browsers without module-worker support keep the established path.
      for (const task of pending.values())
        void task.fallback().then(task.resolve, task.reject);
      pending.clear();
    };
    return worker;
  } catch {
    unavailable = true;
    return;
  }
}

function processState(
  operation: ProcessingOperation,
  state: State,
): Promise<string | ProcessingResult> {
  const fallback = () =>
    operation === "fingerprint"
      ? fingerprintState(state)
      : encodeValidatedState(state);
  const target = backgroundWorker();
  if (!target) return fallback();
  const reuse =
    state.questions === lastCatalog && isImmutableCatalog(state.questions);
  if (!reuse) {
    lastCatalog = state.questions;
    catalogKey++;
  }
  const { questions, ...game } = state;
  const request: ProcessingRequest = {
    id: ++sequence,
    operation,
    catalogKey,
    ...(reuse ? {} : { questions }),
    state: game,
  };
  return new Promise((resolve, reject) => {
    pending.set(request.id, { resolve, reject, fallback });
    try {
      target.postMessage(request);
    } catch (error) {
      pending.delete(request.id);
      lastCatalog = undefined;
      reject(error);
    }
  });
}

export const backgroundFingerprint = (state: State) =>
  processState("fingerprint", state) as Promise<string>;
export const backgroundEncoding = (state: State) =>
  processState("encode", state) as Promise<ProcessingResult>;
