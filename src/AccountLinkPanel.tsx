import { useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { PasswordField } from "./PasswordField";
import { authError } from "./accounts";

import type { parseAccountLink } from "./accounts";
type Link = ReturnType<typeof parseAccountLink>;

export function LinkPanel({
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
              dort weiterzuspielen.
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
          : "Wenn Du die Bestätigung überspringst, bleibt Dein Konto unbestätigt. Zum Spielen brauchst Du ein bestätigtes Konto. Den Link aus Deiner E-Mail kannst Du später erneut öffnen."}
      </p>
      <button
        className="text-button"
        disabled={busy}
        onClick={() => void onCancel()}
      >
        {recovering || link?.type === "recovery"
          ? "Abbrechen und zur Anmeldung"
          : "Zur Anmeldung"}
      </button>
    </main>
  );
}
