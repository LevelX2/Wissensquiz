import { useMemo } from "react";
import { catalogIndex } from "./catalogIndex";
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
  const catalog = useMemo(
    () => catalogIndex(state.questions),
    [state.questions],
  );
  const topics = catalog.topics;
  const startedTopics = answeredOnly
    ? answeredTopics(state)
    : new Set<string>();
  const albumTopics = topics.filter(
    (t) => !answeredOnly || startedTopics.has(t),
  );
  const completed = state.rounds.filter((r) => r.status === "completed");
  const mastered = Object.values(state.learning).filter(
    (p) => p.status === "gefestigt",
  ).length;
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
          <span>Fachwissen</span>
          <strong>
            {mastered}
            <small> gefestigt</small>
          </strong>
          <p>
            {Object.keys(state.learning).length} unterschiedliche Ziele gesehen
          </p>
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
      <div className="section-title">
        <h2>Dein Expertenalbum</h2>
      </div>
      <p className="muted">
        Die drei Status zählen getrennt. Gefestigt heißt: mehrfach sicher, an
        verschiedenen Tagen und nach mindestens sieben Tagen erneut bestätigt.
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
      <p className="tiny muted" role="status">
        {albumTopics.length} von {topics.length} Einträgen
      </p>
      {answeredOnly && albumTopics.length === 0 && (
        <div className="notice">
          <p>
            Noch keine Einträge mit beantworteten Fragen. Sobald Du in einem
            Thema eine Antwort auswählst, erscheint es hier – richtig oder
            falsch.
          </p>
          <button className="secondary" onClick={() => setAnsweredOnly(false)}>
            Alle Einträge anzeigen
          </button>
        </div>
      )}
      <div className="topic-grid">
        {albumTopics.map((t) => (
          <TopicCard
            key={t}
            topic={t}
            state={state}
            questions={catalog.forTopic(t)}
          />
        ))}
      </div>
      {(new Set(state.questions.filter(badgeEligible).map((q) => q.knowledgeId))
        .size >= 10 ||
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
            <h2>Sci-Fi – 10 leichte Wissensziele gefestigt</h2>
            <p>
              {state.badges.length
                ? "Deine Auszeichnung bleibt erhalten, auch wenn der Bestand wächst."
                : "Festige zehn Wissensziele der Stufe „leicht“ aus Film / Science-Fiction. Erfahrungspunkte zählen dafür nicht."}
            </p>
            <p>
              {
                new Set(
                  state.questions
                    .filter(
                      (q) =>
                        badgeEligible(q) &&
                        state.learning[q.knowledgeId]?.status === "gefestigt",
                    )
                    .map((q) => q.knowledgeId),
                ).size
              }{" "}
              von 10 Wissenszielen gefestigt
            </p>
            <small className="muted">
              Begrenzte Auszeichnung für diesen Bestand, kein umfassender
              Expertentitel.
            </small>
            <p className="muted tiny">
              Bisher gibt es dieses eine Wissensabzeichen. Für die anderen
              Genres sind noch keine eigenen Abzeichen umgesetzt.
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
