import type { SyncStatus } from "./syncTypes";
export const syncText: Record<SyncStatus, string> = {
  loading: "Dein Online-Spielstand wird geladen …",
  saved: "Spielstand online gespeichert",
  saving: "Spielstand wird online gespeichert …",
  offline:
    "Die Online-Speicherung ist noch nicht bestätigt. Versuche es erneut. Die Änderung wird erst nach der Serverbestätigung übernommen.",
  conflict:
    "Dein Online-Spielstand wurde in einem anderen Fenster oder auf einem anderen Gerät geändert. Lade den aktuellen Online-Stand erneut.",
};
