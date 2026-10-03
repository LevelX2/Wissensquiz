import { familiarities, familiarityLabel } from "./familiarity";
import {
  type Mode,
  type Question,
  type Round,
  type State,
  type RoundSetup,
} from "./model";
import {
  difficulties,
  difficultyLabel,
  genreLabel,
  questionSources,
  sourceLabels,
} from "./filters";
import { GenreArtwork } from "./Icons";
import { RoundGuide } from "./RoundGuide";
import { SolutionChoice } from "./SolutionChoice";
import { categories, filmCategories } from "./categories";
import { LearningPath } from "./LearningPathPanel";
import type { QuestionSource, SolutionDisplay } from "./model";
import type { Page, DuelPage, Mutate } from "./uiTypes";
import { modeNames } from "./gameUi";
import type * as React from "react";

export function PlaySetup({
  completed,
  mode,
  busy,
  changeSetup,
  selection,
  active,
  begin,
  roundTopic,
  selectedSources,
  filters,
  genres,
  selectedDifficulties,
  selectedFamiliarities,
  pendingSolutions,
  state,
  setPendingSolutions,
  mutate,
  nav,
  resume,
  targetSize,
  toggleGenre,
  selectedCategories,
  mastered,
  setPage,
}: {
  completed: Round[];
  mode: Mode;
  busy: boolean;
  changeSetup: (patch: Partial<RoundSetup>) => Promise<State | null>;
  selection: Question[];
  active: Round | undefined;
  begin: () => Promise<void>;
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
  pendingSolutions: SolutionDisplay | undefined;
  state: State;
  setPendingSolutions: React.Dispatch<
    React.SetStateAction<SolutionDisplay | undefined>
  >;
  mutate: Mutate;
  nav: (next: Page | DuelPage) => Promise<void>;
  resume: () => void;
  targetSize: 10 | 5;
  toggleGenre: (genre: string) => undefined;
  selectedCategories: (
    "Classics" | "Arthouse" | "Preisträger" | "Schauspieler"
  )[];
  mastered: number;
  setPage: React.Dispatch<React.SetStateAction<Page | "duels">>;
}) {
  return (
    <>
      <header className="play-heading">
        <h1>{completed.length ? "Deine nächste Runde" : "Dein Filmquiz"}</h1>
        {!completed.length && (
          <p className="muted">Entdecke Filmwissen – in Deinem Tempo.</p>
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
                onClick={() =>
                  void changeSetup({
                    mode: m,
                    ...(m === "entdecken" ? { sources: ["film"] } : {}),
                  })
                }
              >
                <img
                  className="mode-artwork"
                  src={m === "fehler" ? "/modes/fehler.svg" : `/modes/${m}.png`}
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
          <p id="round-summary" className="tiny muted" aria-live="polite">
            {roundTopic}
            {selectedSources.includes("film") &&
              ` · ${
                filters.genres.length === genres.length
                  ? "Alle Genres"
                  : filters.genres.length
                    ? filters.genres.map(genreLabel).join(" + ")
                    : "Kein Filmgenre"
              }`}
            {" · "}
            {selection.length} {mode === "fehler" ? "offene Fehler" : "Fragen"}
            {" · "}
            {mode !== "entdecken"
              ? "Freie Auswahl: " +
                (selectedDifficulties.length
                  ? selectedDifficulties.map(difficultyLabel).join(" + ")
                  : "keine Stufe")
              : "Filmreise · freigeschaltete Stufen"}
            {mode !== "entdecken" &&
              selectedSources.includes("film") &&
              ` · Filmgruppen ${selectedFamiliarities.join(" + ") || "keine"}`}
          </p>
        </div>
        <SolutionChoice
          value={
            pendingSolutions ?? state.settings.solutionDisplay ?? "question"
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
          <small>Drei Runden mit denselben Fragen · Deine offenen Spiele</small>
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
          selection.length < targetSize && (
            <p className="tiny muted">
              Für Deine Auswahl ist diese Runde kürzer.
            </p>
          )
        )}

        <div className="quiz-filters">
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
                        ...(source !== "film" &&
                        e.target.checked &&
                        mode === "entdecken"
                          ? { mode: "ueben" }
                          : {}),
                      })
                    }
                  />
                  <GenreArtwork
                    genre={
                      source === "film" ? "Classics" : sourceLabels[source]
                    }
                    compact
                  />
                  {sourceLabels[source]}
                </label>
              ))}
            </div>
            <p className="tiny muted">
              Gewählte Bereiche bilden einen gemeinsamen Zufallspool. Genres,
              Filmgruppen und die Filmauswahl gelten nur für Filmfragen. Die
              Schwierigkeitsstufen gelten für alle Bereiche.
            </p>
          </fieldset>
          <fieldset disabled={busy || !selectedSources.includes("film")}>
            <legend>Filmgenres</legend>
            <p className="muted tiny">Ein oder mehrere Genres kombinieren.</p>
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
          <fieldset disabled={busy || !selectedSources.includes("film")}>
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
                        : selectedCategories.filter((c) => c !== category),
                    });
                  }}
                />
                <GenreArtwork genre={category} compact />
                Nur {category}
              </label>
            ))}
            <p className="tiny muted">
              Ohne Einschränkung kommen alle Filmfragen aus Deinen Genres
              infrage. Classics und Arthouse begrenzen nur diesen Bereich;
              zusammen bilden sie eine Vereinigung. Schauspieler und Preisträger
              bleiben zusätzlich im Pool, wenn Du sie oben auswählst. Gemeinsame
              Wissensziele zählen pro Runde einmal.
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
                            difficulties: selectedDifficulties.includes(d)
                              ? selectedDifficulties.filter((x) => x !== d)
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
              <fieldset disabled={busy || !selectedSources.includes("film")}>
                <legend>Bekanntheit der Filme</legend>
                <div className="filter-options">
                  {familiarities.map((level) => (
                    <label className="filter-choice" key={level}>
                      <input
                        type="checkbox"
                        checked={selectedFamiliarities.includes(level)}
                        onChange={() =>
                          void changeSetup({
                            familiarities: selectedFamiliarities.includes(level)
                              ? selectedFamiliarities.filter((x) => x !== level)
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
                  Redaktionelle Einordnung für ein breites deutschsprachiges
                  Kinopublikum. Eigene, noch nicht eingeordnete Filme sind bei
                  Auswahl aller Gruppen dabei.
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
            {mastered} gefestigt · {completed.length} Runden abgeschlossen
          </p>
        </div>
        <button className="text-button" onClick={() => setPage("album")}>
          Deine Sammlung <span>↗</span>
        </button>
      </section>
      <p className="demo-label">
        {state.questions.every((q) => q.demo)
          ? "TESTAUSGABE · Gekennzeichnete Demo-Fragen zu Filmhandwerk und Science-Fiction-Ideen."
          : `${state.questions.filter((q) => !q.demo).length} importierte Fragen · ${new Set(state.questions.map((q) => q.knowledgeId)).size} Wissensziele · ${state.questions.filter((q) => q.demo).length} Demo-Fragen. Details unter Profil → Optionen.`}
      </p>
    </>
  );
}
