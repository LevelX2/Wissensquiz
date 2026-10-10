import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AccountBenefits } from "./AccountBenefits";
import { loadOfficialCatalog } from "./officialCatalog";
import { emptyState, type Question, type State } from "./model";
import { genreLabel, genreOf, questionSourceOf } from "./filters";
import { complete } from "./engine";
import { QuestionScreen } from "./QuestionScreen";
import { Result } from "./RoundResult";
import { stopFeedback, unlockSound } from "./feedback";
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
}: {
  account: (mode: "login" | "register", trialAvailable: boolean) => ReactNode;
  initialAccount?: boolean;
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
  const [catalog, setCatalog] = useState<Question[] | null>(null);
  const [genre, setGenre] = useState("");
  const [index, setIndex] = useState(() =>
    Math.min(currentTrial()?.state.rounds[0].events.length ?? 0, 9),
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const inFlight = useRef(false);
  const round = trial?.state.rounds[0];
  const finished = round?.status === "completed";
  const genres = useMemo(
    () =>
      [
        ...new Set(
          catalog?.filter((q) => questionSourceOf(q) === "film").map(genreOf) ??
            [],
        ),
      ].sort(),
    [catalog],
  );

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
    loadOfficialCatalog()
      .then((release) => {
        if (alive) setCatalog(release.questions);
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
    <main className={`trial-page ${screen === "round" ? "is-playing" : ""}`}>
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
          Wissensquiz<small>DEIN FILMKOSMOS</small>
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
              unlockSound(trial.state.settings);
              if (index === 9) {
                const saved = await mutate((s) => complete(s, round.id));
                if (saved?.rounds[0].status === "completed")
                  setScreen("result");
              } else setIndex((n) => n + 1);
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
              {genres.map((g) => (
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
                await trialLock(() => {
                  if (trialUsed())
                    throw new Error(
                      "In diesem Browser wurde bereits eine Proberunde gestartet. Melde Dich an, um weiterzuspielen.",
                    );
                  const next = createTrial(emptyState(catalog), genre);
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
        <section className="account-page trial-welcome">
          <span className="eyebrow">DEIN FILMWISSEN. DEINE FILMREISE.</span>
          <h1>
            {round
              ? "Deine Proberunde wartet."
              : used
                ? "Bereit für die nächste Runde?"
                : "Wie gut kennst Du Dich im Filmkosmos aus?"}
          </h1>
          <p>
            {round
              ? "Setze Deine begonnene Zehnerrunde fort. Danach kannst Du sie mit einem Konto übernehmen."
              : used
                ? "Deine Proberunde ist bereits genutzt. Mit einem bestätigten Quiz-Konto kannst Du weiterspielen."
                : "Entdecke Filmfragen, lerne mit jeder Antwort etwas dazu und probiere eine erste Runde aus."}
          </p>
          {round ? (
            <button className="primary" onClick={() => setScreen("round")}>
              Proberunde fortsetzen
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
                Eine Runde ausprobieren
              </button>
            )
          )}
          {!used && (
            <p className="tiny muted">
              10 Fragen ohne Konto. Danach brauchst Du ein kostenloses Konto.
            </p>
          )}
          <div className="account-actions">
            <button
              className={used && !round ? "primary" : "secondary"}
              onClick={() => setScreen("login")}
            >
              Anmelden
            </button>
            <button
              className="text-button"
              onClick={() => setScreen("register")}
            >
              Konto erstellen
            </button>
          </div>
          <h2>Mit Deinem kostenlosen Konto</h2>
          <AccountBenefits />
        </section>
      )}
    </main>
  );
}
