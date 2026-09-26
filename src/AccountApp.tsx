import { useEffect, useRef, useState } from "react";
import type { SupabaseClient, User, Session } from "@supabase/supabase-js";
import { App } from "./App";
import {
  accountConfig,
  accountStorageKey,
  authError,
  cloudRead,
  cloudRevision,
  cloudSave,
  createAccountClient,
  parseAccountLink,
  rememberRevision,
  replaceAccountState,
} from "./accounts";
import { download, read } from "./storage";
import type { State } from "./model";

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
  | Promise<{ client: SupabaseClient | null; url: string; error: string }>
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
        url: config?.supabaseUrl ?? "",
        error: "",
      };
    } catch {
      return {
        client: null,
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
        const { data, error } = await client.auth.getUser();
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
      const { data } = await client.auth.getSession();
      if (alive) await verify(data.session);
    });
    return () => {
      alive = false;
      sequence++;
      unsubscribe();
    };
  }, []);
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
          else setMessage("E-Mail bestätigt. Dein Konto ist bereit.");
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
  return (
    <App
      key={key}
      storageKey={key}
      accountName={
        user ? String(user.user_metadata.display_name ?? "Spieler") : undefined
      }
      accountPanel={(state, onState) => (
        <AccountPanel
          client={connection.client}
          user={user}
          storageKey={key}
          state={state}
          onState={onState}
          initialMessage={connection.error || message}
        />
      )}
    />
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
      <h1>{recovering ? "Neues Passwort setzen" : "E-Mail-Link bestätigen"}</h1>
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
          <label>
            Neues Passwort
            <input
              type="password"
              autoComplete="new-password"
              minLength={12}
              maxLength={128}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          <label>
            Passwort wiederholen
            <input
              type="password"
              autoComplete="new-password"
              minLength={12}
              maxLength={128}
              required
              value={repeat}
              onChange={(e) => setRepeat(e.target.value)}
            />
          </label>
          <button className="primary" disabled={busy}>
            Passwort speichern
          </button>
        </form>
      ) : (
        <>
          <p>
            {link?.type === "recovery"
              ? "Bestätige den Link, um ein neues Passwort zu vergeben."
              : "Bestätige Deine E-Mail-Adresse, um Dein Konto zu aktivieren."}
          </p>
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
            Link bestätigen
          </button>
        </>
      )}
      <button
        className="text-button"
        disabled={busy}
        onClick={() => void onCancel()}
      >
        Zurück zum Quiz
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
}: {
  client: SupabaseClient | null;
  user: User | null;
  storageKey: string;
  state: State;
  onState: (state: State) => void;
  initialMessage: string;
}) {
  const [mode, setMode] = useState<"login" | "register" | "forgot" | "resend">(
    "login",
  );
  const [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [name, setName] = useState("");
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState(initialMessage);
  const [remote, setRemote] =
    useState<Awaited<ReturnType<typeof cloudRead>>>(null);
  const [accept, setAccept] = useState(false),
    [guestAccept, setGuestAccept] = useState(false);
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
        <h1>Dein Konto</h1>
        <p>
          Die eigene Anmeldung wird vorbereitet. Bestätigungs- und Reset-Mails
          sind noch nicht eingerichtet.
        </p>
        <p>
          Du kannst weiterhin als Gast spielen. Dein bisheriger Spielstand
          bleibt auf diesem Gerät erhalten.
        </p>
        {message && <p role="status">{message}</p>}
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
          Mit Deinem Quiz-Konto kannst Du Deinen Spielstand online sichern und
          auf einem anderen Gerät laden. Dein Gastspielstand bleibt getrennt
          erhalten.
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
            <label>
              Passwort
              <input
                type="password"
                autoComplete={
                  mode === "register" ? "new-password" : "current-password"
                }
                required
                minLength={mode === "register" ? 12 : 1}
                maxLength={128}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
          )}
          {mode === "register" && (
            <p className="tiny muted">
              Mindestens zwölf Zeichen. Dein Spielername darf ein Pseudonym
              sein. E-Mail und Passwort werden beim Kontodienst verwaltet.
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
      <h1>Dein Konto</h1>
      <p>
        Angemeldet als{" "}
        <strong>{String(user.user_metadata.display_name ?? "Spieler")}</strong>{" "}
        · {user.email}
      </p>
      <p>
        Deine E-Mail-Adresse ist bestätigt. Der Spielstand dieses Kontos ist vom
        Gastspielstand getrennt.
      </p>
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
      <h2>Spielstand auf anderen Geräten</h2>
      <p>
        Speichere Deinen Kontospielstand online und lade ihn auf einem anderen
        Gerät. Es gibt noch keine automatische Zusammenführung. Gleichzeitige
        Änderungen überschreiben sich nicht unbemerkt.
      </p>
      <div className="account-actions">
        <button
          className="primary"
          disabled={busy}
          onClick={() =>
            void run(async () => {
              const current = await read(storageKey);
              if (!current) throw new Error("Kein Spielstand vorhanden.");
              const revision = await cloudSave(
                client,
                current,
                await cloudRevision(storageKey),
                user.id,
              );
              await rememberRevision(storageKey, revision);
              setMessage("Kontospielstand online gespeichert.");
            })
          }
        >
          Online sichern
        </button>
        <button
          className="secondary"
          disabled={busy}
          onClick={() =>
            void run(async () => {
              const save = await cloudRead(client, user.id);
              setRemote(save);
              setAccept(false);
              if (!save) setMessage("Noch kein Online-Spielstand vorhanden.");
            })
          }
        >
          Online-Spielstand prüfen
        </button>
        <button
          className="secondary"
          disabled={busy}
          onClick={() => download("wissensquiz-konto.json", state)}
        >
          Lokale JSON-Sicherung
        </button>
      </div>
      {remote && (
        <div className="notice">
          <p>
            Online gespeichert am{" "}
            {new Date(remote.updated_at).toLocaleString("de-DE")}:{" "}
            {remote.state.rounds.filter((r) => r.status === "completed").length}{" "}
            abgeschlossene Runden.
          </p>
          <label className="filter-choice">
            <input
              type="checkbox"
              checked={accept}
              onChange={(e) => setAccept(e.target.checked)}
            />
            Meinen lokalen Kontospielstand durch diesen Online-Stand ersetzen
          </label>
          <button
            className="secondary"
            disabled={busy || !accept}
            onClick={() =>
              void run(async () => {
                const restored = await replaceAccountState(
                  storageKey,
                  remote.state,
                );
                await rememberRevision(storageKey, remote.revision);
                onState(restored);
                setRemote(null);
                setMessage("Online-Spielstand übernommen.");
              })
            }
          >
            Online-Spielstand übernehmen
          </button>
        </div>
      )}
      <h2>Bisherigen Gastspielstand übernehmen</h2>
      <p>
        Dein bisheriger Gastspielstand wird dabei kopiert und bleibt als Gast
        erhalten. Sichere den Kontospielstand vorher als JSON.
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
              "Gastspielstand kopiert. Zum Übertragen auf andere Geräte jetzt online sichern.",
            );
          })
        }
      >
        Gastspielstand kopieren
      </button>
      <p className="tiny muted">
        Online-Stände sind privat. Die gemeinsame Bestenliste ist noch nicht
        aktiviert; lokale Rekorde bleiben Trainingsrekorde.
      </p>
    </section>
  );
}
