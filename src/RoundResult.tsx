import { isRecordMode, recordSelectionLabel } from "./recordModes";
import { familiarityLabel } from "./familiarity";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { points, selectQuestions } from "./engine";
import { type Round, type State } from "./model";
import { difficultyLabel, genreLabel } from "./filters";
import { GenreArtwork } from "./Icons";
import { repetitionContext } from "./errorTraining";
import { useForegroundTime } from "./useForegroundTime";
import { roundSummary } from "./roundSummary";
import { careerSummary } from "./career";
import { RoundExperience } from "./CareerProgress";
import { historicalModeName, formatDate } from "./gameUi";
import { Explanation } from "./Explanation";
import { LearningProgress } from "./LearningProgressPanel";
import { QuestionHistory } from "./QuestionHistoryPanel";
import { useServer, useServerView } from "./serverViews";
import type { PathUnlock } from "./learningPath";
import { UnlockCelebration } from "./UnlockCelebration";
import { localAchievements, reachedAchievements } from "./achievements";
import { perfectRoundLabel, perfectRoundMilestones } from "./perfectRounds";
import { AchievementProgress } from "./AchievementsPanel";
import { celebrationTier } from "./successTiers";
import { playFeedback } from "./feedback";
import {
  localLearningAchievementReward,
  reachedLearningAchievements,
} from "./learningAchievements";

