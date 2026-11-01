import { useContext, useEffect, useRef, useState } from "react";
import { z } from "zod";
import { RankingContext } from "./SharedLeaderboard";
import { QuestionScreen } from "./QuestionScreen";
import { Result } from "./RoundResult";
import { Explanation } from "./Explanation";
import type { AnswerChoice, Round, State } from "./model";
import { uid } from "./model";
import type { Mutate } from "./uiTypes";
import {
  duelSchema,
  duelViewSchema,
  duelStartSchema,
  duelRpc,
  openDuel,
  duelDeadline,
  duelMessage,
  duelNextStep,
  duelTopics,
  duelTopicLabel,
  type DuelTopic,
  invitationToken,
  invitationUrl,
  importDuelView,
  duelScreen,
  duelReviewRound,
  duelRoundId,
  type Duel,
  type DuelView,
} from "./duels";

function DuelOpponent({ duel }: { duel: Duel }) {
  return (
    <div
      className={`duel-opponent ${duel.paired ? "is-paired" : "is-unpaired"}`}
    >
      <strong>
        {duel.paired
          ? `Dein Gegner: ${duel.opponent}`
          : "Gegner steht noch nicht fest"}
      </strong>
      <span>{duel.paired ? "Paarung gefunden" : "Noch nicht gepaart"}</span>
    </div>
  );
}

