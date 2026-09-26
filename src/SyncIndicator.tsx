import { useState } from "react";
import type { SyncStatus } from "./accountSync";

export type SyncDisplay = {
  status: SyncStatus;
  text: string;
  retry: () => void;
};
export function SyncSymbol({ status }: { status: SyncStatus }) {
  return (
    <span className={`sync-symbol ${status}`} aria-hidden="true">
      {status === "saved" ? "✓" : status === "offline" ? "!" : "↑"}
    </span>
  );
}

export function SyncIndicator({ sync }: { sync: SyncDisplay }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="sync-indicator"
      onKeyDown={(event) => {
        if (event.key === "Escape") setOpen(false);
      }}
    >
      <button
        className="sync-toggle"
        type="button"
        aria-label={`Online-Speicherung: ${sync.text}`}
        aria-expanded={open}
        title={sync.text}
        onClick={() => setOpen(!open)}
      >
        <SyncSymbol status={sync.status} />
      </button>
      {open && (
        <div className="sync-popover">
          <p role="status">{sync.text}</p>
          {sync.status === "offline" && (
            <button type="button" onClick={sync.retry}>
              Erneut versuchen
            </button>
          )}
          <button
            type="button"
            className="text-button"
            onClick={() => setOpen(false)}
          >
            Schließen
          </button>
        </div>
      )}
    </div>
  );
}
