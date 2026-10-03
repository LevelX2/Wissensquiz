import { useEffect, useRef, useState } from "react";
import type { SupabaseClient, User, Session } from "@supabase/supabase-js";
import { App } from "./App";
import { AccountGame } from "./AccountGame";
import {
  accountConfig,
  accountStorageKey,
  createAccountClient,
  createPublicActivityClient,
  parseAccountLink,
} from "./accounts";
import { ActivityContext } from "./GuestActivity";
import { requestWithin } from "./request";

import { AccountPanel } from "./AccountPanel";
import { LinkPanel } from "./AccountLinkPanel";

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