function DuelRounds({ duel }: { duel: Duel }) {
  const compared = duel.rounds.filter((r) => r.opponent !== null);
  return (
    <>
      {duel.status === "active" && compared.length > 0 && (
        <p className="duel-score">
          <strong>
            Zwischenstand: {compared.reduce((sum, r) => sum + r.mine!, 0)} :{" "}
            {compared.reduce((sum, r) => sum + r.opponent!, 0)}
          </strong>{" "}
          · {compared.length} von 3 Runden verglichen
        </p>
      )}
      <div className="duel-rounds" aria-label="Rundenstand">
        {duel.rounds.map((r) => {
          const done = r.mine !== null && r.opponent !== null;
          const outcome = done
            ? r.mine! > r.opponent!
              ? "win"
              : r.mine! < r.opponent!
                ? "loss"
                : "draw"
            : null;
          const status =
            outcome ??
            (r.answered === 10
              ? "waiting"
              : r.answered > 0 || r.opponentAnswered > 0
                ? "playing"
                : "open");
          const label =
            outcome === "win"
              ? "✓ Abgeschlossen · gewonnen"
              : outcome === "loss"
                ? "✓ Abgeschlossen · verloren"
                : outcome === "draw"
                  ? "✓ Abgeschlossen · unentschieden"
                  : r.answered === 10
                    ? "◷ Du fertig · Gegner fehlt"
                    : r.opponentAnswered === 10
                      ? "▶ Gegner fertig · Du bist dran"
                      : status === "playing"
                        ? "▶ In Arbeit"
                        : "○ Noch offen";
          return (
            <div key={r.number} className={`duel-round is-${status}`}>
              <strong>Runde {r.number}</strong>
              <span className="duel-round-status">{label}</span>
              <span>
                Du:{" "}
                {r.mine === null
                  ? `${r.answered}/10 gespielt`
                  : `${r.mine} Treffer`}
              </span>
              <span>
                {!duel.paired
                  ? "Gegner noch offen"
                  : r.opponent === null
                    ? `Gegner: ${r.opponentAnswered}/10 gespielt`
                    : `Gegner: ${r.opponent} Treffer`}
              </span>
              {r.opponent !== null && (
                <b
                  className="duel-round-score"
                  aria-label={`Ergebnis Runde ${r.number}: ${r.mine} zu ${r.opponent}`}
                >
                  {r.mine} : {r.opponent}
                </b>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

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
  const [topic, setTopic] = useState<DuelTopic>("all");
  const [searchTopics, setSearchTopics] = useState<DuelTopic[]>([
    ...duelTopics,
  ]);
  const matchRequest = useRef<{ topics: string; id: string } | null>(null);
  const [archiveCursor, setArchiveCursor] = useState<string | null>(null);
  const pages = useRef(
    new Map<
      string,
      { revision: string; items: Duel[]; nextCursor: string | null }
    >(),
  );
  const pollDelay = useRef(20000);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [view, setView] = useState<DuelView | null>(null);
  const [index, setIndex] = useState(0);
  const [review, setReview] = useState<DuelView | null>(null);
  const [guessed, setGuessed] = useState(false);
  const [retry, setRetry] = useState(0);
  const [pendingClose, setPendingClose] = useState<string | null>(null);
  const [invitation, setInvitation] = useState(invitationToken);
  const inFlight = useRef(false);
  const receivedAt = useRef(performance.now());
  const currentState = useRef(state);
  currentState.current = state;
  const request = useRef<{
    kind: boolean;
    topic: DuelTopic;
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
  async function refresh(older = false) {
    const overviewSchema = z.object({
      revision: z.string(),
      unchanged: z.boolean(),
      items: z.array(duelSchema).max(20).optional(),
      nextCursor: z.string().nullable(),
    });
    let changed = false;
    for (const scope of older
      ? (["archive"] as const)
      : (["active", "archive"] as const)) {
      const cursor = older ? archiveCursor : null;
      const key = scope + ":" + (cursor ?? "");
      const old = pages.current.get(key);
      const page = await rpc(
        "quiz_duel_overview",
        {
          request_text: JSON.stringify({
            scope,
            ...(cursor ? { cursor } : {}),
            ...(old ? { revision: old.revision } : {}),
          }),
        },
        overviewSchema,
      );
      if (!mounted.current) return false;
      if (!page.unchanged) {
        if (!page.items)
          throw new Error("Die Duellübersicht ist unvollständig.");
        pages.current.set(key, {
          revision: page.revision,
          items: page.items,
          nextCursor: page.nextCursor,
        });
        changed = true;
        if (scope === "archive" && !older)
          for (const k of pages.current.keys())
            if (k.startsWith("archive:") && k !== key) pages.current.delete(k);
      }
      if (scope === "archive" && (older || !page.unchanged))
        setArchiveCursor(page.nextCursor);
    }
    const entries = [
      ...new Map(
        [...pages.current.values()]
          .flatMap((p) => p.items)
          .map((d) => [d.id, d]),
      ).values(),
    ].sort(
      (a, b) =>
        Number(openDuel(b)) - Number(openDuel(a)) || b.createdAt - a.createdAt,
    );
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
    // The summary knows which own blocks are already saved, independently of
    // the deliberately small history currently loaded in this tab.
    for (const d of entries)
      for (const r of d.rounds) {
        if (
          r.answered &&
          !r.imported &&
          (d.solutionDisplay === "question" ||
            r.answered === 10 ||
            !openDuel(d))
        ) {
          const snapshot = await rpc(
            "quiz_duel_view",
            { duel: d.id, round_number: r.number },
            duelViewSchema,
          );
          if (!mounted.current) return false;
          const saved = await accept(snapshot);
          if (saved) r.imported = true;
        }
      }
    pollDelay.current = changed
      ? 20000
      : Math.min(120000, pollDelay.current * 2);
    return changed;
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
    void run(() => refresh()).finally(() => setLoading(false));
  }, [connection]);
  const hasOpen = list.some(openDuel);
  useEffect(() => {
    if (!connection || view) return;
    let active = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const schedule = () => {
      if (active && hasOpen && document.visibilityState !== "hidden")
        timer = setTimeout(update, pollDelay.current);
    };
    const update = () => {
      if (timer) clearTimeout(timer);
      if (!inFlight.current && document.visibilityState !== "hidden")
        void run(() => refresh())
          .then((value) => {
            if (value === null)
              pollDelay.current = Math.min(120000, pollDelay.current * 2);
          })
          .finally(schedule);
      else schedule();
    };
    const focus = () => {
      pollDelay.current = 20000;
      update();
    };
    schedule();
    window.addEventListener("focus", focus);
    document.addEventListener("visibilitychange", focus);
    return () => {
      active = false;
      if (timer) clearTimeout(timer);
      window.removeEventListener("focus", focus);
      document.removeEventListener("visibilitychange", focus);
    };
  }, [connection, !!view, hasOpen]);
  async function load(d: Duel, number = d.round) {
    let next = await rpc(
      "quiz_duel_view",
      { duel: d.id, round_number: number },
      duelViewSchema,
    );
    if (
      !next.current &&
      next.answered < 10 &&
      next.duel.myTurn &&
      next.duel.round === number
    )
      next = {
        ...(await rpc(
          "quiz_duel_start",
          {
            duel: d.id,
            round_number: number,
            question_number: next.answered,
          },
          duelStartSchema,
        )),
        items: next.items,
      };
    receivedAt.current = performance.now();
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
      request.current.topic !== topic
    )
      request.current = { kind: invited, topic, id: uid() };
    const d = await rpc(
      "quiz_duel_create",
      {
        display: "question",
        invited,
        request: request.current.id,
        selected_topic: topic,
      },
      duelSchema,
    );
    request.current = null;
    await refresh();
    await load(d);
  }
  async function findOpponent() {
    const allowed = duelTopics.filter((t) => searchTopics.includes(t));
    const key = allowed.join("|");
    if (!matchRequest.current || matchRequest.current.topics !== key)
      matchRequest.current = { topics: key, id: uid() };
    const d = await rpc(
      "quiz_duel_find",
      { allowed_topics: allowed, request: matchRequest.current.id },
      duelSchema.nullable(),
    );
    matchRequest.current = null;
    if (!d) {
      setNotice(
        "Gerade ist kein passendes Duell offen. Du kannst selbst ein neues Duell vorlegen.",
      );
      return;
    }
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
    const saved = await accept(next);
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
    setGuessed(!guessed);
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
        <DuelOpponent duel={view.duel} />
        <p className="tiny">
          Duellthema: {duelTopicLabel(view.duel.selection)}
        </p>
        <p className="duel-next-step">{duelNextStep(view.duel)}</p>
        <p className="tiny muted">
          30 Sekunden pro Frage · nach 2,5 Sekunden Antwortanzeige automatisch
          weiter.
        </p>
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
            if (!view.current || view.current.startedAt === null)
              throw new Error();
            return Math.max(
              0,
              view.serverNow -
                view.current.startedAt +
                performance.now() -
                receivedAt.current,
            );
          }}
          onExit={() => {
            setView(null);
            void run(() => refresh());
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
              void run(async () => {
                const next = await rpc(
                  "quiz_duel_start",
                  {
                    duel: view.duel.id,
                    round_number: view.number,
                    question_number: index + 1,
                  },
                  duelStartSchema,
                );
                receivedAt.current = performance.now();
                setView({ ...next, items: view.items });
                setIndex(index + 1);
                setGuessed(false);
              });
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
            void run(() => refresh());
          }}
        >
          ← Zur Duellübersicht
        </button>
        <button
          className="text-button"
          disabled={unavailable}
          onClick={() => void run(() => refresh())}
        >
          Duellstand aktualisieren
        </button>
        {error && (
          <p role="alert" className="notice error">
            {error}
          </p>
        )}
        <section className="duel-round-result">
          <h2>Duell · Runde {review.number} von 3</h2>
          <DuelOpponent duel={review.duel} />
          <p>Duellthema: {duelTopicLabel(review.duel.selection)}</p>
          <p>{duelNextStep(review.duel)}</p>
          <DuelRounds duel={review.duel} />
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
          {review.duel.status === "completed" &&
            review.duel.ranked === false && (
              <p>Freundschaftsspiel · ohne Ranglistenpunkte.</p>
            )}
          {review.duel.myTurn && (
            <button
              className="primary"
              disabled={unavailable || ownSolo}
              onClick={() => void run(() => load(review.duel))}
            >
              Runde {review.duel.round} spielen →
            </button>
          )}
        </section>
        {local?.status === "completed" ? (
          <Result
            round={local}
            state={state}
            onHome={() => {
              setReview(null);
              void run(() => refresh());
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
        <p className="tiny muted">
          Für die Bestenliste zählt die erste vollständig beendete Begegnung je
          Kontopaar und UTC-Tag. Weitere Duelle sind Freundschaftsspiele.
        </p>
        <p role="status">
          <strong>{active.length} von 10 Spielplätzen belegt</strong>
        </p>
        <p>
          Bis zu zehn Duelle gleichzeitig – auch alle zehn noch ohne Gegner.
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
        onClick={() => void run(() => refresh())}
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
          <section className="duel-new">
            <h2>Gegner finden</h2>
            <fieldset disabled={unavailable || ownSolo}>
              <legend>Welche Duellthemen möchtest Du annehmen?</legend>
              <div className="duel-search-topics">
                {duelTopics.map((value) => (
                  <label key={value}>
                    <input
                      type="checkbox"
                      checked={searchTopics.includes(value)}
                      onChange={(e) =>
                        setSearchTopics((current) =>
                          e.target.checked
                            ? [...current, value]
                            : current.filter((t) => t !== value),
                        )
                      }
                    />
                    {duelTopicLabel(value)}
                  </label>
                ))}
              </div>
            </fieldset>
            <p className="tiny muted">
              Deine Auswahl gilt als Zustimmung: Ein passendes Duell startet
              sofort. „Alle Genres (gemischt)“ ist eine eigene Auswahl.
              Abgewählte Einzelgenres schließen nur reine Duelle in diesem Genre
              aus, ohne gemischte Duelle einzuschränken.
            </p>
            <button
              className="primary"
              disabled={
                unavailable ||
                ownSolo ||
                active.length >= 10 ||
                searchTopics.length === 0
              }
              onClick={() => void run(findOpponent)}
            >
              Zufälligen Gegner finden
            </button>
          </section>
          <section className="duel-new">
            <h2>Neues Duell vorlegen</h2>
            <div className="duel-topic">
              <label htmlFor="duel-topic">Duellthema</label>
              <select
                id="duel-topic"
                value={topic}
                disabled={unavailable || ownSolo}
                onChange={(e) => setTopic(e.target.value as DuelTopic)}
              >
                {duelTopics.map((value) => (
                  <option key={value} value={value}>
                    {duelTopicLabel(value)}
                  </option>
                ))}
              </select>
            </div>
            <p>
              Nach jeder Antwort siehst Du für 2,5 Sekunden die Lösung. Dann
              geht es automatisch weiter. Alle Erklärungen findest Du im
              Rundenrückblick.
            </p>
            <div className="duel-actions">
              <button
                className="primary"
                disabled={unavailable || ownSolo || active.length >= 10}
                onClick={() => void run(() => create(false))}
              >
                Duell vorlegen
              </button>
              <button
                className="secondary"
                disabled={unavailable || ownSolo || active.length >= 10}
                onClick={() => void run(() => create(true))}
              >
                Per Link einladen
              </button>
            </div>
            <p className="tiny muted">
              Du wählst genau ein Thema und legst die ersten zehn Fragen vor.
              Danach kann ein Gegner annehmen. Sobald die Paarung steht, könnt
              Ihr alle drei Runden unabhängig spielen. Ab Paarung habt Ihr 72
              Stunden; ohne Gegner endet die Suche nach sieben Tagen.
            </p>
          </section>
          {(
            [
              "Du bist dran",
              "Warten auf Gegner",
              "Gegner wird gesucht",
            ] as const
          ).map((group) => {
            const games = active.filter((d) => duelMessage(d) === group);
            if (!games.length) return null;
            return (
              <section key={group} className="duel-group">
                <h2>{group}</h2>
                {games.map((d) => (
                  <article className="duel-card" key={d.id}>
                    <h3>
                      {d.paired
                        ? `Duell gegen ${d.opponent}`
                        : "Offene Herausforderung"}
                    </h3>
                    <DuelOpponent duel={d} />
                    <p>Duellthema: {duelTopicLabel(d.selection)}</p>
                    <p className="duel-next-step">{duelNextStep(d)}</p>
                    <p>
                      {d.rounds.filter((r) => r.answered === 10).length} von 3
                      eigenen Runden beendet
                    </p>
                    <p className="tiny">
                      {d.status === "waiting"
                        ? "Gegnersuche bis"
                        : "Spielzeit bis"}{" "}
                      {duelDeadline(d.dueAt)}
                    </p>
                    <DuelRounds duel={d} />
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
          <details className="duel-history">
            <summary>Abgeschlossene Duelle ({past.length})</summary>
            {past.map((d) => (
              <article className="duel-card" key={d.id}>
                <h3>{d.opponent}</h3>
                <p>{duelTopicLabel(d.selection)}</p>
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
            {archiveCursor && (
              <button
                className="secondary"
                disabled={unavailable}
                onClick={() => void run(() => refresh(true))}
              >
                Ältere Duelle laden
              </button>
            )}
          </details>
        </>
      )}
    </section>
  );
}
