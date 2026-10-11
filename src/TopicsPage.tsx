import { useServerView, type TopicSummary } from "./serverViews";
import { ServerTopicList } from "./ServerTopicList";

import { type State, type RoundSetup } from "./model";
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
  const areas = useServerView<TopicSummary[]>({ action: "areas" });
  const summaries = new Map(areas.value?.map((a) => [a.topic, a]));
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
          <ServerTopicList
            key={topicScope.kind + topicScope.name}
            state={state}
            scope={topicScope}
          />
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
          {areas.error && (
            <p role="alert">
              {areas.error}
              <button onClick={areas.retry}>Erneut versuchen</button>
            </p>
          )}
          {!areas.value && <p role="status">Die Übersicht wird geladen …</p>}
          <div className="topic-grid">
            {areas.value &&
              categories.map((category) => (
                <TopicCard
                  key={category}
                  topic={category}
                  state={state}
                  summary={summaries.get(category)}
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
            {areas.value &&
              genres.map((t) => (
                <TopicCard
                  key={t}
                  topic={t}
                  genre
                  state={state}
                  summary={summaries.get(t)}
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
