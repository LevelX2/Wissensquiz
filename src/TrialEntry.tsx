import { useEffect, useRef, useState, type ReactNode } from "react";
import { AccountBenefits } from "./AccountBenefits";
import { emptyState, questionSchema, type State } from "./model";
import { genreLabel } from "./filters";
import type { SupabaseClient } from "@supabase/supabase-js";
import { SupabaseEntryRemote } from "./entryRemote";
import { z } from "zod";
import { complete } from "./engine";
import { QuestionScreen } from "./QuestionScreen";
import { Result } from "./RoundResult";
import { playFeedback, stopFeedback } from "./feedback";
import welcomeWide from "./assets/artwork/filmfieber-wide-1600.webp";
import welcomeWideSmall from "./assets/artwork/filmfieber-wide-1280.webp";
import welcomePortrait from "./assets/artwork/filmfieber-portrait-960.webp";
import welcomePortraitSmall from "./assets/artwork/filmfieber-portrait-640.webp";
import {
  createTrial,
  notifyTrial,
  readTrial,
  trialLock,
  trialUsed,
  writeTrial,
  type Trial,
} from "./trial";

type Screen = "welcome" | "prepare" | "round" | "result" | "login" | "register";
function currentTrial() {
  try {
    return readTrial(localStorage);
  } catch {
    return null;
  }
}

