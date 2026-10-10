export const rankedMessages: Record<string, string> = {
  ranked_active:
    "Für Dein Konto läuft bereits eine Zeitrunde. Beende sie zuerst auf dem anderen Gerät oder hier ausdrücklich.",
  ranked_other_device: "Diese Zeitrunde gehört zu einer anderen Spielsitzung.",
  ranked_unavailable:
    "Diese Zeitrunde wurde bereits beendet. Lade den Online-Spielstand erneut.",
  ranked_wrong_question:
    "Diese Frage ist bereits beantwortet oder nicht mehr aktuell.",
  ranked_not_expired:
    "Die Fragezeit ist noch nicht abgelaufen. Versuche es erneut.",
  ranked_catalog_missing:
    "Die gewerteten Zeitrunden sind für diesen Fragenbestand noch nicht freigeschaltet.",
  ranked_rate_limit:
    "Zu viele Anfragen in kurzer Zeit. Warte einen Moment und versuche es erneut.",
  ranked_run_limit:
    "Dieser Lauf hat die maximale Fragenzahl erreicht. Bitte beende ihn.",
  ranked_request_reused:
    "Diese Anfrage wurde mit anderem Inhalt bereits verwendet.",
  invalid_ranked_request: "Die Anfrage für die Zeitrunde ist ungültig.",
  invalid_ranked_answer: "Die gewählte Antwort gehört nicht zu dieser Frage.",
};
export class RankedRunError extends Error {
  constructor(public code: string) {
    super(rankedMessages[code] ?? "Die Zeitrunde wurde vom Server abgewiesen.");
  }
}
