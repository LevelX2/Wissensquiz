import { isRecordMode, isEndlessMode } from "./recordModes";
import type { PlayGroup } from "./ModePicker";
import type { LeaderboardTarget } from "./leaderboard";
import { familiarities } from "./familiarity";
import {
  lazy,
  Suspense,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { complete, rebuild, startRound } from "./engine";
import {
  emptyState,
  type Round,
  type State,
  type RoundSetup,
  type Difficulty,
  type Mode,
} from "./model";
import {
  difficulties,
  genreOf,
  questionSourceOf,
  questionSources,
} from "./filters";
import { read as readStored, update as updateStored } from "./storage";
import { useOffline } from "./offline";
import { ActivityContext } from "./GuestActivity";
import { GuestActivityReporter } from "./guestActivityDelivery";
import { readRoundSetup } from "./roundSetup";
import { careerProgress } from "./career";
import { CareerProgress } from "./CareerProgress";
import { type Category, selectionTopic, ACTORS } from "./categories";
import { UnlockCelebration } from "./UnlockCelebration";
import {
  learningPathProgress,
  retainJourneyUnlocks,
  newlyUnlocked,
  type PathUnlock,
} from "./learningPath";
import { SyncSymbol, type SyncDisplay } from "./SyncIndicator";
import {
  playClickFeedback,
  playFeedback,
  stopFeedback,
  unlockSound,
} from "./feedback";
import {
  addPackages,
  hasPackage,
  packages,
  type PackageContent,
} from "./packages";
import type { Page, DuelPage, Mutate } from "./uiTypes";
import { QuestionScreen } from "./QuestionScreen";
import { Result } from "./RoundResult";
import { PlaySetup } from "./PlaySetup";
import type { WriteOptions } from "./entryStorage";

import { PageBoundary } from "./PageBoundary";
import { ReleaseInfo } from "./ReleaseInfo";
import { IssueReportForm } from "./IssueReportForm";
import { archiveClosedRounds } from "./roundArchive";

const Leaderboard = lazy(() =>
  import("./RecordLeaderboard").then((m) => ({ default: m.Leaderboard })),
);
const Help = lazy(() => import("./Help").then((m) => ({ default: m.Help })));
const DuelCenter = lazy(() =>
  import("./DuelCenter").then((m) => ({ default: m.DuelCenter })),
);
const Settings = lazy(() =>
  import("./Settings").then((m) => ({ default: m.Settings })),
);
const TopicsPage = lazy(() =>
  import("./TopicsPage").then((m) => ({ default: m.TopicsPage })),
);
const CollectionPage = lazy(() =>
  import("./CollectionPage").then((m) => ({ default: m.CollectionPage })),
);

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
  const update = (
    fn: (s: State) => void,
    initial?: State,
    options?: WriteOptions,
  ) => updateStored(fn, initial, storageKey, options);
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
  const [roundId, setRoundId] = useState("");
  const [justCompleted, setJustCompleted] = useState("");
  const immediateResult = useRef<Round | undefined>(undefined);
  const [leaderboardTarget, setLeaderboardTarget] =
    useState<LeaderboardTarget>();
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
  const catalogNavigation = useMemo(
    () => ({
      topics: [...new Set(state?.questions.map((q) => q.topic) ?? [])].sort(),
      genres: [
        ...new Set(
          state?.questions
            .filter((q) => questionSourceOf(q) === "film")
            .map(genreOf) ?? [],
        ),
      ]
        .filter((genre) => genre !== ACTORS)
        .sort(),
    }),
    [state?.questions],
  );
  const roundSetup = useMemo(
    () => (state ? readRoundSetup(state) : null),
    [state?.questions, state?.settings],
  );
  useEffect(() => {
    if (state) onPersistedState?.(state);
  }, [state, onPersistedState]);
  useEffect(() => {
    if (state?.settings.sound === false) stopFeedback();
  }, [state?.settings.sound]);
  useEffect(() => {
    const stopHidden = () => {
      if (document.visibilityState === "hidden") stopFeedback();
    };
    document.addEventListener("visibilitychange", stopHidden);
    return () => {
      document.removeEventListener("visibilitychange", stopHidden);
      stopFeedback();
    };
  }, []);
  useEffect(() => {
    if (booted.current) return;
    booted.current = true;
    (async () => {
      const initial = (await read()) ?? emptyState();
      const incoming: PackageContent[] = [];
      // Revalidate all bundled IDs once on a catalog upgrade, so variants
      // referring across packages are also included in the official pool.
      const completeCatalog =
        initial.bundledQuestionIds &&
        packages.every((pkg) => hasPackage(initial, pkg.filename));
      for (const pkg of packages) {
        if (completeCatalog) continue;
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
          if (r.status === "active" && isRecordMode(r.mode)) {
            r.status = "aborted";
            r.finishedAt = Date.now();
          }
        rebuild(s);
        archiveClosedRounds(s);
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
    if (page !== "result") {
      setJustCompleted("");
      immediateResult.current = undefined;
    }
  }, [page, index, topicScope]);
  const mutate: Mutate = async (fn, options = { progressOnly: true }) => {
    if (inFlight.current) return null;
    inFlight.current = true;
    setBusy(true);
    setError("");
    try {
      const next = await update(fn, undefined, {
        ...options,
        reuseCatalog: options.reuseCatalog ?? options.progressOnly === true,
      });
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
  const nav = async (next: Page | DuelPage, target?: LeaderboardTarget) => {
    if (page === "result" || page === "duels") {
      const saved = await mutate(archiveClosedRounds, {
        progressOnly: false,
        reuseCatalog: true,
      });
      if (!saved) return;
    }
    if (next === "topics") setTopicScope(null);
    setCelebration(null);
    if (
      page === "round" &&
      state?.rounds.some((r) => r.id === roundId && isRecordMode(r.mode))
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
    if (next === "leaderboard") setLeaderboardTarget(target);
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
  const genres = useMemo(
    () =>
      state
        ? [
            ...new Set(
              state.questions
                .filter((q) => questionSourceOf(q) === "film")
                .map(genreOf),
            ),
          ]
            .filter((genre) => genre !== ACTORS)
            .sort()
        : [],
    [state?.questions],
  );
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
    recordPreset = "standard",
    recordGenre: savedRecordGenre,
  } = pendingSetup ?? roundSetup!;
  const playGroup: PlayGroup =
    state.settings.playGroup ?? (isRecordMode(mode) ? "timed" : "learn");
  const standard = isRecordMode(mode);
  const changeSetup = async (patch: Partial<RoundSetup>) => {
    if (inFlight.current) return null;
    if (
      patch.mode &&
      isRecordMode(patch.mode) &&
      !readRoundSetup(state).recordPreset &&
      !patch.recordPreset
    )
      patch = { ...patch, recordPreset: "standard" };
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
        if (patch.mode) {
          s.settings.playGroup = isRecordMode(patch.mode) ? "timed" : "learn";
          if (isRecordMode(patch.mode)) s.settings.lastTimedMode = patch.mode;
          else s.settings.lastLearningMode = patch.mode;
        }
      });
    } finally {
      setPendingSetup(null);
    }
  };
  const bundledIds = new Set(state.bundledQuestionIds ?? []);
  const recordGenres = [
    ...new Set(
      state.questions
        .filter((q) => bundledIds.has(q.id) && questionSourceOf(q) === "film")
        .map(genreOf),
    ),
  ].sort();
  const recordGenre =
    savedRecordGenre && recordGenres.includes(savedRecordGenre)
      ? savedRecordGenre
      : recordGenres[0];
  const filters = standard
    ? {
        genres:
          recordPreset === "genre"
            ? recordGenre
              ? [recordGenre]
              : []
            : recordGenres,
        sources:
          recordPreset === "genre" ? ["film" as const] : [...questionSources],
        difficulties: ["leicht", "mittel", "schwer"] as Difficulty[],
        familiarities: [...familiarities],
      }
    : {
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
  const active = state.rounds.find((r) => r.status === "active");
  const current = state.rounds.find((r) => r.id === roundId);
  const roundTopic = standard
    ? "Alle Themen"
    : selectionTopic(selectedCategories, selectedSources);
  const begin = async (requestedMode: Mode = mode) => {
    unlockSound(state.settings);
    let id = "";
    const next = await mutate((s) => {
      if (s.rounds.some((r) => r.status === "active"))
        throw new Error(
          "Beende zuerst Deine begonnene Runde oder setze sie fort.",
        );
      // Select and start in one transaction: the clicked tile must not use the
      // previously rendered mode, and a failed save must not change the setup.
      s.settings.roundSetup = readRoundSetup({
        ...s,
        settings: {
          ...s.settings,
          roundSetup: { ...readRoundSetup(s), mode: requestedMode },
        },
      });
      s.settings.playGroup = isRecordMode(requestedMode) ? "timed" : "learn";
      if (isRecordMode(requestedMode)) s.settings.lastTimedMode = requestedMode;
      else s.settings.lastLearningMode = requestedMode;
      s.settings.spoilers = true;
      id = startRound(s, {
        mode: requestedMode,
        topic: roundTopic,
        difficulty: "Alle Stufen",
        filters: {
          ...filters,
          difficulties: standard
            ? filters.difficulties
            : requestedMode === "entdecken"
              ? [...difficulties]
              : selectedDifficulties,
          familiarities: standard
            ? filters.familiarities
            : requestedMode === "entdecken"
              ? [...familiarities]
              : selectedFamiliarities,
        },
        ...(isRecordMode(requestedMode) ? { recordPreset } : {}),
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
  return (
    <div
      className={`app-shell ${page === "round" || duelPlaying ? "is-playing" : ""}`}
      onClickCapture={(e) => playClickFeedback(e.target, state.settings)}
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
          <PageBoundary key={page}>
            <Suspense fallback={<p role="status">Ansicht wird geladen …</p>}>
              {page === "home" && (
                <PlaySetup
                  mode={mode}
                  playGroup={playGroup}
                  standard={standard}
                  recordPreset={recordPreset}
                  recordGenre={recordGenre}
                  busy={busy}
                  changeSetup={changeSetup}
                  active={active}
                  begin={begin}
                  roundTopic={roundTopic}
                  selectedSources={selectedSources}
                  filters={filters}
                  genres={standard ? recordGenres : genres}
                  selectedDifficulties={selectedDifficulties}
                  selectedFamiliarities={selectedFamiliarities}
                  state={state}
                  mutate={mutate}
                  nav={nav}
                  resume={resume}
                  toggleGenre={toggleGenre}
                  selectedCategories={selectedCategories}
                />
              )}
              {page === "topics" && (
                <TopicsPage
                  topicScope={topicScope}
                  setTopicScope={setTopicScope}
                  state={state}
                  changeSetup={changeSetup}
                  setPage={setPage}
                  genres={genres}
                  playGenre={playGenre}
                />
              )}
              {page === "album" && (
                <CollectionPage
                  state={state}
                  answeredOnly={answeredOnly}
                  setAnsweredOnly={setAnsweredOnly}
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
                    initialTarget={leaderboardTarget}
                    onAccount={() => void nav("account")}
                    onPlay={() => {
                      void changeSetup({ mode: "rekord" }).then((saved) => {
                        if (saved) setPage("home");
                      });
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
                  onCompleted={(saved) =>
                    guestReporter.current?.record(
                      saved,
                      current.id,
                      "completed",
                    )
                  }
                  onExit={() => void nav("home")}
                  onNext={async () => {
                    unlockSound(state.settings);
                    if (index === current.questions.length - 1) {
                      let unlocks: PathUnlock[] = [];
                      const next = await mutate((s) => {
                        const before = learningPathProgress(s);
                        complete(s, current.id);
                        unlocks = current.run?.ended
                          ? (current.unlocks ?? [])
                          : newlyUnlocked(before, s);
                      });
                      if (next) {
                        guestReporter.current?.record(
                          next,
                          current.id,
                          "completed",
                        );
                        setJustCompleted(current.id);
                        immediateResult.current = next.rounds.find(
                          (r) => r.id === current.id,
                        );
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
                  onLeaderboard={(duelId) =>
                    void nav("leaderboard", { kind: "duel", duelId })
                  }
                  onPlaying={setDuelPlaying}
                />
              )}
              {page === "result" && current && (
                <Result
                  round={immediateResult.current ?? current}
                  state={state}
                  onHome={() => void nav("home")}
                  onLeaderboard={() =>
                    void nav("leaderboard", {
                      kind: "record",
                      roundId: current.id,
                    })
                  }
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
                    <button
                      className="secondary"
                      onClick={() => void nav("help")}
                    >
                      ? So funktioniert’s
                    </button>
                  </div>
                  {accountPanel?.(state, setState)}
                  <details className="settings-panel">
                    <summary>Problem oder Verbesserung melden</summary>
                    <IssueReportForm />
                  </details>
                  <ReleaseInfo />
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
            </Suspense>
          </PageBoundary>
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
