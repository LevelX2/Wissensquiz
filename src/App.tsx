import { familiarities, familiarityLabel, ruleLabel } from "./familiarity";
import {
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  answer,
  badgeEligible,
  complete,
  elapsed,
  guess,
  points,
  rebuild,
  selectQuestions,
  startRound,
} from "./engine";
import { importCsv } from "./importer";
import {
  emptyState,
  uid,
  hasAnswer,
  type AnswerChoice,
  type AnswerEvent,
  type ImportReport,
  type Mode,
  type Question,
  type Round,
  type State,
  type RoundSetup,
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
import { ActivityContext } from "./GuestActivity";
import { GuestActivityReporter } from "./guestActivityDelivery";
import { Help } from "./Help";
import { RoundGuide } from "./RoundGuide";
import { SolutionChoice } from "./SolutionChoice";
import { DuelCenter } from "./DuelCenter";
import { readRoundSetup } from "./roundSetup";
import { errorTrainingContext } from "./errorTraining";
import { roundSummary } from "./roundSummary";
import { careerProgress, careerSummary } from "./career";
import { CareerProgress, RoundExperience } from "./CareerProgress";
import { answeredTopics } from "./collection";
import { QuestionHistory } from "./QuestionHistoryPanel";
import {
  categories,
  type Category,
  categoryTopic,
  ACTORS,
  matchesCategories,
  matchesTopic,
} from "./categories";
import { discoveryContext } from "./discovery";
import { LearningPath } from "./LearningPathPanel";
import { UnlockCelebration } from "./UnlockCelebration";
import {
  learningPathProgress,
  pathQuestions,
  retainJourneyUnlocks,
  newlyUnlocked,
  type PathUnlock,
} from "./learningPath";
import { filmDetails } from "./filmDetails";
import { directorExplanation } from "./filmFacts";
import { FilmDataPanel } from "./FilmDataPanel";
import { SyncIndicator, SyncSymbol, type SyncDisplay } from "./SyncIndicator";
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
type DuelPage = "duels";
type Mutate = (fn: (s: State) => void) => Promise<State | null>;
const modeNames: Record<Mode, string> = {
  entdecken: "Filmreise",
  ueben: "Freies Spiel",
  rekord: "Rekordrunde",
  fehler: "Fehlertraining",
};
const historicalModeName = (round: Round) =>
  round.duel
    ? `Duell · Runde ${round.duel.number} von 3`
    : round.ruleVersion === "1" &&
        (round.mode === "entdecken" || round.mode === "ueben")
      ? round.mode === "entdecken"
        ? "Entdecken (frühere Runde)"
        : "Besser werden (frühere Runde)"
      : modeNames[round.mode];
const formatDate = (at: number) =>
  new Date(at).toLocaleDateString("de-DE", { day: "numeric", month: "short" });
function Pill({ children }: { children: ReactNode }) {
  return <span className="pill">{children}</span>;
}
function TopicCard({
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
        .filter((q) => (genre ? genreOf(q) === topic : matchesTopic(q, topic)))
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
export function App({
  storageKey = "current",
  accountPanel,
  onPersistedState,
  sync,
}: {
  storageKey?: string;
  accountPanel?: (state: State, onState: (state: State) => void) => ReactNode;
  onPersistedState?: (state: State) => void;
  sync?: SyncDisplay;
}) {
  const read = () => readStored(storageKey);
  const update = (fn: (s: State) => void, initial?: State) =>
    updateStored(fn, initial, storageKey);
  const [state, setState] = useState<State | null>(null);
  const [page, setPage] = useState<Page | DuelPage>(
    location.hash.startsWith("#duel=") ? "duels" : "home",
  );
  const [answeredOnly, setAnsweredOnly] = useState(false);
  const [topicScope, setTopicScope] = useState<
    | { kind: "genre"; name: string }
    | { kind: "category"; name: Category }
    | null
  >(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [pendingSetup, setPendingSetup] = useState<RoundSetup | null>(null);
  const [pendingSolutions, setPendingSolutions] =
    useState<State["settings"]["solutionDisplay"]>();
  const [roundId, setRoundId] = useState("");
  const [justCompleted, setJustCompleted] = useState("");
  const [duelPlaying, setDuelPlaying] = useState(false);
  const [index, setIndex] = useState(0);
  const [celebration, setCelebration] = useState<{
    roundId: string;
    unlocks: PathUnlock[];
  } | null>(null);
  const heading = useRef<HTMLElement>(null);
  const booted = useRef(false);
  const inFlight = useRef(false);
  const offline = useOffline();
  const activityClient = useContext(ActivityContext);
  const guestReporter = useRef<GuestActivityReporter | null>(null);
  useEffect(() => {
    if (storageKey !== "current") return;
    // This delivery queue is separate from the personal guest save.
    let storage: Pick<Storage, "getItem" | "setItem">;
    try {
      storage = localStorage;
    } catch {
      storage = {
        getItem: () => {
          throw new Error();
        },
        setItem: () => {
          throw new Error();
        },
      };
    }
    const reporter = new GuestActivityReporter(activityClient, storage);
    guestReporter.current = reporter;
    const flush = () => {
      void reporter.flush();
    };
    flush();
    const timer = window.setInterval(flush, 30000);
    window.addEventListener("online", flush);
    return () => {
      guestReporter.current = null;
      reporter.stop();
      window.clearInterval(timer);
      window.removeEventListener("online", flush);
    };
  }, [activityClient, storageKey]);
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
        retainJourneyUnlocks(s);
        for (const r of s.rounds)
          if (r.status === "active" && r.mode === "rekord") {
            r.status = "aborted";
            r.finishedAt = Date.now();
          }
        rebuild(s);
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
    if (page !== "result") setJustCompleted("");
  }, [page, index, topicScope]);
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
  const nav = async (next: Page | DuelPage) => {
    if (next === "topics") setTopicScope(null);
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
  useEffect(() => {
    const invitation = () => {
      if (/^#duel=[a-f0-9]{64}$/.test(location.hash) && page !== "round")
        setPage("duels");
    };
    window.addEventListener("hashchange", invitation);
    return () => window.removeEventListener("hashchange", invitation);
  }, [page]);
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
  const {
    mode,
    genres: selectedGenres,
    categories: selectedCategories,
    difficulties: selectedDifficulties,
    familiarities: selectedFamiliarities = [...familiarities],
  } = pendingSetup ?? readRoundSetup(state);
  const changeSetup = async (patch: Partial<RoundSetup>) => {
    if (inFlight.current) return null;
    // Reflect the click immediately; only committed state reaches account sync.
    setPendingSetup({ ...readRoundSetup(state), ...patch });
    try {
      return await mutate((s) => {
        s.settings.roundSetup = { ...readRoundSetup(s), ...patch };
      });
    } finally {
      setPendingSetup(null);
    }
  };
  const topics = [...new Set(state.questions.map((q) => q.topic))].sort();
  const startedTopics =
    page === "album" ? answeredTopics(state) : new Set<string>();
  const albumTopics = topics.filter(
    (t) => !answeredOnly || startedTopics.has(t),
  );
  const genres = [...new Set(state.questions.map(genreOf))]
    .filter((genre) => genre !== ACTORS)
    .sort();
  const browseQuestions =
    page === "topics" && topicScope
      ? state.questions.filter((q) =>
          topicScope.kind === "genre"
            ? genreOf(q) === topicScope.name
            : matchesCategories(q, [topicScope.name]),
        )
      : [];
  const browseTopics = [...new Set(browseQuestions.map((q) => q.topic))].sort();
  const filters = {
    genres: selectedCategories.includes(ACTORS)
      ? [...new Set([...(selectedGenres ?? genres), ACTORS])]
      : (selectedGenres ?? genres).filter((genre) => genre !== ACTORS),
    difficulties:
      mode === "entdecken" ? [...difficulties] : selectedDifficulties,
    familiarities:
      mode === "entdecken" ? [...familiarities] : selectedFamiliarities,
  };
  const toggleGenre = (genre: string) =>
    void changeSetup({
      genres: filters.genres.includes(genre)
        ? filters.genres.filter((g) => g !== genre)
        : [...filters.genres, genre],
    });
  const playGenre = async (genre: string) => {
    if (await changeSetup({ categories: [], genres: [genre] })) setPage("home");
  };
  const completed = state.rounds.filter((r) => r.status === "completed");
  const active = state.rounds.find((r) => r.status === "active");
  const current = state.rounds.find((r) => r.id === roundId);
  const targetSize = completed.length ? 10 : 5;
  const roundTopic = categoryTopic("Alle Themen", selectedCategories);
  const selection = selectQuestions(
    pathQuestions(state, mode),
    state.learning,
    {
      mode,
      topic: roundTopic,
      difficulty: "Alle Stufen",
      filters,
      size: targetSize,
      now: Date.now(),
      ...(mode === "entdecken" ? discoveryContext(state) : {}),
      ...(mode === "fehler" ? errorTrainingContext(state) : {}),
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
      guestReporter.current?.record(next, id, "started");
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
  const retryErrors = async (source: Round) => {
    unlockSound(state.settings);
    let id = "";
    const next = await mutate((s) => {
      id = startRound(s, {
        mode: "fehler",
        topic: source.topic,
        difficulty: source.difficulty,
        filters: source.filters,
        sourceRoundId: source.id,
      }).id;
    });
    if (next) {
      guestReporter.current?.record(next, id, "started");
      playFeedback("start", next.settings);
      setRoundId(id);
      setIndex(0);
      setPage("round");
    }
  };
  const mastered = Object.values(state.learning).filter(
    (p) => p.status === "gefestigt",
  ).length;
  return (
    <div
      className={`app-shell ${page === "round" || duelPlaying ? "is-playing" : ""}`}
    >
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
                page === p ||
                (p === "home" && page === "duels") ||
                (p === "account" && page === "settings")
                  ? "selected"
                  : ""
              }
              aria-current={
                page === p ||
                (p === "home" && page === "duels") ||
                (p === "account" && page === "settings")
                  ? "page"
                  : undefined
              }
              onClick={() => void nav(p)}
              aria-description={p === "account" ? sync?.text : undefined}
            >
              <span aria-hidden="true" className="nav-symbol">
                {icon}
                {p === "account" && sync && <SyncSymbol status={sync.status} />}
              </span>
              {label}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <CareerProgress experience={state.experience} compact />
        </div>
      </aside>
      <div className={`workspace ${page === "home" ? "cinema-home" : ""}`}>
        {!offline.online && !sync && (
          <header className="topbar">
            <span className="connection" role="status">
              Offline · lokal gespeichert
            </span>
          </header>
        )}
        <main
          ref={heading}
          tabIndex={-1}
          className={`main-content ${page === "round" || duelPlaying ? "playing" : ""}`}
        >
          {!["round", "result", "account", "album"].includes(page) &&
            !duelPlaying && (
              <div className="mobile-career">
                <CareerProgress experience={state.experience} compact />
              </div>
            )}
          {error && (
            <div role="alert" className="notice error">
              {error}
            </div>
          )}
          {offline.waiting &&
            !duelPlaying &&
            page !== "round" &&
            page !== "settings" && (
              <p className="notice" role="status">
                Eine neue Quiz-Version ist bereit. Schließe nach Deiner Runde
                alle Quiz-Tabs und gegebenenfalls die installierte Quiz-App.
                Öffne sie danach erneut. Dein Fortschritt bleibt erhalten.
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
                  {(["entdecken", "ueben", "rekord", "fehler"] as Mode[]).map(
                    (m, i) => (
                      <button
                        key={m}
                        className={`mode-card mode-${m} ${mode === m ? "active" : ""}`}
                        aria-pressed={mode === m}
                        disabled={busy}
                        onClick={() => void changeSetup({ mode: m })}
                      >
                        <img
                          className="mode-artwork"
                          src={
                            m === "fehler"
                              ? "/modes/fehler.svg"
                              : `/modes/${m}.png`
                          }
                          alt=""
                          width={88}
                          height={88}
                          decoding="async"
                        />
                        <strong>{modeNames[m]}</strong>
                        <small>
                          {
                            [
                              "Filmwelten und Stufen freischalten",
                              "Alle Stufen frei kombinieren",
                              "30 Sekunden. Dein persönlicher Rekord.",
                              "Offene Fehler gezielt wiederholen",
                            ][i]
                          }
                        </small>
                        {mode === m && (
                          <span className="mode-check" aria-hidden="true">
                            ✓
                          </span>
                        )}
                      </button>
                    ),
                  )}
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
                    {selection.length}{" "}
                    {mode === "fehler" ? "offene Fehler" : "Fragen"}
                    {" · "}
                    {mode !== "entdecken"
                      ? "Freie Auswahl: " +
                        (selectedDifficulties.length
                          ? selectedDifficulties
                              .map(difficultyLabel)
                              .join(" + ")
                          : "keine Stufe")
                      : "Filmreise · freigeschaltete Stufen"}
                    {mode !== "entdecken" &&
                      ` · Filmgruppen ${selectedFamiliarities.join(" + ") || "keine"}`}
                    {roundTopic !== "Alle Themen" && " · " + roundTopic}
                  </p>
                </div>
                <SolutionChoice
                  value={
                    pendingSolutions ??
                    state.settings.solutionDisplay ??
                    "question"
                  }
                  disabled={busy || !!active}
                  onChange={(value) => {
                    setPendingSolutions(value);
                    void mutate((s) => {
                      s.settings.solutionDisplay = value;
                    }).finally(() => setPendingSolutions(undefined));
                  }}
                />
                <button
                  className="duel-entry secondary"
                  disabled={busy || !!active}
                  onClick={() => void nav("duels")}
                >
                  <span aria-hidden="true">⚔</span> Duell · Gegen andere spielen
                  <small>
                    Drei Runden mit denselben Fragen · Deine offenen Spiele
                  </small>
                </button>
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

                <RoundGuide mode={mode} />
                {!selection.length ? (
                  <p role="status" className="notice">
                    {mode === "entdecken"
                      ? "Für diese Auswahl sind noch keine Fragen freigeschaltet. Wähle andere Genres oder Kategorien, oder spiele frei."
                      : mode === "fehler"
                        ? "Keine offenen Fehler in Deiner Auswahl. Spiele eine neue Runde oder erweitere Deine Filter."
                        : "Wähle mindestens ein Genre, eine Schwierigkeitsstufe und eine Filmgruppe mit verfügbaren Fragen."}
                    {mode === "entdecken" && (
                      <button
                        className="text-button"
                        disabled={busy}
                        onClick={() => void changeSetup({ mode: "ueben" })}
                      >
                        Zum Freien Spiel wechseln
                      </button>
                    )}
                  </p>
                ) : (
                  selection.length < targetSize && (
                    <p className="tiny muted">
                      Für Deine Auswahl ist diese Runde kürzer.
                    </p>
                  )
                )}

                <div className="quiz-filters">
                  <fieldset disabled={busy}>
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
                        void changeSetup({ genres: null });
                      }}
                    >
                      Alle Genres auswählen
                    </button>
                    <button
                      className="text-button"
                      onClick={() => {
                        void changeSetup({ genres: [] });
                      }}
                    >
                      Alle Genres abwählen
                    </button>
                  </fieldset>
                  <fieldset disabled={busy}>
                    <legend>Zusätzliche Kategorien</legend>
                    {categories.map((category) => (
                      <label className="filter-choice" key={category}>
                        <input
                          type="checkbox"
                          checked={selectedCategories.includes(category)}
                          onChange={(e) => {
                            void changeSetup({
                              categories: e.target.checked
                                ? [...selectedCategories, category]
                                : selectedCategories.filter(
                                    (c) => c !== category,
                                  ),
                              ...(category === ACTORS &&
                              e.target.checked &&
                              mode === "entdecken"
                                ? { mode: "ueben" }
                                : {}),
                            });
                          }}
                        />
                        <GenreArtwork genre={category} compact />
                        Nur {category}
                      </label>
                    ))}
                    <p className="tiny muted">
                      Kuratierte Auswahlen innerhalb Deiner Genres. Mehrere
                      gewählte Kategorien werden kombiniert. Gemeinsame Fragen
                      zählen nur einmal. Schauspieler ist unabhängig von
                      Filmgenres und Filmgruppen im Freien Spiel verfügbar.
                    </p>
                  </fieldset>
                  {mode !== "entdecken" ? (
                    <>
                      <fieldset disabled={busy}>
                        <legend>Schwierigkeitsstufen</legend>
                        <div className="filter-options">
                          {difficulties.map((d) => (
                            <label className="filter-choice" key={d}>
                              <input
                                type="checkbox"
                                checked={selectedDifficulties.includes(d)}
                                onChange={() =>
                                  void changeSetup({
                                    difficulties: selectedDifficulties.includes(
                                      d,
                                    )
                                      ? selectedDifficulties.filter(
                                          (x) => x !== d,
                                        )
                                      : [...selectedDifficulties, d],
                                  })
                                }
                              />
                              {difficultyLabel(d)}
                            </label>
                          ))}
                        </div>
                        <button
                          className="text-button"
                          onClick={() =>
                            void changeSetup({
                              difficulties: [...difficulties],
                            })
                          }
                        >
                          Alle Stufen auswählen
                        </button>
                      </fieldset>
                      <fieldset disabled={busy}>
                        <legend>Bekanntheit der Filme</legend>
                        <div className="filter-options">
                          {familiarities.map((level) => (
                            <label className="filter-choice" key={level}>
                              <input
                                type="checkbox"
                                checked={selectedFamiliarities.includes(level)}
                                onChange={() =>
                                  void changeSetup({
                                    familiarities:
                                      selectedFamiliarities.includes(level)
                                        ? selectedFamiliarities.filter(
                                            (x) => x !== level,
                                          )
                                        : [...selectedFamiliarities, level],
                                  })
                                }
                              />
                              {familiarityLabel(level)}
                            </label>
                          ))}
                        </div>
                        <button
                          className="text-button"
                          onClick={() =>
                            void changeSetup({
                              familiarities: [...familiarities],
                            })
                          }
                        >
                          Alle Filmgruppen auswählen
                        </button>
                        <p className="tiny muted">
                          Redaktionelle Einordnung für ein breites
                          deutschsprachiges Kinopublikum. Eigene, noch nicht
                          eingeordnete Filme sind bei Auswahl aller Gruppen
                          dabei.
                        </p>
                      </fieldset>
                    </>
                  ) : null}
                  <LearningPath state={state} genres={filters.genres} />
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
              <p className="demo-label">
                {state.questions.every((q) => q.demo)
                  ? "TESTAUSGABE · Gekennzeichnete Demo-Fragen zu Filmhandwerk und Science-Fiction-Ideen."
                  : `${state.questions.filter((q) => !q.demo).length} importierte Fragen · ${new Set(state.questions.map((q) => q.knowledgeId)).size} Wissensziele · ${state.questions.filter((q) => q.demo).length} Demo-Fragen. Details unter Profil → Optionen.`}
              </p>
            </>
          )}
          {page === "topics" && (
            <>
              {topicScope ? (
                <>
                  <button
                    className="text-button"
                    onClick={() => setTopicScope(null)}
                  >
                    ← Zur Themenübersicht
                  </button>
                  <h1>
                    {topicScope.kind === "genre"
                      ? genreLabel(topicScope.name)
                      : topicScope.name}
                    :{" "}
                    {topicScope.name === ACTORS ? "Personen" : "Filme & Reihen"}
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
                        questions={browseQuestions}
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
                    Wähle ein Filmgenre oder eine Kategorie und entdecke ihre
                    Themen. Auf der Startseite kannst Du mehrere Genres und
                    Schwierigkeitsstufen kombinieren.
                  </p>
                  <div className="topic-grid">
                    {categories.map((category) => (
                      <TopicCard
                        key={category}
                        topic={category}
                        state={state}
                        onBrowse={() =>
                          setTopicScope({ kind: "category", name: category })
                        }
                        onPlay={async () => {
                          if (
                            await changeSetup({
                              categories: [category],
                              genres: null,
                              ...(category === ACTORS ? { mode: "ueben" } : {}),
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
                        onPlay={() => playGenre(t)}
                        onBrowse={() =>
                          setTopicScope({ kind: "genre", name: t })
                        }
                      />
                    ))}
                  </div>
                </>
              )}
            </>
          )}
          {page === "album" && (
            <>
              <span className="eyebrow">DAS BLEIBT BEI DIR</span>
              <h1>
                Deine <em>Sammlung.</em>
              </h1>
              <p className="lead">
                Deine Filmkarriere wächst mit Deinen Antworten und
                Lernfortschritten. Fachwissen festigt sich mit sicheren
                Antworten über mehrere Tage.
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
              <CareerProgress
                experience={state.experience}
                legacyBonus={state.career?.legacyBonus}
              />
              <div className="section-title">
                <h2>Dein Expertenalbum</h2>
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
                {albumTopics.map((t) => (
                  <TopicCard key={t} topic={t} state={state} />
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
                              {historicalModeName(r)} · {roundGenres(r)}
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
                onAccount={() => void nav("account")}
                onPlay={() => {
                  void changeSetup({ mode: "rekord" }).then((saved) => {
                    if (saved) setPage("home");
                  });
                }}
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
                onAccount={() => void nav("account")}
                onPlay={() => {
                  void changeSetup({ mode: "rekord" }).then((saved) => {
                    if (saved) setPage("home");
                  });
                }}
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
              sync={sync}
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
                    guestReporter.current?.record(
                      next,
                      current.id,
                      "completed",
                    );
                    setJustCompleted(current.id);
                    if (unlocks.length)
                      setCelebration({ roundId: current.id, unlocks });
                    playFeedback(
                      unlocks.length
                        ? "unlock"
                        : next.badges.length > state.badges.length
                          ? "badge"
                          : careerProgress(next.experience).level >
                              careerProgress(state.experience).level
                            ? "level"
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
          {page === "duels" && (
            <DuelCenter
              state={state}
              mutate={mutate}
              busy={busy}
              onHome={() => void nav("home")}
              onAccount={() => void nav("account")}
              onRetry={(round) => void retryErrors(round)}
              onLeaderboard={() => void nav("leaderboard")}
              onPlaying={setDuelPlaying}
            />
          )}
          {page === "result" && current && (
            <Result
              round={current}
              state={state}
              onHome={() => setPage("home")}
              onLeaderboard={() => setPage("leaderboard")}
              onRetry={() => void retryErrors(current)}
              busy={busy}
              celebrate={justCompleted === current.id}
            />
          )}
          {page === "account" && (
            <>
              <CareerProgress
                experience={state.experience}
                legacyBonus={state.career?.legacyBonus}
              />
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
        <footer hidden={page === "round" || duelPlaying}>
          <span>
            WISSENSQUIZ <span className="footer-star">✦</span> BLEIB NEUGIERIG.
          </span>
          <button onClick={() => void nav("help")}>So funktioniert’s</button>
        </footer>
      </div>
    </div>
  );
}
export function Explanation({ q, event }: { q: Question; event: AnswerEvent }) {
  const selected = q.answers.find((a) => a.id === event.answerId);
  const film = filmDetails(q);
  const director = directorExplanation(q);
  const deepContext = director?.text ?? q.context;
  return (
    <div className="explanation">
      <span className="eyebrow">DIE IDEE DAHINTER</span>
      {q.metadata.person_name && (
        <p className="actor-name">
          <strong>{q.metadata.person_name}</strong>
        </p>
      )}
      <p>{q.explanation}</p>
      {!event.correct && selected?.feedback && (
        <p className="specific-feedback">
          Zu Deiner Antwort: {selected.feedback}
        </p>
      )}
      {(deepContext || film) && (
        <details>
          <summary>Etwas tiefer eintauchen</summary>
          {deepContext && <p>{deepContext}</p>}
          {director && (
            <p className="cast-sources">
              {director.sources.map((source) => (
                <a key={source} href={source} target="_blank" rel="noreferrer">
                  Regiequelle: {new URL(source).hostname} ↗
                </a>
              ))}
            </p>
          )}
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
      <FilmDataPanel q={q} />
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
export function Result({
  round,
  state,
  onHome,
  onLeaderboard,
  onRetry,
  busy,
  celebrate,
}: {
  round: Round;
  state: State;
  onHome: () => void;
  onLeaderboard: () => void;
  onRetry: () => void;
  busy: boolean;
  celebrate: boolean;
}) {
  const [reviewFilter, setReviewFilter] = useState<"all" | "wrong" | "guessed">(
    "all",
  );
  useEffect(() => setReviewFilter("all"), [round.id]);
  const summary = roundSummary(state, round);
  const career = useMemo(() => careerSummary(state), [state]);
  const roundXp = career.rounds.get(round.id)!;
  const roundProgress = career.progress.get(round.id)!;
  const { events, correct, improved, secured: secure } = summary;
  const retryContext = errorTrainingContext(state, round.id);
  const retryCount = selectQuestions(
    state.questions,
    state.learning,
    {
      mode: "fehler",
      topic: round.topic,
      difficulty: round.difficulty,
      filters: round.filters,
      size: 10,
      now: Date.now(),
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
      <span className="eyebrow">
        {historicalModeName(round)} · {formatDate(round.finishedAt!)}
      </span>
      <h1>
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
      {round.mode === "rekord" && (
        <div className="score-breakdown">
          <strong>{points(events)} Punkte</strong>
          <span>
            {events.reduce((a, e) => a + e.knowledgePoints, 0)} Wissen +{" "}
            {events.reduce((a, e) => a + e.timeBonus, 0)} Zeitbonus
          </span>
          <small>
            Lokale Trainingsrunde · {roundGenres(round)} ·{" "}
            {roundDifficulties(round)} · Regel {ruleLabel(round.ruleVersion)}
          </small>
        </div>
      )}
      <div className="result-progress">
        <RoundExperience
          key={round.id}
          xp={roundXp}
          before={roundProgress.before}
          after={roundProgress.after}
          celebrate={celebrate}
        />
        <div className="result-insights">
          <div>
            <strong>{summary.newGoals}</strong>
            <span>Neue Wissensziele entdeckt</span>
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
      {round.mode === "rekord" && (
        <button className="secondary" onClick={onLeaderboard}>
          Bestenliste ansehen →
        </button>
      )}
      <div className="result-actions">
        {retryCount > 0 && (
          <button
            className="primary"
            onClick={onRetry}
            disabled={busy || active}
          >
            Fehler dieser Runde üben ({retryCount}) →
          </button>
        )}
        <button
          className={retryCount ? "secondary" : "primary"}
          onClick={onHome}
        >
          Neue Runde wählen →
        </button>
      </div>
      {retryCount > 0 && (
        <p className="muted tiny">
          {active
            ? "Setze zuerst Deine begonnene Runde fort oder beende sie auf der Startseite."
            : "Ohne Zeitdruck direkt wiederholen. Langfristige Festigung braucht weiterhin Abstand."}
        </p>
      )}
      {!retryCount && events.some((e) => !e.correct) && (
        <p className="muted tiny">
          {retryContext.mistakes.size
            ? "Die offenen Fehler dieser Runde sind in dieser Auswahl aktuell nicht verfügbar."
            : "Die Fehler dieser Runde hast Du inzwischen sicher gelöst."}
        </p>
      )}
      <button className="text-button muted" onClick={onHome}>
        Zur Startseite · Für heute reicht’s
      </button>
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
        {round.questions.map((q) => {
          const e = events.find((e) => e.questionId === q.id);
          return (
            e &&
            (reviewFilter === "all" ||
              (reviewFilter === "wrong" ? !e.correct : e.guessed)) && (
              <details key={q.id}>
                <summary>
                  <span
                    className={
                      e.guessed ? "guessed" : e.correct ? "correct" : "wrong"
                    }
                  >
                    {e.guessed ? "?" : e.correct ? "✓" : "×"}
                  </span>{" "}
                  {q.question}
                </summary>
                {!e.correct && (
                  <p>
                    <strong>Deine Antwort:</strong>{" "}
                    {e.dontKnow
                      ? "Keine Ahnung"
                      : (q.answers.find((a) => a.id === e.answerId)?.text ??
                        "Zeit abgelaufen – keine Antwort")}
                  </p>
                )}
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
    const maxMiB = kind === "json" ? 64 : 20;
    if (file.size > maxMiB * 1024 * 1024) {
      setMessage(`Datei ist zu groß. Höchstens ${maxMiB} MiB.`);
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
          Gilt für Filmreise und Freies Spiel. Nach der Antwort zählt Dein
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
          Runden, Antworten, Erfahrung, Rekorde, Abzeichen, Einstellungen und
          Meldungen werden gelöscht. Fragen und Importberichte bleiben erhalten.
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
