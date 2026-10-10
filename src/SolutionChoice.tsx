import type { SolutionDisplay } from "./model";

export function SolutionChoice({
  value,
  onChange,
  disabled = false,
}: {
  value: SolutionDisplay;
  onChange: (value: SolutionDisplay) => void;
  disabled?: boolean;
}) {
  return (
    <fieldset className="solution-choice" disabled={disabled}>
      <legend>Lösungen anzeigen</legend>
      <label>
        <input
          type="radio"
          name="solution-display"
          checked={value === "question"}
          onChange={() => onChange("question")}
        />{" "}
        Nach jeder Frage
      </label>
      <label>
        <input
          type="radio"
          name="solution-display"
          checked={value === "round"}
          onChange={() => onChange("round")}
        />{" "}
        Nach der Runde
      </label>
      <p className="tiny muted">
        Nach jeder Frage kannst Du Antwort und Vertiefung in Ruhe lesen und
        selbst weitergehen. Bei „Nach der Runde“ siehst Du kurz die richtige und
        gegebenenfalls falsch gewählte Antwort, dann geht es automatisch weiter.
        Erklärungen und Vertiefungen erscheinen im Rundenrückblick. Während der
        Antwortanzeige pausiert die Spielzeit.
      </p>
    </fieldset>
  );
}
