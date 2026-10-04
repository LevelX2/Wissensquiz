import { type Question, type State } from "./model";
import { genreOf, genreLabel } from "./filters";
import { GenreArtwork } from "./Icons";
import { categories, type Category, ACTORS } from "./categories";
import { learningOverview } from "./learningProgress";

export function TopicCard({
  topic,
  state,
  onPlay,
  onBrowse,
  questions,
  genre = false,
}: {
  topic: string;
  state: State;
  onPlay?: () => void;
  onBrowse?: () => void;
  questions: Question[];
  genre?: boolean;
}) {
  const cardGenres = categories.includes(topic as Category)
    ? [topic]
    : genre
      ? [topic]
      : [...new Set(questions.map(genreOf))].sort();
  const ids = [...new Set(questions.map((q) => q.knowledgeId))];
  const progress = learningOverview(ids, state.learning);
  const counts = [progress.unseen, progress.discovered, ...progress.stages];
  const labels = [
    "Ungesehen",
    "Entdeckt",
    "Stufe 1/4",
    "Stufe 2/4",
    "Stufe 3/4",
    "Stufe 4/4",
  ];
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
        <div
          className="mini-stats learning-stage-counts"
          aria-label="Wissensziele nach Lernstufe"
        >
          {labels.map((label, i) => (
            <span key={label}>
              <b>{counts[i]}</b> {label}
            </span>
          ))}
        </div>
        <progress
          value={progress.steps}
          max={Math.max(1, progress.maximum)}
          aria-label={`${progress.steps} von ${progress.maximum} Lernstufen erreicht`}
        />
        <p className="muted tiny">
          {progress.percent.toLocaleString("de-DE")} % Lernfortschritt ·{" "}
          {progress.mastered} von {ids.length} gefestigt
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