export function TrialEntry({
  account,
  initialAccount = false,
  client,
}: {
  account: (mode: "login" | "register", trialAvailable: boolean) => ReactNode;
  initialAccount?: boolean;
  client: SupabaseClient | null;
}) {
  const [trial, setTrial] = useState<Trial | null>(currentTrial);
  const [used, setUsed] = useState(trialUsed);
  const [screen, setScreen] = useState<Screen>(() =>
    initialAccount
      ? "login"
      : currentTrial()?.state.rounds[0].status === "completed"
        ? "result"
        : "welcome",
  );
  const [genres, setGenres] = useState<string[] | null>(null);
  const catalog = genres;
  const [genre, setGenre] = useState("");
  const [index, setIndex] = useState(() =>
    Math.min(currentTrial()?.state.rounds[0].events.length ?? 0, 9),
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const inFlight = useRef(false);
  const round = trial?.state.rounds[0];
  const finished = round?.status === "completed";
  const welcome =
    screen !== "login" &&
    screen !== "register" &&
    !finished &&
    (screen !== "round" || !trial || !round) &&
    (screen !== "prepare" || used);

  useEffect(() => {
    if (initialAccount) setScreen("login");
  }, [initialAccount]);

  useEffect(() => {
    const refresh = () => {
      setTrial(currentTrial());
      setUsed(trialUsed());
    };
    window.addEventListener("storage", refresh);
    window.addEventListener("wissensquiz-trial-changed", refresh);
    window.addEventListener("focus", refresh);
    const expiry = trial
      ? setTimeout(refresh, Math.max(0, trial.expiresAt - Date.now()))
      : undefined;
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("wissensquiz-trial-changed", refresh);
      window.removeEventListener("focus", refresh);
      clearTimeout(expiry);
    };
  }, [trial?.expiresAt]);
  useEffect(() => {
    if (screen !== "prepare" || catalog) return;
    let alive = true;
    const api = client ? new SupabaseEntryRemote(client) : null;
    (api
      ? api.call("quiz_trial_options", {})
      : Promise.reject(new Error("Der Kontodienst ist nicht verfügbar."))
    )
      .then((value) => {
        if (alive)
          setGenres(
            z.object({ genres: z.array(z.string()) }).parse(value).genres,
          );
      })
      .catch(() => {
        if (alive)
          setError(
            "Die Fragen konnten nicht geladen werden. Prüfe Deine Internetverbindung und versuche es erneut.",
          );
      });
    return () => {
      alive = false;
    };
  }, [screen, catalog]);
  useEffect(() => {
    window.scrollTo(0, 0);
    stopFeedback();
  }, [screen]);
  useEffect(() => () => stopFeedback(), []);

  const mutate = async (fn: (state: State) => void): Promise<State | null> => {
    if (inFlight.current) return null;
    inFlight.current = true;
    setBusy(true);
    setError("");
    try {
      return await trialLock(() => {
        const latest = currentTrial();
        if (!latest || latest.state.rounds[0].id !== round?.id)
          throw new Error(
            "Diese Proberunde ist nicht mehr verfügbar. Melde Dich an, um weiterzuspielen.",
          );
        fn(latest.state);
        writeTrial(localStorage, latest);
        notifyTrial();
        return latest.state;
      });
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Die Proberunde konnte nicht vorgemerkt werden.",
      );
      return null;
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  };
  const invitation = (
    <section
      className="trial-invitation"
      aria-label="Deine erste Runde übernehmen"
    >
      <h2>Deine erste Runde zählt schon.</h2>
      <p>
        Erstelle ein kostenloses Konto, um Dein Ergebnis zu übernehmen und
        weiterzuspielen.
      </p>
      <AccountBenefits />
      <div className="account-actions">
        <button className="primary" onClick={() => setScreen("register")}>
          Konto erstellen & Runde übernehmen
        </button>
        <button className="secondary" onClick={() => setScreen("login")}>
          Ich habe schon ein Konto
        </button>
        <button className="text-button" onClick={() => setScreen("register")}>
          Nächste Runde →
        </button>
      </div>
      <p className="tiny muted">
        Bestätige Deine E-Mail-Adresse, damit Du Dein Konto aktivieren und bei
        Bedarf Dein Passwort zurücksetzen kannst. Deine Proberunde bleibt bis 24
        Stunden nach ihrem Start in diesem Browser zur Übernahme bereit.
      </p>
    </section>
  );

  return (
    <main
      className={`trial-page ${welcome ? "is-welcome" : ""} ${screen === "round" ? "is-playing" : ""}`}
    >
      <a
        className="brand"
        href="#"
        onClick={(e) => {
          e.preventDefault();
          setScreen(finished ? "result" : "welcome");
        }}
      >
        <img src="/icon.svg" alt="" />
        <span>
          Filmfieber<small>DEIN QUIZ FÜR FILM & SERIE</small>
        </span>
      </a>
      {error && (
        <p className="notice" role="alert">
          {error}
        </p>
      )}
      {screen === "login" || screen === "register" ? (
        <>
          {account(screen, !!finished)}
          <button
            className="text-button"
            onClick={() => setScreen(finished ? "result" : "welcome")}
          >
            {finished
              ? "Zurück zum Ergebnis und Rückblick"
              : "Zurück zum Einstieg"}
          </button>
        </>
      ) : screen === "round" && trial && round && !finished ? (
        <>
          <p className="tiny muted">
            Deine Proberunde · Danach brauchst Du ein kostenloses Konto.
          </p>
          <QuestionScreen
            key={`${round.id}:${index}`}
            round={round}
            index={index}
            state={trial.state}
            mutate={mutate}
            busy={busy}
            onExit={() => setScreen("welcome")}
            onNext={async () => {
              if (index === 9) {
                const saved = await mutate((s) => complete(s, round.id));
                if (saved?.rounds[0].status === "completed")
                  setScreen("result");
              } else {
                setIndex((n) => n + 1);
                playFeedback("next", trial.state.settings);
              }
            }}
          />
        </>
      ) : finished && trial && round ? (
        <Result
          round={round}
          state={trial.state}
          busy={busy}
          celebrate={true}
          onHome={() => setScreen("register")}
          onRetry={() => setScreen("register")}
          onLeaderboard={() => setScreen("register")}
          trialActions={invitation}
        />
      ) : screen === "prepare" && !used ? (
        <section className="account-page trial-welcome">
          <h1>Deine erste Runde</h1>
          <p>Zehn Filmfragen, Lösungen und Erklärungen. Ohne Zeitdruck.</p>
          {!catalog && !error && (
            <p role="status">Die Fragen werden geladen …</p>
          )}
          <div className="trial-genre">
            <label htmlFor="trial-genre">Genre</label>
            <select
              id="trial-genre"
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              disabled={!catalog || busy}
            >
              <option value="">Alle Genres</option>
              {genres?.map((g) => (
                <option key={g} value={g}>
                  {genreLabel(g)}
                </option>
              ))}
            </select>
          </div>
          <p className="tiny muted">
            10 Fragen ohne Konto. Danach brauchst Du ein kostenloses Konto. Zur
            Übernahme halten wir diese eine Runde höchstens 24 Stunden in diesem
            Browser vor.
          </p>
          <button
            className="primary"
            disabled={!catalog || busy}
            onClick={async () => {
              if (!catalog || inFlight.current) return;
              inFlight.current = true;
              setBusy(true);
              setError("");
              try {
                await trialLock(async () => {
                  if (trialUsed())
                    throw new Error(
                      "In diesem Browser wurde bereits eine Proberunde gestartet. Melde Dich an, um weiterzuspielen.",
                    );
                  if (!client)
                    throw new Error("Die Fragen sind gerade nicht verfügbar.");
                  const api = new SupabaseEntryRemote(client);
                  const questions = z
                    .array(questionSchema)
                    .length(10)
                    .parse(
                      await api.call("quiz_trial_questions", {
                        genre: genre || null,
                      }),
                    );
                  const next = createTrial(emptyState(questions), genre);
                  writeTrial(localStorage, next);
                  notifyTrial();
                });
                setIndex(0);
                setScreen("round");
              } catch (e) {
                setError(
                  e instanceof Error
                    ? e.message
                    : "Die Proberunde konnte nicht gestartet werden.",
                );
              } finally {
                inFlight.current = false;
                setBusy(false);
              }
            }}
          >
            Proberunde starten
          </button>
          <button className="text-button" onClick={() => setScreen("welcome")}>
            Zurück
          </button>
        </section>
      ) : (
        <>
          <section className="welcome-hero" aria-labelledby="welcome-title">
            <picture className="welcome-artwork" aria-hidden="true">
              <source
                media="(max-width: 640px)"
                srcSet={`${welcomePortraitSmall} 640w, ${welcomePortrait} 960w`}
                sizes="100vw"
                width="1024"
                height="1536"
              />
              <img
                src={welcomeWide}
                srcSet={`${welcomeWideSmall} 1280w, ${welcomeWide} 1600w`}
                sizes="(max-width: 1440px) 100vw, 1440px"
                width="1600"
                height="900"
                fetchPriority="high"
                alt=""
              />
            </picture>
            <div className="welcome-content">
              <span className="eyebrow">DEIN QUIZ FÜR FILM & SERIE</span>
              <h1 id="welcome-title">
                {round ? (
                  "Deine Proberunde wartet."
                ) : used ? (
                  "Bereit für die nächste Runde?"
                ) : (
                  <>
                    Großes Kino.
                    <br />
                    <em>Steckt in Dir.</em>
                  </>
                )}
              </h1>
              <p>
                {round
                  ? "Setze Deine begonnene Zehnerrunde fort. Danach kannst Du sie mit einem Konto übernehmen."
                  : used
                    ? "Deine Proberunde ist bereits genutzt. Mit einem bestätigten Quiz-Konto kannst Du weiterspielen."
                    : "Von Kultfilmen bis Serienlieblingen. Von großen Stars bis kleinen Details. Entdecke, wie viel Filmwissen in Dir steckt – und lerne mit jeder Antwort dazu."}
              </p>
              <div className="welcome-actions">
                {round ? (
                  <button
                    className="primary"
                    onClick={() => setScreen("round")}
                  >
                    Proberunde fortsetzen <span aria-hidden="true">↗</span>
                  </button>
                ) : (
                  !used && (
                    <button
                      className="primary"
                      onClick={() => {
                        setError("");
                        setScreen("prepare");
                      }}
                    >
                      Eine Runde ausprobieren <span aria-hidden="true">↗</span>
                    </button>
                  )
                )}
                <button
                  className={used && !round ? "primary" : "secondary"}
                  onClick={() => setScreen("login")}
                >
                  Anmelden
                </button>
              </div>
              {!used && (
                <p className="welcome-trial-note">
                  10 Fragen ohne Konto. Danach brauchst Du ein kostenloses
                  Konto.
                </p>
              )}
              <p className="welcome-register">
                Deine Filmreise geht weiter.{" "}
                <button
                  className="text-button"
                  onClick={() => setScreen("register")}
                >
                  Konto erstellen
                </button>
              </p>
            </div>
            <p className="welcome-caption" aria-hidden="true">
              SO VIELE WELTEN. DEIN FILMKOSMOS.
            </p>
          </section>
          <section className="welcome-topics" aria-label="Dein Filmkosmos">
            <div>
              <span>01 / ENTDECKEN</span>
              <h2>Alle Genres. Große Geschichten.</h2>
              <p>
                Sci-Fi, Fantasy, Thriller, Komödie und mehr. Finde Deine
                Lieblingswelten.
              </p>
            </div>
            <div>
              <span>02 / WISSEN</span>
              <h2>Filme. Serien. Ihre Stars.</h2>
              <p>
                Von legendären Rollen bis zu großen Filmpreisen. Hier zählt Dein
                Blick fürs Detail.
              </p>
            </div>
            <div>
              <span>03 / WEITERSPIELEN</span>
              <h2>Jede Runde bringt Dich weiter.</h2>
              <p>
                Lerne dazu, sammle Erfolge und fordere andere Filmfans im Duell
                heraus.
              </p>
            </div>
          </section>
          <section
            className="welcome-members"
            aria-labelledby="welcome-members-title"
          >
            <div>
              <span className="eyebrow">DEINE NÄCHSTE HAUPTROLLE</span>
              <h2 id="welcome-members-title">Mit Deinem kostenlosen Konto</h2>
            </div>
            <AccountBenefits />
          </section>
        </>
      )}
    </main>
  );
}
