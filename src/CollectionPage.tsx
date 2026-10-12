import { useServerView, type LearningOverview } from "./serverViews";
import { ServerTopicList } from "./ServerTopicList";

import { answeredTopics } from "./collection";
import { badgeEligible } from "./engine";
import { type State, type RoundSetup } from "./model";
import { roundGenres, roundDifficulties } from "./filters";
import { BadgeIcon } from "./Icons";
import { Leaderboard } from "./RecordLeaderboard";
import { careerProgress } from "./career";
import { CareerProgress } from "./CareerProgress";
import type { Page, DuelPage } from "./uiTypes";
import { historicalModeName, formatDate } from "./gameUi";
import { TopicCard } from "./TopicCard";
import type * as React from "react";
import { roundQuestionCount } from "./roundArchive";
import { learningOverview } from "./learningProgress";
import { DiscoveryMedals } from "./DiscoveryMedals";

export function CollectionPage({
  state,
  answeredOnly,
  setAnsweredOnly,
  setPage,
  nav,
  changeSetup,
}: {
  state: State;
  answeredOnly: boolean;
  setAnsweredOnly: React.Dispatch<React.SetStateAction<boolean>>;
  setPage: React.Dispatch<React.SetStateAction<Page | "duels">>;
  nav: (next: Page | DuelPage) => Promise<void>;
  changeSetup: (patch: Partial<RoundSetup>) => Promise<State | null>;
}) {
  const completed = state.rounds.filter((r) => r.status === "completed");
  const summary = useServerView<
    LearningOverview & { badge: { available: number; mastered: number } }
  >({ action: "summary" });
  const learning = summary.value ?? {
    unseen: 0,
    discovered: 0,
    stages: [0, 0, 0, 0],
    steps: 0,
    maximum: 0,
    percent: 0,
    mastered: 0,
  };
  return (
    <>
      <span className="eyebrow">DAS BLEIBT BEI DIR</span>
      <h1>
        Deine <em>Sammlung.</em>
      </h1>
      <p className="lead">
        Deine Filmkarriere wächst mit Deinen Antworten und Lernfortschritten.
        Fachwissen festigt sich mit sicheren Antworten über mehrere Tage.
      </p>
      <div className="stat-grid">
        <div>
          <span>Erfahrung</span>
          <strong>
            {state.experience}
            <small> XP</small>
          </strong>
          <p>
            Level {careerProgress(state.experience).level} ·{" "}
            {careerProgress(state.experience).title}
          </p>
        </div>
        <div>
          <span>Lernfortschritt</span>
          <strong>
            {learning.steps}
            <small> Lernstufen</small>
          </strong>
          <p>
            {learning.steps} von {learning.maximum} Lernstufen erreicht ·{" "}
            {learning.mastered} Filmfakten gefestigt
          </p>
          <progress
            value={learning.steps}
            max={Math.max(1, learning.maximum)}
            aria-label="Lernfortschritt im aktuellen Fragenbestand"
          />
        </div>
        <div>
          <span>Lokale Trainingsrekorde</span>
          <strong>
            {Object.keys(state.records).length}
            <small> Bestwerte</small>
          </strong>
          <p>Getrennt nach Thema, Stufe und Rundengröße</p>
        </div>
      </div>
      <CareerProgress
        experience={state.experience}
        legacyBonus={state.career?.legacyBonus}
      />
      {summary.value && (
        <DiscoveryMedals
          encountered={summary.value.maximum / 4 - summary.value.unseen}
        />
      )}
      <div className="section-title">
        <h2>Dein Expertenalbum</h2>
      </div>
      <p className="muted">
        Jede der vier Lernstufen zählt zum Fortschrittsbalken. Stufe 1 heißt:
        einmal sicher gelöst. Weitere Stufen erreichst Du mit fälligen
        Wiederholungen. Vier Stufen ergeben im normalen Ablauf „gefestigt“.
      </p>
      <div className="ranking-tabs" role="group" aria-label="Sammlungsfilter">
        <button
          className={!answeredOnly ? "primary" : "secondary"}
          aria-pressed={!answeredOnly}
          onClick={() => setAnsweredOnly(false)}
        >
          Alle
        </button>
        <button
          className={answeredOnly ? "primary" : "secondary"}
          aria-pressed={answeredOnly}
          onClick={() => setAnsweredOnly(true)}
        >
          Mit beantworteten Fragen
        </button>
      </div>
      <ServerTopicList
        key={String(answeredOnly)}
        state={state}
        answeredOnly={answeredOnly}
      />
      {((summary.value?.badge.available ?? 0) >= 10 ||
        state.badges.length > 0) && (
        <section className="badge-panel">
          <span
            className={`badge-art ${state.badges.includes("sci-fi-10-v1") ? "earned" : "locked"}`}
          >
            <BadgeIcon earned={state.badges.includes("sci-fi-10-v1")} />
          </span>
          <div>
            <span className="eyebrow">
              {state.badges.length
                ? "AUSZEICHNUNG ERWORBEN"
                : "DEIN NÄCHSTES WISSENSZIEL"}
            </span>
            <h2>Sci-Fi – 10 leichte Filmfakten gefestigt</h2>
            <p>
              {state.badges.length
                ? "Deine Auszeichnung bleibt erhalten, auch wenn der Bestand wächst."
                : "Festige zehn Filmfakten der Stufe „leicht“ aus Film / Science-Fiction. Erfahrungspunkte zählen dafür nicht."}
            </p>
            <p>
              {summary.value?.badge.mastered ?? 0} von 10 Filmfakten gefestigt
            </p>
            <small className="muted">
              Begrenzte Auszeichnung für diesen Bestand, kein umfassender
              Expertentitel.
            </small>
            <p className="muted tiny">
              Dieses Wissensabzeichen belohnt gefestigtes Sci-Fi-Wissen.
              Entdecker-Medaillen zählen dagegen kennengelernte Ziele über alle
              Bereiche.
            </p>
          </div>
        </section>
      )}
      <section>
        <h2>Deine letzten Runden</h2>
        {completed.length === 0 ? (
          <p className="muted">
            Hier erscheinen die Ergebnisse Deiner abgeschlossenen Runden.
          </p>
        ) : (
          <div className="history">
            {[...completed]
              .reverse()
              .slice(0, 20)
              .map((r) => (
                <article key={r.id}>
                  <div>
                    <b>
                      {historicalModeName(r)} · {roundGenres(r)}
                    </b>
                    <small>
                      {formatDate(r.finishedAt!)} · {roundQuestionCount(r)}{" "}
                      Fragen · {roundDifficulties(r)}
                    </small>
                  </div>
                  <span>
                    {
                      state.events.filter(
                        (e) => e.roundId === r.id && e.correct,
                      ).length
                    }
                    /{roundQuestionCount(r)} richtig
                  </span>
                </article>
              ))}
          </div>
        )}
      </section>
      <Leaderboard
        state={state}
        onAccount={() => void nav("account")}
        onPlay={() => {
          void changeSetup({ mode: "rekord" }).then((saved) => {
            if (saved) setPage("home");
          });
        }}
      />{" "}
    </>
  );
}
