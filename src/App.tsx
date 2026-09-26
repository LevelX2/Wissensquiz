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
import { download, read, restore, update, validateBackup } from "./storage";
import { useOffline } from "./offline";
import { BadgeIcon, GenreIcon } from "./Icons";
import { Leaderboard } from "./RecordLeaderboard";
import { filmDetails } from "./filmDetails";
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
  "leaderboard" | "home" | "topics" | "album" | "settings" | "round" | "result";
type Mutate = (fn: (s: State) => void) => Promise<State | null>;
const modeNames: Record<Mode, string> = {
  entdecken: "Entdecken",
  ueben: "Besser werden",
  rekord: "Rekordrunde",
};
const topicIcon = (topic: string) =>
  topic.includes("Film") ? "◈" : topic.includes("All") ? "✧" : "◎";
const formatDate = (at: number) =>
  new Date(at).toLocaleDateString("de-DE", { day: "numeric", month: "short" });
function Planet({ small = false }: { small?: boolean }) {
  return (
    <div className={`planet-art ${small ? "small" : ""}`} aria-hidden="true">
      <div className="orbit orbit-one" />
      <div className="planet" />
      <div className="orbit orbit-two" />
      <span className="star star-one">✦</span>
      <span className="star star-two">✧</span>
      <span className="moon" />
      <span className="coordinates">51° N / UNBEGRENZTE NEUGIER</span>
    </div>
  );
}
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
  const ids = [
    ...new Set(
      state.questions
        .filter((q) => (genre ? genreOf(q) === topic : q.topic === topic))
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
        <span>{genre ? <GenreIcon genre={topic} /> : topicIcon(topic)}</span>
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
          {genre ? "Genre auswählen" : "Thema spielen"} <span>↗</span>
        </button>
      </div>
    </article>
  );
}
export function App() {
  const [state, setState] = useState<State | null>(null);
  const [page, setPage] = useState<Page>("home");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<Mode>("entdecken");
  const [topic, setTopic] = useState("Alle Themen");
  const [selectedGenres, setSelectedGenres] = useState<string[] | null>(null);
  const [selectedDifficulties, setSelectedDifficulties] = useState<
    Difficulty[]
  >([...difficulties]);
  const [roundId, setRoundId] = useState("");
  const [index, setIndex] = useState(0);
  const heading = useRef<HTMLElement>(null);
  const booted = useRef(false);
  const inFlight = useRef(false);
  const offline = useOffline();
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
  const genres = [...new Set(state.questions.map(genreOf))].sort();
  const filters = {
    genres: selectedGenres ?? genres,
    difficulties: selectedDifficulties,
  };
  const availableTopics = topics.filter((t) =>
    state.questions.some(
      (q) => q.topic === t && filters.genres.includes(genreOf(q)),
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
    setSelectedGenres([genre]);
    setTopic("Alle Themen");
    setPage("home");
  };
  const completed = state.rounds.filter((r) => r.status === "completed");
  const active = state.rounds.find((r) => r.status === "active");
  const current = state.rounds.find((r) => r.id === roundId);
  const targetSize = completed.length ? 10 : 5;
  const selection = selectQuestions(
    state.questions,
    state.learning,
    {
      mode,
      topic,
      difficulty: "Alle Stufen",
      filters,
      size: targetSize,
      now: Date.now(),
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
        topic,
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
    <div className="app-shell">
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
              ["album", "☆", "Meine Sammlung"],
            ] as const
          ).map(([p, icon, label]) => (
            <button
              key={p}
              className={page === p ? "selected" : ""}
              aria-current={page === p ? "page" : undefined}
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
          <button
            className="settings-link"
            onClick={() => void nav("settings")}
          >
            Einstellungen & Daten <span>↗</span>
          </button>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <span>DEIN FILMKOSMOS</span>
          <button
            className="sound-toggle"
            aria-pressed={state.settings.sound !== false}
            disabled={busy}
            onClick={async () => {
              const enabled = state.settings.sound === false;
              if (enabled) unlockSound({ ...state.settings, sound: true });
              else stopFeedback();
              const saved = await mutate((s) => {
                s.settings.sound = enabled;
              });
              if (saved && enabled) playFeedback("next", saved.settings);
            }}
          >
            {state.settings.sound !== false ? "Ton an" : "Ton aus"}
          </button>
          <div className="connection">
            <i className={offline.online ? "online" : ""} />
            {offline.online ? "Online" : "Offline"}
            <span className="desktop-only">
              {" "}
              ·{" "}
              {offline.ready ? "Paket bereit" : "Offline-Paket nicht bestätigt"}
            </span>
          </div>
        </header>
        <main ref={heading} tabIndex={-1} className="main-content">
          {error && (
            <div role="alert" className="notice error">
              {error}
            </div>
          )}
          {page === "home" && (
            <>
              <div className="page-heading">
                <div>
                  <span className="eyebrow">DEINE KLEINE AUSZEIT</span>
                  <h1>
                    Neugier? <em>Film ab.</em>
                  </h1>
                </div>
                <Pill>
                  ✦{" "}
                  {completed.length
                    ? "Schön, dass Du wieder da bist"
                    : "Ohne Konto. Einfach loslegen."}
                </Pill>
              </div>
              <section className="hero">
                <div className="hero-copy">
                  <span className="eyebrow accent">
                    ENTDECKE DEINEN FILMKOSMOS
                  </span>
                  <h2>
                    Gute Fragen.
                    <br />
                    Neue Perspektiven.
                  </h2>
                  <p>
                    Reise durch fremde Welten, entdecke die Ideen dahinter – und
                    nimm bei jeder Runde etwas mit.
                  </p>
                  <div className="hero-facts">
                    <span>◷ Ohne Zeitdruck möglich</span>
                    <span>✧ Wissen, das bleibt</span>
                  </div>
                </div>
                <Planet />
              </section>
              <section className="round-setup" aria-label="Runde vorbereiten">
                <div className="section-title">
                  <h2>Wie möchtest Du spielen?</h2>
                  <span className="muted">
                    {completed.length
                      ? "Deine nächste Runde"
                      : "Deine erste Runde"}{" "}
                    · {selection.length} Fragen
                  </span>
                </div>
                <div className="mode-grid">
                  {(["entdecken", "ueben", "rekord"] as Mode[]).map((m, i) => (
                    <button
                      key={m}
                      className={`mode-card ${mode === m ? "active" : ""}`}
                      aria-pressed={mode === m}
                      onClick={() => setMode(m)}
                    >
                      <span className="mode-icon">{["✧", "◎", "ϟ"][i]}</span>
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
                      {mode === m && <span className="mode-check">✓</span>}
                    </button>
                  ))}
                </div>
                {mode === "rekord" && (
                  <button
                    className="text-button"
                    onClick={() => setPage("leaderboard")}
                  >
                    Bestenliste ansehen →
                  </button>
                )}
                <div className="setup-bottom">
                  <div className="quiz-filters">
                    <fieldset>
                      <legend>Filmgenres</legend>
                      <p className="muted tiny">
                        Ein oder mehrere Genres kombinieren.
                      </p>
                      <div className="filter-options">
                        {genres.map((g) => (
                          <label className="filter-choice" key={g}>
                            <input
                              type="checkbox"
                              checked={filters.genres.includes(g)}
                              onChange={() => toggleGenre(g)}
                            />
                            <GenreIcon genre={g} />
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
                    </fieldset>
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
                    <details
                      className="fine-filter"
                      open={topic !== "Alle Themen" ? true : undefined}
                    >
                      <summary>
                        Optional: einzelne Filme oder Filmreihen
                      </summary>
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
                  <button
                    className="primary"
                    disabled={busy || !selection.length || !!active}
                    onClick={() => void begin()}
                  >
                    Losspielen <span>→</span>
                  </button>
                </div>
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
                  : `${state.questions.filter((q) => !q.demo).length} importierte Fragen · ${new Set(state.questions.map((q) => q.knowledgeId)).size} Wissensziele · ${state.questions.filter((q) => q.demo).length} Demo-Fragen. Details unter Einstellungen & Daten.`}
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
              <div className="topic-grid">
                {[...topics]
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
                      Bisher gibt es dieses eine Wissensabzeichen. Für Action
                      und Horror sind noch keine eigenen Abzeichen umgesetzt.
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
              <button className="text-button" onClick={() => setPage("home")}>
                ← Zur Startseite
              </button>
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
                  const next = await mutate((s) => complete(s, current.id));
                  if (next) {
                    playFeedback(
                      next.badges.length > state.badges.length
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
          {page === "settings" && (
            <Settings
              state={state}
              mutate={mutate}
              setState={setState}
              busy={busy}
              offline={offline}
              onHome={() => setPage("home")}
            />
          )}
        </main>
        <footer>
          <span>
            WISSENSQUIZ <span className="footer-star">✦</span> BLEIB NEUGIERIG.
          </span>
          <button onClick={() => void nav("settings")}>
            Lokal gespeichert · Daten verwalten
          </button>
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
    if (event) feedback.current?.focus();
  }, [!!event]);
  return (
    <div className="question-wrap">
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
          <span className="eyebrow">DEIN MOMENT DER NEUGIER</span>
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
        <h1>{q.question}</h1>
        <div className="answers">
          {round.order[index].map((id, i) => {
            const a = q.answers.find((a) => a.id === id)!;
            const correct = !!event && id === q.correctId;
            const wrong = !!event && event.answerId === id && !event.correct;
            return (
              <button
                key={id}
                className={`answer ${correct ? "correct" : ""} ${wrong ? "wrong" : ""}`}
                disabled={
                  !!event || busy || !ready || round.status !== "active"
                }
                onClick={() => void choose(id)}
              >
                <span className="answer-letter">
                  {String.fromCharCode(65 + i)}
                </span>
                <span>{a.text}</span>
                {correct && <b className="answer-verdict">✓ Richtig</b>}
                {wrong && <b className="answer-verdict">× Deine Antwort</b>}
              </button>
            );
          })}
        </div>
        {!event && (
          <p className="quiet-note">
            {round.mode === "rekord"
              ? "Deine erste Antwort zählt."
              : "Nimm Dir Zeit. Hier geht es ums Entdecken."}
          </p>
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
            {!event.correct && (
              <p>
                Die richtige Antwort:{" "}
                <strong>
                  {q.answers.find((a) => a.id === q.correctId)!.text}
                </strong>
              </p>
            )}
            <Explanation q={q} event={event} />
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
            {event.guessed && (
              <p className="tiny muted">
                Deine Punkte bleiben. Dieses Wissensziel kommt früher wieder.
              </p>
            )}
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
  state,
  mutate,
  setState,
  busy,
  offline,
  onHome,
}: {
  state: State;
  mutate: Mutate;
  setState: (s: State) => void;
  busy: boolean;
  offline: ReturnType<typeof useOffline>;
  onHome: () => void;
}) {
  const [message, setMessage] = useState("");
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
        Dein Fortschritt liegt zunächst nur in diesem Browser auf diesem Gerät.
        Gelöschter Browserspeicher kann ihn entfernen. Sichere ihn regelmäßig
        als JSON.
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
        <p className="muted tiny">
          Deine Auswahl bleibt auf diesem Gerät gespeichert und ist in Deiner
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
              disabled={busy || !supportsHaptics()}
              onChange={async (e) => {
                const enabled = e.target.checked;
                const saved = await mutate((s) => {
                  s.settings.haptics = enabled;
                });
                if (saved && enabled)
                  playFeedback("next", { ...saved.settings, sound: false });
                if (!enabled) stopFeedback();
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
            playFeedback("correct", state.settings);
          }}
        >
          Signal ausprobieren
        </button>
        <p className="muted tiny">
          {supportsHaptics()
            ? "Vibration funktioniert nur mit unterstütztem Gerät und Browser."
            : "Dieser Browser bietet keine Vibration an."}{" "}
          Deine Auswahl wird auf diesem Gerät gespeichert. Keine
          Hintergrundmusik.
        </p>
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
                  const saved = await restore(backup);
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
