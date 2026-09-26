import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  answer,
  badgeEligible,
  complete,
  elapsed,
  guess,
  learn,
  points,
  selectQuestions,
  startRound,
} from "./engine";
import { importCsv } from "./importer";
import {
  emptyState,
  uid,
  type AnswerEvent,
  type ImportReport,
  type Mode,
  type Question,
  type Round,
  type State,
  type Difficulty,
} from "./model";
import {
  difficulties,
  difficultyLabel,
  genreOf,
  genreLabel,
  roundGenres,
  roundDifficulties,
} from "./filters";
import {
  download,
  read as readStored,
  restore as restoreStored,
  update as updateStored,
  validateBackup,
} from "./storage";
import { useOffline } from "./offline";
import { BadgeIcon, GenreArtwork } from "./Icons";
import { Leaderboard } from "./RecordLeaderboard";
import { Help } from "./Help";
import { answeredTopics } from "./collection";
import { QuestionHistory } from "./QuestionHistoryPanel";
import {
  categories,
  type Category,
  categoryTopic,
  matchesCategories,
  matchesTopic,
} from "./categories";
import { discoveryContext } from "./discovery";
import { LearningPath } from "./LearningPathPanel";
import { UnlockCelebration } from "./UnlockCelebration";
import {
  learningPathProgress,
  pathQuestions,
  newlyUnlocked,
  type PathUnlock,
} from "./learningPath";
import { filmDetails } from "./filmDetails";
import { questionTitleParts } from "./questionTitle";
import {
  playFeedback,
  stopFeedback,
  supportsHaptics,
  unlockSound,
} from "./feedback";
import {
  addPackages,
  hasPackage,
  packages,
  type PackageContent,
} from "./packages";

type Page =
  | "account"
  | "leaderboard"
  | "home"
  | "topics"
  | "album"
  | "settings"
  | "help"
  | "round"
  | "result";
type Mutate = (fn: (s: State) => void) => Promise<State | null>;
const modeNames: Record<Mode, string> = {
  entdecken: "Entdecken",
  ueben: "Besser werden",
  rekord: "Rekordrunde",
};
const formatDate = (at: number) =>
  new Date(at).toLocaleDateString("de-DE", { day: "numeric", month: "short" });
