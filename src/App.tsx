import { familiarities } from "./familiarity";
import { useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { complete, rebuild, selectQuestions, startRound } from "./engine";
import { emptyState, type Round, type State, type RoundSetup } from "./model";
import { difficulties, genreOf, questionSourceOf } from "./filters";
import { read as readStored, update as updateStored } from "./storage";
import { useOffline } from "./offline";
import { Leaderboard } from "./RecordLeaderboard";
import { ActivityContext } from "./GuestActivity";
import { GuestActivityReporter } from "./guestActivityDelivery";
import { Help } from "./Help";
import { DuelCenter } from "./DuelCenter";
import { readRoundSetup } from "./roundSetup";
import { errorTrainingContext } from "./errorTraining";
import { careerProgress } from "./career";
import { CareerProgress } from "./CareerProgress";
import { answeredTopics } from "./collection";
import {
  categories,
  type Category,
  selectionTopic,
  ACTORS,
  matchesCategories,
} from "./categories";
import { discoveryContext } from "./discovery";
import { UnlockCelebration } from "./UnlockCelebration";
import {
  learningPathProgress,
  pathQuestions,
  retainJourneyUnlocks,
  newlyUnlocked,
  type PathUnlock,
} from "./learningPath";
import { SyncSymbol, type SyncDisplay } from "./SyncIndicator";
import { playFeedback, stopFeedback, unlockSound } from "./feedback";
import {
  addPackages,
  hasPackage,
  packages,
  type PackageContent,
} from "./packages";
import type { Page, DuelPage, Mutate } from "./uiTypes";
import { QuestionScreen } from "./QuestionScreen";
import { Result } from "./RoundResult";
import { Settings } from "./Settings";
import { PlaySetup } from "./PlaySetup";
import { TopicsPage } from "./TopicsPage";
import { CollectionPage } from "./CollectionPage";

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
    sources: selectedSources = ["film"],
  } = pendingSetup ?? readRoundSetup(state);
  const changeSetup = async (patch: Partial<RoundSetup>) => {
    if (inFlight.current) return null;
    // Reflect the click immediately; only committed state reaches account sync.
    setPendingSetup(
      readRoundSetup({
        ...state,
        settings: {
          ...state.settings,
          roundSetup: { ...readRoundSetup(state), ...patch },
        },
      }),
    );
    try {
      return await mutate((s) => {
        s.settings.roundSetup = { ...readRoundSetup(s), ...patch };
        s.settings.roundSetup = readRoundSetup(s);
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
  const genres = [
    ...new Set(
      state.questions
        .filter((q) => questionSourceOf(q) === "film")
        .map(genreOf),
    ),
  ]
    .filter((genre) => genre !== ACTORS)
    .sort();
  const browseQuestions =
    page === "topics" && topicScope
      ? state.questions.filter((q) =>
          topicScope.kind === "genre"
            ? questionSourceOf(q) === "film" && genreOf(q) === topicScope.name
            : matchesCategories(q, [topicScope.name]),
        )
      : [];
  const browseTopics = [...new Set(browseQuestions.map((q) => q.topic))].sort();
  const filters = {
    genres: (selectedGenres ?? genres).filter((genre) => genre !== ACTORS),
    sources: selectedSources,
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
    if (
      await changeSetup({ categories: [], genres: [genre], sources: ["film"] })
    )
      setPage("home");
  };
  const completed = state.rounds.filter((r) => r.status === "completed");
  const active = state.rounds.find((r) => r.status === "active");
  const current = state.rounds.find((r) => r.id === roundId);
  const targetSize = completed.length ? 10 : 5;
  const roundTopic = selectionTopic(selectedCategories, selectedSources);
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
            <PlaySetup
              completed={completed}
              mode={mode}
              busy={busy}
              changeSetup={changeSetup}
              selection={selection}
              active={active}
              begin={begin}
              roundTopic={roundTopic}
              selectedSources={selectedSources}
              filters={filters}
              genres={genres}
              selectedDifficulties={selectedDifficulties}
              selectedFamiliarities={selectedFamiliarities}
              pendingSolutions={pendingSolutions}
              state={state}
              setPendingSolutions={setPendingSolutions}
              mutate={mutate}
              nav={nav}
              resume={resume}
              targetSize={targetSize}
              toggleGenre={toggleGenre}
              selectedCategories={selectedCategories}
              mastered={mastered}
              setPage={setPage}
            />
          )}
          {page === "topics" && (
            <TopicsPage
              topicScope={topicScope}
              setTopicScope={setTopicScope}
              browseTopics={browseTopics}
              state={state}
              browseQuestions={browseQuestions}
              changeSetup={changeSetup}
              setPage={setPage}
              genres={genres}
              playGenre={playGenre}
            />
          )}
          {page === "album" && (
            <CollectionPage
              state={state}
              mastered={mastered}
              answeredOnly={answeredOnly}
              setAnsweredOnly={setAnsweredOnly}
              albumTopics={albumTopics}
              topics={topics}
              completed={completed}
              setRoundId={setRoundId}
              setPage={setPage}
              nav={nav}
              changeSetup={changeSetup}
            />
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
