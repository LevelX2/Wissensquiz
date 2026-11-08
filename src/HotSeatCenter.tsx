import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useServer } from "./serverViews";
import { MissingSyncProtocol } from "./entryRemote";
import {
  HotSeatSession,
  hotSeatModes,
  type HotSeatLobby,
  type HotSeatParticipant,
  type HotSeatSetup as Setup,
  type HotSeatParty,
  type HotSeatTopic,
} from "./hotSeat";
import { HotSeatSetup } from "./HotSeatSetup";
import { HotSeatGame, HotSeatScores } from "./HotSeatGame";
import { playFeedback, unlockSound } from "./feedback";
import "./styles/hot-seat.css";

type Confirmation =
  | { kind: "abort"; party: HotSeatParty }
  | { kind: "delete"; party: HotSeatParty }
  | { kind: "template"; name: string };
function Confirm({
  value,
  onCancel,
  onConfirm,
}: {
  value: Confirmation;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    dialog.current?.showModal();
    return () => dialog.current?.close();
  }, []);
  return (
    <dialog
      ref={dialog}
      className="hot-confirm"
      aria-labelledby="hot-confirm-title"
      onCancel={(e) => {
        e.preventDefault();
        onCancel();
      }}
    >
      <h2 id="hot-confirm-title">
        {value.kind === "abort"
          ? "Partie abbrechen?"
          : value.kind === "delete"
            ? "Ergebnis löschen?"
            : "Vorlage löschen?"}
      </h2>
      <p>
        {value.kind === "abort"
          ? "Der bestätigte Teilstand bleibt als „Abgebrochen“ gespeichert. Anschließend kannst Du sofort eine neue Partie starten."
          : value.kind === "delete"
            ? "Dieses private Ergebnis und die zugehörigen Partiedaten werden entfernt."
            : `Die Regelvorlage „${value.name}“ wird entfernt.`}
      </p>
      <div className="hot-actions">
        <button autoFocus onClick={onCancel}>
          Zurück
        </button>
        <button className="primary" onClick={onConfirm}>
          {value.kind === "abort" ? "Partie abbrechen" : "Löschen"}
        </button>
      </div>
    </dialog>
  );
}

