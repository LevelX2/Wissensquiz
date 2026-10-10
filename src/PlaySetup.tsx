import {
  ModePicker,
  ModeArtwork,
  modeDescriptions,
  type PlayGroup,
} from "./ModePicker";
import { isRecordMode, isEndlessMode } from "./recordModes";
import { hasPackage, packages } from "./packages";
import { matchesTopic } from "./categories";
import { matchesFilters } from "./filters";
import { selectQuestions } from "./engine";
import { pathAreaOf, pathQuestions } from "./learningPath";
import { discoveryContext } from "./discovery";
import { learningDueText, repetitionOverview } from "./learningProgress";
import { useForegroundTime } from "./useForegroundTime";
import { familiarities, familiarityLabel } from "./familiarity";
import { type Mode, type Round, type State, type RoundSetup } from "./model";
import {
  difficulties,
  difficultyLabel,
  genreLabel,
  questionSources,
  sourceLabels,
  questionSourceOf,
} from "./filters";
import { GenreArtwork } from "./Icons";
import { SetupSection } from "./SetupSection";
import { RoundGuide } from "./RoundGuide";
import { filmCategories } from "./categories";
import { LearningPath, JourneyNextStep } from "./LearningPathPanel";
import type { QuestionSource } from "./model";
import type { Page, DuelPage, Mutate } from "./uiTypes";
import { modeNames } from "./gameUi";
import { useRef, useState } from "react";

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
    genres: string[];
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
  toggleGenre: (genre: string) => undefined;
  selectedCategories: (
    "Classics" | "Arthouse" | "Preisträger" | "Schauspieler"
  )[];
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
  const officialIds =
    state.bundledQuestionIds && new Set(state.bundledQuestionIds);
  const standardReady =
    !!state.bundledQuestionIds?.length &&
    packages.every((p) => hasPackage(state, p.filename));
  const selectable = pathQuestions(state, mode).filter(
    (q) => !standard || (standardReady && officialIds?.has(q.id)),
  );
  const runPoolSize = new Set(
    selectable
      .filter((q) => matchesTopic(q, roundTopic) && matchesFilters(q, filters))
      .map((q) => q.knowledgeId),
  ).size;
  const areaCount = new Set(state.questions.map(pathAreaOf)).size;
  const now = useForegroundTime();
  const repetitions = repetitionOverview(
    selectable
      .filter(
        (q) =>
          matchesTopic(q, roundTopic) &&
          matchesFilters(q, filters) &&
          questionSourceOf(q) === "film",
      )
      .map((q) => q.knowledgeId),
    state.learning,
    now,
  );
  const selection = selectQuestions(
    selectable,
    state.learning,
    {
      mode,
      topic: roundTopic,
      difficulty: "Alle Stufen",
      filters,
      ...(isRecordMode(mode) ? { recordPreset } : {}),
      size: targetSize,
      now,
      ...(mode === "entdecken" ? discoveryContext(state) : {}),
    },
    () => 0.5,
  );
  const genreSummary =
    filters.genres.length === genres.length
      ? "Alle Genres"
      : filters.genres.length > 2
        ? `${filters.genres.length} Genres`
        : filters.genres.map(genreLabel).join(" + ") || "Keine Genres";
  const difficultySummary =
    selectedDifficulties.length === difficulties.length
      ? "Alle Stufen"
      : selectedDifficulties.map(difficultyLabel).join(" + ") || "Keine Stufe";
  const familiaritySummary =
    selectedFamiliarities.length === familiarities.length
      ? "Alle Filmgruppen"
      : `Filmgruppen ${selectedFamiliarities.join(" + ") || "keine"}`;
  return (
    <>
      <header className="play-heading">
        <h1>{completed.length ? "Deine nächste Runde" : "Dein Filmquiz"}</h1>
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
          title="Spielmodus"
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
              {playGroup === "learn" && mode === "entdecken" && (
                <JourneyNextStep
                  state={state}
                  areas={[
                    ...new Set(
                      state.questions
                        .filter(
                          (q) =>
                            matchesTopic(q, roundTopic) &&
                            matchesFilters(q, filters),
                        )
                        .map(pathAreaOf),
                    ),
                  ]}
                />
              )}
            </>
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
        {playGroup === "duel" ? (
          <>
            <button
              className="primary"
              disabled={busy || !!active}
              onClick={() => void nav("duels")}
            >
              Losspielen <span>→</span>
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
                {roundTopic}
                {filters.sources.includes("film") &&
                  ` · ${
                    filters.genres.length === genres.length
                      ? "Alle Genres"
                      : filters.genres.length
                        ? filters.genres.map(genreLabel).join(" + ")
                        : "Kein Filmgenre"
                  }`}
                {" · "}
                {isEndlessMode(mode)
                  ? `Endlos · ${runPoolSize} Wissensziele im Pool`
                  : `${selection.length} Fragen`}
                {" · "}
                {standard
                  ? `${recordPreset === "genre" ? "Genre-Rekord" : "Universal"} · 3 leicht / 4 mittel / 3 schwer`
                  : mode !== "entdecken"
                    ? "Freie Auswahl: " + difficultySummary
                    : "Filmreise · freigeschaltete Etappen · neue Fragen und Wiederholungen"}
                {mode !== "entdecken" &&
                  filters.sources.includes("film") &&
                  ` · ${standard ? "Alle Filmgruppen" : familiaritySummary}`}
              </p>
            </div>

            <RoundGuide mode={mode} />
            {!selection.length ? (
              <p role="status" className="notice">
                {standard && !standardReady
                  ? "Der vollständige Standardmix wird geladen. Bitte warte, bis alle Fragenpakete bereit sind."
                  : mode === "entdecken"
                    ? "Für diese Auswahl sind noch keine Fragen freigeschaltet. Wähle andere Fragenbereiche oder Filmgenres, oder spiele frei."
                    : mode === "fehler"
                      ? "Aktuell ist in Deiner Auswahl nichts zur Wiederholung fällig. Entdecke weitere Fragen in der Filmreise oder spiele frei."
                      : "Wähle einen Fragenbereich und eine Schwierigkeitsstufe mit verfügbaren Fragen. Für Filmfragen brauchst Du außerdem passende Genres und Filmgruppen."}
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
                      Nur Filmfragen · 3 leicht / 4 mittel / 3 schwer
                    </small>
                  </span>
                </label>
                {recordPreset === "genre" && (
                  <label className="record-genre-filter">
                    Filmgenre
                    <select
                      aria-label="Genre für den Rekord"
                      value={recordGenre ?? ""}
                      onChange={(e) =>
                        void changeSetup({ recordGenre: e.target.value })
                      }
                    >
                      {genres.map((g) => (
                        <option key={g} value={g}>
                          {genreLabel(g)}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
                <p className="tiny muted">
                  Rekorde vergleichen Universal oder genau ein Genre.
                  Themen, Filmgruppen und Schwierigkeiten sind dafür fest
                  vorgegeben. Freie Filter gibt es in den Lernmodi.
                </p>
              </fieldset>
            )}

            {!isRecordMode(mode) && (
              <div className="quiz-filters">
                {mode !== "fehler" && (
                  <SetupSection
                    title="Fragenbereiche"
                    selection={
                      selectedSources.map((s) => sourceLabels[s]).join(" + ") ||
                      "Keine Bereiche"
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
                                    : selectedSources.filter(
                                        (s) => s !== source,
                                      ),
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
                            {sourceLabels[source]}
                          </label>
                        ))}
                      </div>
                      <p className="tiny muted">
                        Gewählte Bereiche bilden einen gemeinsamen Zufallspool.
                        Genres, Filmgruppen und die Filmauswahl gelten nur für
                        Filmfragen. In der Filmreise gelten die freigeschalteten
                        Stufen jedes Bereichs.
                      </p>
                    </fieldset>
                  </SetupSection>
                )}
                <SetupSection
                  title="Filmgenres & Filmauswahl"
                  selection={
                    selectedSources.includes("film")
                      ? [genreSummary, ...selectedCategories].join(" · ")
                      : "Filmfragen derzeit abgewählt"
                  }
                >
                  <fieldset
                    disabled={busy || !selectedSources.includes("film")}
                  >
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
                  <fieldset
                    disabled={busy || !selectedSources.includes("film")}
                  >
                    <legend>Filmauswahl</legend>
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
                      Ohne Einschränkung kommen alle Filmfragen aus Deinen
                      Genres infrage. Classics und Arthouse begrenzen nur diesen
                      Bereich; zusammen bilden sie eine Vereinigung.
                      Schauspieler und Preisträger bleiben zusätzlich im Pool,
                      wenn Du sie oben auswählst. Gemeinsame Wissensziele zählen
                      pro Runde einmal.
                    </p>
                  </fieldset>
                </SetupSection>
                {mode !== "entdecken" ? (
                  <SetupSection
                    title="Schwierigkeit & Filmgruppen"
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
                    <fieldset
                      disabled={busy || !selectedSources.includes("film")}
                    >
                      <legend>Bekanntheit der Filme</legend>
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
                        Alle Filmgruppen auswählen
                      </button>
                      <p className="tiny muted">
                        Redaktionelle Einordnung für ein breites
                        deutschsprachiges Kinopublikum. Eigene, noch nicht
                        eingeordnete Filme sind bei Auswahl aller Gruppen dabei.
                      </p>
                    </fieldset>
                  </SetupSection>
                ) : null}
                <LearningPath
                  state={state}
                  genres={
                    selectedSources.includes("film") ? filters.genres : []
                  }
                  sources={selectedSources}
                />
              </div>
            )}
          </>
        )}
      </section>
      <p className="question-stock">
        {state.questions.length.toLocaleString("de-DE")}{" "}
        {state.questions.length === 1 ? "Frage" : "Fragen"} in {areaCount}{" "}
        {areaCount === 1 ? "Gebiet" : "Gebieten"}
      </p>
    </>
  );
}
