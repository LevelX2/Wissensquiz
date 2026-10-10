import type { Mode } from "./model";
import { modeNames } from "./recordModes";

const recordSelection =
  "Du wählst die Königsklasse mit allen offiziellen Fragenbereichen oder genau ein Filmgenre. Der feste Mix enthält je Zehnerblock drei leichte, vier mittlere und drei schwere Fragen. Richtige und schnelle Antworten bringen Rekordpunkte; jede Auswahl hat ihre eigene Rangliste.";
const timedFlow =
  "Die Lösungsanzeige stellst Du unter Profil → Optionen ein. Erklärungen liest Du ohne Zeitdruck. Beim Tabwechsel läuft die Frageuhr weiter; Neuladen beendet den Lauf.";

const guides: Record<
  Mode | "duel",
  { introduction: string; selection: string; flow: string }
> = {
  entdecken: {
    introduction:
      "Du entdeckst Filmwissen ohne Zeitdruck und schaltest Schritt für Schritt neue Stufen frei. Filmgenres, Schauspieler und Preisträger haben jeweils ihren eigenen Fortschritt.",
    selection:
      "Du kombinierst Fragenbereiche und Filmgenres aus Deinen freigeschalteten Stufen. Wähle nur fällige Wiederholungen oder „Gemischt“: möglichst zur Hälfte fällige Wiederholungen und neue Ziele. Freie Plätze werden aus Deiner Auswahl ergänzt.",
    flow: "Die erste Runde umfasst bis zu fünf Fragen, danach bis zu zehn. Nach jeder Antwort siehst Du Lösung und Erklärung. Sichere Treffer bringen Dich beim Rundenabschluss weiter; geratene Treffer zählen dafür nicht. Pro Runde kommt jedes Wissensziel höchstens einmal vor. Deine Stufenfortschritte zeigen die nächste Freischaltung.",
  },
  ueben: {
    introduction:
      "Du spielst zufällige Fragen ohne Zeitdruck. Dein Lernstand bestimmt die Auswahl nicht; bereits beantwortete Fragen können wieder vorkommen.",
    selection:
      "Du kombinierst Filmfragen, Schauspieler und Preisträger und wählst die Schwierigkeit frei. Genres, Classics, Arthouse und Filmgruppen filtern nur Filmfragen. Filmgruppen beschreiben die Bekanntheit der Filme, nicht die Schwierigkeit der Fragen.",
    flow: "Die erste Runde umfasst bis zu fünf Fragen, danach bis zu zehn. Bei kleiner Auswahl sind es weniger. Die Lösungsanzeige stellst Du unter Profil → Optionen ein. Sichere Treffer zählen beim Rundenabschluss für Deinen Lernfortschritt; geratene Treffer zählen dafür nicht.",
  },
  fehler: {
    introduction:
      "Du wiederholst falsch beantwortete Fragen und Zeitabläufe ohne Zeitdruck. Ein sicherer Treffer entfernt das Wissensziel aus Deinen offenen Fehlern; ein geratener Treffer reicht dafür nicht.",
    selection:
      "Deine Fragenbereiche, Genres, Schwierigkeitsstufen und Filmgruppen grenzen die offenen Fehler ein. Häufige Fehler kommen zuerst, bei Gleichstand die zuletzt falsch beantworteten. Du kannst sofort üben und musst nicht auf den Wiederholungstermin warten.",
    flow: "Die erste Runde umfasst bis zu fünf Fragen, danach bis zu zehn – bei weniger offenen Fehlern entsprechend weniger. Jedes Wissensziel kommt höchstens einmal pro Runde vor. Nach jeder Antwort siehst Du Lösung und Erklärung. Allein geratene Fragen kommen nicht ins Fehlertraining.",
  },
  rekord: {
    introduction:
      "Du beantwortest zehn Fragen mit jeweils 30 Sekunden Zeit. Fehler, „Keine Ahnung“ und Zeitabläufe bringen keine Punkte; die Runde geht bis zur zehnten Frage weiter.",
    selection: recordSelection,
    flow: timedFlow,
  },
  fehlerfrei: {
    introduction:
      "Wie lange hält Deine Serie? Du hast 30 Sekunden pro Frage. Der erste Fehler, „Keine Ahnung“ oder Zeitablauf beendet Deinen Lauf.",
    selection: recordSelection,
    flow:
      "Es gibt keine feste Fragenzahl. Ist der Fragenpool ausgeschöpft, werden die Wissensziele neu gemischt. " +
      timedFlow,
  },
  zeitkonto: {
    introduction:
      "Du startest mit 120 Sekunden Zeitkonto. Deine Antwortzeit verbraucht Vorrat. Richtige Antworten geben 15 Sekunden zurück, Fehler und „Keine Ahnung“ kosten 45 Sekunden. Das Konto fasst höchstens 120 Sekunden; je Frage bleiben höchstens 30 Sekunden oder der kleinere Restvorrat.",
    selection: recordSelection,
    flow:
      "Der Lauf endet, sobald Dein Zeitkonto leer ist. Nach Ausschöpfen des Fragenpools werden die Wissensziele neu gemischt. " +
      timedFlow,
  },
  duel: {
    introduction:
      "Du spielst gegen einen Mitspieler: drei Runden mit je zehn Fragen und 30 Sekunden pro Frage. Ihr bekommt dieselben Fragen und spielt abwechselnd, ohne gleichzeitig online sein zu müssen.",
    selection:
      "Mit Losspielen öffnest Du die Duellübersicht. Dort findest Du offene Duelle und kannst einen zufälligen Gegner suchen oder jemanden per Link einladen.",
    flow: "Jeder Treffer zählt einen Punkt, ohne Zeitbonus. Nach Deiner Zehnerrunde siehst Du Lösungen und Erklärungen. Gegnerergebnisse erscheinen, sobald beide die Runde beendet haben. Die Gesamtzahl richtiger Antworten entscheidet; bei Gleichstand ist es ein Unentschieden. Eine gestartete Frage läuft auch bei Unterbrechung weiter.",
  },
};

export function RoundGuide({ mode }: { mode: Mode | "duel" }) {
  const guide = guides[mode];
  return (
    <div className="round-guide">
      <details key={mode}>
        <summary>
          So funktioniert {mode === "duel" ? "Duell" : modeNames[mode]}
        </summary>
        <div className="round-guide-details">
          <p>{guide.introduction}</p>
          <p>
            <strong>Deine Auswahl:</strong> {guide.selection}
          </p>
          <p>
            <strong>Ablauf:</strong> {guide.flow}
          </p>
        </div>
      </details>
      <p className="round-spoiler">
        Fragen und Erklärungen können Filmhandlungen verraten.
      </p>
    </div>
  );
}