export function HotSeatCenter({
  onHome,
  onBusy,
  onPlaying,
}: {
  onHome: () => void;
  onBusy: (busy: boolean) => void;
  onPlaying: (playing: boolean) => void;
}) {
  const server = useServer()!;
  const session = useMemo(() => new HotSeatSession(server.api), [server.api]);
  const [lobby, setLobby] = useState<HotSeatLobby>();
  const [party, setParty] = useState<HotSeatParty>();
  const [view, setView] = useState<"lobby" | "setup" | "game">("lobby");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [page, setPage] = useState(0);
  const [large, setLarge] = useState(false);
  const [confirmation, setConfirmation] = useState<Confirmation>();
  const [seed, setSeed] = useState<{
    key: number;
    setup?: Setup;
    players?: HotSeatParticipant[];
  }>({ key: 0 });
  const [topics, setTopics] = useState<HotSeatTopic[]>([]);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const lock = useRef(false),
    alive = useRef(true),
    optionsVersion = useRef(0);
  const optionsTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      clearTimeout(optionsTimer.current);
      onBusy(false);
      onPlaying(false);
    };
  }, []);
  useEffect(() => {
    onBusy(busy);
  }, [busy]);
  useEffect(() => {
    onPlaying(view === "game" && party?.status === "active");
  }, [view, party?.status]);
  useEffect(() => {
    heading.current?.focus();
    window.scrollTo(0, 0);
  }, [view]);
  const run = useCallback(
    async (work: () => Promise<unknown>) => {
      if (lock.current) return;
      lock.current = true;
      setBusy(true);
      setError("");
      setNotice("");
      try {
        await work();
        if (alive.current) setParty(session.party);
      } catch (cause) {
        if (alive.current)
          setError(
            cause instanceof MissingSyncProtocol
              ? "Hot Seat ist auf diesem Server noch nicht eingerichtet. Die lokale Backend-Erweiterung muss gemeinsam mit der App veröffentlicht werden."
              : cause instanceof Error
                ? cause.message
                : "Die Partie konnte nicht bestätigt werden.",
          );
      } finally {
        lock.current = false;
        if (alive.current) setBusy(false);
      }
    },
    [session],
  );
  const loadLobby = async (selectedPage = page) => {
    const data = await session.reloadLobby(selectedPage);
    if (alive.current) {
      setLobby(data);
      setView("lobby");
    }
  };
  useEffect(() => {
    void run(() => loadLobby(0));
  }, [session]);
  const requestOptions = useCallback(
    (setup: Setup) => {
      const version = ++optionsVersion.current;
      clearTimeout(optionsTimer.current);
      setOptionsLoading(true);
      optionsTimer.current = setTimeout(() => {
        void session
          .options({
            ...setup,
            topics: setup.topics.length ? setup.topics : ["mix"],
          })
          .then((value) => {
            if (alive.current && version === optionsVersion.current)
              setTopics(value);
          })
          .catch((cause) => {
            if (alive.current && version === optionsVersion.current)
              setError(
                cause instanceof Error
                  ? cause.message
                  : "Die Themen konnten nicht geladen werden.",
              );
          })
          .finally(() => {
            if (alive.current && version === optionsVersion.current)
              setOptionsLoading(false);
          });
      }, 200);
    },
    [session],
  );
  const soundSettings = {
    spoilers: false,
    sound: party?.setup.sound ?? true,
    haptics: false,
  };
  const send = (action: string, payload: Record<string, unknown> = {}) => {
    void unlockSound(soundSettings);
    void run(async () => {
      const oldPhase = session.party?.phase;
      await session.send(action, payload);
      const next = session.party!;
      if (next.status === "completed")
        playFeedback("complete", { ...soundSettings, sound: next.setup.sound });
      else if (next.phase === "reveal" && oldPhase !== "reveal")
        playFeedback(
          next.current?.answers.some((a) => a.correct) ? "correct" : "wrong",
          { ...soundSettings, sound: next.setup.sound },
        );
      else if (next.phase === "question")
        playFeedback("next", { ...soundSettings, sound: next.setup.sound });
    });
  };
  const prepare = (setup?: Setup, players?: HotSeatParticipant[]) => {
    setSeed((s) => ({ key: s.key + 1, setup, players }));
    setView("setup");
    setNotice("");
  };
  const locked = busy || session.hasPending;
  const openParty = (id: string) =>
    void run(async () => {
      await session.resume(id);
      setView("game");
    });
  const recover = () =>
    void run(async () => {
      if (view === "game" && session.party)
        await session.resume(session.party.id);
      else await loadLobby();
    });
  return (
    <section
      className={`hot-seat${large ? " hot-large" : ""}`}
      aria-label="Hot Seat"
    >
      <header className="hot-header">
        <div>
          <p className="eyebrow">Ein Bildschirm · Zwei bis acht Personen</p>
          <h1 ref={heading} tabIndex={-1}>
            Gemeinsam spielen
          </h1>
        </div>
        <button
          disabled={busy}
          aria-pressed={large}
          onClick={() => setLarge((v) => !v)}
        >
          Große Ansicht
        </button>
      </header>
      {error && (
        <div className="notice error" role="alert">
          <p>{error}</p>
          <div className="hot-actions">
            {session.hasPending && (
              <button
                disabled={busy}
                onClick={() =>
                  void run(async () => {
                    const pendingAction = session.pendingAction;
                    await session.retry();
                    if (pendingAction === "delete") {
                      session.party = undefined;
                      await loadLobby(0);
                    } else if (pendingAction?.startsWith("template-")) {
                      if (view !== "setup") await loadLobby();
                      else setNotice("Die Vorlage wurde bestätigt.");
                    } else if (session.party) setView("game");
                    else await loadLobby();
                  })
                }
              >
                Erneut versuchen
              </button>
            )}
            <button disabled={busy} onClick={recover}>
              Stand erneut laden
            </button>
          </div>
        </div>
      )}
      {notice && (
        <p role="status" className="notice">
          {notice}
        </p>
      )}
      {busy && (
        <p role="status" className="tiny">
          Wird online bestätigt …
        </p>
      )}
      {view === "lobby" && (
        <>
          <p>
            Ein Konto genügt. Gib euren Namen ein, wählt eure Regeln und spielt
            gemeinsam. Eure Partiewertung bleibt privat.
          </p>
          {!lobby ? (
            <p role="status">Partien werden geladen …</p>
          ) : (
            <>
              {lobby.active && (
                <article className="hot-active">
                  <h2>Eure begonnene Partie</h2>
                  <p>
                    {hotSeatModes[lobby.active.setup.mode].name} ·{" "}
                    {lobby.active.players.map((p) => p.name).join(", ")}
                  </p>
                  <div className="hot-actions">
                    <button
                      className="primary"
                      disabled={locked}
                      onClick={() => openParty(lobby.active!.id)}
                    >
                      Partie fortsetzen →
                    </button>
                    <button
                      disabled={busy}
                      onClick={() =>
                        setConfirmation({ kind: "abort", party: lobby.active! })
                      }
                    >
                      Partie abbrechen
                    </button>
                  </div>
                </article>
              )}
              <button
                className="primary"
                disabled={locked || !!lobby.active}
                onClick={() => prepare()}
              >
                Neue Partie einrichten →
              </button>
              {lobby.templates.length > 0 && (
                <details>
                  <summary>
                    Eigene Regelvorlagen · {lobby.templates.length}
                  </summary>
                  <ul className="hot-history">
                    {lobby.templates.map((t) => (
                      <li key={t.name}>
                        <span>
                          <strong>{t.name}</strong> ·{" "}
                          {hotSeatModes[t.setup.mode].name}
                        </span>
                        <div className="hot-actions">
                          <button
                            disabled={locked || !!lobby.active}
                            onClick={() => prepare(t.setup)}
                          >
                            Vorlage verwenden
                          </button>
                          <button
                            className="text-button"
                            disabled={locked}
                            aria-label={`Vorlage ${t.name} löschen`}
                            onClick={() =>
                              setConfirmation({
                                kind: "template",
                                name: t.name,
                              })
                            }
                          >
                            Löschen
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </details>
              )}
              <details open={lobby.history.length > 0}>
                <summary>Private Ergebnisse</summary>
                {lobby.history.length ? (
                  <ul className="hot-history">
                    {lobby.history.map((p) => (
                      <li key={p.id}>
                        <div>
                          <strong>{hotSeatModes[p.setup.mode].name}</strong>
                          <span>
                            {p.status === "aborted" ? "Abgebrochen" : "Beendet"}{" "}
                            ·{" "}
                            {new Date(p.createdAt).toLocaleDateString("de-DE")}
                          </span>
                          <small>
                            {p.players.map((v) => v.name).join(", ")}
                          </small>
                        </div>
                        <div className="hot-actions">
                          <button
                            disabled={locked}
                            onClick={() => openParty(p.id)}
                          >
                            Ergebnis ansehen
                          </button>
                          <button
                            disabled={locked}
                            className="text-button"
                            aria-label={`Ergebnis ${p.id} löschen`}
                            onClick={() =>
                              setConfirmation({ kind: "delete", party: p })
                            }
                          >
                            Löschen
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>Noch keine abgeschlossenen Partien.</p>
                )}
                <div className="hot-actions">
                  {page > 0 && (
                    <button
                      disabled={locked}
                      onClick={() =>
                        void run(async () => {
                          await loadLobby(page - 1);
                          setPage((p) => p - 1);
                        })
                      }
                    >
                      Neuere Ergebnisse
                    </button>
                  )}
                  {lobby.hasMore && (
                    <button
                      disabled={locked}
                      onClick={() =>
                        void run(async () => {
                          await loadLobby(page + 1);
                          setPage((p) => p + 1);
                        })
                      }
                    >
                      Ältere Ergebnisse
                    </button>
                  )}
                </div>
              </details>
            </>
          )}
          <button className="text-button" disabled={busy} onClick={onHome}>
            Zurück zum Solospiel
          </button>
        </>
      )}
      {view === "setup" && (
        <HotSeatSetup
          key={seed.key}
          initial={seed.setup}
          initialPlayers={seed.players}
          topics={topics}
          loading={optionsLoading}
          busy={locked}
          onOptions={requestOptions}
          onBack={() => void run(() => loadLobby())}
          onSave={(name, setup) =>
            void run(async () => {
              await session.send("template-save", { name, setup });
              setNotice(`Vorlage „${name}“ gespeichert.`);
            })
          }
          onStart={(setup, players) => {
            void unlockSound({ ...soundSettings, sound: setup.sound });
            void run(async () => {
              await session.create(setup, players);
              setView("game");
              playFeedback("start", { ...soundSettings, sound: setup.sound });
            });
          }}
        />
      )}
      {view === "game" && party && (
        <>
          {party.status === "active" ? (
            <HotSeatGame
              key={`${party.id}:${party.phase}:${party.round}:${party.turn}:${party.current?.position ?? "ready"}`}
              party={party}
              busy={locked}
              onSend={send}
            />
          ) : (
            <section className="hot-result">
              <p className="eyebrow">
                {hotSeatModes[party.setup.mode].name} · Private Partiewertung
              </p>
              <h2>
                {party.status === "aborted"
                  ? "Partie abgebrochen"
                  : party.winners.length > 1
                    ? "Gemeinsame Sieger"
                    : `${party.players[party.winners[0]]?.name ?? "Die Partie"} gewinnt!`}
              </h2>
              {party.status === "completed" && party.winners.length > 1 && (
                <p>
                  {party.winners
                    .map((i) => party.players[i].name)
                    .join(" und ")}
                </p>
              )}
              {party.status === "aborted" && (
                <p>
                  Gespeicherter Teilstand. Eine neue Partie kann sofort starten.
                </p>
              )}
              <HotSeatScores party={party} />
              <ul className="hot-highlights">
                {party.players.map((p, i) => (
                  <li key={i}>
                    {p.name}: {p.hits} von {p.answered} regulären Antworten
                    richtig
                    {p.bestStreak > 1
                      ? ` · ${p.bestStreak} Treffer in Folge`
                      : ""}
                  </li>
                ))}
              </ul>
              <div className="hot-actions">
                <button
                  className="primary"
                  disabled={locked}
                  onClick={() =>
                    prepare(
                      party.setup,
                      party.players.map(({ name, members }) => ({
                        name,
                        members,
                      })),
                    )
                  }
                >
                  Revanche vorbereiten →
                </button>
                <button
                  disabled={locked}
                  onClick={() => void run(() => loadLobby(0))}
                >
                  Zur Partienübersicht
                </button>
                <button
                  className="text-button"
                  disabled={locked}
                  onClick={() => setConfirmation({ kind: "delete", party })}
                >
                  Ergebnis löschen
                </button>
              </div>
            </section>
          )}
          {party.status === "active" && (
            <div
              className="hot-actions hot-game-exit"
              role="group"
              aria-label="Partiesteuerung"
            >
              <button
                disabled={busy}
                onClick={() => void run(() => loadLobby(0))}
              >
                Unterbrechen
              </button>
              <button
                className="text-button"
                disabled={busy}
                onClick={() => setConfirmation({ kind: "abort", party })}
              >
                Partie abbrechen
              </button>
              <small>
                Eine laufende Antwortzeit läuft beim Unterbrechen weiter.
              </small>
            </div>
          )}
        </>
      )}
      <p className="hot-privacy tiny muted">
        Nur im Gastgeberkonto gespeichert · Keine Lern-XP oder öffentlichen
        Rekorde
      </p>
      {confirmation && (
        <Confirm
          value={confirmation}
          onCancel={() => setConfirmation(undefined)}
          onConfirm={() => {
            const chosen = confirmation;
            setConfirmation(undefined);
            void run(async () => {
              if (chosen.kind === "template") {
                await session.send("template-delete", { name: chosen.name });
                await loadLobby();
              } else {
                await session.resume(chosen.party.id);
                await session.send(
                  chosen.kind === "abort" ? "abort" : "delete",
                );
                if (chosen.kind === "abort") setView("game");
                else {
                  session.party = undefined;
                  await loadLobby(0);
                }
              }
            });
          }}
        />
      )}
    </section>
  );
}