export function Result({
  round,
  state,
  onHome,
  onLeaderboard,
  leaderboardLabel,
  onRetry,
  busy,
  celebrate,
  unlocks = [],
  promotion,
  onAcknowledged,
  trialActions,
}: {
  round: Round;
  state: State;
  onHome: () => void;
  onLeaderboard: () => void;
  leaderboardLabel?: string;
  onRetry: () => void;
  busy: boolean;
  celebrate: boolean;
  unlocks?: PathUnlock[];
  promotion?: { level: number; title: string };
  onAcknowledged?: () => void;
  trialActions?: ReactNode;
}) {
  const [reviewFilter, setReviewFilter] = useState<"all" | "wrong" | "guessed">(
    "all",
  );
  useEffect(() => setReviewFilter("all"), [round.id]);
  const server = useServer();
  const remoteReward = !!server && !trialActions;
  const career = useMemo(
    () => (remoteReward ? null : careerSummary(state)),
    [state, remoteReward],
  );
  const serverReward = useServerView(
    remoteReward ? { action: "round-experience", scope: round.id } : null,
  );
  const roundXp = remoteReward
    ? serverReward.value?.xp
    : career!.rounds.get(round.id);
  const roundProgress = remoteReward
    ? serverReward.value
    : career!.progress.get(round.id);
  const [acknowledged, setAcknowledged] = useState("");
  const sounded = useRef("");
  const resultHeading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (acknowledged === round.id) resultHeading.current?.focus();
  }, [acknowledged, round.id]);
  const achievementSnapshot = remoteReward
    ? serverReward.value?.achievements
    : localAchievements(state, round.id).snapshot;
  const learningReward = remoteReward
    ? serverReward.value?.learningAchievements
    : localLearningAchievementReward(state, round.id);
  const achievements = [
    ...reachedAchievements(
      achievementSnapshot ?? { completed: 0, perfectTens: 0, zeroTens: 0 },
    ),
    ...(learningReward ? reachedLearningAchievements(learningReward) : []),
  ];
  const hasSuccess =
    !!promotion || achievements.length > 0 || unlocks.length > 0;
  const successTier = celebrationTier(achievements, promotion?.level);
  const rewardReady = !remoteReward || serverReward.value !== undefined;
  useEffect(() => {
    if (!celebrate || !rewardReady || sounded.current === round.id) return;
    sounded.current = round.id;
    playFeedback(
      hasSuccess ? "success" : "complete",
      state.settings,
      successTier,
    );
  }, [
    celebrate,
    rewardReady,
    round.id,
    hasSuccess,
    successTier,
    state.settings,
  ]);
  const summary = roundSummary(
    state,
    round,
    remoteReward ? serverReward.value?.learning : undefined,
  );
  const { events, correct, improved, secured: secure } = summary;
  const now = useForegroundTime();
  const repetitions = useServerView(
    server && !trialActions
      ? {
          action: "round-repetitions",
          scope: round.id,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        }
      : null,
  );
  useEffect(() => {
    if (repetitions.value?.nextAt != null && repetitions.value.nextAt <= now)
      repetitions.retry();
  }, [now, repetitions.value?.nextAt]);
  const retryContext = server ? {} : repetitionContext(state, round.id);
  const retryCount = server
    ? (repetitions.value?.due ?? 0)
    : selectQuestions(
        state.questions,
        state.learning,
        {
          mode: "fehler",
          topic: round.topic,
          difficulty: round.difficulty,
          filters: round.filters,
          size: 10,
          now,
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
      {celebrate && rewardReady && hasSuccess && acknowledged !== round.id && (
        <UnlockCelebration
          unlocks={unlocks}
          promotion={promotion}
          achievements={achievements}
          onClose={() => {
            setAcknowledged(round.id);
            onAcknowledged?.();
          }}
        />
      )}
      <span className="eyebrow">
        {historicalModeName(round)} · {formatDate(round.finishedAt!)}
      </span>
      <h1 ref={resultHeading} tabIndex={-1}>
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
      {trialActions}
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
          <small>{recordSelectionLabel(round)}</small>
        </div>
      )}
      <div className="result-progress">
        {!!achievementSnapshot?.perfectTens && (
          <div className="result-achievements">
            <p>
              <strong>
                Perfekte Zehnerrunde Nr. {achievementSnapshot.perfectTens}
              </strong>
            </p>
            <AchievementProgress
              count={achievementSnapshot.perfectTens}
              milestones={perfectRoundMilestones}
              label={perfectRoundLabel}
            />
            <p className="tiny muted">
              Deine Abzeichen und weitere Ziele findest Du im Profil unter
              „Deine Erfolge“.
            </p>
          </div>
        )}
        {roundXp &&
          roundProgress &&
          roundProgress.before !== undefined &&
          roundProgress.after !== undefined && (
            <RoundExperience
              key={round.id}
              xp={roundXp}
              before={roundProgress.before}
              after={roundProgress.after}
              celebrate={celebrate}
            />
          )}
        {serverReward.error && (
          <p role="alert">
            Deine Rundenerfahrung konnte nicht geladen werden.{" "}
            <button className="text-button" onClick={serverReward.retry}>
              Erneut versuchen
            </button>
          </p>
        )}
        <div className="result-insights">
          <div>
            <strong>{summary.firstSolved}</strong>
            <span>Erstmals sicher gelöst</span>
          </div>
          <div>
            <strong>{summary.advanced}</strong>
            <span>Lernstufen verbessert</span>
          </div>
          <div>
            <strong>{summary.newGoals}</strong>
            <span>Neue Filmfakten entdeckt</span>
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
            ✧ {improved} Filmfakt{improved === 1 ? "" : "en"} in dieser Runde
            neu geübt.
          </p>
        )}
        {secure > 0 && (
          <p>
            ✦ {secure} Filmfakt{secure === 1 ? "" : "en"} nach Abstand
            gefestigt.
          </p>
        )}
        {!summary.advanced && !secure && (
          <p>
            Deine Antworten zählen. Für die nächste Lernstufe muss die
            Wiederholung fällig sein; pro Tag zählt eine neue Stufe.
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
      {(isRecordMode(round.mode) || leaderboardLabel) && (
        <button className="secondary" onClick={onLeaderboard}>
          {leaderboardLabel ?? "Bestenliste ansehen"} →
        </button>
      )}
      {!trialActions && (
        <div className="result-actions">
          {retryCount > 0 && (
            <button
              className="primary"
              onClick={onRetry}
              data-feedback="own"
              disabled={busy || active}
            >
              Fällige Fragen dieser Runde wiederholen ({retryCount}) →
            </button>
          )}
          <button
            className={retryCount ? "secondary" : "primary"}
            onClick={onHome}
          >
            {round.duel ? "Neues Duell starten" : "Neue Runde wählen"} →
          </button>
        </div>
      )}
      {!trialActions && retryCount > 0 && (
        <p className="muted tiny">
          {active
            ? "Setze zuerst Deine begonnene Runde fort oder beende sie auf der Startseite."
            : "Du wiederholst ausschließlich Fragen dieser Runde, deren Lerntermin erreicht ist."}
        </p>
      )}
      {!trialActions && (
        <button className="text-button muted" onClick={onHome}>
          {round.duel
            ? "Duellübersicht · Für heute reicht’s"
            : "Zur Startseite · Für heute reicht’s"}
        </button>
      )}
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
                  {q.presentation?.questionText ?? q.question}
                </summary>
                {!e.correct && (
                  <p
                    className={`chosen-answer answer-result ${e.answerId !== null ? "wrong" : ""}`}
                  >
                    Deine Antwort:{" "}
                    <strong>
                      {e.dontKnow
                        ? "Keine Ahnung"
                        : (q.answers.find((a) => a.id === e.answerId)?.text ??
                          "Zeit abgelaufen – keine Antwort")}
                    </strong>
                  </p>
                )}
                <p className="correct-answer answer-result correct">
                  Lösung:{" "}
                  <strong>
                    {q.answers.find((a) => a.id === q.correctId)?.text}
                  </strong>
                </p>
                <Explanation q={q} event={e}>
                  {e.guessed && <p className="muted">Als geraten markiert.</p>}
                  <LearningProgress
                    events={state.events}
                    evidence={serverReward.value?.learning?.find(
                      (x) => x.eventId === e.id,
                    )}
                    event={e}
                    now={Date.now()}
                    history={
                      !isRecordMode(round.mode) &&
                      !round.duel &&
                      state.settings.questionHistory !== "hidden" ? (
                        <QuestionHistory
                          events={state.events}
                          question={q}
                          currentEventId={e.id}
                          embedded
                        />
                      ) : undefined
                    }
                  />
                </Explanation>
              </details>
            )
          );
        })}
      </section>
    </div>
  );
}
