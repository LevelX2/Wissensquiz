import type { Mode } from "./model";
import { modeNames } from "./recordModes";

export type PlayGroup = "learn" | "timed" | "duel";
export const modeDescriptions: Record<Mode, string> = {
  entdecken: "Filmwelten und Stufen freischalten",
  ueben: "Alle Stufen frei kombinieren",
  fehler: "Offene Fehler gezielt wiederholen",
  rekord: "30 Sekunden je Frage · zehn Fragen",
  fehlerfrei: "30 Sekunden je Frage · erster Fehler beendet den Lauf",
  zeitkonto: "120 Sekunden Start · richtig +15 · falsch −45",
};
const artwork: Record<Mode, string> = {
  entdecken: "entdecken.png",
  ueben: "ueben.png",
  fehler: "fehler.svg",
  rekord: "rekord.png",
  fehlerfrei: "fehlerfrei.svg",
  zeitkonto: "zeitkonto.svg",
};
export function ModeArtwork({
  mode,
  duel = false,
}: {
  mode: Mode;
  duel?: boolean;
}) {
  return (
    <img
      className="mode-artwork"
      src={`/modes/${duel ? "duell.svg" : artwork[mode]}`}
      alt=""
      width={128}
      height={128}
    />
  );
}
export function modesForGroup(group: PlayGroup): Mode[] {
  return group === "learn"
    ? ["entdecken", "ueben", "fehler"]
    : group === "timed"
      ? ["rekord", "fehlerfrei", "zeitkonto"]
      : [];
}
export function ModePicker({
  mode,
  group,
  busy,
  onGroup,
  onMode,
  onDuel,
}: {
  mode: Mode;
  group: PlayGroup;
  busy: boolean;
  onGroup: (group: PlayGroup) => void;
  onMode: (mode: Mode) => void;
  onDuel: () => void;
}) {
  const variants = modesForGroup(group);
  return (
    <>
      <div className="mode-groups" role="group" aria-label="Spielgruppen">
        {(["learn", "timed", "duel"] as const).map((item) => (
          <button
            key={item}
            className={`mode-group ${group === item ? "active" : ""}`}
            aria-pressed={group === item}
            disabled={busy}
            onClick={() => onGroup(item)}
          >
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
        <div
          className="mode-grid mode-variants"
          role="group"
          aria-label="Spielvarianten"
        >
          {variants.map((item) => (
            <div className="mode-tile" key={item}>
              <button
                disabled={busy}
                className={`mode-card mode-variant ${mode === item ? "active" : ""}`}
                aria-pressed={mode === item}
                onClick={() => onMode(item)}
              >
                <ModeArtwork mode={item} />
                <strong>{modeNames[item]}</strong>
                <small>{modeDescriptions[item]}</small>
                <span className="mode-play">
                  Auswählen <span aria-hidden="true">→</span>
                </span>
                {mode === item && (
                  <span className="mode-check" aria-hidden="true">
                    ✓
                  </span>
                )}
              </button>
            </div>
          ))}
        </div>
      )}
      {group === "duel" && (
        <div
          className="mode-grid mode-variants"
          role="group"
          aria-label="Spielvarianten"
        >
          <button
            className="mode-card mode-variant"
            disabled={busy}
            onClick={onDuel}
          >
            <ModeArtwork mode={mode} duel />
            <strong>Duell</strong>
            <small>Drei Runden gegen einen Mitspieler</small>
            <span className="mode-play">
              Auswählen <span aria-hidden="true">→</span>
            </span>
          </button>
        </div>
      )}
    </>
  );
}
