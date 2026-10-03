import { useEffect, useRef, useState } from "react";
import type { SupabaseClient, User, Session } from "@supabase/supabase-js";
import { App } from "./App";
import { PasswordField } from "./PasswordField";
import { ProfileStats } from "./ProfileStats";
import { AccountGame, syncText } from "./AccountGame";
import type { SyncStatus } from "./accountSync";
import {
  accountConfig,
  accountStorageKey,
  authError,
  createAccountClient,
  createPublicActivityClient,
  parseAccountLink,
  replaceAccountState,
} from "./accounts";
import { read } from "./storage";
import type { State } from "./model";
import { ActivityContext } from "./GuestActivity";
import { requestWithin } from "./request";
import { RecoveryCopies } from "./RecoveryCopiesPanel";
import { OnlineConfirmation } from "./OnlineConfirmation";

type Link = ReturnType<typeof parseAccountLink>;
const recoveryMarker = {
  read: () => {
    try {
      return sessionStorage.getItem("wissensquiz-recovery");
    } catch {
      return null;
    }
  },
  write: (id: string | null) => {
    try {
      if (id) sessionStorage.setItem("wissensquiz-recovery", id);
      else sessionStorage.removeItem("wissensquiz-recovery");
    } catch {
      /* In-memory recovery still works. */
    }
  },
};
// Remove tokens before rendering. No token or password enters quiz data or logs.
let startupLink: Link = null;
let linkError = "";
if (location.hash.startsWith("#auth?")) {
  try {
    startupLink = parseAccountLink(location.hash);
  } catch {
    linkError = "Dieser Link ist ungültig. Bitte fordere eine neue E-Mail an.";
  }
  history.replaceState(null, "", location.pathname + location.search);
}
let setup:
  | Promise<{
      client: SupabaseClient | null;
      publicClient: SupabaseClient | null;
      url: string;
      error: string;
    }>
  | undefined;
function setupAccounts() {
  return (setup ??= (async () => {
    try {
      const response = await fetch("/account-config.json", {
        cache: "no-store",
        signal: AbortSignal.timeout(5000),
      });
      if (!response.ok) throw new Error();
      const config = accountConfig(await response.json());
      return {
        client: config ? createAccountClient(config) : null,
        publicClient: config ? createPublicActivityClient(config) : null,
        url: config?.supabaseUrl ?? "",
        error: "",
      };
    } catch {
      return {
        client: null,
        publicClient: null,
        url: "",
        error:
          "Der Kontodienst ist nicht verfügbar. Dein Gastspielstand bleibt nutzbar.",
      };
    }
  })());
}

export function AccountApp() {
  const [connection, setConnection] = useState<Awaited<
    ReturnType<typeof setupAccounts>
  > | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [pending, setPending] = useState(true);
  const [link, setLink] = useState(startupLink);
  const [recovering, setRecovering] = useState(!!recoveryMarker.read());
  const [message, setMessage] = useState(linkError);
  const identity = useRef<string | null>(null);
  const [configAttempt, setConfigAttempt] = useState(0);
  const retryConfig = () => {
    setup = undefined;
    setPending(true);
    setConfigAttempt((attempt) => attempt + 1);
  };
  useEffect(() => {
    let alive = true,
      sequence = 0;
    let unsubscribe = () => {};
    void setupAccounts().then(async (value) => {
      if (!alive) return;
      setConnection(value);
      if (!value.client) {
        setPending(false);
        return;
      }
      const client = value.client;
      const verify = async (session: Session | null) => {
        const ticket = ++sequence;
        if (!session) {
          recoveryMarker.write(null);
          setRecovering(false);
          identity.current = null;
          setUser(null);
          setPending(false);
          return;
        }
        if (identity.current !== session.user.id) {
          setPending(true);
          setUser(null);
        }
        const { data, error } = await requestWithin(() =>
          client.auth.getUser(),
        ).catch(() => ({
          data: { user: null },
          error: true,
        }));
        if (!alive || ticket !== sequence) return;
        const verified =
          !error && data.user?.email_confirmed_at ? data.user : null;
        identity.current = verified?.id ?? null;
        setUser(verified);
        setPending(false);
        if (recoveryMarker.read() && recoveryMarker.read() !== verified?.id) {
          recoveryMarker.write(null);
          setRecovering(false);
        }
        if (!verified)
          setMessage(
            "Dein Konto konnte nicht bestätigt werden. Bitte melde Dich mit Internetverbindung erneut an.",
          );
      };
      const subscription = client.auth.onAuthStateChange((event, session) => {
        if (event === "INITIAL_SESSION") return;
        if (event === "PASSWORD_RECOVERY") {
          recoveryMarker.write(session?.user.id ?? null);
          setRecovering(true);
        }
        // Do not call another Auth method while Supabase holds its event lock.
        queueMicrotask(() => {
          if (alive) void verify(session);
        });
      });
      unsubscribe = () => subscription.data.subscription.unsubscribe();
      const { data } = await requestWithin(() =>
        client.auth.getSession(),
      ).catch(() => ({
        data: { session: null },
      }));
      if (alive) await verify(data.session);
    });
    return () => {
      alive = false;
      sequence++;
      unsubscribe();
    };
  }, [configAttempt]);
  if (pending || !connection)
    return (
      <main className="loading">
        <h1>Wissensquiz</h1>
        <p role="status">Konto wird geprüft …</p>
      </main>
    );
  if (link || recovering)
    return (
      <LinkPanel
        client={connection.client}
        link={link}
        recovering={recovering}
        message={message}
        onVerified={(type) => {
          setLink(null);
          if (type === "recovery") setRecovering(true);
          else
            setMessage(
              "Deine E-Mail-Adresse ist bestätigt und Dein Quiz-Konto ist aktiviert. Dein Fortschritt wird beim Spielen automatisch online gespeichert.",
            );
        }}
        onDone={() => {
          recoveryMarker.write(null);
          setRecovering(false);
          setLink(null);
          setMessage(
            "Passwort geändert. Bitte melde Dich mit Deinem neuen Passwort an.",
          );
        }}
        onCancel={async () => {
          if (connection.client && recovering)
            await connection.client.auth.signOut({ scope: "local" });
          recoveryMarker.write(null);
          setRecovering(false);
          setLink(null);
        }}
      />
    );
  const key = user ? accountStorageKey(connection.url, user.id) : "current";
  if (user && connection.client)
    return (
      <AccountGame
        key={key}
        client={connection.client}
        publicClient={connection.publicClient}
        owner={user.id}
        storageKey={key}
        panel={(state, onState, syncStatus, syncMessage, confirmedAt) => (
          <AccountPanel
            client={connection.client}
            user={user}
            storageKey={key}
            state={state}
            onState={onState}
            syncStatus={syncStatus}
            syncMessage={syncMessage}
            confirmedAt={confirmedAt}
            initialMessage={connection.error || message}
            serviceUnavailable={!!connection.error}
            onRetryConfig={retryConfig}
          />
        )}
      />
    );
  return (
    <ActivityContext.Provider value={connection.publicClient}>
      <App
        key={key}
        storageKey={key}
        accountPanel={(state, onState) => (
          <AccountPanel
            client={connection.client}
            user={user}
            storageKey={key}
            state={state}
            onState={onState}
            initialMessage={connection.error || message}
            serviceUnavailable={!!connection.error}
            onRetryConfig={retryConfig}
          />
        )}
      />
    </ActivityContext.Provider>
  );
}

