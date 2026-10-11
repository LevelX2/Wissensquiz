export const learningMessages: Record<string, string> = {
  game_active:
    "Es läuft bereits eine Lernrunde. Lade Deinen aktuellen Spielstand und setze sie fort.",
  game_empty: "Für diese Auswahl sind keine Fragen verfügbar.",
  game_closed:
    "Diese Runde wurde bereits beendet. Lade Deinen aktuellen Spielstand.",
  game_question_changed:
    "Diese Frage wurde bereits in einem anderen Fenster beantwortet. Lade die Runde erneut.",
  game_incomplete: "Beantworte zuerst alle Fragen dieser Runde.",
  game_receipt_mismatch:
    "Die Anfrage stimmt nicht mit der bestätigten Anfrage überein.",
};
export class LearningRunError extends Error {
  constructor(readonly code: string) {
    super(learningMessages[code]);
  }
}
