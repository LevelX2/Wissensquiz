import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { openDatabase, read, restore, validateBackup } from "./storage";
import type { State } from "./model";
import { decodeCloudState } from "./cloudCodec";
import { backgroundEncoding } from "./stateProcessing";

const configSchema = z.object({
  enabled: z.boolean(),
  supabaseUrl: z.string(),
  publishableKey: z.string(),
});
export function accountConfig(value: unknown) {
  const config = configSchema.parse(value);
  if (!config.enabled) return null;
  const url = new URL(config.supabaseUrl);
  if (
    url.protocol !== "https:" ||
    !/^[a-z0-9-]+\.supabase\.co$/.test(url.hostname) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    url.pathname !== "/" ||
    url.port
  )
    throw new Error("Ungültige Kontodienst-Adresse.");
  if (!/^sb_publishable_[A-Za-z0-9_-]+$/.test(config.publishableKey))
    throw new Error(
      "Für die App ist ausschließlich ein öffentlicher Supabase-Publishable-Key erlaubt.",
    );
  return { ...config, supabaseUrl: url.origin };
}
export const accountStorageKey = (url: string, id: string) =>
  `account:${new URL(url).hostname}:${id}`;
export function createAccountClient(
  config: NonNullable<ReturnType<typeof accountConfig>>,
) {
  return createClient(config.supabaseUrl, config.publishableKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
      storageKey: `wissensquiz-auth:${new URL(config.supabaseUrl).hostname}`,
    },
  });
}
export function parseAccountLink(hash: string) {
  if (!hash.startsWith("#auth?")) return null;
  const params = new URLSearchParams(hash.slice(6));
  const type = params.get("type");
  const token = params.get("token_hash");
  if (
    (type !== "signup" && type !== "recovery") ||
    !token ||
    !/^[A-Za-z0-9_-]{20,256}$/.test(token)
  )
    throw new Error(
      "Dieser Bestätigungslink ist ungültig. Fordere eine neue E-Mail an.",
    );
  return { type, token_hash: token } as {
    type: "signup" | "recovery";
    token_hash: string;
  };
}
export function authError(error: { code?: string; status?: number } | null) {
  if (!error)
    return "Der Kontodienst ist gerade nicht erreichbar. Versuche es mit Internetverbindung erneut.";
  if (error.code === "invalid_credentials")
    return "E-Mail oder Passwort stimmt nicht.";
  if (error.code === "email_not_confirmed")
    return "Bitte bestätige zuerst Deine E-Mail-Adresse.";
  if (["otp_expired", "otp_disabled"].includes(error.code ?? ""))
    return "Der Link ist abgelaufen oder wurde bereits verwendet. Fordere eine neue E-Mail an.";
  if (error.status === 429 || error.code?.includes("rate_limit"))
    return "Zu viele Versuche. Bitte warte etwas und versuche es erneut.";
  if (error.code === "weak_password")
    return "Bitte wähle ein stärkeres Passwort mit mindestens zwölf Zeichen.";
  return "Die Kontoaktion konnte nicht abgeschlossen werden. Bitte prüfe Deine Eingaben oder versuche es später erneut.";
}

const cloudSchema = z.object({
  revision: z.number().int().positive(),
  updated_at: z.string(),
  state: z.unknown(),
});
export async function cloudSave(
  client: SupabaseClient,
  state: State,
  revision: number,
  ownerId: string,
) {
  const payload = await backgroundEncoding(state);
  const { data, error, status } = await client.rpc("quiz_save_state", {
    payload,
    expected_revision: revision,
    expected_owner: ownerId,
  });
  if (error?.message.includes("revision_conflict"))
    throw new CloudConflict(
      "Auf einem anderen Gerät wurde bereits gespeichert. Lade zuerst den Online-Stand; Dein lokaler Stand bleibt erhalten.",
    );
  if (error)
    throw new CloudSaveError(
      status === 401 || status === 403
        ? "Der Kontodienst hat den Zugriff abgelehnt. Prüfe Deine Anmeldung im Profil."
        : status === 413 || error.message.includes("invalid_state")
          ? "Der Kontodienst hat den Spielstand abgelehnt, möglicherweise wegen seiner Größe."
          : status === 429
            ? "Der Kontodienst erhält gerade zu viele Anfragen. Wir versuchen es erneut."
            : status >= 500
              ? "Der Kontodienst meldet einen Serverfehler."
              : "Die Online-Speicherung konnte nicht bestätigt werden. Prüfe Deine Verbindung; bei wiederholten Fehlern melde das bitte.",
    );
  return z.number().int().positive().parse(data);
}
export class CloudConflict extends Error {}
export class CloudSaveError extends Error {}

export type SyncReceipt = { revision: number; fingerprint: string };
export async function readSyncReceipt(
  key: string,
): Promise<SyncReceipt | undefined> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const req = db.transaction("state").objectStore("state").get(`sync:${key}`);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
export async function writeSyncReceipt(key: string, receipt: SyncReceipt) {
  const db = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction("state", "readwrite");
    tx.objectStore("state").put(receipt, `sync:${key}`);
    tx.objectStore("state").put(receipt.revision, `revision:${key}`);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}
export async function cloudRead(client: SupabaseClient, ownerId: string) {
  const { data, error } = await client
    .from("quiz_saves")
    .select("state,revision,updated_at")
    .eq("owner_id", ownerId)
    .maybeSingle();
  if (error)
    throw new Error("Der Online-Spielstand konnte nicht geladen werden.");
  if (!data) return null;
  const result = cloudSchema.parse(data);
  const decoded = await decodeCloudState(result.state);
  return {
    ...result,
    needsCareerSave:
      !decoded || typeof decoded !== "object" || !("career" in decoded),
    state: validateBackup(decoded),
  };
}
export async function cloudRevision(key: string): Promise<number> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const req = db
      .transaction("state")
      .objectStore("state")
      .get(`revision:${key}`);
    req.onsuccess = () =>
      resolve(typeof req.result === "number" ? req.result : 0);
    req.onerror = () => reject(req.error);
  });
}
export async function rememberRevision(key: string, revision: number) {
  const db = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction("state", "readwrite");
    tx.objectStore("state").put(revision, `revision:${key}`);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}
// A recoverable copy is made before any explicit cloud/guest replacement.
export async function replaceAccountState(key: string, state: State) {
  if (!key.startsWith("account:"))
    throw new Error("Kein Kontospielstand ausgewählt.");
  const checked = validateBackup(state);
  const old = await read(key);
  if (old) {
    const db = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction("state", "readwrite");
      tx.objectStore("state").put(
        old,
        `recovery:${key}:${crypto.randomUUID()}`,
      );
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  }
  return restore(checked, key);
}
