import type { State } from "./model";
import { validateBackup } from "./backupValidation";
import { encodeCloudState } from "./cloudCodec";

export async function fingerprintState(state: State) {
  const bytes = new TextEncoder().encode(JSON.stringify(validateBackup(state)));
  return Array.from(
    new Uint8Array(await crypto.subtle.digest("SHA-256", bytes)),
  )
    .map((n) => n.toString(16).padStart(2, "0"))
    .join("");
}

export async function encodeValidatedState(state: State) {
  return encodeCloudState(validateBackup(state));
}

export type ProcessingOperation = "fingerprint" | "encode";
export type ProcessingRequest = {
  id: number;
  operation: ProcessingOperation;
  catalogKey: number;
  questions?: State["questions"];
  state: Omit<State, "questions">;
};
export type ProcessingResult = Awaited<ReturnType<typeof encodeValidatedState>>;
export type ProcessingResponse = {
  id: number;
} & ({ value: string | ProcessingResult } | { error: string });