function Pill({ children }: { children: ReactNode }) {
  return <span className="pill">{children}</span>;
}
function TopicCard({
  topic,
  state,
  onPlay,
  onFavorite,
  genre = false,
}: {
  topic: string;
  state: State;
  onPlay: () => void;
  onFavorite?: () => void;
  genre?: boolean;
}) {
  const cardGenres = categories.includes(topic as Category)
    ? [topic]
    : genre
      ? [topic]
      : [
          ...new Set(
            state.questions.filter((q) => matchesTopic(q, topic)).map(genreOf),
          ),
        ].sort();
  const ids = [
    ...new Set(
      state.questions
        .filter((q) => (genre ? genreOf(q) === topic : matchesTopic(q, topic)))
        .map((q) => q.knowledgeId),
    ),
  ];
  const counts = ["entdeckt", "geübt", "gefestigt"].map(
    (status) =>
      ids.filter((id) => state.learning[id]?.status === status).length,
  );
  const favorite = state.favorites.includes(topic);
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
        {onFavorite && (
          <button
            className="favorite"
            aria-label={`${favorite ? "Favorit entfernen" : "Als Favorit markieren"}: ${topic}`}
            aria-pressed={favorite}
            onClick={onFavorite}
          >
            {favorite ? "★" : "☆"}
          </button>
        )}
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
        <button className="text-button" onClick={onPlay}>
          {genre
            ? "Genre auswählen"
            : categories.includes(topic as Category)
              ? `${topic} spielen`
              : "Thema spielen"}{" "}
          <span>↗</span>
        </button>
      </div>
    </article>
  );
}
export function App({
  storageKey = "current",
  accountPanel,
  onPersistedState,
}: {
  storageKey?: string;
  accountPanel?: (state: State, onState: (state: State) => void) => ReactNode;
  onPersistedState?: (state: State) => void;
}) {
  const read = () => readStored(storageKey);
  const update = (fn: (s: State) => void, initial?: State) =>
    updateStored(fn, initial, storageKey);
  const [state, setState] = useState<State | null>(null);
  const [page, setPage] = useState<Page>("home");
  const [answeredOnly, setAnsweredOnly] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<Mode>("entdecken");
  const [topic, setTopic] = useState("Alle Themen");
  const [selectedCategories, setSelectedCategories] = useState<Category[]>([]);
  const [selectedGenres, setSelectedGenres] = useState<string[] | null>(null);
  const [selectedDifficulties, setSelectedDifficulties] = useState<
    Difficulty[]
  >([...difficulties]);
  const [roundId, setRoundId] = useState("");
  const [index, setIndex] = useState(0);
  const [celebration, setCelebration] = useState<{
    roundId: string;
    unlocks: PathUnlock[];
  } | null>(null);
  const heading = useRef<HTMLElement>(null);
  const booted = useRef(false);
  const inFlight = useRef(false);
  const offline = useOffline();
  useEffect(() => {
    if (state) onPersistedState?.(state);
  }, [state, onPersistedState]);
  useEffect(() => {
    if (booted.current) return;
    booted.current = true;
    (async () => {
      const initial = (await read()) ?? emptyState();
      const incoming: PackageContent[] = [];
      for (const pkg of packages) {
        if (hasPackage(initial, pkg.filename)) continue;
        try {
          const response = await fetch(pkg.path);
          if (!response.ok) throw new Error("Download fehlgeschlagen");
          incoming.push({
            filename: pkg.filename,
            text: await response.text(),
          });
        } catch {
          if (!initial.questions.length)
            throw new Error("Fragenpaket konnte nicht geladen werden.");
          setError(
            "Ein neues Fragenpaket ist noch nicht verfügbar. Dein gespeicherter Bestand bleibt spielbar. Lade die App später mit Internetverbindung neu.",
          );
        }
      }
      const loaded = await update((s) => {
        addPackages(s, incoming);
        for (const r of s.rounds)
          if (r.status === "active" && r.mode === "rekord") {
            r.status = "aborted";
            r.finishedAt = Date.now();
          }
      }, initial);
      setState(loaded);
    })().catch((e) =>
      setError(
        `Lokaler Speicher nicht verfügbar: ${String(e)}. Bitte Browser-Speicher freigeben und neu laden.`,
      ),
    );
  }, []);
  useEffect(() => {
    heading.current?.focus();
    window.scrollTo(0, 0);
  }, [page, index]);
  const mutate: Mutate = async (fn) => {
    if (inFlight.current) return null;
    inFlight.current = true;
    setBusy(true);
    setError("");
    try {
      const next = await update(fn);
      setState(next);
      return next;
    } catch (e) {
      setError(
        `Nicht gespeichert: ${e instanceof Error ? e.message : String(e)}`,
      );
      return null;
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  };
  const nav = async (next: Page) => {
    setCelebration(null);
    if (
      page === "round" &&
      state?.rounds.find((r) => r.id === roundId)?.mode === "rekord"
    ) {
      const saved = await mutate((s) => {
        const r = s.rounds.find((r) => r.id === roundId);
        if (r?.status === "active") {
          r.status = "aborted";
          r.finishedAt = Date.now();
        }
      });
      if (!saved) return;
    }
    setPage(next);
  };
  if (!state)
    return (
      <main className="loading">
        <img src="/icon.svg" width="64" alt="" />
        <h1>Dein Filmkosmos wird vorbereitet.</h1>
        <p role="status">
          {error || "Fragen und Lernfortschritt werden geladen …"}
        </p>
        {error && (
          <button onClick={() => location.reload()}>Erneut versuchen</button>
        )}
      </main>
    );
  const topics = [...new Set(state.questions.map((q) => q.topic))].sort();
  const startedTopics =
    page === "album" ? answeredTopics(state) : new Set<string>();
  const albumTopics = topics.filter(
    (t) => !answeredOnly || startedTopics.has(t),
  );
  const genres = [...new Set(state.questions.map(genreOf))].sort();
  const filters = {
    genres: selectedGenres ?? genres,
    difficulties: state.settings.allDifficulties
      ? selectedDifficulties
      : [...difficulties],
  };
  const availableTopics = topics.filter((t) =>
    state.questions.some(
      (q) =>
        q.topic === t &&
        filters.genres.includes(genreOf(q)) &&
        matchesCategories(q, selectedCategories),
    ),
  );
  const toggleGenre = (genre: string) => {
    setSelectedGenres(
      filters.genres.includes(genre)
        ? filters.genres.filter((g) => g !== genre)
        : [...filters.genres, genre],
    );
    setTopic("Alle Themen");
  };
  const playGenre = (genre: string) => {
    setSelectedCategories([]);
    setSelectedGenres([genre]);
    setTopic("Alle Themen");
    setPage("home");
  };
  const completed = state.rounds.filter((r) => r.status === "completed");
  const active = state.rounds.find((r) => r.status === "active");
  const current = state.rounds.find((r) => r.id === roundId);
  const targetSize = completed.length ? 10 : 5;
  const roundTopic = categoryTopic(topic, selectedCategories);
  const selection = selectQuestions(
    pathQuestions(state),
    state.learning,
    {
      mode,
      topic: roundTopic,
      difficulty: "Alle Stufen",
      filters,
      size: targetSize,
      now: Date.now(),
      ...(mode === "entdecken" ? discoveryContext(state) : {}),
    },
    () => 0.5,
  );
  const begin = async () => {
    unlockSound(state.settings);
    let id = "";
    const next = await mutate((s) => {
      s.settings.spoilers = true;
      id = startRound(s, {
        mode,
        topic: roundTopic,
        difficulty: "Alle Stufen",
        filters,
      }).id;
    });
    if (next) {
      playFeedback("start", next.settings);
      setRoundId(id);
      setIndex(0);
      setPage("round");
    }
  };
  const resume = () => {
    if (active) {
      unlockSound(state.settings);
      setRoundId(active.id);
      setIndex(Math.max(0, active.events.length - 1));
      setPage("round");
    }
  };
  const playTopic = (t: string) => {
    setSelectedCategories([]);
    setSelectedGenres([
      ...new Set(state.questions.filter((q) => q.topic === t).map(genreOf)),
    ]);
    setTopic(t);
    setMode("ueben");
    setPage("home");
  };
  const mastered = Object.values(state.learning).filter(
    (p) => p.status === "gefestigt",
  ).length;
  const favorite = async (t: string) => {
    await mutate((s) => {
      if (s.favorites.includes(t))
        s.favorites = s.favorites.filter((x) => x !== t);
      else if (s.favorites.length < 3) s.favorites.push(t);
      else
        throw new Error(
          "Du kannst bis zu drei Favoriten auswählen. Entferne zuerst einen anderen.",
        );
    });
  };
  return (
    <div className={`app-shell ${page === "round" ? "is-playing" : ""}`}>
      <aside className="sidebar">
        <a
          className="brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            void nav("home");
          }}
        >
          <img src="/icon.svg" alt="" />
          <span>
            Wissensquiz<small>DEIN FILMKOSMOS</small>
          </span>
        </a>
        <nav aria-label="Hauptnavigation">
          {(
            [
              ["home", "◉", "Spielen"],
              ["topics", "▦", "Themen"],
              ["album", "☆", "Sammlung"],
              ["leaderboard", "♜", "Highscores"],
              ["account", "♙", "Profil"],
            ] as const
          ).map(([p, icon, label]) => (
            <button
              key={p}
              className={
                page === p || (p === "account" && page === "settings")
                  ? "selected"
                  : ""
              }
              aria-current={
                page === p || (p === "account" && page === "settings")
                  ? "page"
                  : undefined
              }
              onClick={() => void nav(p)}
            >
              <span aria-hidden="true">{icon}</span>
              {label}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="level-dot">
            {1 + Math.floor(state.experience / 100)}
          </div>
          <div>
            <b>Neugier bringt Dich weiter.</b>
            <small>
              {state.experience} Erfahrung · Level{" "}
              {1 + Math.floor(state.experience / 100)}
            </small>
          </div>
        </div>
      </aside>
      <div className={`workspace ${page === "home" ? "cinema-home" : ""}`}>
        {!offline.online && (
          <header className="topbar">
            <span className="connection" role="status">
              Offline · lokal gespeichert
            </span>
          </header>
        )}
        <main
          ref={heading}
          tabIndex={-1}
          className={`main-content ${page === "round" ? "playing" : ""}`}
        >
          {error && (
            <div role="alert" className="notice error">
              {error}
            </div>
          )}
          {offline.waiting && page !== "round" && page !== "settings" && (
            <p className="notice" role="status">
              Eine neue Quiz-Version ist bereit. Schließe nach Deiner Runde alle
              Quiz-Tabs und gegebenenfalls die installierte Quiz-App. Öffne sie
              danach erneut. Dein Fortschritt bleibt erhalten.
            </p>
          )}
          {page === "home" && (
            <>
              <header className="play-heading">
                <h1>
                  {completed.length ? "Deine nächste Runde" : "Dein Filmquiz"}
                </h1>
                {!completed.length && (
                  <p className="muted">
                    Entdecke Filmwissen – in Deinem Tempo.
                  </p>
                )}
              </header>
              <section className="round-setup" aria-label="Runde vorbereiten">
                <div className="section-title">
                  <h2>Wie möchtest Du spielen?</h2>
                </div>
                <div className="mode-grid">
                  {(["entdecken", "ueben", "rekord"] as Mode[]).map((m, i) => (
                    <button
                      key={m}
                      className={`mode-card mode-${m} ${mode === m ? "active" : ""}`}
                      aria-pressed={mode === m}
                      onClick={() => setMode(m)}
                    >
                      <img
                        className="mode-artwork"
                        src={`/modes/${m}.png`}
                        alt=""
                        width={88}
                        height={88}
                        decoding="async"
                      />
                      <strong>{modeNames[m]}</strong>
                      <small>
                        {
                          [
                            "Neue Ideen & bekannte Welten",
                            "Wissen in Ruhe festigen",
                            "30 Sekunden. Dein persönlicher Rekord.",
                          ][i]
                        }
                      </small>
                      {mode === m && (
                        <span className="mode-check" aria-hidden="true">
                          ✓
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                <div className="round-start">
                  <button
                    className="primary"
                    disabled={busy || !selection.length || !!active}
                    onClick={() => void begin()}
                    aria-describedby="round-summary"
                  >
                    Losspielen <span>→</span>
                  </button>
                  <p
                    id="round-summary"
                    className="tiny muted"
                    aria-live="polite"
                  >
                    {filters.genres.length === genres.length
                      ? "Alle Genres"
                      : filters.genres.length
                        ? filters.genres.map(genreLabel).join(" + ")
                        : "Kein Genre"}
                    {" · "}
                    {selection.length} Fragen{" · "}
                    {state.settings.allDifficulties
                      ? "Freie Auswahl: " +
                        (selectedDifficulties.length
                          ? selectedDifficulties
                              .map(difficultyLabel)
                              .join(" + ")
                          : "keine Stufe")
                      : "Lernpfad"}
                    {roundTopic !== "Alle Themen" && " · " + roundTopic}
                  </p>
                </div>
                {active && (
                  <div className="resume notice">
                    <span>Deine begonnene Runde wartet auf Dich.</span>
                    <button onClick={resume}>Fortsetzen →</button>
                    <button
                      className="text-button"
                      onClick={() =>
                        void mutate((s) => {
                          const r = s.rounds.find((r) => r.id === active.id)!;
                          r.status = "aborted";
                          r.finishedAt = Date.now();
                        })
                      }
                    >
                      Runde beenden
                    </button>
                  </div>
                )}

                <p className="spoiler-note">
                  Hinweis: Filmfragen können Handlung verraten. Du startest mit{" "}
                  {selection.length} unterschiedlichen Wissenszielen.
                  {mode === "rekord"
                    ? " Die Uhr läuft bei einem Tabwechsel weiter; Neuladen beendet die Rekordrunde."
                    : ""}
                </p>
                {!selection.length ? (
                  <p role="status" className="notice">
                    Wähle mindestens ein Genre und eine Schwierigkeitsstufe mit
                    verfügbaren Fragen.
                  </p>
                ) : (
                  selection.length < targetSize && (
                    <p className="tiny muted">
                      Die Runde ist an Deinen Bestand angepasst. Fällige Inhalte
                      werden auf höchstens fünf pro Runde begrenzt.
                    </p>
                  )
                )}

                <div className="quiz-filters">
                  <fieldset>
                    <legend>Filmgenres</legend>
                    <p className="muted tiny">
                      Ein oder mehrere Genres kombinieren.
                    </p>
                    <div className="filter-options genre-options">
                      {genres.map((g) => (
                        <label className="filter-choice" key={g}>
                          <input
                            type="checkbox"
                            checked={filters.genres.includes(g)}
                            onChange={() => toggleGenre(g)}
                          />
                          <GenreArtwork genre={g} compact />
                          <span>{genreLabel(g)}</span>
                        </label>
                      ))}
                    </div>
                    <button
                      className="text-button"
                      onClick={() => {
                        setSelectedGenres(null);
                        setTopic("Alle Themen");
                      }}
                    >
                      Alle Genres auswählen
                    </button>
                    <button
                      className="text-button"
                      onClick={() => {
                        setSelectedGenres([]);
                        setTopic("Alle Themen");
                      }}
                    >
                      Alle Genres abwählen
                    </button>
                  </fieldset>
                  <fieldset>
                    <legend>Zusätzliche Kategorien</legend>
                    {categories.map((category) => (
                      <label className="filter-choice" key={category}>
                        <input
                          type="checkbox"
                          checked={selectedCategories.includes(category)}
                          onChange={(e) => {
                            setSelectedCategories(
                              e.target.checked
                                ? [...selectedCategories, category]
                                : selectedCategories.filter(
                                    (c) => c !== category,
                                  ),
                            );
                            setTopic("Alle Themen");
                          }}
                        />
                        <GenreArtwork genre={category} compact />
                        Nur {category}
                      </label>
                    ))}
                    <p className="tiny muted">
                      Kuratierte Auswahlen innerhalb Deiner Genres. Beide
                      gewählt: Classics oder Arthouse. Gemeinsame Fragen zählen
                      nur einmal.
                    </p>
                  </fieldset>
                  <details
                    className="difficulty-options"
                    open={state.settings.allDifficulties || undefined}
                  >
                    <summary>Schwierigkeit selbst wählen</summary>
                    <p className="tiny muted">
                      Im Lernpfad wählt die App aus Deinen freigeschalteten
                      Stufen je Genre. Hier kannst Du stattdessen frei wählen.
                    </p>
                    <label className="filter-choice">
                      <input
                        type="checkbox"
                        checked={state.settings.allDifficulties === true}
                        disabled={busy}
                        onChange={(e) => {
                          const enabled = e.target.checked;
                          void mutate((s) => {
                            s.settings.allDifficulties = enabled;
                          });
                        }}
                      />
                      Alle Schwierigkeitsstufen freigeben
                    </label>
                    {state.settings.allDifficulties && (
                      <>
                        <p className="tiny muted">
                          Freie Auswahl: Alle Stufen stehen Dir zur Wahl.
                          Sichere Antworten zählen weiterhin für Deinen
                          Lernpfad.
                        </p>
                        <fieldset>
                          <legend>Schwierigkeitsstufen</legend>
                          <div className="filter-options">
                            {difficulties.map((d) => (
                              <label className="filter-choice" key={d}>
                                <input
                                  type="checkbox"
                                  checked={selectedDifficulties.includes(d)}
                                  onChange={() =>
                                    setSelectedDifficulties(
                                      selectedDifficulties.includes(d)
                                        ? selectedDifficulties.filter(
                                            (x) => x !== d,
                                          )
                                        : [...selectedDifficulties, d],
                                    )
                                  }
                                />
                                <span>{difficultyLabel(d)}</span>
                              </label>
                            ))}
                          </div>
                          <button
                            className="text-button"
                            onClick={() =>
                              setSelectedDifficulties([...difficulties])
                            }
                          >
                            Alle Stufen auswählen
                          </button>
                        </fieldset>
                      </>
                    )}
                  </details>
                  <LearningPath state={state} genres={filters.genres} />
                  <details
                    className="fine-filter"
                    open={topic !== "Alle Themen" ? true : undefined}
                  >
                    <summary>Optional: einzelne Filme oder Filmreihen</summary>
                    <label>
                      Thema wählen
                      <select
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                      >
                        <option>Alle Themen</option>
                        {availableTopics.map((t) => (
                          <option key={t}>{t}</option>
                        ))}
                      </select>
                    </label>
                  </details>
                </div>
              </section>
              <section className="journey-strip">
                <span className="journey-icon">✺</span>
                <div>
                  <h3>Jede Entdeckung ist ein Anfang.</h3>
                  <p>
                    {Object.keys(state.learning).length} Wissensziele entdeckt ·{" "}
                    {mastered} gefestigt · {completed.length} Runden
                    abgeschlossen
                  </p>
                </div>
                <button
                  className="text-button"
                  onClick={() => setPage("album")}
                >
                  Deine Sammlung <span>↗</span>
                </button>
              </section>
              <section>
                <div className="section-title">
                  <div>
                    <span className="eyebrow">EIN KOSMOS VOLLER IDEEN</span>
                    <h2>Wohin führt Deine Neugier?</h2>
                  </div>
                  <button
                    className="text-button"
                    onClick={() => setPage("topics")}
                  >
                    Alle Genres ↗
                  </button>
                </div>
                <div className="topic-grid">
                  {genres.map((t) => (
                    <TopicCard
                      key={t}
                      topic={t}
                      genre
                      state={state}
                      onPlay={() => playGenre(t)}
                    />
                  ))}
                </div>
              </section>
              <p className="demo-label">
                {state.questions.every((q) => q.demo)
                  ? "TESTAUSGABE · Gekennzeichnete Demo-Fragen zu Filmhandwerk und Science-Fiction-Ideen."
                  : `${state.questions.filter((q) => !q.demo).length} importierte Fragen · ${new Set(state.questions.map((q) => q.knowledgeId)).size} Wissensziele · ${state.questions.filter((q) => q.demo).length} Demo-Fragen. Details unter Profil → Optionen.`}
              </p>
            </>
          )}
          {page === "topics" && (
            <>
              <span className="eyebrow">DEIN NÄCHSTES KAPITEL</span>
              <h1>
                Welten zum <em>Entdecken.</em>
              </h1>
              <p className="lead">
                Wähle ein Filmgenre. Auf der Startseite kannst Du mehrere Genres
                und Schwierigkeitsstufen kombinieren.
              </p>
              <div className="topic-grid">
                {categories.map((category) => (
                  <TopicCard
                    key={category}
                    topic={category}
                    state={state}
                    onPlay={() => {
                      setSelectedCategories([category]);
                      setSelectedGenres(null);
                      setTopic("Alle Themen");
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
                    onPlay={() => playGenre(t)}
                  />
                ))}
              </div>
            </>
          )}
          {page === "album" && (
            <>
              <span className="eyebrow">DAS BLEIBT BEI DIR</span>
              <h1>
                Deine <em>Sammlung.</em>
              </h1>
              <p className="lead">
                Erfahrung erzählt, wie oft Du spielst. Fachwissen wächst mit
                sicheren Antworten über mehrere Tage.
              </p>
              <div className="stat-grid">
                <div>
                  <span>Erfahrung</span>
                  <strong>
                    {state.experience}
                    <small> XP</small>
                  </strong>
                  <p>
                    Level {1 + Math.floor(state.experience / 100)} · 10 XP je
                    abgeschlossener Runde
                  </p>
                </div>
                <div>
                  <span>Fachwissen</span>
                  <strong>
                    {mastered}
                    <small> gefestigt</small>
                  </strong>
                  <p>
                    {Object.keys(state.learning).length} unterschiedliche Ziele
                    gesehen
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
              <div className="section-title">
                <h2>Dein Expertenalbum</h2>
                <span className="muted">
                  {state.favorites.length}/3 Favoriten
                </span>
              </div>
              <p className="muted">
                Die drei Status zählen getrennt. Gefestigt heißt: mehrfach
                sicher, an verschiedenen Tagen und nach mindestens sieben Tagen
                erneut bestätigt.
              </p>
              <div
                className="ranking-tabs"
                role="group"
                aria-label="Sammlungsfilter"
              >
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
                    Noch keine Einträge mit beantworteten Fragen. Sobald Du in
                    einem Thema eine Antwort auswählst, erscheint es hier –
                    richtig oder falsch.
                  </p>
                  <button
                    className="secondary"
                    onClick={() => setAnsweredOnly(false)}
                  >
                    Alle Einträge anzeigen
                  </button>
                </div>
              )}
              <div className="topic-grid">
                {[...albumTopics]
                  .sort(
                    (a, b) =>
                      Number(state.favorites.includes(b)) -
                      Number(state.favorites.includes(a)),
                  )
                  .map((t) => (
                    <TopicCard
                      key={t}
                      topic={t}
                      state={state}
                      onPlay={() => playTopic(t)}
                      onFavorite={() => void favorite(t)}
                    />
                  ))}
              </div>
              {(new Set(
                state.questions.filter(badgeEligible).map((q) => q.knowledgeId),
              ).size >= 10 ||
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
                                state.learning[q.knowledgeId]?.status ===
                                  "gefestigt",
                            )
                            .map((q) => q.knowledgeId),
                        ).size
                      }{" "}
                      von 10 Wissenszielen gefestigt
                    </p>
                    <small className="muted">
                      Begrenzte Auszeichnung für diesen Bestand, kein
                      umfassender Expertentitel.
                    </small>
                    <p className="muted tiny">
                      Bisher gibt es dieses eine Wissensabzeichen. Für die
                      anderen Genres sind noch keine eigenen Abzeichen
                      umgesetzt.
                    </p>
                  </div>
                </section>
              )}
              <section>
                <h2>Deine letzten Runden</h2>
                {completed.length === 0 ? (
                  <p className="muted">
                    Hier erscheinen Deine abgeschlossenen Runden und ihre
                    Erklärungen.
                  </p>
                ) : (
                  <div className="history">
                    {[...completed]
                      .reverse()
                      .slice(0, 20)
                      .map((r) => (
                        <button
                          key={r.id}
                          onClick={() => {
                            setRoundId(r.id);
                            setPage("result");
                          }}
                        >
                          <div>
                            <b>
                              {modeNames[r.mode]} · {roundGenres(r)}
                            </b>
                            <small>
                              {formatDate(r.finishedAt!)} · {r.questions.length}{" "}
                              Fragen · {roundDifficulties(r)}
                            </small>
                          </div>
                          <span>
                            {
                              state.events.filter(
                                (e) => e.roundId === r.id && e.correct,
                              ).length
                            }
                            /{r.questions.length} richtig ↗
                          </span>
                        </button>
                      ))}
                  </div>
                )}
              </section>
              <Leaderboard
                state={state}
                onReview={(id) => {
                  setRoundId(id);
                  setPage("result");
                }}
              />{" "}
            </>
          )}
          {page === "leaderboard" && (
            <>
              <h1>Highscores</h1>
              <Leaderboard
                state={state}
                onReview={(id) => {
                  setRoundId(id);
                  setPage("result");
                }}
              />
            </>
          )}
          {page === "round" && current && (
            <QuestionScreen
              key={`${current.id}:${index}`}
              round={current}
              index={index}
              state={state}
              mutate={mutate}
              busy={busy}
              onExit={() => void nav("home")}
              onNext={async () => {
                unlockSound(state.settings);
                if (index === current.questions.length - 1) {
                  let unlocks: PathUnlock[] = [];
                  const next = await mutate((s) => {
                    const before = learningPathProgress(s);
                    complete(s, current.id);
                    unlocks = newlyUnlocked(before, s);
                  });
                  if (next) {
                    if (unlocks.length)
                      setCelebration({ roundId: current.id, unlocks });
                    playFeedback(
                      unlocks.length
                        ? "unlock"
                        : next.badges.length > state.badges.length
                          ? "badge"
                          : "complete",
                      next.settings,
                    );
                    setPage("result");
                  }
                } else {
                  playFeedback("next", state.settings);
                  setIndex(index + 1);
                }
              }}
            />
          )}
          {page === "result" && current && (
            <Result
              round={current}
              state={state}
              onHome={() => setPage("home")}
              onTopic={() => playTopic(current.questions[0].topic)}
              onLeaderboard={() => setPage("leaderboard")}
            />
          )}
          {page === "account" && (
            <>
              <div className="profile-tools">
                <button
                  className="secondary"
                  onClick={() => void nav("settings")}
                >
                  ⚙ Optionen
                </button>
                <button className="secondary" onClick={() => void nav("help")}>
                  ? So funktioniert’s
                </button>
              </div>
              {accountPanel?.(state, setState)}
            </>
          )}
          {page === "help" && <Help />}
          {page === "settings" && (
            <>
              <button
                className="text-button"
                onClick={() => void nav("account")}
              >
                ← Zurück zum Profil
              </button>
              <Settings
                storageKey={storageKey}
                state={state}
                mutate={mutate}
                setState={setState}
                busy={busy}
                offline={offline}
                onHome={() => setPage("home")}
              />
            </>
          )}
        </main>
        {page === "result" &&
          celebration &&
          celebration.roundId === current?.id && (
            <UnlockCelebration
              unlocks={celebration.unlocks}
              onClose={() => {
                setCelebration(null);
                stopFeedback();
                requestAnimationFrame(() => heading.current?.focus());
              }}
            />
          )}
        <footer hidden={page === "round"}>
          <span>
            WISSENSQUIZ <span className="footer-star">✦</span> BLEIB NEUGIERIG.
          </span>
          <button onClick={() => void nav("help")}>So funktioniert’s</button>
        </footer>
      </div>
    </div>
  );
}
function Explanation({ q, event }: { q: Question; event: AnswerEvent }) {
  const selected = q.answers.find((a) => a.id === event.answerId);
  const film = filmDetails(q);
  return (
    <div className="explanation">
      <span className="eyebrow">DIE IDEE DAHINTER</span>
      <p>{q.explanation}</p>
      {!event.correct && selected?.feedback && (
        <p className="specific-feedback">
          Zu Deiner Antwort: {selected.feedback}
        </p>
      )}
      {(q.context || film) && (
        <details>
          <summary>Etwas tiefer eintauchen</summary>
          {q.context && <p>{q.context}</p>}
          {film && (
            <div>
              <p className="cast-context">{film.text}</p>
              <p className="cast-sources">
                {film.sources.map((source) => (
                  <a
                    key={source}
                    href={source}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Besetzungsquelle: {new URL(source).hostname} ↗
                  </a>
                ))}
              </p>{" "}
            </div>
          )}
        </details>
      )}
      {q.anchor && (
        <div className="memory-anchor">
          <span>✦</span>
          <p>
            <small>DEIN MERKSATZ</small>
            {q.anchor}
          </p>
        </div>
      )}
      {q.sources.length > 0 && (
        <details>
          <summary>Quellen ansehen</summary>
          <ul>
            {q.sources.map((url) => (
              <li key={url}>
                <a href={url} target="_blank" rel="noreferrer">
                  {new URL(url).hostname} ↗
                </a>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
function QuestionScreen({
  round,
  index,
  state,
  mutate,
  busy,
  onExit,
  onNext,
}: {
  round: Round;
  index: number;
  state: State;
  mutate: Mutate;
  busy: boolean;
  onExit: () => void;
  onNext: () => void;
}) {
  const q = round.questions[index];
  const event = state.events.find((e) => e.id === round.events[index]);
  const [remaining, setRemaining] = useState(30_000);
  const [ready, setReady] = useState(false);
  const start = useRef<{ wall: number; mono: number } | null>(null);
  const locked = useRef(false);
  const chooseRef = useRef<(id: string | null) => void>(() => {});
  const feedback = useRef<HTMLDivElement>(null);
  const [reporting, setReporting] = useState(false);
  const [comment, setComment] = useState("");
  const [sent, setSent] = useState(false);
  const choose = async (id: string | null) => {
    if (locked.current || event || !ready || round.status !== "active") return;
    locked.current = true;
    if (id !== null) unlockSound(state.settings);
    const ms = start.current ? elapsed(start.current) : 0;
    const result = await mutate((s) => answer(s, round.id, q.id, id, ms));
    if (!result) locked.current = false;
    else {
      const saved = result.events.find(
        (e) => e.id === `${round.id}:${q.knowledgeId}`,
      );
      if (saved)
        playFeedback(
          saved.answerId === null
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
    if (event) return;
    let second = 0;
    const first = requestAnimationFrame(() => {
      second = requestAnimationFrame(() => {
        start.current = { wall: Date.now(), mono: performance.now() };
        setReady(true);
      });
    });
    return () => {
      cancelAnimationFrame(first);
      cancelAnimationFrame(second);
    };
  }, [q.id, !!event]);
  useEffect(() => {
    if (event || round.mode !== "rekord" || !ready) return;
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
  }, [!!event, ready, round.mode]);
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
        const correct = !!event && id === q.correctId;
        const wrong = !!event && event.answerId === id && !event.correct;
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
    </div>
  );
  return (
    <div className={`question-wrap ${event ? "is-answered" : ""}`}>
      <div className="round-top">
        <button className="text-button" onClick={onExit}>
          ← {round.mode === "rekord" ? "Runde beenden" : "Pause & Startseite"}
        </button>
        <Pill>{modeNames[round.mode]}</Pill>
      </div>
      <div className="round-progress">
        <span>
          FRAGE {index + 1} VON {round.questions.length}
        </span>
        <div className="progress-dots">
          {round.questions.map((_, i) => (
            <i key={i} className={i <= index ? "filled" : ""} />
          ))}
        </div>
      </div>
      {round.mode === "rekord" && !event && (
        <div
          className="timer"
          role="timer"
          aria-label={`${Math.ceil(remaining / 1000)} Sekunden verbleibend`}
        >
          <progress max={30_000} value={remaining} />
          <span>
            {Math.ceil(remaining / 1000)} s ·{" "}
            {remaining > 0 ? 100 + 2 * Math.floor(remaining / 1000) : 0}{" "}
            mögliche Punkte
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
        {round.mode !== "rekord" &&
          state.settings.questionHistory !== "hidden" &&
          (state.settings.questionHistory === "always" || !!event) && (
            <QuestionHistory key={q.id} events={state.events} question={q} />
          )}
        {event ? (
          <details className="answer-review">
            <summary>Alle Antworten ansehen</summary>
            {answerOptions}
          </details>
        ) : (
          answerOptions
        )}
        {!event && round.mode === "rekord" && (
          <p className="quiet-note">Deine erste Antwort zählt.</p>
        )}
        {event && (
          <div ref={feedback} tabIndex={-1} className="feedback" role="status">
            <div
              className={`feedback-title ${event.correct ? "success" : "incorrect"}`}
            >
              <span>{event.correct ? "✓" : "↗"}</span>
              <h2>
                {event.correct
                  ? "Genau richtig."
                  : event.answerId === null
                    ? "Die Zeit ist um."
                    : "Eine neue Entdeckung."}
              </h2>
              {round.mode === "rekord" && (
                <Pill>+{event.knowledgePoints + event.timeBonus} Punkte</Pill>
              )}
            </div>
            <p className="chosen-answer">
              Deine Antwort:{" "}
              <strong>
                {q.answers.find((a) => a.id === event.answerId)?.text ??
                  "Keine Antwort gewählt"}
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
                Deine Punkte bleiben. Dieses Wissensziel kommt früher wieder.
              </p>
            )}
          </div>
        )}
        {event && (
          <div className="feedback-actions">
            {event.correct && (
              <button
                className="secondary"
                aria-pressed={event.guessed}
                disabled={event.guessed || busy}
                onClick={() => void mutate((s) => guess(s, event.id))}
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
function Result({
  round,
  state,
  onHome,
  onTopic,
  onLeaderboard,
}: {
  round: Round;
  state: State;
  onHome: () => void;
  onTopic: () => void;
  onLeaderboard: () => void;
}) {
  const events = state.events.filter((e) => e.roundId === round.id);
  const correct = events.filter((e) => e.correct).length;
  const after = structuredClone(round.before);
  for (const e of events) after[e.knowledgeId] = learn(after[e.knowledgeId], e);
  const improved = round.questions.filter(
    (q) =>
      after[q.knowledgeId]?.status === "geübt" &&
      round.before[q.knowledgeId]?.status !== "geübt" &&
      round.before[q.knowledgeId]?.status !== "gefestigt",
  ).length;
  const secure = round.questions.filter(
    (q) =>
      after[q.knowledgeId]?.status === "gefestigt" &&
      round.before[q.knowledgeId]?.status !== "gefestigt",
  ).length;
  const pathNow = learningPathProgress(state);
  const pathBefore = learningPathProgress({
    ...state,
    rounds: state.rounds.filter((r) => r.id !== round.id),
  });
  const unlocked = [...new Set(round.questions.map(genreOf))].flatMap(
    (genre) => {
      const before = pathBefore(genre),
        after = pathNow(genre);
      return [
        ...(!before.mediumUnlocked && after.mediumUnlocked
          ? [`${genreLabel(genre)} · Mittel`]
          : []),
        ...(!before.hardUnlocked && after.hardUnlocked
          ? [`${genreLabel(genre)} · Schwer`]
          : []),
      ];
    },
  );
  return (
    <div className="result">
      <span className="eyebrow">ABSPANN? NOCH LANGE NICHT.</span>
      <div className="result-orbit" aria-hidden="true">
        ✦
      </div>
      <h1>
        Eine Runde <em>weiter.</em>
      </h1>
      <p className="lead">
        {correct === round.questions.length
          ? "Alle Antworten richtig. Lass das Wissen jetzt ein bisschen wirken."
          : "Jede Frage ist eine Gelegenheit, etwas mitzunehmen."}
      </p>
      <div className="result-score">
        <strong>
          {correct}
          <span> / {round.questions.length}</span>
        </strong>
        <p>richtig beantwortet</p>
      </div>
      {round.mode === "rekord" && (
        <div className="score-breakdown">
          <strong>{points(events)} Punkte</strong>
          <span>
            {events.reduce((a, e) => a + e.knowledgePoints, 0)} Wissen +{" "}
            {events.reduce((a, e) => a + e.timeBonus, 0)} Zeitbonus
          </span>
          <small>
            Lokale Trainingsrunde · {roundGenres(round)} ·{" "}
            {roundDifficulties(round)} · Regel {round.ruleVersion}
          </small>
        </div>
      )}
      <div className="result-progress">
        <Pill>+10 Erfahrung · einmal pro Runde</Pill>
        {!!unlocked.length && (
          <p className="notice" role="status">
            ✦ Im Lernpfad neu freigeschaltet: {unlocked.join(" und ")}. Du
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
      {round.mode === "rekord" && (
        <button className="secondary" onClick={onLeaderboard}>
          Bestenliste ansehen →
        </button>
      )}
      <div className="result-actions">
        <button className="primary" onClick={onHome}>
          Neue Runde wählen →
        </button>
        <button className="secondary" onClick={onTopic}>
          Thema vertiefen
        </button>
      </div>
      <button className="text-button muted" onClick={onHome}>
        Zur Startseite · Für heute reicht’s
      </button>
      <section className="review">
        <h2>Dein Rundenrückblick</h2>
        <p className="muted">Die Erklärungen bleiben hier zum Nachlesen.</p>
        {round.questions.map((q) => {
          const e = events.find((e) => e.questionId === q.id);
          return (
            e && (
              <details key={q.id}>
                <summary>
                  <span>{e.correct ? "✓" : "○"}</span> {q.question}
                </summary>
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
function Settings({
  storageKey,
  state,
  mutate,
  setState,
  busy,
  offline,
  onHome,
}: {
  state: State;
  storageKey: string;
  mutate: Mutate;
  setState: (s: State) => void;
  busy: boolean;
  offline: ReturnType<typeof useOffline>;
  onHome: () => void;
}) {
  const [message, setMessage] = useState("");
  const [hapticMessage, setHapticMessage] = useState("");
  const reportHaptics = (result: ReturnType<typeof playFeedback>) =>
    setHapticMessage(
      result === "blocked"
        ? "Der Browser konnte keine Vibration starten. Deine Auswahl bleibt gespeichert. Prüfe die Geräte- und Browsereinstellungen."
        : result === "requested"
          ? "Vibrationssignal angefordert. Falls Du nichts spürst, unterstützt Dein Gerät die Ausgabe möglicherweise nicht oder blockiert sie in den Einstellungen."
          : result === "unavailable"
            ? "Vibration ist eingeschaltet und gespeichert. Dieser Browser bietet keine Vibrationsfunktion; hier wird deshalb keine Vibration ausgegeben."
            : "",
    );
  const [csv, setCsv] = useState<{
    text: string;
    name: string;
    report: ImportReport;
  } | null>(null);
  const [backup, setBackup] = useState<State | null>(null);
  const [reset, setReset] = useState("");
  const readFile = async (file: File | undefined, kind: "csv" | "json") => {
    setMessage("");
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) {
      setMessage("Datei ist zu groß. Höchstens 20 MB.");
      return;
    }
    try {
      const text = await file.text();
      if (kind === "csv") {
        const imported = importCsv(text, state.questions, file.name);
        setCsv({ text, name: file.name, report: imported.report });
      } else {
        setBackup(validateBackup(JSON.parse(text)));
      }
    } catch (e) {
      setMessage(
        `Datei abgelehnt: ${e instanceof Error ? e.message : String(e)}`,
      );
    }
  };
  return (
    <>
      <span className="eyebrow">DEIN GERÄT. DEINE DATEN.</span>
      <h1>
        Einstellungen <em>& Daten.</em>
      </h1>
      <p className="lead">
        Ton, Vibration und Fragehinweise stellst Du hier ein. Angemeldet wird
        Dein Fortschritt automatisch online gespeichert; als Gast bleibt er auf
        diesem Gerät. Eine JSON-Sicherung bietet Dir eine zusätzliche Kopie.
      </p>
      <div role="status">{message && <p className="notice">{message}</p>}</div>
      <section className="settings-panel">
        <h2>Hinweise an der Frage</h2>
        <p>
          Bei gemischten Runden zeigen diese Hinweise das Genre und die
          Schwierigkeit der aktuellen Frage. Du kannst beide unabhängig
          ausblenden.
        </p>
        <div className="filter-options">
          {(
            [
              { key: "showGenre", label: "Genre anzeigen" },
              { key: "showDifficulty", label: "Schwierigkeit anzeigen" },
            ] as const
          ).map(({ key, label }) => (
            <label key={key} className="filter-choice">
              <input
                type="checkbox"
                checked={state.settings[key] !== false}
                disabled={busy}
                onChange={async (e) => {
                  const enabled = e.target.checked;
                  await mutate((s) => {
                    s.settings[key] = enabled;
                  });
                }}
              />
              {label}
            </label>
          ))}
        </div>
        <label>
          Fragenstatistik im Lernmodus
          <select
            value={state.settings.questionHistory ?? "after"}
            disabled={busy}
            onChange={async (e) => {
              const value = e.target.value as NonNullable<
                State["settings"]["questionHistory"]
              >;
              await mutate((s) => {
                s.settings.questionHistory = value;
              });
            }}
          >
            <option value="after">Nach der Antwort</option>
            <option value="always">Immer anzeigen</option>
            <option value="hidden">Ausblenden</option>
          </select>
        </label>
        <p className="muted tiny">
          Gilt für Entdecken und Besser werden. Nach der Antwort zählt Dein
          aktuelles Ergebnis bereits mit. Deine Auswahl wird im Spielstand
          gespeichert, bei angemeldeten Konten auch online, und ist in Deiner
          JSON-Sicherung enthalten.
        </p>
      </section>
      <section className="settings-panel">
        <h2>Ton & Vibration</h2>
        <p>
          Kurze Signale für Rundenstart, Antworten, nächste Frage, Zeitablauf
          und Abschluss. Alle Hinweise bleiben auch sichtbar.
        </p>
        <div className="filter-options">
          <label className="filter-choice">
            <input
              type="checkbox"
              checked={state.settings.sound !== false}
              disabled={busy}
              onChange={async (e) => {
                const enabled = e.target.checked;
                if (enabled) unlockSound({ ...state.settings, sound: true });
                else stopFeedback();
                const saved = await mutate((s) => {
                  s.settings.sound = enabled;
                });
                if (saved && enabled) playFeedback("correct", saved.settings);
              }}
            />
            Soundeffekte
          </label>
          <label className="filter-choice">
            <input
              type="checkbox"
              checked={!!state.settings.haptics}
              disabled={busy}
              aria-describedby="haptics-support"
              onChange={async (e) => {
                const enabled = e.target.checked;
                const saved = await mutate((s) => {
                  s.settings.haptics = enabled;
                });
                if (saved && enabled)
                  reportHaptics(
                    playFeedback("next", { ...saved.settings, sound: false }),
                  );
                if (saved && !enabled) {
                  stopFeedback();
                  setHapticMessage("Vibration ausgeschaltet und gespeichert.");
                }
              }}
            />
            Vibration
          </label>
        </div>
        <button
          className="secondary"
          disabled={state.settings.sound === false && !state.settings.haptics}
          onClick={async () => {
            await unlockSound(state.settings);
            reportHaptics(playFeedback("correct", state.settings));
          }}
        >
          Signal ausprobieren
        </button>
        <p id="haptics-support" className="muted tiny">
          {supportsHaptics()
            ? "Dieser Browser kann Vibrationssignale anfordern. Ob Du sie spürst, hängt vom Gerät und seinen Einstellungen ab."
            : "Dieser Browser bietet keine Vibration an. Du kannst Deine Auswahl trotzdem speichern; sie wirkt auf Geräten und in Browsern mit Vibrationsunterstützung."}{" "}
          Deine Auswahl wird im Spielstand gespeichert, bei angemeldeten Konten
          auch online. Keine Hintergrundmusik.
        </p>
        {hapticMessage && (
          <p className="tiny" role="status">
            {hapticMessage}
          </p>
        )}
      </section>
      <section className="settings-panel">
        <h2>Dein Lernpaket</h2>
        <p>
          {state.questions.length} Fragen ·{" "}
          {new Set(state.questions.map((q) => q.knowledgeId)).size} Wissensziele
          · {state.questions.filter((q) => q.demo).length} Demo-Fragen
        </p>
        <p>
          {offline.online
            ? "Netzwerkverbindung vorhanden."
            : "Das Gerät meldet keine Netzwerkverbindung."}{" "}
          {offline.ready
            ? "Die App-Dateien sind im Offline-Cache bestätigt. Fragen und Erklärungen liegen im lokalen Speicher."
            : "Die App-Dateien sind noch nicht als offline verfügbar bestätigt."}
        </p>
        {!offline.supported && (
          <p className="notice">
            Offline-Installation benötigt HTTPS oder localhost. Über eine
            unverschlüsselte Heimnetz-Adresse kannst Du online spielen und
            speichern.
          </p>
        )}
        {offline.waiting && (
          <p className="notice">
            Ein Update ist bereit. Schließe nach Deiner Runde alle App-Fenster
            und öffne die App erneut. Dein Fortschritt bleibt erhalten.
          </p>
        )}
        <p className="muted">
          Auf unterstützten Geräten findest Du „Installieren“ oder „Zum
          Home-Bildschirm“ im Browsermenü. Der Offline-Status wird erst nach
          vollständigem Laden bestätigt.
        </p>
        <button
          className="secondary"
          onClick={async () => {
            const granted = await navigator.storage?.persist?.();
            setMessage(
              granted
                ? "Der Browser hat dauerhaften Speicher gewährt. Exporte bleiben sinnvoll."
                : "Dauerhafter Speicher wurde nicht gewährt oder wird nicht unterstützt. Bitte regelmäßig exportieren.",
            );
          }}
        >
          Dauerhaften Gerätespeicher anfragen
        </button>
      </section>
      <section className="settings-panel">
        <h2>Fragen hinzufügen</h2>
        <p>
          CSV mit UTF-8, Komma, Semikolon oder Tabulator. Vorhandene IDs werden
          übersprungen. Dein Fortschritt bleibt erhalten.
        </p>
        <label className="file-label">
          CSV auswählen
          <input
            type="file"
            accept=".csv,text/csv,text/tab-separated-values"
            onChange={(e) => void readFile(e.target.files?.[0], "csv")}
          />
        </label>
        <a className="text-button" href="/demo-fragen.csv" download>
          Demo-CSV als Formatbeispiel ↓
        </a>
        {csv && (
          <div className="import-preview">
            <h3>Importvorschau: {csv.name}</h3>
            <ImportSummary report={csv.report} />
            <button
              className="primary"
              disabled={
                busy ||
                csv.report.accepted === 0 ||
                state.rounds.some((r) => r.status === "active")
              }
              onClick={async () => {
                const saved = await mutate((s) => {
                  const incoming = importCsv(csv.text, s.questions, csv.name);
                  s.questions.push(...incoming.questions);
                  s.imports.push(incoming.report);
                });
                if (saved) {
                  setCsv(null);
                  setMessage(
                    "Fragenpaket gespeichert. Den vollständigen Bericht findest Du unten.",
                  );
                }
              }}
            >
              Gültige Fragen importieren
            </button>
            {state.rounds.some((r) => r.status === "active") && (
              <p>Beende zuerst Deine laufende Runde.</p>
            )}
          </div>
        )}
        <details>
          <summary>Bisherige Importberichte ({state.imports.length})</summary>
          {state.imports.map((r, i) => (
            <div className="import-report" key={`${r.at}:${i}`}>
              <h3>
                {r.filename} · {formatDate(r.at)}
              </h3>
              <ImportSummary report={r} />
            </div>
          ))}
        </details>
        <button
          className="text-button"
          onClick={() =>
            download("wissensquiz-importberichte.json", state.imports)
          }
        >
          Importberichte exportieren ↓
        </button>
      </section>
      <section className="settings-panel">
        <h2>Fortschritt sichern & wiederherstellen</h2>
        <p>
          Der Export enthält auch Fragen, Inhaltsversionen, Runden und lokale
          Meldungen. Ein Wiederimport ersetzt nach Deiner Bestätigung den
          gesamten lokalen Stand.
        </p>
        <button
          className="primary"
          onClick={() =>
            download(
              `wissensquiz-${new Date().toISOString().slice(0, 10)}.json`,
              state,
            )
          }
        >
          Alles als JSON sichern ↓
        </button>
        <label className="file-label">
          Sicherung auswählen
          <input
            type="file"
            accept=".json,application/json"
            onChange={(e) => void readFile(e.target.files?.[0], "json")}
          />
        </label>
        {backup && (
          <div className="notice">
            <p>
              Geprüfte Sicherung: {backup.questions.length} Fragen,{" "}
              {backup.rounds.length} Runden. Dein jetziger Stand wird ersetzt.
              Laufende Rekordrunden werden beendet.
            </p>
            <button
              className="primary"
              disabled={busy}
              onClick={async () => {
                try {
                  const saved = await restoreStored(backup, storageKey);
                  setState(saved);
                  setBackup(null);
                  setMessage("Sicherung vollständig wiederhergestellt.");
                } catch (e) {
                  setMessage(`Wiederherstellung fehlgeschlagen: ${String(e)}`);
                }
              }}
            >
              Lokalen Stand durch Sicherung ersetzen
            </button>
            <button className="text-button" onClick={() => setBackup(null)}>
              Abbrechen
            </button>
          </div>
        )}
      </section>
      <section className="settings-panel">
        <h2>Lokale Fragenmeldungen</h2>
        <p>
          {state.reports.length} Meldungen auf diesem Gerät gespeichert. Es
          wurde nichts an eine Redaktion gesendet.
        </p>
        <button
          className="secondary"
          onClick={() =>
            download("wissensquiz-fragenmeldungen.json", state.reports)
          }
        >
          Meldungen exportieren ↓
        </button>
      </section>
      <section className="settings-panel">
        <h2>So wächst Dein Wissen</h2>
        <p>
          Nach einer ersten sicheren Antwort folgt eine Wiederholung nach etwa
          einem Tag. Weitere sichere, fällige Antworten verlängern auf drei,
          sieben und 21 Tage.
        </p>
        <p>
          „Gefestigt“ braucht mindestens vier sichere Lerntage und eine
          erfolgreiche Wiederholung nach mindestens sieben Tagen Abstand. Am
          gleichen Tag steigt die Stufe höchstens einmal. Falsche Antworten
          kommen nach zehn Minuten, geratene nach sechs Stunden wieder.
        </p>
        <p className="muted">
          Das sind konfigurierbare Testregeln, keine wissenschaftliche Messung
          Deines gesamten Wissens. Eine Runde enthält jedes Wissensziel nur
          einmal.
        </p>
      </section>
      <section className="settings-panel danger">
        <h2>Lernfortschritt zurücksetzen</h2>
        <p>
          Runden, Antworten, Erfahrung, Rekorde, Abzeichen, Favoriten,
          Einstellungen und Meldungen werden gelöscht. Fragen und Importberichte
          bleiben erhalten.
        </p>
        <label>
          Zum Bestätigen LÖSCHEN eingeben
          <input
            value={reset}
            onChange={(e) => setReset(e.target.value)}
            autoComplete="off"
          />
        </label>
        <button
          className="danger-button"
          disabled={reset !== "LÖSCHEN" || busy}
          onClick={async () => {
            const saved = await mutate((s) => {
              const questions = s.questions,
                imports = s.imports;
              Object.assign(s, emptyState(questions));
              s.imports = imports;
            });
            if (saved) onHome();
          }}
        >
          Fortschritt jetzt endgültig zurücksetzen
        </button>
      </section>
    </>
  );
}
function ImportSummary({ report: r }: { report: ImportReport }) {
  return (
    <>
      <p>
        <b>{r.accepted}</b> gültig · <b>{r.rejected}</b> ausgeschlossen ·{" "}
        <b>{r.duplicates}</b> vorhandene IDs übersprungen
      </p>
      <p className="tiny muted">
        Trennzeichen: {r.delimiter === "\t" ? "Tabulator" : r.delimiter} ·{" "}
        {r.columns.length} Spalten erkannt
      </p>
      {r.issues.length > 0 && (
        <details open>
          <summary>Hinweise zu ausgeschlossenen Daten</summary>
          <ul>
            {r.issues.map((x, i) => (
              <li key={i}>{x}</li>
            ))}
          </ul>
        </details>
      )}
      {r.warnings.length > 0 && (
        <details>
          <summary>Annahmen und Einschränkungen ({r.warnings.length})</summary>
          <ul>
            {r.warnings.map((x, i) => (
              <li key={i}>{x}</li>
            ))}
          </ul>
        </details>
      )}
      <details>
        <summary>Erkannte Spalten</summary>
        <p className="mono">{r.columns.join(", ")}</p>
      </details>
    </>
  );
}
