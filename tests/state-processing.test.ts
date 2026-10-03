import "fake-indexeddb/auto";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { importCsv } from "../src/importer";
import { emptyState } from "../src/model";
import { decodeCloudState } from "../src/cloudCodec";
import type {
  ProcessingRequest,
  ProcessingResponse,
} from "../src/stateProcessingCore";

const questions = importCsv(
  readFileSync("public/fragen.csv", "utf8"),
).questions.slice(0, 5);
beforeEach(() => vi.resetModules());
afterEach(() => vi.unstubAllGlobals());
async function harness() {
  const requests: ProcessingRequest[] = [];
  let instance: FakeWorker;
  const surface = {
    onmessage: null as
      null | ((event: MessageEvent<ProcessingRequest>) => Promise<void>),
    postMessage: (data: ProcessingResponse) => instance.onmessage?.({ data }),
  };
  class FakeWorker {
    onmessage?: (event: { data: ProcessingResponse }) => void;
    onerror?: (event: { preventDefault: () => void }) => void;
    terminated = false;
    constructor() {
      instance = this;
    }
    postMessage(request: ProcessingRequest) {
      requests.push(structuredClone(request));
      void surface.onmessage!({
        data: structuredClone(request),
      } as MessageEvent<ProcessingRequest>);
    }
    terminate() {
      this.terminated = true;
    }
  }
  vi.stubGlobal("self", surface);
  vi.stubGlobal("Worker", FakeWorker);
  await import("../src/stateProcessing.worker");
  const processing = await import("../src/stateProcessing");
  const core = await import("../src/stateProcessingCore");
  return { processing, core, requests, worker: () => instance };
}

it("erhält Fingerabdruck und portable Sicherung bei wiederverwendetem schreibgeschütztem Katalog", async () => {
  const { processing, core, requests } = await harness();
  const { update } = await import("../src/storage");
  const state = await update(
    (s) => Object.assign(s, emptyState(structuredClone(questions))),
    undefined,
    crypto.randomUUID(),
  );
  expect(await processing.backgroundFingerprint(state)).toBe(
    await core.fingerprintState(state),
  );
  const encoded = await processing.backgroundEncoding(state);
  expect(await decodeCloudState(encoded)).toEqual(
    await decodeCloudState(await core.encodeValidatedState(state)),
  );
  expect(requests[0].questions).toHaveLength(5);
  expect(requests[1].questions).toBeUndefined();
  expect(requests[1].catalogKey).toBe(requests[0].catalogKey);
});

it("trennt gleichzeitig verarbeitete Kataloge und übernimmt Änderungen an nicht gesperrten Fragen", async () => {
  const { processing, core, requests } = await harness();
  const a = emptyState(structuredClone(questions)),
    b = emptyState([structuredClone(questions[0])]);
  const encoded = processing.backgroundEncoding(a);
  const hash = processing.backgroundFingerprint(b);
  expect(await decodeCloudState(await encoded)).toEqual(
    await decodeCloudState(await core.encodeValidatedState(a)),
  );
  expect(await hash).toBe(await core.fingerprintState(b));
  const before = await processing.backgroundFingerprint(a);
  a.questions[0].question += " Geändert";
  expect(await processing.backgroundFingerprint(a)).toBe(
    await core.fingerprintState(a),
  );
  expect(await processing.backgroundFingerprint(a)).not.toBe(before);
  expect(requests.every((request) => request.questions)).toBe(true);
});

it("weist ungültige Zustände auch im Worker ab und fällt bei einem Worker-Ladefehler sicher zurück", async () => {
  const { processing, core, worker } = await harness();
  const state = emptyState(questions);
  const broken = structuredClone(state);
  broken.questions.push(broken.questions[0]);
  await expect(processing.backgroundEncoding(broken)).rejects.toThrow(
    "Doppelte IDs",
  );
  const valid = processing.backgroundFingerprint(state);
  let prevented = false;
  worker().onerror!({
    preventDefault: () => {
      prevented = true;
    },
  });
  expect(await valid).toBe(await core.fingerprintState(state));
  expect(prevented).toBe(true);
  expect(worker().terminated).toBe(true);
  expect(await processing.backgroundFingerprint(state)).toBe(
    await core.fingerprintState(state),
  );
});
