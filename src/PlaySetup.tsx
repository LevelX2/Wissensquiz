import {
  workTypes,
  workTypeLabels,
  techniques,
  techniqueLabels,
} from "./workAttributes";
import {
  ModePicker,
  ModeArtwork,
  modeDescriptions,
  type PlayGroup,
} from "./ModePicker";
import { isRecordMode, isEndlessMode } from "./recordModes";
import { learningDueText } from "./learningProgress";
import { useForegroundTime } from "./useForegroundTime";
import { familiarities, familiarityLabel } from "./familiarity";
import { type Mode, type Round, type State, type RoundSetup } from "./model";
import {
  difficulties,
  difficultyLabel,
  genreLabel,
  questionSources,
  sourceLabels,
} from "./filters";
import { GenreArtwork } from "./Icons";
import { SetupSection } from "./SetupSection";
import { DisclosureArtwork } from "./DisclosureArtwork";
import { RoundGuide } from "./RoundGuide";
import { filmCategories } from "./categories";
import { LearningPath, JourneyOverview } from "./LearningPathPanel";
import type { QuestionSource } from "./model";
import type { Page, DuelPage, Mutate } from "./uiTypes";
import { modeNames } from "./gameUi";
import { useEffect, useRef, useState } from "react";
import { useServer, useServerView } from "./serverViews";

