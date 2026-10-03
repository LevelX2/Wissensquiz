import { useState } from "react";
import { download } from "./storage";
import {
  listRecoveryCopies,
  readRecoveryCopy,
  type RecoveryCopyInfo,
} from "./recoveryCopies";

export function RecoveryCopies({ storageKey }: { storageKey: string }) {
  const [copies, setCopies] = useState<RecoveryCopyInfo[] | null>(null);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const run = async (task: () => Promise<void>) => {
    setBusy(true);
    setError("");
    try {
      await task();
    } catch {
      setError(
        "Die Rückfallkopien konnten nicht gelesen oder exportiert werden. Bitte versuche es erneut.",
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <details className="recovery-copies">
      <summary>Lokale Rückfallkopien</summary>
      <p>
        Vor der Übernahme eines anderen Spielstands bleibt Dein bisheriger
        Kontostand auf diesem Gerät als Kopie erhalten. Du kannst ihn als JSON
        exportieren und bei Bedarf unter Optionen wiederherstellen. Die Kopien
        bleiben auf diesem Gerät erhalten und werden nicht automatisch gelöscht.
      </p>
      <button
        className="secondary"
        disabled={busy}
        onClick={() =>
          void run(async () => setCopies(await listRecoveryCopies(storageKey)))
        }
      >
        Kopien anzeigen / aktualisieren
      </button>
      {error && <p role="alert">{error}</p>}
      {copies?.length === 0 && (
        <p role="status">
          Für dieses Konto gibt es auf diesem Gerät noch keine Rückfallkopie.
        </p>
      )}
      {!!copies?.length && (
        <>
          <p>
            {copies.length} {copies.length === 1 ? "Kopie" : "Kopien"} ·{" "}
            {new Intl.NumberFormat("de-DE", {
              maximumFractionDigits: 1,
            }).format(copies.reduce((n, c) => n + c.bytes, 0) / 1024 ** 2)}{" "}
            MiB JSON-Nutzdaten. Der Browser kann dafür zusätzlichen Speicher
            benötigen.
          </p>
          <ul>
            {copies.map((copy, i) => (
              <li key={copy.key}>
                <span>
                  {copy.createdAt !== null
                    ? new Date(copy.createdAt).toLocaleString("de-DE")
                    : `Ältere Kopie ${i + 1} · Datum unbekannt`}
                </span>{" "}
                <small>
                  (
                  {new Intl.NumberFormat("de-DE", {
                    maximumFractionDigits: 1,
                  }).format(copy.bytes / 1024 ** 2)}{" "}
                  MiB)
                </small>{" "}
                <button
                  className="text-button"
                  disabled={busy}
                  aria-label={`Rückfallkopie ${i + 1} als JSON exportieren`}
                  onClick={() =>
                    void run(async () => {
                      const state = await readRecoveryCopy(
                        storageKey,
                        copy.key,
                      );
                      download(
                        `wissensquiz-rueckfallkopie-${copy.createdAt ?? "alt"}-${i + 1}.json`,
                        state,
                      );
                    })
                  }
                >
                  Als JSON exportieren
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </details>
  );
}
