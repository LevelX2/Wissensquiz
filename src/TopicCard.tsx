import { type Question, type State } from "./model";
import { genreOf, genreLabel, questionSourceOf } from "./filters";
import { GenreArtwork } from "./Icons";
import { categories, type Category, ACTORS, matchesTopic } from "./categories";

export function TopicCard({
  topic,
  state,
  onPlay,
  onBrowse,
  questions = state.questions,
  genre = false,
}: {
  topic: string;
  state: State;
  onPlay?: () => void;
  onBrowse?: () => void;
  questions?: Question[];
  genre?: boolean;
}) {
  const cardGenres = categories.includes(topic as Category)
    ? [topic]
    : genre
      ? [topic]
      : [
          ...new Set(
            questions.filter((q) => matchesTopic(q, topic)).map(genreOf),
          ),
        ].sort();
  const ids = [
    ...new Set(
      questions
        .filter((q) =>
          genre
            ? questionSourceOf(q) === "film" && genreOf(q) === topic
            : matchesTopic(q, topic),
        )
        .map((q) => q.knowledgeId),
    ),
  ];
  const counts = ["entdeckt", "geübt", "gefestigt"].map(
    (status) =>
      ids.filter((id) => state.learning[id]?.status === status).length,
  );
  return (
    <article className="topic-card">
      <div className="topic-art">
        <span
          className={cardGenres.length > 1 ? "topic-genres" : undefined}
          role="img"
          aria-label={cardGenres.map(genreLabel).join(" und ")}
        >
          {cardGenres.map((g) => (
            <GenreArtwork key={g} genre={g} />
          ))}
        </span>
        <div className="art-lines" />
      </div>
      <div className="topic-body">
        <span className="eyebrow">{ids.length} Wissensziele</span>
        <h3>{genre ? genreLabel(topic) : topic}</h3>
        <div className="mini-stats">
          <span>
            <b>{counts[0]}</b> entdeckt
          </span>
          <span>
            <b>{counts[1]}</b> geübt
          </span>
          <span>
            <b>{counts[2]}</b> gefestigt
          </span>
        </div>
        <progress
          value={counts[2]}
          max={ids.length}
          aria-label={`${counts[2]} von ${ids.length} Wissenszielen gefestigt`}
        />
        <p className="muted tiny">
          Ziel: {ids.length} vorhandene Wissensziele festigen
        </p>
        {onPlay && (
          <button className="text-button" onClick={onPlay}>
            {genre
              ? "Genre auswählen"
              : categories.includes(topic as Category)
                ? `${topic} spielen`
                : "Thema spielen"}{" "}
            <span>↗</span>
          </button>
        )}
        {onBrowse && (
          <button className="text-button" onClick={onBrowse}>
            {topic === ACTORS ? "Personen ansehen" : "Filme & Reihen ansehen"}{" "}
            <span>↗</span>
          </button>
        )}
      </div>
    </article>
  );
}