export function PlaySetup({
  mode,
  playGroup,
  standard,
  recordPreset,
  recordGenre,
  busy,
  changeSetup,
  active,
  begin,
  roundTopic,
  selectedSources,
  filters,
  genres,
  selectedDifficulties,
  selectedFamiliarities,
  state,
  mutate,
  nav,
  resume,
  toggleGenre,
  selectedCategories,
  onAbortActive,
}: {
  mode: Mode;
  playGroup: PlayGroup;
  standard: boolean;
  recordPreset: "standard" | "genre";
  recordGenre?: string;
  busy: boolean;
  changeSetup: (patch: Partial<RoundSetup>) => Promise<State | null>;
  active: Round | undefined;
  begin: (mode?: Mode) => Promise<void>;
  roundTopic: string;
  selectedSources: QuestionSource[];
  filters: {
    genres: string[] | null;
    workTypes?: ("film" | "series")[];
    techniques?: ("animation" | "live-action")[];
    sources: QuestionSource[];
    difficulties: ("leicht" | "mittel" | "schwer" | "experte")[];
    familiarities: (2 | 1 | 4 | 3)[];
  };
  genres: string[];
  selectedDifficulties: ("leicht" | "mittel" | "schwer" | "experte")[];
  selectedFamiliarities: (2 | 1 | 4 | 3)[];
  state: State;
  mutate: Mutate;
  nav: (next: Page | DuelPage) => Promise<void>;
  resume: () => void;
  toggleGenre: (genre: string) => void;
  selectedCategories: (
    "Classics" | "Arthouse" | "Preisträger" | "Schauspieler"
  )[];
  onAbortActive: () => void;
}) {
  const modePanel = useRef<HTMLDetailsElement>(null);
  const [selectionOpen, setSelectionOpen] = useState(false);
  const [browsingGroup, setBrowsingGroup] = useState<PlayGroup>();
  const closeSelection = () => {
    setSelectionOpen(false);
    setBrowsingGroup(undefined);
    if (modePanel.current) {
      modePanel.current.querySelector("summary")?.focus();
    }
  };
  const completed = state.rounds.filter((r) => r.status === "completed");
  const targetSize = 10;
  const now = useForegroundTime();
  const server = useServer()!;
  const view = useServerView({
    action: "selection",
    mode,
    topic: roundTopic,
    filters,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });
  useEffect(() => {
    if (
      view.value?.repetitions.nextAt != null &&
      view.value.repetitions.nextAt <= now
    )
      view.retry();
  }, [now, view.value?.repetitions.nextAt]);
  const selection = { length: view.value?.selectionSize ?? 0 };
  const standardReady = !!view.value;
  const runPoolSize = view.value?.poolSize ?? 0;
  const areaCount = server.info.areas;
  const repetitions = view.value?.repetitions ?? {
    due: 0,
    later: 0,
    nextAt: null,
  };
  const genreSummary =
    filters.genres === null
      ? "Alle Genres"
      : filters.genres.length > 2
        ? `${filters.genres.length} Genres`
        : filters.genres.map(genreLabel).join(" + ") || "Keine Genres";
  const workSummary = filters.workTypes
    ? filters.workTypes.map((type) => workTypeLabels[type]).join(" + ") ||
      "Keine Werkart"
    : "Filme und Serien";
  const techniqueSummary = filters.techniques
    ? filters.techniques.map((type) => techniqueLabels[type]).join(" + ") ||
      "Keine Machart"
    : "Alle Macharten";
  const difficultySummary =
    selectedDifficulties.length === difficulties.length
      ? "Alle Stufen"
      : selectedDifficulties.map(difficultyLabel).join(" + ") || "Keine Stufe";
  const familiaritySummary =
    selectedFamiliarities.length === familiarities.length
      ? "Alle Bekanntheitsgruppen"
      : `Bekanntheitsgruppen ${selectedFamiliarities.join(" + ") || "keine"}`;
  return (
    <>
      <header className="play-heading">
        <h1>
          {playGroup === "duel"
            ? "Dein nächstes Duell"
            : completed.length
              ? "Deine nächste Runde"
              : "Dein Filmquiz"}
        </h1>
        {!completed.length && (
          <p className="muted">Entdecke Filmwissen – in Deinem Tempo.</p>
        )}
      </header>
      <section
        className="round-setup"
        aria-label="Runde vorbereiten"
        aria-busy={busy}
      >
        <div className="section-title">
          <h2>Wie möchtest Du spielen?</h2>
        </div>
        <SetupSection
          className="mode-selection"
          detailsRef={modePanel}
          open={selectionOpen}
          onOpenChange={(open) => {
            setSelectionOpen(open);
            if (!open) setBrowsingGroup(undefined);
          }}
          illustration={<ModeArtwork mode={mode} duel={playGroup === "duel"} />}
          selection={
            <>
              <strong>
                {playGroup === "duel" ? "Duell" : modeNames[mode]}
              </strong>
              <small>
                {playGroup === "duel"
                  ? "Drei Runden gegen einen Mitspieler"
                  : modeDescriptions[mode]}
              </small>
              {playGroup === "learn" && mode === "fehler" && (
                <small aria-label="Fällige Wiederholungen">
                  {repetitions.due.toLocaleString("de-DE")}{" "}
                  {repetitions.due === 1 ? "Wiederholung" : "Wiederholungen"}{" "}
                  fällig
                </small>
              )}
              {playGroup === "learn" &&
                mode === "fehler" &&
                repetitions.due === 0 &&
                repetitions.nextAt !== null && (
                  <small>
                    Nächste Wiederholung:{" "}
                    {learningDueText(repetitions.nextAt, now)}
                  </small>
                )}
            </>
          }
          summaryExtra={
            playGroup === "learn" && mode === "entdecken" ? (
              <JourneyOverview />
            ) : undefined
          }
          actionLabel="Modus ändern"
        >
          <ModePicker
            mode={
              browsingGroup === "timed"
                ? (state.settings.lastTimedMode ?? "rekord")
                : browsingGroup === "learn"
                  ? (state.settings.lastLearningMode ?? "entdecken")
                  : mode
            }
            group={browsingGroup ?? playGroup}
            busy={busy}
            onMode={(next) =>
              void changeSetup({
                mode: next,
                ...(isRecordMode(next) && !state.settings.lastTimedMode
                  ? { recordPreset: "standard" }
                  : {}),
              }).then((saved) => {
                if (saved) closeSelection();
              })
            }
            onGroup={setBrowsingGroup}
            onDuel={() =>
              void mutate((s) => {
                s.settings.playGroup = "duel";
              }).then((saved) => {
                if (saved) closeSelection();
              })
            }
          />
        </SetupSection>
        {active && (
          <div className="resume notice">
            <span>Deine begonnene Runde wartet auf Dich.</span>
            <button onClick={resume}>Fortsetzen →</button>
            <button className="text-button" onClick={onAbortActive}>
              Runde beenden
            </button>
          </div>
        )}
        {playGroup === "duel" ? (
          <>
            <button
              className="primary"
              disabled={busy || !!active}
              onClick={() => void nav("duels")}
            >
              Duell wählen <span>→</span>
            </button>
            <RoundGuide mode="duel" />
          </>
        ) : (
          <>
            <div className="round-start">
              <button
                className="primary"
                data-feedback="own"
                disabled={busy || !selection.length || !!active}
                onClick={() => void begin()}
                aria-describedby="round-summary"
              >
                Losspielen <span>→</span>
              </button>
              <p id="round-summary" className="tiny muted" aria-live="polite">
                {roundTopic.replace("Filmfragen", "Werkfragen")}
                {` · ${workSummary} · ${genreSummary} · ${techniqueSummary}`}
                {!!selectedCategories.length &&
                  ` · ${selectedCategories.join(" + ")}`}
                {" · "}
                {isEndlessMode(mode)
                  ? `Endlos · ${runPoolSize} Filmfakten im Pool`
                  : `${selection.length} Fragen`}
                {" · "}
                {standard
                  ? `${recordPreset === "genre" ? "Genre-Rekord" : "Universal"} · 3 leicht / 4 mittel / 3 schwer`
                  : mode !== "entdecken"
                    ? "Freie Auswahl: " + difficultySummary
                    : "Filmreise · freigeschaltete Etappen · neue Fragen und Wiederholungen"}
                {mode !== "entdecken" &&
                  ` · ${standard ? "Alle Bekanntheitsgruppen" : familiaritySummary}`}
              </p>
            </div>

            <RoundGuide mode={mode} />
            {view.error ? (
              <p role="alert" className="notice">
                {view.error}
                <button onClick={view.retry}>Erneut versuchen</button>
              </p>
            ) : !view.value ? (
              <p role="status">Deine Auswahl wird geprüft …</p>
            ) : !selection.length ? (
              <p role="status" className="notice">
                {standard && !standardReady
                  ? "Der vollständige Standardmix wird geladen. Bitte warte, bis alle Fragenpakete bereit sind."
                  : mode === "entdecken"
                    ? "Für diese Auswahl sind noch keine Fragen freigeschaltet. Wähle andere Fragenbereiche oder Filmgenres, oder spiele frei."
                    : mode === "fehler"
                      ? "Aktuell ist in Deiner Auswahl nichts zur Wiederholung fällig. Entdecke weitere Fragen in der Filmreise oder spiele frei."
                      : "Wähle einen Fragenbereich und eine Schwierigkeitsstufe mit verfügbaren Fragen. Wähle außerdem passende Bekanntheitsgruppen und für Filmfragen passende Genres."}
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
              !isEndlessMode(mode) &&
              selection.length < targetSize && (
                <p className="tiny muted">
                  Für Deine Auswahl ist diese Runde kürzer.
                </p>
              )
            )}

            {isRecordMode(mode) && (
              <fieldset disabled={busy} className="record-preset">
                <legend>Rekordauswahl</legend>
                <label>
                  <input
                    type="radio"
                    name="record-preset"
                    aria-label="Universal · alle Bereiche · 3 leicht / 4 mittel / 3 schwer"
                    checked={recordPreset === "standard"}
                    onChange={() =>
                      void changeSetup({ recordPreset: "standard" })
                    }
                  />
                  <span>
                    <strong>Universal</strong>
                    <small>
                      Alle Bereiche · 3 leicht / 4 mittel / 3 schwer
                    </small>
                  </span>
                </label>
                <label>
                  <input
                    type="radio"
                    name="record-preset"
                    aria-label="Ein Genre · fester Schwierigkeitsmix"
                    checked={recordPreset === "genre"}
                    onChange={() => void changeSetup({ recordPreset: "genre" })}
                  />
                  <span>
                    <strong>Ein Genre</strong>
                    <small>
                      Werkfragen · Filme und Serien getrennt · 3 leicht / 4
                      mittel / 3 schwer
                    </small>
                  </span>
                </label>
                {recordPreset === "genre" && (
                  <label className="record-genre-filter">
                    Werkgenre
                    <select
                      aria-label="Genre für den Rekord"
                      value={recordGenre ?? ""}
                      onChange={(e) =>
                        void changeSetup({ recordGenre: e.target.value })
                      }
                    >
                      {genres.map((g) => (
                        <option key={g} value={g}>
                          {g.startsWith("Serien · ")
                            ? genreLabel(g)
                            : "Filme · " + genreLabel(g)}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
                <p className="tiny muted">
                  Rekorde vergleichen Universal oder genau ein Genre. Themen,
                  Bekanntheitsgruppen und Schwierigkeiten sind dafür fest
                  vorgegeben. Freie Filter gibt es in den Lernmodi.
                </p>
              </fieldset>
            )}

            {!isRecordMode(mode) && (
              <div className="quiz-filters">
                <SetupSection
                  title="Fragenbereiche"
                  illustration={<DisclosureArtwork subject="answers" />}
                  selection={
                    selectedSources
                      .map((s) =>
                        s === "film" ? "Werkfragen" : sourceLabels[s],
                      )
                      .join(" + ") || "Keine Bereiche"
                  }
                >
                  <fieldset disabled={busy}>
                    <legend>Fragenbereiche</legend>
                    <div className="filter-options">
                      {questionSources.map((source) => (
                        <label className="filter-choice" key={source}>
                          <input
                            type="checkbox"
                            checked={selectedSources.includes(source)}
                            onChange={(e) =>
                              void changeSetup({
                                sources: e.target.checked
                                  ? [...selectedSources, source]
                                  : selectedSources.filter((s) => s !== source),
                              })
                            }
                          />
                          <GenreArtwork
                            genre={
                              source === "film"
                                ? "Classics"
                                : sourceLabels[source]
                            }
                            compact
                          />
                          {source === "film"
                            ? "Werkfragen"
                            : sourceLabels[source]}
                        </label>
                      ))}
                    </div>
                    <p className="tiny muted">
                      Gewählte Bereiche bilden einen gemeinsamen Fragenpool.
                      Bekanntheitsgruppen und Schwierigkeiten gelten für alle
                      Bereiche. Werkart, Genres, Machart und Sammlungen
                      begrenzen alle Bereiche. Allgemeine Personen- und
                      Preisfragen bleiben über die unbeschränkte Auswahl
                      erreichbar. In der Filmreise gelten die freigeschalteten
                      Stufen jedes Bereichs.
                    </p>
                  </fieldset>
                </SetupSection>
                <SetupSection
                  title="Werke, Genres & Sammlungen"
                  illustration={<DisclosureArtwork subject="film" />}
                  selection={[
                    workSummary,
                    genreSummary,
                    techniqueSummary,
                    ...selectedCategories,
                  ].join(" · ")}
                >
                  <fieldset disabled={busy}>
                    <legend>Werkart</legend>
                    <p className="muted tiny">
                      Filme und Serien öffnen getrennte Lernpfade. Beide
                      ausgewählt lässt auch allgemeine Personen- und Preisfragen
                      zu.
                    </p>
                    <div className="filter-options">
                      {workTypes.map((type) => (
                        <label className="filter-choice" key={type}>
                          <input
                            type="checkbox"
                            checked={
                              !filters.workTypes ||
                              filters.workTypes.includes(type)
                            }
                            onChange={(e) => {
                              const selected = filters.workTypes ?? [
                                ...workTypes,
                              ];
                              const next = e.target.checked
                                ? [...selected, type]
                                : selected.filter((item) => item !== type);
                              void changeSetup({
                                workTypes:
                                  next.length === workTypes.length
                                    ? undefined
                                    : next,
                              });
                            }}
                          />
                          <GenreArtwork
                            genre={type === "film" ? "Film" : "Serie"}
                            compact
                          />
                          {workTypeLabels[type]}
                        </label>
                      ))}
                    </div>
                  </fieldset>
                  <fieldset disabled={busy}>
                    <legend>Machart</legend>
                    <label className="filter-choice">
                      <input
                        type="checkbox"
                        checked={!filters.techniques}
                        onChange={(e) =>
                          void changeSetup({
                            techniques: e.target.checked ? undefined : [],
                          })
                        }
                      />
                      Alle Macharten einschließlich ungeklärter Einordnung
                    </label>
                    <div className="filter-options">
                      {techniques.map((type) => (
                        <label className="filter-choice" key={type}>
                          <input
                            type="checkbox"
                            checked={
                              filters.techniques?.includes(type) ?? false
                            }
                            onChange={(e) =>
                              void changeSetup({
                                techniques: e.target.checked
                                  ? [...(filters.techniques ?? []), type]
                                  : (filters.techniques ?? []).filter(
                                      (item) => item !== type,
                                    ),
                              })
                            }
                          />
                          <GenreArtwork genre={techniqueLabels[type]} compact />
                          {techniqueLabels[type]}
                        </label>
                      ))}
                    </div>
                    <p className="muted tiny">
                      Nur ausdrücklich eingeordnete Werke passen zu einer
                      gezielten Machart. Ein leerer Treffer ist bei noch
                      fehlendem Bestand möglich.
                    </p>
                  </fieldset>
                  <fieldset disabled={busy}>
                    <legend>Genres</legend>
                    <p className="muted tiny">
                      Ein oder mehrere Genres kombinieren.
                    </p>
                    <div className="filter-options genre-options">
                      {genres.map((g) => (
                        <label className="filter-choice" key={g}>
                          <input
                            type="checkbox"
                            checked={
                              filters.genres === null ||
                              filters.genres.includes(g)
                            }
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
                    <legend>Sammlungen</legend>
                    {filmCategories.map((category) => (
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
                            });
                          }}
                        />
                        <GenreArtwork genre={category} compact />
                        Nur {category}
                      </label>
                    ))}
                    <p className="tiny muted">
                      Classics und Arthouse begrenzen die konkreten Werkbezüge
                      aller gewählten Fragenbereiche; zusammen bilden sie eine
                      Vereinigung. Alle gewählten Merkmale müssen am selben Werk
                      zutreffen. Ein gemeinsamer Filmfakt zählt pro Runde
                      einmal.
                    </p>
                  </fieldset>
                </SetupSection>
                {mode !== "entdecken" ? (
                  <SetupSection
                    title="Schwierigkeit & Bekanntheitsgruppen"
                    illustration={<DisclosureArtwork subject="learning" />}
                    selection={`${difficultySummary} · ${familiaritySummary}`}
                  >
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
                                  difficulties: selectedDifficulties.includes(d)
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
                      <legend>Bekanntheit</legend>
                      <div className="filter-options">
                        {familiarities.map((level) => (
                          <label className="filter-choice" key={level}>
                            <input
                              type="checkbox"
                              checked={selectedFamiliarities.includes(level)}
                              onChange={() =>
                                void changeSetup({
                                  familiarities: selectedFamiliarities.includes(
                                    level,
                                  )
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
                        Alle Bekanntheitsgruppen auswählen
                      </button>
                      <p className="tiny muted">
                        Redaktionelle Einordnung für ein breites
                        deutschsprachiges Kinopublikum. Schauspieler werden nach
                        Person, Preisträger nach ihrem Film eingeordnet. Eigene,
                        noch nicht eingeordnete Filme sind bei Auswahl aller
                        Gruppen dabei.
                      </p>
                    </fieldset>
                  </SetupSection>
                ) : null}
                <LearningPath
                  journey={view.value?.journey}
                  state={state}
                  genres={
                    selectedSources.includes("film")
                      ? (filters.genres ?? genres)
                      : []
                  }
                  sources={selectedSources}
                  workTypes={filters.workTypes}
                />
              </div>
            )}
          </>
        )}
      </section>
      <p className="question-stock">
        {server.info.questions.toLocaleString("de-DE")}{" "}
        {server.info.questions === 1 ? "Frage" : "Fragen"} in {areaCount}{" "}
        {areaCount === 1 ? "Gebiet" : "Gebieten"}
      </p>
    </>
  );
}
