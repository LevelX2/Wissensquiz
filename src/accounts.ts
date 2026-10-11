import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
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
// Public reads and anonymous activity never inherit a stale account token.
export function createPublicActivityClient(
  config: NonNullable<ReturnType<typeof accountConfig>>,
) {
  return createClient(config.supabaseUrl, config.publishableKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
      storageKey: `wissensquiz-public:${new URL(config.supabaseUrl).hostname}`,
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

export class CloudConflict extends Error {}
export class CloudSaveError extends Error {}
