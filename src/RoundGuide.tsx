import type { Mode } from "./model";

const introductions: Record<Mode, string> = {
  entdecken:
    "Die Filmreise wählt bevorzugt neue Fragen aus Deinen freigeschalteten Stufen. Mit sicheren richtigen Antworten schaltest Du je Genre schwierigere Fragen und weniger bekannte Filme frei.",
  ueben:
    "Du wählst Genres, Schwierigkeit und Bekanntheit der Filme frei aus. Daraus bekommst Du zufällige Fragen ohne Zeitdruck – auch bereits beantwortete können dabei sein.",
  rekord:
    "Du wählst Genres, Schwierigkeit und Bekanntheit der Filme frei aus. Pro Frage hast Du 30 Sekunden; richtige und schnelle Antworten bringen Punkte für Deinen Rekord.",
};

export function RoundGuide({ mode }: { mode: Mode }) {
  return (
    <div className="round-guide">
      <p>{introductions[mode]}</p>
      <details key={mode}>
        <summary>Mehr zu Auswahl und Ablauf</summary>
        <div className="round-guide-details">
          <p>
            <strong>Deine Auswahl:</strong> Die Zeile unter Losspielen zeigt die
            gewählten Filter und die Anzahl der Fragen in Deiner nächsten Runde.
            Die erste Runde umfasst bis zu fünf Fragen, danach sind es bis zu
            zehn. Bei einer kleinen Auswahl können es weniger sein.
          </p>
          {mode === "entdecken" ? (
            <p>
              <strong>Schritt für Schritt:</strong> Du beginnst je Genre mit
              leichten Fragen zu den bekanntesten verfügbaren Filmen. Deine
              Stufenfortschritte unten zeigen, was als Nächstes freigeschaltet
              wird. Bekannte Inhalte kommen zum Wiederholen wieder vor; neue
              Fragen und neu freigeschaltete Stufen haben Vorrang.
            </p>
          ) : (
            <p>
              <strong>Zufällige Fragen:</strong> Dein bisheriger Lernstand
              beeinflusst die Auswahl nicht. Die vier Filmgruppen reichen von
              Film-Ikonen bis zu selten bekannten Entdeckungen; sie beschreiben
              die Bekanntheit der Filme, nicht die Schwierigkeit der Fragen.
              {mode === "rekord" &&
                " Die Runde mischt die gewählten Schwierigkeiten und Filmgruppen möglichst gleichmäßig."}
            </p>
          )}
          <p>
            <strong>Gemeinsamer Fortschritt:</strong> Richtige Antworten zählen
            in allen drei Modi für Deine Filmreise, sobald Du die Runde
            abschließt. Als geraten markierte Treffer zählen dafür nicht.
            Mehrere Fragen zum selben Filmdetail teilen sich ein Wissensziel:
            Für eine Freischaltung zählt es nur einmal, und pro Runde kommt
            höchstens eine dieser Fragen vor.
          </p>
          {mode === "rekord" && (
            <p>
              <strong>Die Uhr läuft beim Tabwechsel weiter.</strong> Neuladen
              beendet die Rekordrunde. Nach jeder Antwort kannst Du die
              Erklärung ohne Zeitdruck lesen.
            </p>
          )}
        </div>
      </details>
      <p className="round-spoiler">
        Fragen und Erklärungen können Filmhandlungen verraten.
      </p>
    </div>
  );
}
