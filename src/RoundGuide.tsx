import type { Mode } from "./model";

const introductions: Record<Mode, string> = {
  entdecken:
    "Die Filmreise wählt bevorzugt neue Fragen aus Deinen freigeschalteten Stufen. Mit sicheren richtigen Antworten schaltest Du je Genre schwierigere Fragen und weniger bekannte Filme frei.",
  ueben:
    "Du kombinierst Filmfragen, Schauspieler und Preisträger zu einem gemeinsamen Pool. Daraus bekommst Du zufällige Fragen ohne Zeitdruck – auch bereits beantwortete können dabei sein.",
  rekord:
    "Du kombinierst Fragenbereiche und Schwierigkeitsstufen. Genres und Filmgruppen begrenzen nur Filmfragen. Pro Frage hast Du 30 Sekunden; richtige und schnelle Antworten bringen Punkte für Deinen Rekord.",
  fehler:
    "Hier wiederholst Du gezielt falsch beantwortete Fragen und Zeitabläufe – ohne Zeitdruck. Sobald Du ein Wissensziel sicher richtig beantwortest, fällt es aus dem Fehlertraining heraus.",
};

export function RoundGuide({ mode }: { mode: Mode }) {
  return (
    <div className="round-guide">
      <details key={mode}>
        <summary>Mehr zu Auswahl und Ablauf</summary>
        <div className="round-guide-details">
          <p>{introductions[mode]}</p>
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
          ) : mode === "fehler" ? (
            <p>
              <strong>Offene Fehler zuerst:</strong> Häufige Fehler haben
              Vorrang, bei Gleichstand die zuletzt falsch beantworteten Fragen.
              Deine Genre-, Stufen- und Filmgruppenfilter gelten weiterhin. Du
              musst nicht auf den Wiederholungstermin warten. Ein geratener
              Treffer löst einen früheren Fehler noch nicht; allein geratene
              Fragen kommen aber nicht in das Fehlertraining. Jedes Wissensziel
              kommt pro Runde höchstens einmal vor.
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
            <strong>Gemeinsamer Fortschritt:</strong> Richtige Antworten auf
            Filmfragen zählen in allen Modi für Deine Filmreise, sobald Du die
            Runde abschließt. Als geraten markierte Treffer zählen dafür nicht.
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
