import { useOffline } from "./offline";

export function UpdateNotice({
  always = false,
  disabledReason,
}: {
  always?: boolean;
  disabledReason?: string;
}) {
  const offline = useOffline();
  if (!offline.supported || (!offline.waiting && !always)) return null;
  return (
    <section className="notice" aria-label="Quiz-Update">
      <p>
        {offline.waiting
          ? "Eine neue Quiz-Version ist bereit. Dein gespeicherter Fortschritt bleibt beim Aktualisieren erhalten."
          : "Prüfe, ob eine neue Quiz-Version bereitsteht."}
      </p>
      <button
        className="secondary"
        disabled={
          offline.checking ||
          offline.updating ||
          (!!offline.waiting && !!disabledReason)
        }
        onClick={() =>
          void (offline.waiting
            ? offline.activateUpdate()
            : offline.checkForUpdate())
        }
      >
        {offline.updating
          ? "Quiz wird aktualisiert …"
          : offline.checking
            ? "Update wird geprüft …"
            : offline.waiting
              ? "Quiz aktualisieren"
              : "Nach Update suchen"}
      </button>
      {offline.waiting && disabledReason && <p>{disabledReason}</p>}
      {offline.updateMessage && <p role="status">{offline.updateMessage}</p>}
    </section>
  );
}