function LinkPanel({
  client,
  link,
  recovering,
  message,
  onVerified,
  onDone,
  onCancel,
}: {
  client: SupabaseClient | null;
  link: Link;
  recovering: boolean;
  message: string;
  onVerified: (type: "signup" | "recovery") => void;
  onDone: () => void;
  onCancel: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(message),
    [password, setPassword] = useState(""),
    [repeat, setRepeat] = useState("");
  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError("");
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Kontoaktion fehlgeschlagen.");
    } finally {
      setPassword("");
      setRepeat("");
      setBusy(false);
    }
  };
  return (
    <main className="account-page">
      <h1>
        {recovering
          ? "Neues Passwort setzen"
          : link?.type === "recovery"
            ? "Passwort zurücksetzen"
            : "Dein Quiz-Konto aktivieren"}
      </h1>
      <p role="status">{error}</p>
      {!client ? (
        <p>
          Die Kontoeinrichtung ist noch nicht abgeschlossen. Bitte versuche
          diesen Link später erneut.
        </p>
      ) : recovering ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void run(async () => {
              if (password.length < 12 || password !== repeat)
                throw new Error(
                  "Die Passwörter müssen übereinstimmen und mindestens zwölf Zeichen lang sein.",
                );
              const { error } = await client.auth.updateUser({ password });
              if (error) throw new Error(authError(error));
              const signedOut = await client.auth.signOut({ scope: "global" });
              if (signedOut.error)
                throw new Error(
                  "Passwort geändert. Bitte melde Dich erneut ab.",
                );
              onDone();
            });
          }}
        >
          <PasswordField
            label="Neues Passwort"
            value={password}
            onChange={setPassword}
            newPassword
          />
          <PasswordField
            label="Passwort wiederholen"
            value={repeat}
            onChange={setRepeat}
            newPassword
          />
          <button className="primary" disabled={busy}>
            Passwort speichern
          </button>
        </form>
      ) : (
        <>
          <p>
            {link?.type === "recovery"
              ? "Mit „Weiter zum neuen Passwort“ bestätigst Du Deinen Reset-Link. Anschließend kannst Du ein neues Passwort für Dein Quiz-Konto festlegen."
              : "Dein Quiz-Konto ist vorbereitet. Mit „E-Mail bestätigen und Konto aktivieren“ bestätigst Du Deine E-Mail-Adresse und schließt Deine Registrierung ab."}
          </p>
          {link?.type === "signup" && (
            <p>
              Danach wirst Du mit Deinem Quiz-Konto angemeldet und kannst
              losspielen. Dein Fortschritt wird automatisch online gespeichert.
              Melde Dich auf einem anderen Gerät mit demselben Quiz-Konto an, um
              dort weiterzuspielen. Dein Gastspielstand bleibt getrennt
              erhalten.
            </p>
          )}
          <button
            className="primary"
            disabled={busy || !link}
            onClick={() =>
              void run(async () => {
                const { error } = await client.auth.verifyOtp(link!);
                if (error) throw new Error(authError(error));
                onVerified(link!.type);
              })
            }
          >
            {link?.type === "recovery"
              ? "Weiter zum neuen Passwort"
              : "E-Mail bestätigen und Konto aktivieren"}
          </button>
        </>
      )}
      <p>
        {recovering || link?.type === "recovery"
          ? "Beim Abbrechen bleibt Dein bisheriges Passwort unverändert."
          : "Wenn Du die Bestätigung überspringst, bleibt Dein Konto unbestätigt. Du kannst weiterhin als Gast spielen und den Link aus Deiner E-Mail später erneut öffnen."}
      </p>
      <button
        className="text-button"
        disabled={busy}
        onClick={() => void onCancel()}
      >
        {recovering || link?.type === "recovery"
          ? "Abbrechen und zum Quiz"
          : "Ohne Bestätigung zum Quiz"}
      </button>
    </main>
  );
}

function AccountPanel({
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
