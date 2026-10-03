import { isRecordMode } from "./recordModes";
import { familiarityLabel, ruleLabel } from "./familiarity";
import { useEffect, useMemo, useState } from "react";
import { points, selectQuestions } from "./engine";
import { type Round, type State } from "./model";
import {
  difficultyLabel,
  genreLabel,
  roundGenres,
  roundDifficulties,
} from "./filters";
import { GenreArtwork } from "./Icons";
import { errorTrainingContext } from "./errorTraining";
import { roundSummary } from "./roundSummary";
import { careerSummary } from "./career";
import { RoundExperience } from "./CareerProgress";
import { historicalModeName, formatDate } from "./gameUi";
import { presentedQuestion } from "./actorEditorial";
import { Explanation } from "./Explanation";

export function Result({
  round,
  state,
  onHome,
  onLeaderboard,
  onRetry,
  busy,
  celebrate,
}: {
  round: Round;
  state: State;
  onHome: () => void;
  onLeaderboard: () => void;
  onRetry: () => void;
  busy: boolean;
  celebrate: boolean;
}) {
  const [reviewFilter, setReviewFilter] = useState<"all" | "wrong" | "guessed">(
    "all",
  );
  useEffect(() => setReviewFilter("all"), [round.id]);
  const summary = roundSummary(state, round);
  const career = useMemo(() => careerSummary(state), [state]);
  const roundXp = career.rounds.get(round.id)!;
  const roundProgress = career.progress.get(round.id)!;
  const { events, correct, improved, secured: secure } = summary;
  const retryContext = errorTrainingContext(state, round.id);
  const retryCount = selectQuestions(
    state.questions,
    state.learning,
    {
      mode: "fehler",
      topic: round.topic,
      difficulty: round.difficulty,
      filters: round.filters,
      size: 10,
      now: Date.now(),
      ...retryContext,
    },
    () => 0.5,
  ).length;
  const active = state.rounds.some((r) => r.status === "active");
  const headline =
    summary.recovered > 0
      ? `${summary.recovered} ${summary.recovered === 1 ? "früherer Fehler" : "frühere Fehler"} sicher gelöst. Das ist Fortschritt.`
      : correct === round.questions.length
        ? summary.guessed
          ? "Alles richtig gewählt. Geratene Treffer kannst Du im Rückblick noch einmal nachlesen."
          : "Alle Antworten sicher richtig. Starkes Filmwissen!"
        : correct === 0
          ? "Diese Runde hatte es in sich. Nimm Dir die Erklärungen mit und probiere die Fehler noch einmal."
          : `${correct} richtige Antworten – und ${summary.wrong + summary.timedOut} Ansatzpunkte für Deine nächste Runde.`;
  const unlocked = (round.unlocks ?? []).map(
    (u) =>
      `${genreLabel(u.genre)} · ${"difficulty" in u ? difficultyLabel(u.difficulty) : familiarityLabel(u.familiarity)}`,
  );
  return (
    <div className="result">
      <span className="eyebrow">
        {historicalModeName(round)} · {formatDate(round.finishedAt!)}
      </span>
      <h1>
        Eine Runde <em>weiter.</em>
      </h1>
      <p className="lead">{headline}</p>
      <div className="result-overview">
        <div
          className="result-ring"
          style={{
            background: `conic-gradient(#28674b ${summary.accuracy}%, #e6e9e2 0)`,
          }}
        >
          <div>
            <strong>{summary.accuracy}%</strong>
            <span>Trefferquote</span>
          </div>
        </div>
        <div className="result-score">
          <strong>
            {correct}
            <span> / {round.questions.length}</span>
          </strong>
          <p>richtig beantwortet</p>
          <div
            className="result-answer-strip"
            aria-label="Antworten dieser Runde"
          >
            {events.map((e, i) => (
              <span
                key={e.id}
                className={
                  e.guessed ? "guessed" : e.correct ? "correct" : "wrong"
                }
                aria-label={`Frage ${i + 1}: ${e.guessed ? "richtig, geraten" : e.correct ? "richtig" : e.dontKnow ? "keine Ahnung, als falsch gewertet" : e.answerId ? "falsch" : "Zeit abgelaufen"}`}
              >
                {e.guessed || e.dontKnow
                  ? "?"
                  : e.correct
                    ? "✓"
                    : e.answerId
                      ? "×"
                      : "–"}
              </span>
            ))}
          </div>
        </div>
      </div>
      <div className="result-metrics">
        <div>
          <strong>{summary.wrong}</strong>
          <span>Falsch beantwortet</span>
          {summary.dontKnow > 0 && (
            <small>davon {summary.dontKnow} × Keine Ahnung</small>
          )}
        </div>
        <div>
          <strong>{summary.timedOut}</strong>
          <span>Zeit abgelaufen</span>
        </div>
        <div>
          <strong>{summary.guessed}</strong>
          <span>Richtig geraten</span>
        </div>
        <div>
          <strong>{summary.bestStreak}</strong>
          <span>Sicher richtig in Folge</span>
        </div>
      </div>
      {isRecordMode(round.mode) && (
        <div className="score-breakdown">
          <strong>{points(events)} Punkte</strong>
          <span>
            {events.reduce((a, e) => a + e.knowledgePoints, 0)} Wissen +{" "}
            {events.reduce((a, e) => a + e.timeBonus, 0)} Zeitbonus
          </span>
          <small>
            Lokale Trainingsrunde · {roundGenres(round)} ·{" "}
            {roundDifficulties(round)} · Regel {ruleLabel(round.ruleVersion)}
          </small>
        </div>
      )}
      <div className="result-progress">
        <RoundExperience
          key={round.id}
          xp={roundXp}
          before={roundProgress.before}
          after={roundProgress.after}
          celebrate={celebrate}
        />
        <div className="result-insights">
          <div>
            <strong>{summary.newGoals}</strong>
            <span>Neue Wissensziele entdeckt</span>
          </div>
          <div>
            <strong>{summary.recovered}</strong>
            <span>Frühere Fehler sicher gelöst</span>
          </div>
        </div>
        {!!unlocked.length && (
          <p className="notice" role="status">
            ✦ In der Filmreise neu freigeschaltet: {unlocked.join(" und ")}. Du
            kannst die neue Stufe bei Deiner nächsten Runde auswählen.
          </p>
        )}
        {improved > 0 && (
          <p>
            ✧ {improved} Wissensziel{improved === 1 ? "" : "e"} in dieser Runde
            neu geübt.
          </p>
        )}
        {secure > 0 && (
          <p>
            ✦ {secure} Wissensziel{secure === 1 ? "" : "e"} nach Abstand
            gefestigt.
          </p>
        )}
        {!improved && !secure && (
          <p>
            Du hast Dir Zeit für {events.length} Wissensziele genommen.
            Festigung braucht Abstand.
          </p>
        )}
      </div>
      <section className="result-genres" aria-label="Ergebnis nach Genre">
        {[...summary.genres].map(([genre, tally]) => (
          <div key={genre}>
            <GenreArtwork genre={genre} compact />
            <span>{genreLabel(genre)}</span>
            <strong>
              {tally.correct} / {tally.total} richtig
            </strong>
            <progress
              value={tally.correct}
              max={tally.total}
              aria-label={`${genreLabel(genre)}: ${tally.correct} von ${tally.total} richtig`}
            />
          </div>
        ))}
      </section>
      {round.mode === "rekord" && (
        <button className="secondary" onClick={onLeaderboard}>
          Bestenliste ansehen →
        </button>
      )}
      <div className="result-actions">
        {retryCount > 0 && (
          <button
            className="primary"
            onClick={onRetry}
            disabled={busy || active}
          >
            Fehler dieser Runde üben ({retryCount}) →
          </button>
        )}
        <button
          className={retryCount ? "secondary" : "primary"}
          onClick={onHome}
        >
          Neue Runde wählen →
        </button>
      </div>
      {retryCount > 0 && (
        <p className="muted tiny">
          {active
            ? "Setze zuerst Deine begonnene Runde fort oder beende sie auf der Startseite."
            : "Ohne Zeitdruck direkt wiederholen. Langfristige Festigung braucht weiterhin Abstand."}
        </p>
      )}
      {!retryCount && events.some((e) => !e.correct) && (
        <p className="muted tiny">
          {retryContext.mistakes.size
            ? "Die offenen Fehler dieser Runde sind in dieser Auswahl aktuell nicht verfügbar."
            : "Die Fehler dieser Runde hast Du inzwischen sicher gelöst."}
        </p>
      )}
      <button className="text-button muted" onClick={onHome}>
        Zur Startseite · Für heute reicht’s
      </button>
      <section className="review">
        <h2>Dein Rundenrückblick</h2>
        <p className="muted">Die Erklärungen bleiben hier zum Nachlesen.</p>
        <div
          className="review-filters"
          role="group"
          aria-label="Rückblick filtern"
        >
          {(
            [
              ["all", `Alle (${events.length})`],
              ["wrong", `Fehler (${summary.wrong + summary.timedOut})`],
              ["guessed", `Geraten (${summary.guessed})`],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              aria-pressed={reviewFilter === value}
              onClick={() => setReviewFilter(value)}
            >
              {label}
            </button>
          ))}
        </div>
        {reviewFilter === "wrong" && !events.some((e) => !e.correct) && (
          <p className="muted">Keine Fehler in dieser Runde.</p>
        )}
        {reviewFilter === "guessed" && !summary.guessed && (
          <p className="muted">Keine als geraten markierten Treffer.</p>
        )}
        {round.questions.map((q, index) => {
          const e = events.find((e) => e.id === round.events[index]);
          return (
            e &&
            (reviewFilter === "all" ||
              (reviewFilter === "wrong" ? !e.correct : e.guessed)) && (
              <details key={`${q.id}:${index}`}>
                <summary>
                  <span
                    className={
                      e.guessed ? "guessed" : e.correct ? "correct" : "wrong"
                    }
                  >
                    {e.guessed ? "?" : e.correct ? "✓" : "×"}
                  </span>{" "}
                  {presentedQuestion(q)}
                </summary>
                {!e.correct && (
                  <p>
                    <strong>Deine Antwort:</strong>{" "}
                    {e.dontKnow
                      ? "Keine Ahnung"
                      : (q.answers.find((a) => a.id === e.answerId)?.text ??
                        "Zeit abgelaufen – keine Antwort")}
                  </p>
                )}
                <p>
                  <strong>Lösung:</strong>{" "}
                  {q.answers.find((a) => a.id === q.correctId)?.text}
                </p>
                <Explanation q={q} event={e} />
                {e.guessed && <p className="muted">Als geraten markiert.</p>}
              </details>
            )
          );
        })}
      </section>
    </div>
  );
}
