export const hotSeatMessages: Record<string, string> = {
  hot_seat_setup: "Prüfe die Regeln und die Inhaltsauswahl Deiner Partie.",
  hot_seat_players:
    "Trage zwei bis acht Personen mit eindeutigen Spielplatznamen ein. In Teams sind insgesamt höchstens acht Personen möglich.",
  hot_seat_pool:
    "Für dieses Thema fehlen unbenutzte Fragen der benötigten Schwierigkeit. Wähle ein anderes Thema oder eine breitere Inhaltsauswahl.",
  hot_seat_capacity:
    "Für diese Partielänge sind zu wenige unterschiedliche Wissensziele verfügbar. Wähle mehr Themen oder eine kürzere Partie.",
  hot_seat_active:
    "Eine Hot-Seat-Partie wartet bereits. Setze sie fort oder brich sie ab, bevor Du eine neue startest.",
  hot_seat_missing:
    "Diese Partie ist nicht mehr verfügbar. Lade die Übersicht erneut.",
  hot_seat_conflict:
    "Die Partie wurde in einem anderen Fenster verändert. Lade den bestätigten Stand erneut.",
  hot_seat_phase:
    "Dieser Zug ist bereits weitergelaufen. Lade den bestätigten Stand erneut.",
  hot_seat_closed:
    "Diese Partie ist bereits beendet. Lade den bestätigten Stand erneut.",
  hot_seat_joker: "Dieser Joker ist für den aktuellen Zug nicht verfügbar.",
  hot_seat_answer: "Diese Antwort gehört nicht zur aktuellen Frage.",
  hot_seat_request:
    "Die Anfrage passt nicht zur Partie. Lade den bestätigten Stand erneut.",
  hot_seat_templates:
    "Du kannst bis zu 20 eigene Vorlagen speichern. Entferne zuerst eine nicht mehr benötigte Vorlage.",
};
export class HotSeatError extends Error {
  constructor(
    readonly code: string,
    detail = "",
  ) {
    const pool = detail.match(/hot_seat_pool:(.*):(leicht|mittel|schwer)/);
    const theme =
      pool?.[1] === "mix"
        ? "Bunter Mix"
        : pool?.[1] === "actors"
          ? "Schauspieler"
          : pool?.[1] === "awards"
            ? "Preise"
            : pool?.[1].replace(/^genre:/, "");
    super(
      pool
        ? `Für „${theme}“ fehlen Fragen der Stufe ${pool[2]}. Wähle mehr Inhalte, andere Themen oder eine kürzere Partie.`
        : (hotSeatMessages[code] ??
            "Die Partie konnte nicht bestätigt werden."),
    );
  }
}
