import { type ReactNode } from "react";
import { type Mode, type Round } from "./model";

export const modeNames: Record<Mode, string> = {
  entdecken: "Filmreise",
  ueben: "Freies Spiel",
  rekord: "Rekordrunde",
  fehler: "Fehlertraining",
};

export const historicalModeName = (round: Round) =>
  round.duel
    ? `Duell · Runde ${round.duel.number} von 3`
    : round.ruleVersion === "1" &&
        (round.mode === "entdecken" || round.mode === "ueben")
      ? round.mode === "entdecken"
        ? "Entdecken (frühere Runde)"
        : "Besser werden (frühere Runde)"
      : modeNames[round.mode];

export const formatDate = (at: number) =>
  new Date(at).toLocaleDateString("de-DE", { day: "numeric", month: "short" });

export function Pill({ children }: { children: ReactNode }) {
  return <span className="pill">{children}</span>;
}
