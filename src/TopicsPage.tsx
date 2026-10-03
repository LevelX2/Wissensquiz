import { useMemo } from "react";
import { catalogIndex } from "./catalogIndex";
import { type Question, type State, type RoundSetup } from "./model";
import { genreLabel } from "./filters";
import { categories, type Category, ACTORS } from "./categories";
import type { Page } from "./uiTypes";
import { TopicCard } from "./TopicCard";
import type * as React from "react";

export function TopicsPage({
  topicScope,
  setTopicScope,
  state,
  changeSetup,
  setPage,
  genres,
  playGenre,
}: {
  topicScope:
    | { kind: "genre"; name: string }
    | { kind: "category"; name: Category }
    | null;
  setTopicScope: React.Dispatch<
    React.SetStateAction<
      | { kind: "genre"; name: string }
      | { kind: "category"; name: Category }
      | null
    >
  >;
  state: State;
  changeSetup: (patch: Partial<RoundSetup>) => Promise<State | null>;
  setPage: React.Dispatch<React.SetStateAction<Page | "duels">>;
  genres: string[];
  playGenre: (genre: string) => Promise<void>;
}) {
  const catalog = useMemo(
    () => catalogIndex(state.questions),
    [state.questions],
  );
  const browseQuestions = topicScope
    ? ((topicScope.kind === "genre" ? catalog.genres : catalog.curated).get(
        topicScope.name,
      ) ?? [])
    : [];
  const scoped = useMemo(
    () => catalogIndex(browseQuestions),
    [browseQuestions],
  );
  const browseTopics = scoped.topics;
  return (
    <>
      {topicScope ? (
        <>
          <button className="text-button" onClick={() => setTopicScope(null)}>
            ← Zur Themenübersicht
          </button>
          <h1>
            {topicScope.kind === "genre"
              ? genreLabel(topicScope.name)
              : topicScope.name}
            : {topicScope.name === ACTORS ? "Personen" : "Filme & Reihen"}
          </h1>
          <p className="lead">
            {browseTopics.length}{" "}
            {topicScope.name === ACTORS
              ? "Schauspielerinnen und Schauspieler"
              : "Film- und Reihenblöcke"}{" "}
            mit Deinem Lernfortschritt.
          </p>
          <div className="topic-grid">
            {browseTopics.map((t) => (
              <TopicCard
                key={t}
                topic={t}
                state={state}
                questions={scoped.forTopic(t)}
              />
            ))}
          </div>
        </>
      ) : (
        <>
          <span className="eyebrow">DEIN NÄCHSTES KAPITEL</span>
          <h1>
            Welten zum <em>Entdecken.</em>
          </h1>
          <p className="lead">
            Wähle ein Filmgenre oder eine Kategorie und entdecke ihre Themen.
            Auf der Startseite kannst Du mehrere Genres und Schwierigkeitsstufen
            kombinieren.
          </p>
          <div className="topic-grid">
            {categories.map((category) => (
              <TopicCard
                key={category}
                topic={category}
                state={state}
                questions={catalog.curated.get(category) ?? []}
                onBrowse={() =>
                  setTopicScope({ kind: "category", name: category })
                }
                onPlay={async () => {
                  if (
                    await changeSetup({
                      categories: [category],
                      genres: null,
                      sources:
                        category === ACTORS
                          ? ["actors"]
                          : category === "Preisträger"
                            ? ["awards"]
                            : ["film"],
                      ...(category === ACTORS || category === "Preisträger"
                        ? { mode: "ueben", categories: [] }
                        : {}),
                    })
                  )
                    setPage("home");
                }}
              />
            ))}
            {genres.map((t) => (
              <TopicCard
                key={t}
                topic={t}
                genre
                state={state}
                questions={catalog.genres.get(t) ?? []}
                onPlay={() => playGenre(t)}
                onBrowse={() => setTopicScope({ kind: "genre", name: t })}
              />
            ))}
          </div>
        </>
      )}
    </>
  );
}
