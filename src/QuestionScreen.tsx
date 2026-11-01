import { useEffect, useRef, useState } from "react";
import { answer, elapsed, guess, points } from "./engine";
import {
  DEFAULT_ANSWER_REVEAL_MS,
  hasAnswer,
  type AnswerChoice,
  type Question,
  type Round,
  type State,
} from "./model";
import {
  difficultyLabel,
  genreOf,
  genreLabel,
  questionSourceOf,
  sourceLabels,
} from "./filters";
import { QuestionHistory } from "./QuestionHistoryPanel";
import { QuestionStatus } from "./QuestionStatus";
import { SyncIndicator, type SyncDisplay } from "./SyncIndicator";
import { questionTitleParts } from "./questionTitle";
import { playFeedback, stopFeedback, unlockSound } from "./feedback";
import type { Mutate } from "./uiTypes";
import { historicalModeName, Pill } from "./gameUi";
import { Explanation } from "./Explanation";
import type { LearningEvidence } from "./learningProgress";
import { LearningProgress } from "./LearningProgressPanel";
import { IssueReportForm } from "./IssueReportForm";
import { ActorPortrait } from "./ActorPortrait";
import { GenreArtwork } from "./Icons";
import { DisclosureArtwork } from "./DisclosureArtwork";

import {
  isRecordMode,
  QUESTION_LIMIT,
  isEndlessMode,
  allowsSolutionChoice,
  questionLimit,
  eventIdFor,
} from "./recordModes";
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
  onCompleted,
  hasNext,
  presentationQuestion,
  learningEvidence,
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
  onCompleted?: (saved: State) => void;
  hasNext?: boolean;
  presentationQuestion?: Question;
  learningEvidence?: LearningEvidence;
}) {
  const q = round.questions[index];
  const event = state.events.find((e) => e.id === round.events[index]);
  // Existing public editorial text/images are presentation only. The answer
  // and all scoring still use the server-issued question and response.
  const displayQ =
    !event &&
    presentationQuestion?.id === q.id &&
    presentationQuestion.version === q.version &&
    presentationQuestion.question === q.question
      ? presentationQuestion
      : q;
  const titleParts = questionTitleParts(displayQ);
  const displayedQuestionText = titleParts
    ? `${titleParts.before}${titleParts.title}${titleParts.after}`
    : (displayQ.presentation?.questionText ?? displayQ.question);
  const collected =
    round.solutionDisplay === "round" &&
    (!!round.duel || allowsSolutionChoice(round.mode));
  const canRevealAnswers = !collected || !round.duel;
  const automaticDuel = !!round.duel && !collected;
  const automaticNext = collected || automaticDuel;
  const timed = isRecordMode(round.mode) || !!round.duel;
  const limit = questionLimit(round);
  const [guessed, setGuessed] = useState(false);
  const [remaining, setRemaining] = useState(limit);
  const [ready, setReady] = useState(false);
  const [imageStatus, setImageStatus] = useState<
    "loading" | "ready" | "failed"
  >(q.image ? "loading" : "ready");
  const [imageAttempt, setImageAttempt] = useState(0);
  const canChoose = ready && imageStatus === "ready";
  const [revealing, setRevealing] = useState(false);
  const [pendingChoice, setPendingChoice] = useState<
    AnswerChoice | undefined
  >();
  const submitting = pendingChoice !== undefined;
  const revealDuration = useRef(DEFAULT_ANSWER_REVEAL_MS);
  const showReveal =
    !!event &&
    (event.answerId !== null || !!event.dontKnow || automaticDuel) &&
    revealing &&
    canRevealAnswers;
  const start = useRef<{ wall: number; mono: number } | null>(null);
  const locked = useRef(false);
  const advanced = useRef(false);
  const nextAction = useRef(onNext);
  nextAction.current = onNext;
  const chooseRef = useRef<(choice: AnswerChoice) => void>(() => {});
  const feedback = useRef<HTMLDivElement>(null);
  const questionHeading = useRef<HTMLHeadingElement>(null);
  const [reporting, setReporting] = useState(false);
  const choose = async (choice: AnswerChoice) => {
    if (
      locked.current ||
      event ||
      !ready ||
      round.status !== "active" ||
      (choice !== null && imageStatus !== "ready")
    )
      return;
    locked.current = true;
    setPendingChoice(choice);
    if (choice !== null) unlockSound(state.settings);
    if (canRevealAnswers && (choice !== null || automaticDuel)) {
      revealDuration.current = automaticDuel
        ? 2500
        : (state.settings.answerRevealMs ?? DEFAULT_ANSWER_REVEAL_MS);
      setRevealing(true);
    }
    const ms = start.current ? elapsed(start.current) : 0;
    const result = onAnswer
      ? await onAnswer(choice, ms)
      : await mutate((s) => {
          answer(s, round.id, q.id, choice, ms, Date.now(), index);
          if (collected && guessed) guess(s, eventIdFor(round, index));
        });
    setPendingChoice(undefined);
    if (!result) {
      locked.current = false;
      setRevealing(false);
    } else {
      const saved = result.events.find(
        (e) => e.id === eventIdFor(round, index),
      );
      if (result.rounds.find((r) => r.id === round.id)?.status === "completed")
        onCompleted?.(result);
      if (saved)
        playFeedback(
          collected
            ? "click"
            : saved.dontKnow
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
    const timer = setTimeout(() => setRevealing(false), revealDuration.current);
    return () => clearTimeout(timer);
  }, [event?.id, revealing]);
  useEffect(() => {
    if (!event || !automaticNext || revealing || busy || advanced.current)
      return;
    advanced.current = true;
    nextAction.current();
  }, [event?.id, automaticNext, revealing, busy]);
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
            setRemaining(Math.max(0, limit - spent));
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
      if (!start.current || locked.current) return;
      const left = Math.max(0, limit - elapsed(start.current));
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
    if (event || !canChoose) return;
    window.scrollTo(0, 0);
    questionHeading.current?.focus({ preventScroll: true });
  }, [q.id, canChoose, !!event]);
  useEffect(() => {
    if (event) {
      feedback.current?.focus({ preventScroll: true });
      if (window.matchMedia("(max-width: 760px)").matches)
        window.scrollTo(0, 0);
      else feedback.current?.scrollIntoView({ block: "nearest" });
    }
  }, [!!event]);
  const answerOptions = (
    <div className="answers" aria-busy={submitting && !event}>
      {round.order[index].map((id, i) => {
        const a = q.answers.find((a) => a.id === id)!;
        const correct = !!event && canRevealAnswers && id === q.correctId;
        const wrong =
          !!event &&
          canRevealAnswers &&
          event.answerId === id &&
          !event.correct;
        return (
          <button
            key={id}
            data-feedback="own"
            className={`answer ${correct ? "correct" : ""} ${wrong ? "wrong" : ""} ${!event && pendingChoice === id ? "is-submitting" : ""}`}
            disabled={
              !!event ||
              submitting ||
              busy ||
              !canChoose ||
              round.status !== "active"
            }
            onClick={() => void choose(id)}
          >
            <span className="answer-letter">{String.fromCharCode(65 + i)}</span>
            <span>{a.text}</span>
            {!event && pendingChoice === id && (
              <span className="answer-verdict">Ausgewählt</span>
            )}
            {correct && <b className="answer-verdict">✓ Richtig</b>}
            {wrong && <b className="answer-verdict">× Deine Antwort</b>}
          </button>
        );
      })}
      {!event && (
        <button
          className={`answer answer-unknown ${pendingChoice && typeof pendingChoice === "object" ? "is-submitting" : ""}`}
          data-feedback="own"
          aria-describedby={`dont-know-${q.id}`}
          disabled={
            submitting || busy || !canChoose || round.status !== "active"
          }
          onClick={() => void choose({ dontKnow: true })}
        >
          <span className="answer-letter" aria-hidden="true">
            ?
          </span>
          <span>Keine Ahnung</span>
          {pendingChoice && typeof pendingChoice === "object" && (
            <span className="answer-verdict">Ausgewählt</span>
          )}
        </button>
      )}
      {!event && (
        <p className="answer-unknown-hint" id={`dont-know-${q.id}`}>
          Zählt als falsch.{" "}
          {!canRevealAnswers
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
            : isRecordMode(round.mode)
              ? "Runde beenden"
              : "Pause & Startseite"}
        </button>
        <div className="round-status">
          <button
            className="sound-toggle text-button"
            data-feedback="own"
            aria-label={
              state.settings.sound !== false
                ? "Soundeffekte ausschalten"
                : "Soundeffekte einschalten"
            }
            aria-pressed={state.settings.sound !== false}
            disabled={busy}
            onClick={async () => {
              const enabled = state.settings.sound === false;
              if (enabled) void unlockSound({ ...state.settings, sound: true });
              else stopFeedback();
              const saved = await mutate((s) => {
                s.settings.sound = enabled;
              });
              if (saved && enabled) playFeedback("correct", saved.settings);
            }}
          >
            ♪ Ton {state.settings.sound !== false ? "an" : "aus"}
          </button>
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
          {isEndlessMode(round.mode)
            ? `FRAGE ${index + 1} · ENDLOS`
            : `FRAGE ${index + 1} VON ${round.questions.length}`}
        </span>
        <div
          className="progress-dots"
          role="group"
          aria-label="Fragenfortschritt"
        >
          {round.questions
            .map((_, i) => i)
            .slice(-20)
            .map((i) => {
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
          <progress max={limit} value={remaining} />
          <span>
            {Math.ceil(remaining / 1000)} s ·{" "}
            {round.duel
              ? "1 Punkt pro richtiger Antwort"
              : `${remaining > 0 ? 100 + 2 * Math.floor((30000 - limit + remaining) / 1000) : 0} mögliche Punkte`}
          </span>
        </div>
      )}
      {round.run &&
        (!collected || round.mode === "zeitkonto" || round.run.ended) && (
          <div className="run-status" role="status">
            {!collected && (
              <strong>
                {points(state.events.filter((e) => e.roundId === round.id))}{" "}
                Laufpunkte
              </strong>
            )}
            {!collected && (
              <span>
                {
                  state.events.filter(
                    (e) => e.roundId === round.id && e.correct,
                  ).length
                }{" "}
                richtig
              </span>
            )}
            {round.mode === "zeitkonto" && (
              <span>
                Zeitkonto:{" "}
                {Math.ceil(
                  Math.max(
                    0,
                    round.run.bankMs - (!event ? limit - remaining : 0),
                  ) / 1000,
                )}{" "}
                s
                {event &&
                  !collected &&
                  ` · ${event.correct ? "+15" : "−45"} Sekunden`}
              </span>
            )}
            {round.run.ended && <strong>Lauf beendet</strong>}
          </div>
        )}
      <section className="question-card">
        <div className="question-heading">
          <div className="question-hints">
            {state.settings.showGenre !== false && (
              <span
                className="question-genre"
                role="img"
                aria-label={
                  questionSourceOf(displayQ) === "film"
                    ? genreLabel(genreOf(displayQ))
                    : sourceLabels[questionSourceOf(displayQ)]
                }
                title={
                  questionSourceOf(displayQ) === "film"
                    ? genreLabel(genreOf(displayQ))
                    : sourceLabels[questionSourceOf(displayQ)]
                }
              >
                <GenreArtwork
                  genre={
                    questionSourceOf(displayQ) === "film"
                      ? genreOf(displayQ)
                      : sourceLabels[questionSourceOf(displayQ)]
                  }
                  compact
                />
              </span>
            )}
            {state.settings.showDifficulty !== false && (
              <span className="pill question-difficulty">
                Schwierigkeit: {difficultyLabel(q.difficulty)}
              </span>
            )}
            {state.settings.showQuestionStatus !== false && (
              <QuestionStatus
                events={state.events}
                question={q}
                currentEventId={event?.id}
              />
            )}
          </div>
        </div>
        <h1 ref={questionHeading} tabIndex={-1} data-question-id={q.id}>
          {titleParts ? (
            <>
              {titleParts.before}
              <mark className="film-title">{titleParts.title}</mark>
              {titleParts.after}
            </>
          ) : (
            displayedQuestionText
          )}
        </h1>
        {!event && imageStatus !== "ready" && (
          <div
            className="notice"
            role={imageStatus === "failed" ? "alert" : "status"}
          >
            <p>
              {imageStatus === "failed"
                ? "Das Bild konnte nicht geladen werden."
                : "Das Bild wird geladen …"}
              {timed && " Die Zeit läuft während des Ladens weiter."}
            </p>
            {imageStatus === "failed" && (
              <button
                disabled={busy}
                onClick={() => {
                  setImageStatus("loading");
                  setImageAttempt((attempt) => attempt + 1);
                }}
              >
                Bild erneut laden
              </button>
            )}
          </div>
        )}
        {!event && (
          <ActorPortrait
            q={q}
            beforeAnswer
            selectionKey={eventIdFor(round, index)}
            loadAttempt={imageAttempt}
            onReady={() => setImageStatus("ready")}
            onError={() => setImageStatus("failed")}
          />
        )}
        {!collected &&
          !timed &&
          state.settings.questionHistory !== "hidden" &&
          state.settings.questionHistory === "always" &&
          !event &&
          !showReveal && (
            <QuestionHistory key={q.id} events={state.events} question={q} />
          )}
        {event
          ? !showReveal &&
            !automaticNext && (
              <details className="answer-review">
                <summary className="illustrated-summary">
                  <DisclosureArtwork subject="answers" />
                  Alle Antworten ansehen
                </summary>
                {answerOptions}
              </details>
            )
          : answerOptions}
        {submitting && !event && (
          <p role="status" className="quiet-note">
            Antwort wird bestätigt …
          </p>
        )}
        {!event && isRecordMode(round.mode) && (
          <p className="quiet-note">Deine erste Antwort zählt.</p>
        )}
        {automaticNext && !event && (
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
        {event && collected && !showReveal && (
          <p role="status" className="notice">
            Antwort gespeichert.{" "}
            {round.duel
              ? "Die Lösungen siehst Du nach der Runde."
              : "Die Erklärungen siehst Du nach der Runde."}
          </p>
        )}
        {event && ((!automaticNext && !collected) || showReveal) && (
          <div
            ref={feedback}
            tabIndex={-1}
            className="feedback"
            role="region"
            aria-label="Antwortauflösung"
          >
            <span className="sr-only" role="status" aria-atomic="true">
              {event.correct
                ? "Richtig beantwortet."
                : event.dontKnow
                  ? "Nicht gewusst. Die richtige Antwort wird angezeigt."
                  : event.answerId === null
                    ? "Zeit abgelaufen. Die richtige Antwort wird angezeigt."
                    : "Nicht richtig. Die richtige Antwort wird angezeigt."}
            </span>
            {round.mode === "rekord" && !round.duel && (
              <p className="quiet-note">
                Benötigte Zeit:{" "}
                {(event.elapsedMs / 1000).toLocaleString("de-DE", {
                  minimumFractionDigits: 1,
                  maximumFractionDigits: 1,
                })}{" "}
                s · Restzeit:{" "}
                {(
                  Math.max(0, QUESTION_LIMIT - event.elapsedMs) / 1000
                ).toLocaleString("de-DE", {
                  minimumFractionDigits: 1,
                  maximumFractionDigits: 1,
                })}{" "}
                s
              </p>
            )}
            {showReveal ? (
              <div className="solution-reveal">
                {answerOptions}
                <span>
                  {event.dontKnow
                    ? "Keine Ahnung gewählt · als falsch gewertet"
                    : event.answerId === null
                      ? "Zeit abgelaufen · die richtige Antwort ist grün"
                      : event.correct
                        ? "Richtig gewählt"
                        : "Falsch gewählt · die richtige Antwort ist grün"}
                </span>
              </div>
            ) : (
              <>
                <div
                  className={`feedback-outcome ${event.correct ? "success" : "incorrect"}`}
                >
                  <span aria-hidden="true">{event.correct ? "✓" : "×"}</span>
                  <strong>
                    {event.correct
                      ? "Richtig"
                      : event.dontKnow
                        ? "Nicht gewusst"
                        : event.answerId === null
                          ? "Zeit abgelaufen"
                          : "Nicht richtig"}
                  </strong>
                  {isRecordMode(round.mode) && (
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
                  <p className="correct-answer">
                    Richtige Antwort:{" "}
                    <strong>
                      {q.answers.find((a) => a.id === q.correctId)!.text}
                    </strong>
                  </p>
                )}
                <Explanation q={q} event={event}>
                  {event.guessed && (
                    <p className="tiny muted">
                      Deine Punkte bleiben. Dieser Filmfakt kommt früher wieder.
                    </p>
                  )}
                  <LearningProgress
                    evidence={learningEvidence}
                    events={state.events}
                    event={event}
                    now={Date.now()}
                    history={
                      !timed && state.settings.questionHistory !== "hidden" ? (
                        <QuestionHistory
                          events={state.events}
                          question={q}
                          currentEventId={event.id}
                          embedded
                        />
                      ) : undefined
                    }
                  />
                </Explanation>
              </>
            )}
          </div>
        )}
        {event && !showReveal && !automaticNext && (
          <div className="feedback-actions">
            <button
              className="primary"
              data-feedback={round.duel ? undefined : "own"}
              disabled={busy}
              onClick={() => {
                void unlockSound(state.settings);
                onNext();
              }}
            >
              {(hasNext ?? index < round.questions.length - 1)
                ? "Nächste Frage"
                : "Runde abschließen"}{" "}
              →
            </button>
          </div>
        )}
        <div className="report-area">
          <button
            className="text-button muted"
            aria-expanded={reporting}
            onClick={() => setReporting(!reporting)}
          >
            ✎ Verbesserung vorschlagen
          </button>
          <div hidden={!reporting}>
            <IssueReportForm
              key={`${q.id}:${index}`}
              question={{
                id: q.id,
                version: q.version,
                text: displayedQuestionText,
              }}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
