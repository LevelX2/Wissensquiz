import type { Mode } from "./model";
import { isRecordMode, isEndlessMode } from "./recordModes";

const introductions: Record<Mode, string> = {
  entdecken:
    "Die Filmreise mischt Deine gewählten Fragenbereiche und bevorzugt neue Fragen aus den freigeschalteten Stufen. Filmgenres, Schauspieler und Preisträger haben jeweils ihren eigenen Fortschritt.",
  ueben:
    "Du kombinierst Filmfragen, Schauspieler und Preisträger zu einem gemeinsamen Pool. Daraus bekommst Du zufällige Fragen ohne Zeitdruck – auch bereits beantwortete können dabei sein.",
  rekord:
    "Du spielst zehn Fragen in der Königsklasse oder aus genau einem Genre. Der Schwierigkeitsmix ist fest. Pro Frage hast Du 30 Sekunden; richtige und schnelle Antworten bringen Punkte für Deinen Rekord.",
  fehlerfrei:
    "Pro Frage hast Du 30 Sekunden. Richtige Antworten verlängern die Serie; der erste Fehler, Keine Ahnung oder Zeitablauf beendet Deinen Lauf.",
  zeitkonto:
    "Du startest mit 120 Sekunden. Richtige Antworten geben 15 Sekunden, Fehler kosten 45 Sekunden. Deine Antwortzeit verbraucht zusätzlich Vorrat; je Frage hast Du höchstens 30 Sekunden.",
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
            {isEndlessMode(mode)
              ? "Der Lauf hat keine feste Fragenzahl; nach Ausschöpfen des Pools werden die Ziele neu gemischt."
              : isRecordMode(mode)
                ? "Die Rekordrunde umfasst zehn Fragen. Die Königsklasse und jedes einzelne Genre haben getrennte Kategorien."
                : "Die erste Runde umfasst bis zu fünf Fragen, danach sind es bis zu zehn. Bei einer kleinen Auswahl können es weniger sein."}
          </p>
          {mode === "entdecken" ? (
            <p>
              <strong>Schritt für Schritt:</strong> Du beginnst je Genre mit
              leichten Fragen zu den bekanntesten verfügbaren Filmen. Bei
              Schauspielern und Preisträgern beginnst Du mit Leicht; je 20
              sichere Ziele öffnen Mittel, Schwer und Experte. Deine
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
                " Der feste Mix enthält drei leichte, vier mittlere und drei schwere Fragen je Zehnerblock. Weitere Themen-, Stufen- oder Filmgruppenfilter sind für Rekorde nicht möglich."}
            </p>
          )}
          <p>
            <strong>Gemeinsamer Fortschritt:</strong> Richtige Antworten auf
            Fragen zählen in allen Modi für den jeweiligen Bereich der
            Filmreise, sobald Du die Runde abschließt. Als geraten markierte
            Treffer zählen dafür nicht. Mehrere Fragen zum selben Zusammenhang
            teilen sich ein Wissensziel: Für eine Freischaltung zählt es nur
            einmal, und pro Runde kommt höchstens eine dieser Fragen vor. In
            Endlosläufen gilt das je vollständigem Pooldurchgang.
          </p>
          {isRecordMode(mode) && (
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
