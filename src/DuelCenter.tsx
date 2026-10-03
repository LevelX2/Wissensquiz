import { useContext, useEffect, useRef, useState } from "react";
import { z } from "zod";
import { RankingContext } from "./SharedLeaderboard";
import { QuestionScreen } from "./QuestionScreen";
import { Result } from "./RoundResult";
import { Explanation } from "./Explanation";
import { SolutionChoice } from "./SolutionChoice";
import type { AnswerChoice, Round, State, SolutionDisplay } from "./model";
import { uid } from "./model";
import type { Mutate } from "./uiTypes";
import {
  duelSchema,
  duelViewSchema,
  duelRpc,
  openDuel,
  duelDeadline,
  duelMessage,
  invitationToken,
  invitationUrl,
  importDuelView,
  duelScreen,
  duelReviewRound,
  duelRoundId,
  type Duel,
  type DuelView,
} from "./duels";

export function DuelCenter({
  state,
  mutate,
  busy,
  onHome,
  onAccount,
  onRetry,
  onLeaderboard,
  onPlaying,
}: {
  state: State;
  mutate: Mutate;
  busy: boolean;
  onHome: () => void;
  onAccount: () => void;
  onRetry: (r: Round) => void;
  onLeaderboard: (duelId: string) => void;
  onPlaying: (playing: boolean) => void;
}) {
  const connection = useContext(RankingContext);
  const [list, setList] = useState<Duel[]>([]);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [display, setDisplay] = useState<SolutionDisplay>("question");
  const [view, setView] = useState<DuelView | null>(null);
  const [index, setIndex] = useState(0);
  const [review, setReview] = useState<DuelView | null>(null);
  const [guessed, setGuessed] = useState(false);
  const [retry, setRetry] = useState(0);
  const [pendingClose, setPendingClose] = useState<string | null>(null);
  const [invitation, setInvitation] = useState(invitationToken);
  const inFlight = useRef(false);
  const currentState = useRef(state);
  currentState.current = state;
  const request = useRef<{
    kind: boolean;
    display: SolutionDisplay;
    id: string;
  } | null>(null);
  const mounted = useRef(true);
  useEffect(() => {
    const update = () => setInvitation(invitationToken());
    window.addEventListener("hashchange", update);
    return () => window.removeEventListener("hashchange", update);
  }, []);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  useEffect(() => {
    onPlaying(!!view);
    return () => onPlaying(false);
  }, [!!view, onPlaying]);
  const rpc = <T,>(
    name: string,
    args: Record<string, unknown>,
    schema: z.ZodType<T>,
  ) => {
    if (!connection) throw new Error("Melde Dich für ein Duell an.");
    return duelRpc(connection.client, connection.owner, name, args, schema);
  };
  async function accept(v: DuelView, finish = true): Promise<State | null> {
    if (!v.items.some((i) => i.event.correct !== null))
      return currentState.current;
    return mutate((s) => importDuelView(s, v, finish), {
      progressOnly: false,
      reuseCatalog: true,
    });
  }
  async function refresh() {
    const entries = await rpc(
      "quiz_duel_list",
      {},
      z.array(duelSchema).max(100),
    );
    if (!mounted.current) return;
    setList(entries);
    setReview((previous) =>
      previous
        ? {
            ...previous,
            duel:
              entries.find((d) => d.id === previous.duel.id) ?? previous.duel,
          }
        : null,
    );
    // Recover only own server-confirmed learning after a device change or local failure.
    for (const d of entries)
      for (const r of d.rounds) {
        const local = currentState.current.rounds.find(
          (local) => local.id === duelRoundId(d.id, r.number),
        );
        if (
          r.answered &&
          ((local?.events.length ?? 0) < r.answered ||
            (r.answered === 10 && local?.status !== "completed")) &&
          (d.solutionDisplay === "question" ||
            r.answered === 10 ||
            !openDuel(d))
        ) {
          const snapshot = await rpc(
            "quiz_duel_view",
            { duel: d.id, round_number: r.number },
            duelViewSchema,
          );
          if (!mounted.current) return;
          await accept(snapshot);
        }
      }
  }
  async function run<T>(action: () => Promise<T>): Promise<T | null> {
    if (inFlight.current) return null;
    inFlight.current = true;
    setWorking(true);
    setError("");
    setNotice("");
    try {
      return await action();
    } catch (e) {
      if (mounted.current)
        setError(
          e instanceof Error
            ? e.message
            : "Der Duellstand konnte nicht geladen werden.",
        );
      return null;
    } finally {
      inFlight.current = false;
      if (mounted.current) setWorking(false);
    }
  }
  useEffect(() => {
    if (!connection) {
      setLoading(false);
      return;
    }
    void run(refresh).finally(() => setLoading(false));
  }, [connection]);
  useEffect(() => {
    if (!connection || view) return;
    const update = () => {
      if (!inFlight.current && document.visibilityState !== "hidden")
        void run(refresh);
    };
    const interval = setInterval(update, 20000);
    window.addEventListener("focus", update);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", update);
    };
  }, [connection, !!view]);
  async function load(d: Duel, number = d.round) {
    const next = await rpc(
      "quiz_duel_view",
      { duel: d.id, round_number: number },
      duelViewSchema,
    );
    await accept(next);
    setGuessed(false);
    setReview(null);
    if (next.answered === 10 || !next.current) {
      setView(null);
      setReview(next);
    } else {
      setIndex(next.answered);
      setView(next);
    }
    window.scrollTo(0, 0);
  }
  async function create(invited: boolean) {
    if (
      !request.current ||
      request.current.kind !== invited ||
      request.current.display !== display
    )
      request.current = { kind: invited, display, id: uid() };
    const d = await rpc(
      "quiz_duel_create",
      { display, invited, request: request.current.id },
      duelSchema,
    );
    request.current = null;
    await refresh();
    await load(d);
  }
  async function choose(choice: AnswerChoice): Promise<State | null> {
    if (!view) return null;
    const next = await run(() =>
      rpc(
        "quiz_duel_answer",
        {
          duel: view.duel.id,
          round_number: view.number,
          question_number: index,
          answer_id: typeof choice === "string" ? choice : null,
          unknown_answer: choice !== null && typeof choice === "object",
          was_guessed: guessed,
        },
        duelViewSchema,
      ),
    );
    if (!next) return null;
    const saved = await accept(
      next,
      next.duel.solutionDisplay === "round" || next.answered < 10,
    );
    if (!saved) {
      setError(
        "Deine Antwort ist im Duell bestätigt. Die lokale Lernübernahme wird beim Aktualisieren erneut versucht.",
      );
      return null;
    }
    setView(next);
    return saved;
  }
  async function markGuess() {
    if (!view) return;
    if (view.duel.solutionDisplay === "round") {
      setGuessed(!guessed);
      return;
    }
    await run(async () => {
      const next = await rpc(
        "quiz_duel_guess",
        {
          duel: view.duel.id,
          round_number: view.number,
          question_number: index,
        },
        duelViewSchema,
      );
      await accept(next, false);
      setView(next);
    });
  }
  const unavailable = busy || working;
  const ownSolo = state.rounds.some((r) => r.status === "active");
  if (!connection)
    return (
      <section className="duel-center">
        <button className="text-button" onClick={onHome}>
          ← Zurück zum Spielen
        </button>
        <h1>Duell</h1>
        <p>
          Drei Runden mit je zehn gleichen Fragen. Ihr spielt, wenn Ihr Zeit
          habt.
        </p>
        <p>Für gemeinsame Duelle brauchst Du ein bestätigtes Quiz-Konto.</p>
        <button className="primary" onClick={onAccount}>
          Zum Profil und anmelden
        </button>
      </section>
    );
  if (view) {
    const screen = duelScreen(view, index, state);
    return (
      <div className="duel-playing">
        <div className="duel-opponent">
          <strong>
            {view.duel.status === "preparing"
              ? "Du legst vor"
              : `Gegen ${view.duel.opponent}`}
          </strong>
          <span>Dein Spielblock bis {duelDeadline(view.duel.dueAt)}</span>
        </div>
        {error && (
          <div role="alert" className="notice error">
            {error}
            <button
              className="text-button"
              disabled={unavailable}
              onClick={() =>
                void run(async () => {
                  await load(view.duel, view.number);
                  setRetry((n) => n + 1);
                })
              }
            >
              Stand erneut laden
            </button>
          </div>
        )}
        <QuestionScreen
          key={`${view.duel.id}:${view.number}:${index}:${retry}`}
          round={screen.round}
          index={index}
          state={screen.state}
          mutate={mutate}
          busy={unavailable}
          onAnswer={choose}
          onGuessed={guessed}
          onGuess={() => void markGuess()}
          onReady={async () => {
            const started = await run(() =>
              rpc(
                "quiz_duel_start",
                {
                  duel: view.duel.id,
                  round_number: view.number,
                  question_number: index,
                },
                z.object({ elapsedMs: z.number().min(0).max(30000) }),
              ),
            );
            if (!started) throw new Error();
            return started.elapsedMs;
          }}
          onExit={() => {
            setView(null);
            void run(refresh);
          }}
          onNext={() => {
            if (index === 9) {
              void run(async () => {
                const saved = await accept(view);
                if (!saved)
                  throw new Error(
                    "Dein Rundenabschluss konnte lokal nicht gespeichert werden. Versuche es erneut.",
                  );
                setReview(view);
                setView(null);
                await refresh();
              });
            } else {
              setIndex((i) => i + 1);
              setGuessed(false);
            }
            window.scrollTo(0, 0);
          }}
        />
      </div>
    );
  }
  if (review) {
    const stored = state.rounds.find(
      (r) => r.id === duelRoundId(review.duel.id, review.number),
    );
    const local = stored && duelReviewRound(review, stored);
    return (
      <div className="duel-review">
        <button
          className="text-button"
          onClick={() => {
            setReview(null);
            void run(refresh);
          }}
        >
          ← Zur Duellübersicht
        </button>
        <section className="duel-round-result">
          <h2>Duell · Runde {review.number} von 3</h2>
          <p>Gegen {review.duel.opponent}</p>
          <p>{duelMessage(review.duel)}</p>
          <p>
            {review.duel.rounds[review.number - 1].opponent === null
              ? "Dein Gegner hat diese Runde noch nicht abgeschlossen."
              : `Runde ${review.number}: ${review.duel.rounds[review.number - 1].mine} : ${review.duel.rounds[review.number - 1].opponent}`}
          </p>
          {review.duel.status === "completed" && (
            <strong>
              Endergebnis:{" "}
              {review.duel.rounds.reduce((sum, r) => sum + (r.mine ?? 0), 0)} :{" "}
              {review.duel.rounds.reduce(
                (sum, r) => sum + (r.opponent ?? 0),
                0,
              )}
            </strong>
          )}
          {review.duel.myTurn && (
            <button
              className="primary"
              disabled={unavailable || ownSolo}
              onClick={() => void run(() => load(review.duel))}
            >
              Runde {review.duel.round} vorlegen →
            </button>
          )}
        </section>
        {local?.status === "completed" ? (
          <Result
            round={local}
            state={state}
            onHome={() => {
              setReview(null);
              void run(refresh);
            }}
            onLeaderboard={() => onLeaderboard(review.duel.id)}
            leaderboardLabel="Duell-Bestenliste ansehen"
            onRetry={() => onRetry(local)}
            busy={unavailable}
            celebrate={false}
          />
        ) : (
          <section className="review">
            <h2>Deine gespielten Fragen</h2>
            {local?.questions.map((q, i) => {
              const e = state.events.find((e) => e.id === local.events[i])!;
              return (
                <details key={q.id}>
                  <summary>{q.question}</summary>
                  <p>
                    Lösung: {q.answers.find((a) => a.id === q.correctId)?.text}
                  </p>
                  <Explanation q={q} event={e} />
                </details>
              );
            })}
            <p>{review.answered}/10 Fragen gespielt.</p>
          </section>
        )}
      </div>
    );
  }
  const active = list.filter(openDuel),
    past = list.filter((d) => !openDuel(d));
  return (
    <section className="duel-center">
      <button className="text-button" onClick={onHome}>
        ← Zurück zum Spielen
      </button>
      <header>
        <h1>Deine Duelle</h1>
        <p>Drei Runden · zehn gleiche Fragen · ein Punkt pro Treffer.</p>
        <p role="status">
          <strong>{active.length} von 5 Spielplätzen belegt</strong>
        </p>
      </header>
      {error && (
        <p role="alert" className="notice error">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="notice">
          {notice}
        </p>
      )}
      <button
        className="text-button"
        disabled={unavailable}
        onClick={() => void run(refresh)}
      >
        Aktualisieren
      </button>
      {invitation && (
        <section className="notice">
          <h2>Du wurdest herausgefordert</h2>
          <p>Ihr spielt dieselben Fragen in drei Runden.</p>
          <button
            className="primary"
            disabled={unavailable || ownSolo}
            onClick={() =>
              void run(async () => {
                const d = await rpc(
                  "quiz_duel_join",
                  { invitation },
                  duelSchema,
                );
                setInvitation(null);
                history.replaceState(
                  null,
                  "",
                  location.pathname + location.search,
                );
                await refresh();
                await load(d);
              })
            }
          >
            Einladung annehmen
          </button>
        </section>
      )}
      {ownSolo && (
        <p className="notice">
          Beende zuerst Deine begonnene Solorunde. Deine Duelle bleiben hier
          erhalten.
        </p>
      )}
      {loading ? (
        <p role="status">Deine Duelle werden geladen …</p>
      ) : (
        <>
          {(
            [
              "Du bist dran",
              "Warten auf Gegner",
              "Gegner wird gesucht",
            ] as const
          ).map((group) => {
            const games = active.filter((d) => duelMessage(d) === group);
            return (
              <section key={group} className="duel-group">
                <h2>{group}</h2>
                {!games.length && (
                  <p className="tiny muted">Hier sind gerade keine Duelle.</p>
                )}
                {games.map((d) => (
                  <article className="duel-card" key={d.id}>
                    <h3>{d.opponent}</h3>
                    <p>
                      Runde {d.round} von 3 ·{" "}
                      {d.solutionDisplay === "round"
                        ? "Lösungen nach der Runde"
                        : "Lösungen nach jeder Frage"}
                    </p>
                    <p className="tiny">
                      {d.status === "waiting"
                        ? "Gegnersuche bis"
                        : "Spielblock bis"}{" "}
                      {duelDeadline(d.dueAt)}
                    </p>
                    <div className="duel-rounds">
                      {d.rounds.map((r) => (
                        <span key={r.number}>
                          R{r.number}:{" "}
                          {r.mine === null
                            ? `${r.answered}/10 gespielt`
                            : r.mine}{" "}
                          : {r.opponent ?? "–"}
                        </span>
                      ))}
                    </div>
                    <div className="duel-actions">
                      {d.myTurn && (
                        <button
                          className="primary"
                          disabled={unavailable || ownSolo}
                          onClick={() => void run(() => load(d))}
                        >
                          Weiterspielen →
                        </button>
                      )}
                      {d.invitation && (
                        <button
                          className="secondary"
                          onClick={async () => {
                            try {
                              await navigator.clipboard.writeText(
                                invitationUrl(d.invitation!),
                              );
                              setNotice("Einladungslink kopiert.");
                            } catch {
                              setNotice(
                                `Einladungslink: ${invitationUrl(d.invitation!)}`,
                              );
                            }
                          }}
                        >
                          Einladungslink kopieren
                        </button>
                      )}
                      <button
                        className="text-button"
                        disabled={unavailable}
                        onClick={() => setPendingClose(d.id)}
                      >
                        {d.status === "waiting" || d.status === "preparing"
                          ? "Zurücknehmen"
                          : "Aufgeben"}
                      </button>
                    </div>
                    {pendingClose === d.id && (
                      <div className="notice">
                        <p>
                          {d.status === "active"
                            ? "Dieses Duell aufgeben? Wenn Ihr bereits eine Runde gemeinsam abgeschlossen habt, gewinnt Dein Gegner durch Aufgabe. Dein Lernfortschritt bleibt erhalten."
                            : "Diese Herausforderung zurücknehmen? Dein Lernfortschritt bleibt erhalten."}
                        </p>
                        <button
                          className="secondary"
                          onClick={() => setPendingClose(null)}
                        >
                          Weiter behalten
                        </button>
                        <button
                          className="primary"
                          disabled={unavailable}
                          onClick={() =>
                            void run(async () => {
                              await rpc(
                                "quiz_duel_close",
                                { duel: d.id },
                                duelSchema,
                              );
                              setPendingClose(null);
                              await refresh();
                            })
                          }
                        >
                          Bestätigen
                        </button>
                      </div>
                    )}
                  </article>
                ))}
              </section>
            );
          })}
          <section className="duel-new">
            <h2>Neues Duell</h2>
            <SolutionChoice
              value={display}
              disabled={unavailable}
              onChange={setDisplay}
            />
            <div className="duel-actions">
              <button
                className="primary"
                disabled={unavailable || ownSolo || active.length >= 5}
                onClick={() => void run(() => create(false))}
              >
                Zufälligen Gegner finden
              </button>
              <button
                className="secondary"
                disabled={
                  unavailable ||
                  ownSolo ||
                  active.length >= 5 ||
                  active.some(
                    (d) => d.status === "preparing" || d.status === "waiting",
                  )
                }
                onClick={() => void run(() => create(true))}
              >
                Per Link einladen
              </button>
            </div>
            <p className="tiny muted">
              Wir nehmen zuerst eine offene Herausforderung an. Sonst legst Du
              die ersten zehn Fragen vor. Pro Spielblock habt Ihr 72 Stunden;
              ohne Gegner endet die Suche nach sieben Tagen.
            </p>
          </section>
          <details className="duel-history">
            <summary>Abgeschlossene Duelle ({past.length})</summary>
            {past.map((d) => (
              <article className="duel-card" key={d.id}>
                <h3>{d.opponent}</h3>
                <p>{duelMessage(d)}</p>
                {d.status === "completed" && (
                  <strong>
                    {d.rounds.reduce((s, r) => s + (r.mine ?? 0), 0)} :{" "}
                    {d.rounds.reduce((s, r) => s + (r.opponent ?? 0), 0)}
                  </strong>
                )}
              </article>
            ))}
            {!past.length && <p>Noch kein Duell abgeschlossen.</p>}
          </details>
        </>
      )}
    </section>
  );
}
