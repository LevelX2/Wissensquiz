import { serverUnlocks, type PathUnlock } from "./learningPath";
import { isRecordMode } from "./recordModes";
import type { PlayGroup } from "./ModePicker";
import type { LeaderboardTarget } from "./leaderboard";
import { familiarities } from "./familiarity";
import {
  lazy,
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import {
  emptyState,
  type Round,
  type State,
  type RoundSetup,
  type Difficulty,
  type Mode,
} from "./model";
import { difficulties, questionSources } from "./filters";
import type { OnlineGameStore } from "./onlineGameStore";
import { readRoundSetup } from "./roundSetup";
import { careerProgress } from "./career";
import { CareerProgress } from "./CareerProgress";
import { ProfileSection } from "./ProfileSection";
import { type Category, selectionTopic } from "./categories";

import { SyncSymbol, type SyncDisplay } from "./SyncIndicator";
import {
  playClickFeedback,
  playFeedback,
  releaseFeedbackAudio,
  stopFeedback,
  unlockSound,
} from "./feedback";
import type { Page, DuelPage, Mutate } from "./uiTypes";
import { Result } from "./RoundResult";
import { PlaySetup } from "./PlaySetup";
import type { WriteOptions } from "./syncTypes";

import { PageBoundary } from "./PageBoundary";
import { ReleaseInfo } from "./ReleaseInfo";
import { IssueReportForm } from "./IssueReportForm";
import { uiArtwork } from "./uiArtwork";
import { LearningGame } from "./LearningGame";
import {
  LearningSession,
  learningRunSchema,
  type LearningSetup,
} from "./learningRuns";
import { archiveClosedRounds } from "./roundArchive";
import { RankedGame } from "./RankedGame";
import {
  RankedSession,
  rankedRound,
  importRankedHistory,
  type RankedSetup,
} from "./rankedRuns";

const Leaderboard = lazy(() =>
  import("./RecordLeaderboard").then((m) => ({ default: m.Leaderboard })),
);
const Help = lazy(() => import("./Help").then((m) => ({ default: m.Help })));
const DuelCenter = lazy(() =>
  import("./DuelCenter").then((m) => ({ default: m.DuelCenter })),
);
const HotSeatCenter = lazy(() =>
  import("./HotSeatCenter").then((m) => ({ default: m.HotSeatCenter })),
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
const navigationAwards = uiArtwork("genre-awards", "32px");

export function App({
  store,
  accountPanel,
  sync,
  initialNotice = "",
  onInitialized,
}: {
  store: OnlineGameStore;
  accountPanel?: (state: State) => ReactNode;
  sync?: SyncDisplay;
  initialNotice?: string;
  onInitialized?: () => void;
}) {
  const read = () => store.read();
  const update = (
    fn: (s: State) => void,
    _initial?: State,
    options?: WriteOptions,
  ) => store.update(fn, options);
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
  const [notice, setNotice] = useState(initialNotice);
  const [busy, setBusy] = useState(false);
  const [pendingSetup, setPendingSetup] = useState<RoundSetup | null>(null);
  const [roundId, setRoundId] = useState("");
  const [celebration, setCelebration] = useState<{
    roundId: string;
    unlocks: PathUnlock[];
    promotion?: { level: number; title: string };
  } | null>(null);
  const [justCompleted, setJustCompleted] = useState("");
  const immediateResult = useRef<Round | undefined>(undefined);
  const [leaderboardTarget, setLeaderboardTarget] =
    useState<LeaderboardTarget>();
  const [duelPlaying, setDuelPlaying] = useState(false);
  const [ranked, setRanked] = useState<{
    session: RankedSession;
    setup: RankedSetup;
  } | null>(null);
  const [learning, setLearning] = useState<{
    session: LearningSession;
    setup?: LearningSetup;
    resumeId?: string;
  } | null>(null);
  const [activeLearning, setActiveLearning] = useState<Round>();
  const heading = useRef<HTMLElement>(null);
  const booted = useRef(false);
  const inFlight = useRef(false);
  const navigating = useRef(false);
  useEffect(
    () =>
      store.subscribe((next) => {
        setState(next);
        setError("");
      }),
    [store],
  );
  const availableGenres = store.info!.genres.filter(
    (genre) => !genre.startsWith("Serien · "),
  );
  const roundSetup = useMemo(
    () => (state ? readRoundSetup(state, store.info!.genres) : null),
    [state?.questions, state?.settings],
  );
  useEffect(() => {
    if (state?.settings.sound === false) stopFeedback();
  }, [state?.settings.sound]);
  useEffect(() => {
    const stopHidden = () => {
      if (document.visibilityState === "hidden") releaseFeedbackAudio();
    };
    document.addEventListener("visibilitychange", stopHidden);
    window.addEventListener("pagehide", releaseFeedbackAudio);
    window.addEventListener("blur", releaseFeedbackAudio);
    return () => {
      document.removeEventListener("visibilitychange", stopHidden);
      window.removeEventListener("pagehide", releaseFeedbackAudio);
      window.removeEventListener("blur", releaseFeedbackAudio);
      releaseFeedbackAudio();
    };
  }, []);
  useEffect(() => {
    if (booted.current) return;
    booted.current = true;
    (async () => {
      const initial = (await read()) ?? emptyState();
      const status = await store
        .rankedRemote()
        .call<{ active: unknown }>("quiz_game_call", {
          request_text: '{"action":"status"}',
        });
      if (status.active) {
        const r = learningRunSchema.parse(status.active);
        setActiveLearning({
          ...r,
          id: "learn-" + r.id,
          difficulty: "Alle Stufen",
          ruleVersion: "learn-server-v1",
          questions: [],
          order: [],
          events: [],
          before: {},
        });
      }
      const loaded = initial;
      setState(loaded);
    })()
      .catch((e) =>
        setError(
          `Dein Online-Spielstand konnte nicht geöffnet werden: ${e instanceof Error ? e.message : String(e)}`,
        ),
      )
      .finally(() => onInitialized?.());
  }, []);
  useEffect(() => {
    heading.current?.focus();
    window.scrollTo(0, 0);
    if (page !== "result") {
      setJustCompleted("");
      immediateResult.current = undefined;
    }
  }, [page, topicScope]);
  useEffect(() => {
    if (page === "result") heading.current?.focus();
  }, [page]);
  const mutate: Mutate = async (fn, options = { progressOnly: true }) => {
    if (inFlight.current || navigating.current) return null;
    inFlight.current = true;
    setBusy(true);
    setError("");
    try {
      if (learning) {
        if (learning.session.hasPending)
          throw new Error("Bestätige zuerst die ausstehende Anfrage.");
        // Learning answers write directly on the server. Refresh their
        // revision before saving settings such as the in-game sound toggle.
        await store.refresh();
      }
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
    if (busy || inFlight.current || navigating.current) return;
    navigating.current = true;
    setBusy(true);
    try {
      if (learning) {
        if (learning.session.hasPending) {
          setError("Bestätige zuerst die ausstehende Anfrage.");
          return;
        }
        try {
          setState(await store.refresh());
        } catch (e) {
          setError(e instanceof Error ? e.message : String(e));
          return;
        }
        const r = learning.session.run;
        if (r?.status === "active") setActiveLearning(learning.session.round());
        setLearning(null);
      }
      if (ranked) {
        if (ranked.session.isWriting) return;
        try {
          await ranked.session.abort();
          await store.retry();
          const session = ranked.session;
          const saved =
            session.run && session.items.length
              ? await store.update(
                  (s) =>
                    importRankedHistory(s, {
                      run: session.run!,
                      items: session.items,
                    }),
                  { progressOnly: false, reuseCatalog: true },
                )
              : store.read();
          setState(saved);
          setRanked(null);
        } catch (e) {
          setError(e instanceof Error ? e.message : String(e));
          return;
        }
      }
      if (page === "result" || page === "duels") {
        const saved = await store.update(archiveClosedRounds, {
          progressOnly: false,
          reuseCatalog: true,
        });
        setState(saved);
      }
      if (next === "topics") setTopicScope(null);

      if (
        page === "round" &&
        state?.rounds.some((r) => r.id === roundId && isRecordMode(r.mode))
      ) {
        const saved = await store.update((s) => {
          const r = s.rounds.find((r) => r.id === roundId);
          if (r?.status === "active") {
            r.status = "aborted";
            r.finishedAt = Date.now();
          }
        });
        setState(saved);
      }
      if (next === "leaderboard") setLeaderboardTarget(target);
      setPage(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      navigating.current = false;
      setBusy(false);
    }
  };
  useEffect(() => {
    const invitation = () => {
      if (/^#duel=[a-f0-9]{64}$/.test(location.hash) && page !== "round")
        setPage("duels");
    };
    window.addEventListener("hashchange", invitation);
    return () => window.removeEventListener("hashchange", invitation);
  }, [page]);
  const genres = availableGenres;
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
    workTypes: selectedWorkTypes,
    techniques: selectedTechniques,
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
      !readRoundSetup(state, store.info!.genres).recordPreset &&
      !patch.recordPreset
    )
      patch = { ...patch, recordPreset: "standard" };
    // Reflect the click immediately; only committed state reaches account sync.
    setPendingSetup(
      readRoundSetup(
        {
          ...state,
          settings: {
            ...state.settings,
            roundSetup: {
              ...readRoundSetup(state, store.info!.genres),
              ...patch,
            },
          },
        },
        store.info!.genres,
      ),
    );
    try {
      return await mutate((s) => {
        s.settings.roundSetup = {
          ...readRoundSetup(s, store.info!.genres),
          ...patch,
        };
        s.settings.roundSetup = readRoundSetup(s, store.info!.genres);
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
  const recordGenres = store.info!.genres;
  const recordGenre =
    savedRecordGenre && recordGenres.includes(savedRecordGenre)
      ? savedRecordGenre
      : recordGenres[0];
  const filters = standard
    ? {
        genres:
          recordPreset === "genre"
            ? recordGenre
              ? [
                  recordGenre.startsWith("Serien · ")
                    ? recordGenre.slice(9)
                    : recordGenre,
                ]
              : []
            : null,
        ...(recordPreset === "genre"
          ? {
              workTypes: [
                recordGenre?.startsWith("Serien · ")
                  ? ("series" as const)
                  : ("film" as const),
              ],
            }
          : {}),
        sources:
          recordPreset === "genre" ? ["film" as const] : [...questionSources],
        difficulties: ["leicht", "mittel", "schwer"] as Difficulty[],
        familiarities: [...familiarities],
      }
    : {
        genres: selectedGenres,
        ...(selectedWorkTypes ? { workTypes: selectedWorkTypes } : {}),
        ...(selectedTechniques ? { techniques: selectedTechniques } : {}),
        ...(selectedCategories.length
          ? {
              collections: selectedCategories.filter(
                (c): c is "Classics" | "Arthouse" =>
                  c === "Classics" || c === "Arthouse",
              ),
            }
          : {}),
        sources: selectedSources,
        difficulties:
          mode === "entdecken" ? [...difficulties] : selectedDifficulties,
        familiarities:
          mode === "entdecken" ? [...familiarities] : selectedFamiliarities,
      };
  const toggleGenre = (genre: string) => {
    const selected = filters.genres ?? genres;
    const next = selected.includes(genre)
      ? selected.filter((g) => g !== genre)
      : [...selected, genre];
    void changeSetup({ genres: next.length === genres.length ? null : next });
  };
  const playGenre = async (genre: string) => {
    if (
      await changeSetup({
        categories: [],
        genres: [genre.startsWith("Serien · ") ? genre.slice(9) : genre],
        sources: ["film"],
        workTypes: [genre.startsWith("Serien · ") ? "series" : "film"],
        techniques: undefined,
      })
    )
      setPage("home");
  };
  const active =
    activeLearning ?? state.rounds.find((r) => r.status === "active");
  const current =
    state.rounds.find((r) => r.id === roundId) ??
    (immediateResult.current?.id === roundId
      ? immediateResult.current
      : undefined);
  const roundTopic = standard
    ? "Alle Themen"
    : selectionTopic([], selectedSources);
  const showCompletedRound = (review: Round, saved: State) => {
    const unlocks = serverUnlocks(state, saved);
    const promoted = careerProgress(saved.experience);
    const promotion =
      promoted.level > careerProgress(state.experience).level
        ? promoted
        : undefined;
    setCelebration(
      unlocks.length || promotion
        ? {
            roundId: review.id,
            unlocks,
            ...(promotion ? { promotion } : {}),
          }
        : null,
    );
    setState(saved);
    setRoundId(review.id);
    setJustCompleted(review.id);
    immediateResult.current = review;
    setPage("result");
  };
  const begin = async (requestedMode: Mode = mode) => {
    unlockSound(state.settings);
    const next = await mutate((s) => {
      if (s.rounds.some((r) => r.status === "active"))
        throw new Error(
          "Beende zuerst Deine begonnene Runde oder setze sie fort.",
        );
      // Select and start in one transaction: the clicked tile must not use the
      // previously rendered mode, and a failed save must not change the setup.
      s.settings.roundSetup = readRoundSetup(
        {
          ...s,
          settings: {
            ...s.settings,
            roundSetup: {
              ...readRoundSetup(s, store.info!.genres),
              mode: requestedMode,
            },
          },
        },
        store.info!.genres,
      );
      s.settings.playGroup = isRecordMode(requestedMode) ? "timed" : "learn";
      if (isRecordMode(requestedMode)) s.settings.lastTimedMode = requestedMode;
      else s.settings.lastLearningMode = requestedMode;
      s.settings.spoilers = true;
    });
    if (next) {
      playFeedback("start", next.settings);
      if (isRecordMode(requestedMode)) {
        setRanked({
          session: new RankedSession(
            store.rankedRemote(),
            store.rankedCatalogHash(),
          ),
          setup: {
            mode: requestedMode,
            preset: recordPreset,
            genre: recordGenre,
            solutionDisplay: next.settings.solutionDisplay ?? "question",
          },
        });
        setPage("round");
        return;
      }
      setLearning({
        session: new LearningSession(store.rankedRemote()),
        setup: {
          mode: requestedMode as LearningSetup["mode"],
          topic: roundTopic,
          filters,
          solutionDisplay: next.settings.solutionDisplay ?? "question",
        },
      });
      setPage("round");
    }
  };
  const resume = () => {
    if (activeLearning) {
      setLearning({
        session: new LearningSession(store.rankedRemote()),
        resumeId: activeLearning.id.slice(6),
      });
      setPage("round");
    }
  };
  const retryErrors = async (source: Round) => {
    setLearning({
      session: new LearningSession(store.rankedRemote()),
      setup: {
        mode: "fehler",
        topic: source.filters ? source.topic : "Alle Themen",
        filters: source.filters ?? {
          genres,
          sources: [...questionSources],
          difficulties: [...difficulties],
          familiarities: [...familiarities],
        },
        solutionDisplay: state.settings.solutionDisplay ?? "question",
        sourceRoundId: source.id,
      },
    });
    setPage("round");
  };
  const abortActive = async () => {
    if (!activeLearning) return;
    setBusy(true);
    setError("");
    try {
      const session = new LearningSession(store.rankedRemote());
      await session.resume(activeLearning.id.slice(6));
      if (session.run!.status === "active") await session.abort();
      setState(await store.refresh());
      setActiveLearning(undefined);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <div
      className={`app-shell ${page === "round" || duelPlaying ? "is-playing" : ""}`}
      onClickCapture={(e) => {
        if (page !== "hot-seat") playClickFeedback(e.target, state.settings);
      }}
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
              ["home", "/navigation/play.png", "Spielen"],
              ["topics", "/disclosures/film.png", "Themen"],
              ["album", "/disclosures/sources.png", "Sammlung"],
              ["leaderboard", "/genres/awards.png", "Highscores"],
              ["account", "/navigation/profile.png", "Profil"],
            ] as const
          ).map(([p, icon, label]) => (
            <button
              key={p}
              className={
                page === p ||
                (p === "home" && (page === "duels" || page === "hot-seat")) ||
                (p === "account" && page === "settings")
                  ? "selected"
                  : ""
              }
              aria-current={
                page === p ||
                (p === "home" && (page === "duels" || page === "hot-seat")) ||
                (p === "account" && page === "settings")
                  ? "page"
                  : undefined
              }
              onClick={() => void nav(p)}
              disabled={busy}
              aria-description={p === "account" ? sync?.text : undefined}
            >
              <span aria-hidden="true" className="nav-symbol">
                <img
                  className="nav-artwork"
                  {...(icon === "/genres/awards.png"
                    ? navigationAwards
                    : { src: icon })}
                  alt=""
                  width={32}
                  height={32}
                />
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
          {notice && page === "home" && (
            <p role="status" className="notice">
              {notice}{" "}
              <button
                className="text-button"
                aria-label="Hinweis schließen"
                onClick={() => setNotice("")}
              >
                ×
              </button>
            </p>
          )}
          {error && (
            <div role="alert" className="notice error">
              {error}
              {ranked?.session.hasPending ? (
                <button
                  disabled={busy}
                  onClick={async () => {
                    setBusy(true);
                    try {
                      await ranked.session.retry();
                      setError("");
                    } catch (e) {
                      setError(e instanceof Error ? e.message : String(e));
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  Erneut versuchen
                </button>
              ) : (
                sync?.status === "offline" && (
                  <button onClick={sync.retry}>Erneut versuchen</button>
                )
              )}
            </div>
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
                  onAbortActive={() =>
                    void abortActive().catch((e) => setError(String(e)))
                  }
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
              {page === "round" && ranked && (
                <RankedGame
                  session={ranked.session}
                  setup={ranked.setup}
                  store={store}
                  state={state}
                  disabled={busy}
                  mutate={mutate}
                  onBusy={setBusy}
                  onExit={() => void nav("home")}
                  onFinish={async () => {
                    const session = ranked.session;
                    if (!session.run) return;
                    const review = rankedRound({
                      run: session.run,
                      items: session.items,
                    });
                    await store.retry();
                    const saved = await store.update(
                      (s) =>
                        importRankedHistory(s, {
                          run: session.run!,
                          items: session.items,
                        }),
                      { progressOnly: false, reuseCatalog: true },
                    );
                    showCompletedRound(review, saved);
                    setRanked(null);
                  }}
                />
              )}
              {page === "round" && learning && (
                <LearningGame
                  session={learning.session}
                  setup={learning.setup}
                  resumeId={learning.resumeId}
                  state={state}
                  disabled={busy}
                  mutate={mutate}
                  onBusy={setBusy}
                  onExit={() => void nav("home")}
                  onFinish={async () => {
                    const review = learning.session.round();
                    const saved = await store.refresh();
                    showCompletedRound(review, saved);
                    setActiveLearning(undefined);
                    setLearning(null);
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
              {page === "hot-seat" && (
                <HotSeatCenter
                  onHome={() => void nav("home")}
                  onBusy={setBusy}
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
                      ...(isRecordMode(current.mode)
                        ? { mode: current.mode }
                        : {}),
                    })
                  }
                  onRetry={() => void retryErrors(current)}
                  busy={busy}
                  celebrate={justCompleted === current.id}
                  unlocks={
                    celebration?.roundId === current.id
                      ? celebration.unlocks
                      : []
                  }
                  promotion={
                    celebration?.roundId === current.id
                      ? celebration.promotion
                      : undefined
                  }
                  onAcknowledged={() => setCelebration(null)}
                />
              )}
              {page === "account" && (
                <div className="profile-page">
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
                  {accountPanel?.(state)}
                  <ProfileSection
                    title="Problem oder Verbesserung melden"
                    subject="report"
                  >
                    <IssueReportForm />
                  </ProfileSection>
                  <ReleaseInfo />
                </div>
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
                    state={state}
                    mutate={mutate}
                    busy={busy}
                    onHome={() => {
                      setActiveLearning(undefined);
                      setPage("home");
                    }}
                  />
                </>
              )}
            </Suspense>
          </PageBoundary>
        </main>

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
