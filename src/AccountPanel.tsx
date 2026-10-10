import { useState } from "react";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { PasswordField } from "./PasswordField";
import { ProfileStats } from "./ProfileStats";
import { syncText } from "./AccountGame";
import type { SyncStatus } from "./syncTypes";
import { authError } from "./accounts";
import type { State } from "./model";
import { OnlineConfirmation } from "./OnlineConfirmation";
import { AccountBenefits } from "./AccountBenefits";
import { authorizeTrial } from "./trial";

export function AccountPanel({
  client,
  user,
  state,
  initialMessage,
  syncStatus,
  syncMessage,
  confirmedAt,
  serviceUnavailable = false,
  onRetryConfig,
  initialMode = "login",
  trialAvailable = false,
}: {
  client: SupabaseClient | null;
  user: User | null;
  state: State;
  initialMessage: string;
  syncStatus?: SyncStatus;
  syncMessage?: string;
  confirmedAt?: number;
  serviceUnavailable?: boolean;
  onRetryConfig?: () => void;
  initialMode?: "login" | "register";
  trialAvailable?: boolean;
}) {
  const [mode, setMode] = useState<"login" | "register" | "forgot" | "resend">(
    initialMode,
  );
  const [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [name, setName] = useState("");
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState(initialMessage);
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
          Mit Deinem kostenlosen Quiz-Konto wird Dein Fortschritt automatisch
          online gespeichert. Nach der Proberunde brauchst Du ein bestätigtes
          Konto, um weiterzuspielen.
        </p>
        <AccountBenefits />
        {trialAvailable && (
          <p>
            Deine erste Runde wird nach der Anmeldung und bestätigten
            E-Mail-Adresse automatisch in dieses Konto übernommen.
          </p>
        )}
        {mode === "register" && (
          <p>
            Bestätige Deine E-Mail-Adresse, damit Du Dein Konto aktivieren und
            bei Bedarf Dein Passwort zurücksetzen kannst.
          </p>
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void run(async () => {
              if (trialAvailable && (mode === "login" || mode === "register"))
                await authorizeTrial(email);
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
                  "Wenn die Registrierung möglich ist, erhältst Du eine Bestätigungsmail. Prüfe auch Deinen Spamordner." +
                    (trialAvailable
                      ? " Deine Proberunde bleibt bis 24 Stunden nach ihrem Start in diesem Browser zur Übernahme bereit. Öffne die Bestätigung hier oder melde Dich danach hier an."
                      : ""),
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
              für andere Spieler. Die einzelnen Rekordergebnisse stehen im
              Spielervergleich für angemeldete Spieler. Die Teilnahme gehört zum
              Quiz-Konto. E-Mail und privater Spielstand bleiben verborgen.
            </p>
          )}
          <button className="primary" disabled={busy}>
            {
              {
                login: trialAvailable
                  ? "Anmelden & Runde übernehmen"
                  : "Anmelden",
                register: trialAvailable
                  ? "Konto erstellen & Runde übernehmen"
                  : "Registrieren",
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
        öffentlichen Bestenliste, für andere Spieler. E-Mail und privater
        Spielstand bleiben verborgen.
      </p>
      <details className="account-help">
        <summary>Konto & Speicherung</summary>
        <p className="tiny muted profile-sync-status" role="status">
          {syncMessage || (syncStatus && syncText[syncStatus])}
        </p>
        <OnlineConfirmation at={confirmedAt} />
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
      </details>
    </section>
  );
}
