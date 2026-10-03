import { useState } from "react";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { PasswordField } from "./PasswordField";
import { ProfileStats } from "./ProfileStats";
import { syncText } from "./AccountGame";
import type { SyncStatus } from "./accountSync";
import { authError, replaceAccountState } from "./accounts";
import { read } from "./storage";
import type { State } from "./model";
import { RecoveryCopies } from "./RecoveryCopiesPanel";
import { OnlineConfirmation } from "./OnlineConfirmation";

export function AccountPanel({
  client,
  user,
  storageKey,
  state,
  onState,
  initialMessage,
  syncStatus,
  syncMessage,
  confirmedAt,
  serviceUnavailable = false,
  onRetryConfig,
}: {
  client: SupabaseClient | null;
  user: User | null;
  storageKey: string;
  state: State;
  onState: (state: State) => void;
  initialMessage: string;
  syncStatus?: SyncStatus;
  syncMessage?: string;
  confirmedAt?: number;
  serviceUnavailable?: boolean;
  onRetryConfig?: () => void;
}) {
  const [mode, setMode] = useState<"login" | "register" | "forgot" | "resend">(
    "login",
  );
  const [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [name, setName] = useState("");
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState(initialMessage);
  const [guestAccept, setGuestAccept] = useState(false);
  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setMessage("");
    try {
      await fn();
    } catch (e) {
      setMessage(
        e instanceof Error ? e.message : "Kontoaktion fehlgeschlagen.",
      );
    } finally {
      setPassword("");
      setBusy(false);
    }
  };
  const change = (next: typeof mode) => {
    setMode(next);
    setPassword("");
    setMessage("");
  };
  if (!client)
    return (
      <section className="account-page">
        <h1>Dein Profil</h1>
        <p role={serviceUnavailable ? "status" : undefined}>
          {serviceUnavailable
            ? "Der Kontodienst konnte gerade nicht geladen werden. Prüfe Deine Internetverbindung und versuche es erneut."
            : "Die eigene Anmeldung wird vorbereitet. Bestätigungs- und Reset-Mails sind noch nicht eingerichtet."}
        </p>
        <p>
          Du kannst weiterhin als Gast spielen. Dein bisheriger Spielstand
          bleibt auf diesem Gerät erhalten.
        </p>
        {message && !serviceUnavailable && <p role="status">{message}</p>}
        {serviceUnavailable && (
          <button className="secondary" onClick={onRetryConfig}>
            Kontodienst erneut laden
          </button>
        )}
      </section>
    );
  if (!user)
    return (
      <section className="account-page">
        <h1>
          {
            {
              login: "Anmelden",
              register: "Konto erstellen",
              forgot: "Passwort vergessen",
              resend: "Bestätigung erneut senden",
            }[mode]
          }
        </h1>
        <p>
          Mit Deinem Quiz-Konto wird Dein Fortschritt automatisch online
          gespeichert. Melde Dich auf einem anderen Gerät an und spiele dort
          weiter. Als Gast bleibt Dein Fortschritt nur auf diesem Gerät.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void run(async () => {
              if (mode === "login") {
                const { error } = await client.auth.signInWithPassword({
                  email: email.trim(),
                  password,
                });
                if (error) throw new Error(authError(error));
              }
              if (mode === "register") {
                if (name.trim().length < 2)
                  throw new Error(
                    "Bitte gib einen Spielernamen mit mindestens zwei Zeichen ein.",
                  );
                const { data, error } = await client.auth.signUp({
                  email: email.trim(),
                  password,
                  options: {
                    data: { display_name: name.trim() },
                    emailRedirectTo: location.origin + "/",
                  },
                });
                if (error) throw new Error(authError(error));
                if (data.session) {
                  await client.auth.signOut({ scope: "local" });
                  throw new Error(
                    "E-Mail-Bestätigung ist beim Kontodienst noch nicht korrekt eingerichtet.",
                  );
                }
                setMessage(
                  "Wenn die Registrierung möglich ist, erhältst Du eine Bestätigungsmail. Prüfe auch Deinen Spamordner.",
                );
              }
              if (mode === "forgot") {
                const { error } = await client.auth.resetPasswordForEmail(
                  email.trim(),
                  { redirectTo: location.origin + "/" },
                );
                if (error) throw new Error(authError(error));
                setMessage(
                  "Falls ein Konto zu dieser Adresse besteht, erhältst Du einen Link zum Zurücksetzen.",
                );
              }
              if (mode === "resend") {
                const { error } = await client.auth.resend({
                  type: "signup",
                  email: email.trim(),
                  options: { emailRedirectTo: location.origin + "/" },
                });
                if (error) throw new Error(authError(error));
                setMessage(
                  "Falls eine Bestätigung aussteht, erhältst Du eine neue E-Mail.",
                );
              }
            });
          }}
        >
          {mode === "register" && (
            <label>
              Spielername
              <input
                autoComplete="nickname"
                required
                minLength={2}
                maxLength={40}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
          )}
          <label>
            E-Mail-Adresse
            <input
              type="email"
              autoComplete="email"
              required
              maxLength={254}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          {(mode === "login" || mode === "register") && (
            <PasswordField
              key={mode}
              value={password}
              onChange={setPassword}
              newPassword={mode === "register"}
            />
          )}
          {mode === "register" && (
            <p className="tiny muted">
              Mindestens zwölf Zeichen. Dein Spielername darf ein Pseudonym
              sein. Dein Spielername, Level, XP und zusammengefasste
              Spielerstatistik sind in der öffentlichen Bestenliste sichtbar,
              auch für Gäste. Die einzelnen Rekordergebnisse stehen im
              Spielervergleich für angemeldete Spieler. Die Teilnahme gehört zum
              Quiz-Konto. E-Mail und privater Spielstand bleiben verborgen.
            </p>
          )}
          <button className="primary" disabled={busy}>
            {
              {
                login: "Anmelden",
                register: "Registrieren",
                forgot: "Reset-Link anfordern",
                resend: "Bestätigung anfordern",
              }[mode]
            }
          </button>
        </form>
        <p role="status">{message}</p>
        <div className="account-actions">
          {(["login", "register", "forgot", "resend"] as const)
            .filter((m) => m !== mode)
            .map((m) => (
              <button
                className="text-button"
                disabled={busy}
                key={m}
                onClick={() => change(m)}
              >
                {
                  {
                    login: "Zur Anmeldung",
                    register: "Konto erstellen",
                    forgot: "Passwort vergessen?",
                    resend: "E-Mail noch nicht bestätigt?",
                  }[m]
                }
              </button>
            ))}
        </div>
      </section>
    );
  return (
    <section className="account-page">
      <h1>Dein Profil</h1>
      <p>
        Angemeldet als{" "}
        <strong>{String(user.user_metadata.display_name ?? "Spieler")}</strong>{" "}
        · {user.email}
      </p>
      <ProfileStats state={state} />
      <p className="tiny muted">
        Dein Spielername und Deine Leistungswerte erscheinen automatisch in der
        öffentlichen Bestenliste, auch für Gäste. E-Mail und privater Spielstand
        bleiben verborgen.
      </p>
      <details className="account-help">
        <summary>Konto & Speicherung</summary>
        <p className="tiny muted profile-sync-status" role="status">
          {syncMessage || (syncStatus && syncText[syncStatus])}
        </p>
        <OnlineConfirmation at={confirmedAt} />
        <RecoveryCopies key={storageKey} storageKey={storageKey} />
        <p role="status">{message}</p>
        <button
          className="secondary"
          disabled={busy}
          onClick={() =>
            void run(async () => {
              const { error } = await client.auth.signOut({ scope: "local" });
              if (error) throw new Error(authError(error));
            })
          }
        >
          Abmelden
        </button>
        <p>
          Dein Fortschritt wird automatisch gespeichert. Warte vor dem
          Gerätewechsel hier im Profil auf „Spielstand online gespeichert“.
        </p>
        <details>
          <summary>Vorhandenen Gastspielstand übernehmen</summary>
          <h2>Bisherigen Gastspielstand übernehmen</h2>
          <p>
            Damit startest Du in Deinem Konto mit dem Fortschritt, den Du auf
            diesem Gerät bisher als Gast erspielt hast. Der Gastspielstand
            bleibt erhalten; der lokale Kontospielstand wird ersetzt. Sichere
            ihn vorher als JSON. Der übernommene Stand wird anschließend
            automatisch online gespeichert.
          </p>
          <label className="filter-choice">
            <input
              type="checkbox"
              checked={guestAccept}
              onChange={(e) => setGuestAccept(e.target.checked)}
            />
            Meinen lokalen Kontospielstand durch den Gastspielstand ersetzen
          </label>
          <button
            className="secondary"
            disabled={busy || !guestAccept}
            onClick={() =>
              void run(async () => {
                const guest = await read();
                if (!guest) throw new Error("Kein Gastspielstand vorhanden.");
                onState(await replaceAccountState(storageKey, guest));
                setGuestAccept(false);
                setMessage(
                  "Gastspielstand kopiert. Er wird automatisch online gespeichert.",
                );
              })
            }
          >
            Gastspielstand kopieren
          </button>
        </details>
      </details>
    </section>
  );
}
