import type { Mode } from "./model";
import { modeNames } from "./recordModes";

export type PlayGroup = "learn" | "timed" | "duel";
const descriptions: Record<Mode, string> = {
  entdecken: "Filmwelten und Stufen freischalten",
  ueben: "Alle Stufen frei kombinieren",
  fehler: "Offene Fehler gezielt wiederholen",
  rekord: "30 Sekunden je Frage · zehn Fragen",
  fehlerfrei: "30 Sekunden je Frage · erster Fehler beendet den Lauf",
  zeitkonto: "120 Sekunden Start · richtig +15 · falsch −45",
};
export function ModePicker({
  mode,
  group,
  busy,
  onGroup,
  onMode,
}: {
  mode: Mode;
  group: PlayGroup;
  busy: boolean;
  onGroup: (group: PlayGroup) => void;
  onMode: (mode: Mode) => void;
}) {
  const variants: Mode[] =
    group === "learn"
      ? ["entdecken", "ueben", "fehler"]
      : group === "timed"
        ? ["rekord", "fehlerfrei", "zeitkonto"]
        : [];
  return (
    <>
      <div
        className="mode-grid mode-groups"
        role="group"
        aria-label="Spielgruppen"
      >
        {(["learn", "timed", "duel"] as const).map((item) => (
          <button
            key={item}
            className={`mode-card ${group === item ? "active" : ""}`}
            aria-pressed={group === item}
            disabled={busy}
            onClick={() => onGroup(item)}
          >
            {item === "duel" ? (
              <span className="mode-swords" aria-hidden="true">
                ⚔
              </span>
            ) : (
              <img
                className="mode-artwork"
                src={`/modes/${item === "learn" ? "entdecken" : "rekord"}.png`}
                alt=""
                width={88}
                height={88}
              />
            )}
            <strong>
              {item === "learn"
                ? "Lernen"
                : item === "timed"
                  ? "Auf Zeit"
                  : "Duell"}
            </strong>
          </button>
        ))}
      </div>
      {!!variants.length && (
        <div className="mode-variants" role="group" aria-label="Spielvarianten">
          {variants.map((item) => (
            <button
              key={item}
              disabled={busy}
              aria-pressed={mode === item}
              className={`mode-variant ${mode === item ? "active" : ""}`}
              onClick={() => onMode(item)}
            >
              <strong>{modeNames[item]}</strong>
              <small>{descriptions[item]}</small>
            </button>
          ))}
        </div>
      )}
    </>
  );
}
