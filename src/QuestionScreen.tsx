import { useEffect, useRef, useState } from "react";
import { answer, elapsed, guess } from "./engine";
import {
  uid,
  hasAnswer,
  type AnswerChoice,
  type Round,
  type State,
} from "./model";
import { difficultyLabel, genreOf, genreLabel } from "./filters";
import { QuestionHistory } from "./QuestionHistoryPanel";
import { SyncIndicator, type SyncDisplay } from "./SyncIndicator";
import { questionTitleParts } from "./questionTitle";
import { playFeedback, unlockSound } from "./feedback";
import type { Mutate } from "./uiTypes";
import { historicalModeName, Pill } from "./gameUi";
import { Explanation } from "./Explanation";

export function QuestionScreen({
  round,
  index,
  state,
  mutate,
  busy,
  onExit,
  onNext,
  sync,
  onAnswer,
  onReady,
  onGuessed,
  onGuess,
}: {
  round: Round;
  index: number;
  state: State;
  mutate: Mutate;
  busy: boolean;
  onExit: () => void;
  onNext: () => void;
  sync?: SyncDisplay;
  onAnswer?: (choice: AnswerChoice, elapsedMs: number) => Promise<State | null>;
  onReady?: () => Promise<number>;
  onGuessed?: boolean;
  onGuess?: () => void;
}) {
  const q = round.questions[index];
  const event = state.events.find((e) => e.id === round.events[index]);
  const collected = round.solutionDisplay === "round";
  const timed = round.mode === "rekord" || !!round.duel;
  const [guessed, setGuessed] = useState(false);
  const [remaining, setRemaining] = useState(30_000);
  const [ready, setReady] = useState(false);
  const [revealing, setRevealing] = useState(false);
  const showReveal = !!event?.dontKnow && revealing && !collected;
  const start = useRef<{ wall: number; mono: number } | null>(null);
  const locked = useRef(false);
  const chooseRef = useRef<(choice: AnswerChoice) => void>(() => {});
  const feedback = useRef<HTMLDivElement>(null);
  const [reporting, setReporting] = useState(false);
  const [comment, setComment] = useState("");
  const [sent, setSent] = useState(false);
  const choose = async (choice: AnswerChoice) => {
    if (locked.current || event || !ready || round.status !== "active") return;
    locked.current = true;
    if (choice !== null) unlockSound(state.settings);
    if (!collected && choice !== null && typeof choice === "object")
      setRevealing(true);
    const ms = start.current ? elapsed(start.current) : 0;
    const result = onAnswer
      ? await onAnswer(choice, ms)
      : await mutate((s) => {
          answer(s, round.id, q.id, choice, ms);
          if (collected && guessed) guess(s, `${round.id}:${q.knowledgeId}`);
        });
    if (!result) {
      locked.current = false;
      setRevealing(false);
    } else {
      const saved = result.events.find(
        (e) => e.id === `${round.id}:${q.knowledgeId}`,
      );
      if (saved && !collected)
        playFeedback(
          saved.dontKnow
            ? "reveal"
            : saved.answerId === null
              ? "timeout"
              : saved.correct
                ? "correct"
                : "wrong",
          result.settings,
        );
    }
  };
  chooseRef.current = (id) => {
    void choose(id);
  };
  useEffect(() => {
    if (!event || !revealing) return;
    const timer = setTimeout(() => setRevealing(false), 1100);
    return () => clearTimeout(timer);
  }, [event?.id, revealing]);
  useEffect(() => {
    if (event) return;
    let second = 0;
    const first = requestAnimationFrame(() => {
      second = requestAnimationFrame(() => {
        const prepare = async () => {
          try {
            const spent = onReady ? await onReady() : 0;
            start.current = {
              wall: Date.now() - spent,
              mono: performance.now() - spent,
            };
            setRemaining(Math.max(0, 30_000 - spent));
            setReady(true);
          } catch {
            setReady(false);
          }
        };
        void prepare();
      });
    });
    return () => {
      cancelAnimationFrame(first);
      cancelAnimationFrame(second);
    };
  }, [q.id, !!event]);
  useEffect(() => {
    if (event || !timed || !ready) return;
    const tick = () => {
      if (!start.current) return;
      const left = Math.max(0, 30_000 - elapsed(start.current));
      setRemaining(left);
      if (left === 0) chooseRef.current(null);
    };
    const timer = setInterval(tick, 100);
    document.addEventListener("visibilitychange", tick);
    window.addEventListener("focus", tick);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", tick);
      window.removeEventListener("focus", tick);
    };
  }, [!!event, ready, timed]);
  useEffect(() => {
    if (event) {
      feedback.current?.focus({ preventScroll: true });
      if (window.matchMedia("(max-width: 760px)").matches)
        window.scrollTo(0, 0);
      else feedback.current?.scrollIntoView({ block: "nearest" });
    }
  }, [!!event]);
  const answerOptions = (
    <div className="answers">
      {round.order[index].map((id, i) => {
        const a = q.answers.find((a) => a.id === id)!;
        const correct = !!event && !collected && id === q.correctId;
        const wrong =
          !!event && !collected && event.answerId === id && !event.correct;
        return (
          <button
            key={id}
            className={`answer ${correct ? "correct" : ""} ${wrong ? "wrong" : ""}`}
            disabled={!!event || busy || !ready || round.status !== "active"}
            onClick={() => void choose(id)}
          >
            <span className="answer-letter">{String.fromCharCode(65 + i)}</span>
            <span>{a.text}</span>
            {correct && <b className="answer-verdict">✓ Richtig</b>}
            {wrong && <b className="answer-verdict">× Deine Antwort</b>}
          </button>
        );
      })}
      {!event && (
        <button
          className="answer answer-unknown"
          aria-describedby={`dont-know-${q.id}`}
          disabled={busy || !ready || round.status !== "active"}
          onClick={() => void choose({ dontKnow: true })}
        >
          <span className="answer-letter" aria-hidden="true">
            ?
          </span>
          <span>Keine Ahnung</span>
        </button>
      )}
      {!event && (
        <p className="answer-unknown-hint" id={`dont-know-${q.id}`}>
          Zählt als falsch.{" "}
          {collected
            ? "Die Lösung siehst Du nach der Runde."
            : "Danach siehst Du die richtige Lösung."}
        </p>
      )}
    </div>
  );
  return (
    <div className={`question-wrap ${event ? "is-answered" : ""}`}>
      <div className="round-top">
        <button className="text-button" disabled={busy} onClick={onExit}>
          ←{" "}
          {round.duel
            ? "Pause & Duellübersicht"
            : round.mode === "rekord"
              ? "Runde beenden"
              : "Pause & Startseite"}
        </button>
        <div className="round-status">
          <Pill>
            {round.duel
              ? `Duell · Runde ${round.duel.number} von 3`
              : historicalModeName(round)}
          </Pill>
          {sync && <SyncIndicator sync={sync} />}
        </div>
      </div>
      <div className="round-progress">
        <span>
          FRAGE {index + 1} VON {round.questions.length}
        </span>
        <div
          className="progress-dots"
          role="group"
          aria-label="Fragenfortschritt"
        >
          {round.questions.map((_, i) => {
            const result = state.events.find((e) => e.id === round.events[i]);
            const status =
              result && collected
                ? "answered"
                : result
                  ? result.correct
                    ? "correct"
                    : "wrong"
                  : "open";
            const label = `Frage ${i + 1}: ${result && collected ? "Antwort gespeichert" : result ? (result.correct ? "richtig beantwortet" : result.dontKnow ? "keine Ahnung, als falsch gewertet" : result.answerId ? "falsch beantwortet" : "ohne Antwort") : "noch offen"}${i === index ? ", aktuell" : ""}`;
            return (
              <span
                key={i}
                role="img"
                aria-label={label}
                title={label}
                className={`progress-step ${status}${i === index ? " current" : ""}`}
              >
                {result && collected
                  ? "•"
                  : result
                    ? result.correct
                      ? "✓"
                      : hasAnswer(result)
                        ? "×"
                        : "–"
                    : i === index
                      ? "•"
                      : ""}
              </span>
            );
          })}
        </div>
      </div>
      {timed && !event && (
        <div
          className="timer"
          role="timer"
          aria-label={`${Math.ceil(remaining / 1000)} Sekunden verbleibend`}
        >
          <progress max={30_000} value={remaining} />
          <span>
            {Math.ceil(remaining / 1000)} s ·{" "}
            {round.duel
              ? "1 Punkt pro richtiger Antwort"
              : `${remaining > 0 ? 100 + 2 * Math.floor(remaining / 1000) : 0} mögliche Punkte`}
          </span>
        </div>
      )}
      <section className="question-card">
        <div className="question-heading">
          <div className="question-hints">
            {state.settings.showGenre !== false && (
              <span className="pill question-genre">
                {genreLabel(genreOf(q))}
              </span>
            )}
            {state.settings.showDifficulty !== false && (
              <span className="pill question-difficulty">
                Schwierigkeit: {difficultyLabel(q.difficulty)}
              </span>
            )}
          </div>
        </div>
        <h1 data-question-id={q.id}>
          {(() => {
            const parts = questionTitleParts(q);
            return parts ? (
              <>
                {parts.before}
                <mark className="film-title">{parts.title}</mark>
                {parts.after}
              </>
            ) : (
              q.question
            );
          })()}
        </h1>
        {!collected &&
          !timed &&
          state.settings.questionHistory !== "hidden" &&
          (state.settings.questionHistory === "always" || !!event) &&
          !showReveal && (
            <QuestionHistory key={q.id} events={state.events} question={q} />
          )}
        {event
          ? !showReveal &&
            !collected && (
              <details className="answer-review">
                <summary>Alle Antworten ansehen</summary>
                {answerOptions}
              </details>
            )
          : answerOptions}
        {!event && round.mode === "rekord" && (
          <p className="quiet-note">Deine erste Antwort zählt.</p>
        )}
        {collected && !event && (
          <label className="guess-choice">
            <input
              type="checkbox"
              checked={onGuessed ?? guessed}
              onChange={() => {
                if (onGuess) onGuess();
                else setGuessed(!guessed);
              }}
            />{" "}
            Ich rate bei dieser Frage
          </label>
        )}
        {event && collected && (
          <p role="status" className="notice">
            Antwort gespeichert. Die Lösungen siehst Du nach der Runde.
          </p>
        )}
        {event && !collected && (
          <div ref={feedback} tabIndex={-1} className="feedback" role="status">
            {showReveal ? (
              <div className="solution-reveal">
                <span className="eyebrow">DIE RICHTIGE ANTWORT</span>
                <p>
                  <span aria-hidden="true">✓</span>{" "}
                  {q.answers.find((a) => a.id === q.correctId)!.text}
                </p>
                <span>Keine Ahnung gewählt · als falsch gewertet</span>
              </div>
            ) : (
              <>
                <div
                  className={`feedback-title ${event.correct ? "success" : "incorrect"}`}
                >
                  <span>{event.correct ? "✓" : "↗"}</span>
                  <h2>
                    {event.correct
                      ? "Genau richtig."
                      : event.dontKnow
                        ? "Die Lösung zum Merken."
                        : event.answerId === null
                          ? "Die Zeit ist um."
                          : "Eine neue Entdeckung."}
                  </h2>
                  {round.mode === "rekord" && (
                    <Pill>
                      +{event.knowledgePoints + event.timeBonus} Punkte
                    </Pill>
                  )}
                </div>
                <p className="chosen-answer">
                  Deine Antwort:{" "}
                  <strong>
                    {event.dontKnow
                      ? "Keine Ahnung"
                      : (q.answers.find((a) => a.id === event.answerId)?.text ??
                        "Keine Antwort gewählt")}
                  </strong>
                </p>
                {!event.correct && (
                  <p>
                    Die richtige Antwort:{" "}
                    <strong>
                      {q.answers.find((a) => a.id === q.correctId)!.text}
                    </strong>
                  </p>
                )}
                <Explanation q={q} event={event} />
                {event.guessed && (
                  <p className="tiny muted">
                    Deine Punkte bleiben. Dieses Wissensziel kommt früher
                    wieder.
                  </p>
                )}
              </>
            )}
          </div>
        )}
        {event && !showReveal && (
          <div className="feedback-actions">
            {!collected && event.correct && (
              <button
                className="secondary"
                aria-pressed={event.guessed}
                disabled={event.guessed || busy}
                onClick={() =>
                  onGuess ? onGuess() : void mutate((s) => guess(s, event.id))
                }
              >
                {event.guessed ? "✓ Als geraten markiert" : "War geraten"}
              </button>
            )}
            <button className="primary" disabled={busy} onClick={onNext}>
              {index === round.questions.length - 1
                ? "Runde abschließen"
                : "Nächste Frage"}{" "}
              →
            </button>
          </div>
        )}
        <div className="report-area">
          <button
            className="text-button muted"
            onClick={() => setReporting(!reporting)}
          >
            ⚑ Frage melden
          </button>
          {sent && (
            <span role="status">Lokal gespeichert. Nicht versendet.</span>
          )}
          {reporting && !sent && (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const saved = await mutate((s) =>
                  s.reports.push({
                    id: uid(),
                    questionId: q.id,
                    version: q.version,
                    comment,
                    at: Date.now(),
                  }),
                );
                if (saved) {
                  setSent(true);
                  setReporting(false);
                }
              }}
            >
              <label>
                Was ist Dir aufgefallen? (optional)
                <textarea
                  value={comment}
                  maxLength={4000}
                  onChange={(e) => setComment(e.target.value)}
                />
              </label>
              <p className="tiny muted">
                Fragen-ID und Inhaltsversion werden lokal gespeichert. Export
                unter Einstellungen.
              </p>
              <button className="secondary" disabled={busy}>
                Meldung lokal speichern
              </button>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}
