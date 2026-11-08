import { useEffect, useRef, useState } from "react";
import {
  hotSeatModes,
  hotSeatStandings,
  hotSeatTheme,
  type HotSeatParty,
} from "./hotSeat";
import { difficultyLabel } from "./filters";
import { Explanation } from "./Explanation";
import type { AnswerEvent, Question } from "./model";
import { ActorPortrait } from "./ActorPortrait";

export function HotSeatScores({ party }: { party: HotSeatParty }) {
  return (
    <ol className="hot-scores" aria-label="Punktestand">
      {hotSeatStandings(party).map((p) => (
        <li
          key={p.index}
          className={
            party.status === "completed" && party.winners.includes(p.index)
              ? "hot-winner"
              : ""
          }
        >
          <span
            className={`hot-marker hot-color-${p.index}`}
            aria-hidden="true"
          >
            {p.index + 1}
          </span>
          <div>
            <strong>{p.name}</strong>
            {party.setup.teams && <small>{p.members.join(", ")}</small>}
            <span>
              {p.score} Punkte
              {party.setup.mode === "hunt" && ` · ${p.badges.length} Abzeichen`}
              {party.tieRound > 0 && ` · ${p.tieScore} Stechpunkte`}
            </span>
            {p.badges.length > 0 && (
              <small>{p.badges.map(hotSeatTheme).join(" · ")}</small>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}

export function HotSeatGame({
  party,
  busy,
  onSend,
}: {
  party: HotSeatParty;
  busy: boolean;
  onSend: (action: string, payload?: Record<string, unknown>) => void;
}) {
  const [doubles, setDoubles] = useState<number[]>([]);
  const [correctPlayers, setCorrectPlayers] = useState<number[]>([]);
  const [theme, setTheme] = useState(party.theme);
  const [difficulty, setDifficulty] = useState(party.difficulty);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [imageReady, setImageReady] = useState("");
  const [imageFailed, setImageFailed] = useState("");
  const [imageAttempt, setImageAttempt] = useState(0);
  const heading = useRef<HTMLHeadingElement>(null);
  const action = useRef(onSend);
  action.current = onSend;
  const q = party.current?.question;
  const phase = party.phase;
  useEffect(() => {
    heading.current?.focus();
    window.scrollTo(0, 0);
  }, [phase, party.round, party.turn, party.current?.position]);
  useEffect(() => {
    const deadline = party.current?.deadline;
    if (deadline == null || !["question", "stealing"].includes(phase)) {
      setRemaining(null);
      return;
    }
    const began = performance.now();
    let expired = false;
    const update = () => {
      const ms = deadline - party.serverNow - (performance.now() - began);
      setRemaining(Math.max(0, Math.ceil(ms / 1000)));
      if (ms <= 0 && !expired) {
        expired = true;
        action.current(
          party.setup.mode === "all" && party.setup.input === "moderated"
            ? "reveal"
            : "answer",
          { answerId: null },
        );
      }
    };
    update();
    const timer = window.setInterval(update, 250);
    return () => window.clearInterval(timer);
  }, [party.revision]);
  const toggle = (xs: number[], n: number) =>
    xs.includes(n) ? xs.filter((x) => x !== n) : [...xs, n];
  const activePlayer = party.players[party.player];
  const allModerated =
    party.setup.mode === "all" && party.setup.input === "moderated";
  const availableDoubles = allModerated ? party.roster : [party.player];
  const selectedChoice = party.choices.find(
    (c) => c.id === (party.setup.mode === "hunt" ? theme : party.theme),
  );
  const available =
    party.tieRound > 0 ||
    !["hunt", "risk"].includes(party.setup.mode) ||
    (selectedChoice?.counts[
      party.setup.mode === "risk" ? difficulty : party.difficulty
    ] ?? 0) > 0;
  const revealed = q && "correctId" in q;
  const imageKey = q?.image
    ? `${party.id}:${party.current!.position}:${q.image.src}`
    : "";
  const imageBlocked = !!imageKey && imageReady !== imageKey;
  const displayQuestion: Question | undefined = q
    ? "correctId" in q
      ? q
      : {
          ...q,
          correctId: "unrevealed",
          explanation: "",
          context: "",
          sources: [],
          answers: q.answers.map((a) => ({ ...a, feedback: "" })),
        }
    : undefined;
  const answerEvent =
    party.current?.answers.find((a) => a.player === party.player) ??
    party.current?.answers[0];
  const event: AnswerEvent | undefined =
    q && revealed
      ? {
          id: `${party.id}:${party.current!.position}`,
          roundId: party.id,
          questionId: q.id,
          knowledgeId: q.knowledgeId,
          version: q.version,
          answerId: answerEvent?.answerId ?? null,
          correct: answerEvent?.correct ?? true,
          guessed: false,
          at: party.serverNow,
          knowledgePoints: 0,
          timeBonus: 0,
          elapsedMs: 0,
        }
      : undefined;
  const label =
    party.tieRound > 0
      ? `Stechen · Durchgang ${party.tieRound} von höchstens 3`
      : `Durchgang ${party.round + 1} von ${party.setup.rounds}`;
  return (
    <div className="hot-game">
      <p className="eyebrow">
        {hotSeatModes[party.setup.mode].name} · {label}
      </p>
      {phase === "interval" ? (
        <section className="hot-transition">
          <h2 ref={heading} tabIndex={-1}>
            {party.tieRound > 0
              ? "Es geht ins Stechen"
              : "Zeit für den Zwischenstand"}
          </h2>
          <p>
            {party.tieRound > 0
              ? `Noch dabei: ${party.roster.map((i) => party.players[i].name).join(", ")}. Mittel, ein Stechpunkt je Treffer, ohne Joker.`
              : `Als Nächstes: ${hotSeatTheme(party.theme)} · ${difficultyLabel(party.difficulty)}.`}
          </p>
          <HotSeatScores party={party} />
          <button
            className="primary"
            disabled={busy}
            onClick={() => onSend("next")}
          >
            Nächsten Durchgang starten →
          </button>
        </section>
      ) : phase === "ready" || phase === "handoff" ? (
        <section className="hot-transition">
          <span
            className={`hot-marker hot-color-${party.player} hot-marker-large`}
            aria-hidden="true"
          >
            {party.player + 1}
          </span>
          <h2 ref={heading} tabIndex={-1}>
            {allModerated ? "Alle sind dran" : `${activePlayer.name} ist dran`}
          </h2>
          {phase === "handoff" && (
            <p>
              Antwort gespeichert. Reiche das Gerät weiter. Frühere Antworten
              bleiben verdeckt.
            </p>
          )}
          {!allModerated && party.setup.teams && (
            <p>{activePlayer.members.join(" · ")}</p>
          )}
          {party.setup.mode === "hunt" &&
          party.tieRound === 0 &&
          phase === "ready" ? (
            <label>
              Dein Thema
              <select
                value={theme}
                disabled={busy}
                onChange={(e) => setTheme(e.target.value)}
              >
                {party.setup.topics.map((id) => (
                  <option
                    key={id}
                    value={id}
                    disabled={
                      !(
                        party.choices.find((c) => c.id === id)?.counts[
                          party.difficulty
                        ] ?? 0
                      )
                    }
                  >
                    {hotSeatTheme(id)}
                    {activePlayer.badges.includes(id)
                      ? " · Abzeichen vorhanden"
                      : ""}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <p>
              {hotSeatTheme(party.theme)} · {difficultyLabel(party.difficulty)}
            </p>
          )}
          {party.setup.mode === "risk" &&
            party.tieRound === 0 &&
            phase === "ready" && (
              <label>
                Welches Risiko gehst Du ein?
                <select
                  value={difficulty}
                  disabled={busy}
                  onChange={(e) =>
                    setDifficulty(e.target.value as typeof difficulty)
                  }
                >
                  {(["leicht", "mittel", "schwer"] as const).map((d, i) => (
                    <option
                      key={d}
                      value={d}
                      disabled={!(selectedChoice?.counts[d] ?? 0)}
                    >
                      {difficultyLabel(d)} ·{" "}
                      {["+1 / 0", "+3 / −1", "+5 / −2"][i]}
                    </option>
                  ))}
                </select>
              </label>
            )}
          {party.setup.double && party.tieRound === 0 && (
            <div className="hot-double-choice">
              {availableDoubles.map(
                (i) =>
                  !party.players[i].doubleUsed && (
                    <label className="hot-check" key={i}>
                      <input
                        type="checkbox"
                        disabled={busy}
                        checked={doubles.includes(i)}
                        onChange={() => setDoubles((xs) => toggle(xs, i))}
                      />
                      {allModerated ? `${party.players[i].name}: ` : ""}
                      Doppelpunkt-Joker einsetzen
                    </label>
                  ),
              )}
            </div>
          )}
          {allModerated && (
            <p>
              Legt euch mit Papier oder Antwortkärtchen auf A, B, C oder D fest.
              Erst danach die Lösung aufdecken.
            </p>
          )}
          {!available && (
            <p role="status">
              Für diese Wahl fehlen weitere Fragen. Wähle ein anderes
              verfügbares Thema oder eine andere Stufe.
            </p>
          )}
          <button
            className="primary"
            disabled={busy || !available}
            onClick={() =>
              onSend(phase === "handoff" ? "ready" : "start-question", {
                theme,
                difficulty,
                doublePlayers: doubles,
              })
            }
          >
            {phase === "handoff" ? "Bereit · Frage zeigen" : "Frage starten"} →
          </button>
        </section>
      ) : q ? (
        <section className="hot-question">
          <div className="hot-question-meta">
            <strong>
              {allModerated
                ? "Alle tippen mit"
                : phase === "offer-steal" || phase === "stealing"
                  ? `Stehlchance für ${activePlayer.name}`
                  : activePlayer.name}
            </strong>
            <span>
              {hotSeatTheme(party.current!.theme)} ·{" "}
              {difficultyLabel(party.current!.difficulty)}
            </span>
            {remaining !== null && (
              <span role="timer" aria-label="Verbleibende Antwortzeit">
                {remaining} s
              </span>
            )}
          </div>
          <h2 ref={heading} tabIndex={-1} data-question-id={q.id}>
            {q.question}
          </h2>
          {q.image && !revealed && displayQuestion && (
            <div className="hot-question-image">
              <ActorPortrait
                q={displayQuestion}
                beforeAnswer
                loadAttempt={imageAttempt}
                onReady={() => setImageReady(imageKey)}
                onError={() => setImageFailed(imageKey)}
              />
              {imageBlocked && (
                <p role={imageFailed === imageKey ? "alert" : "status"}>
                  {imageFailed === imageKey
                    ? "Das Bild konnte nicht geladen werden."
                    : "Das Bild wird geladen …"}
                  {imageFailed === imageKey && (
                    <button
                      disabled={busy}
                      onClick={() => {
                        setImageFailed("");
                        setImageAttempt((n) => n + 1);
                      }}
                    >
                      Bild erneut laden
                    </button>
                  )}
                </p>
              )}
            </div>
          )}
          <div className="hot-answers">
            {party.current!.order.map((id, i) => {
              const a = q.answers.find((candidate) => candidate.id === id)!;
              const isCorrect = revealed && q.correctId === id;
              const selectedWrong =
                revealed &&
                party.current!.answers.some(
                  (r) => r.answerId === id && !r.correct,
                );
              return (
                <button
                  className={`hot-answer${isCorrect ? " correct" : selectedWrong ? " wrong" : ""}`}
                  key={id}
                  data-answer-id={id}
                  disabled={
                    busy ||
                    (imageBlocked && !revealed) ||
                    !["question", "stealing"].includes(phase) ||
                    allModerated
                  }
                  onClick={() => onSend("answer", { answerId: id })}
                >
                  <span className="hot-letter" aria-hidden="true">
                    {"ABCD"[i]}
                  </span>
                  <span>{a.text}</span>
                  {isCorrect && (
                    <span className="sr-only"> · Richtige Antwort</span>
                  )}
                </button>
              );
            })}
          </div>
          {phase === "offer-steal" ? (
            <div className="hot-steal">
              <p>
                Ein zweiter Versuch: Ein Treffer gibt einen Bonuspunkt. Der
                Joker ist danach verbraucht.
              </p>
              <div className="hot-actions">
                <button
                  className="primary"
                  disabled={busy}
                  onClick={() => onSend("take-steal")}
                >
                  Stehljoker einsetzen
                </button>
                <button disabled={busy} onClick={() => onSend("pass-steal")}>
                  Passen · Lösung zeigen
                </button>
              </div>
            </div>
          ) : phase === "question" || phase === "stealing" ? (
            allModerated ? (
              <button
                className="primary"
                disabled={busy}
                onClick={() => onSend("reveal")}
              >
                Alle festgelegt · Lösung aufdecken
              </button>
            ) : (
              <button
                disabled={busy}
                onClick={() => onSend("answer", { answerId: null })}
              >
                Keine Ahnung
              </button>
            )
          ) : phase === "moderate" ? (
            <fieldset disabled={busy}>
              <legend>Wer hatte die richtige Antwort?</legend>
              <p>
                Markiere die Teilnehmer, deren Antwortkärtchen oder Notiz
                stimmt.
              </p>
              {party.roster.map((i) => (
                <label className="hot-check" key={i}>
                  <input
                    type="checkbox"
                    checked={correctPlayers.includes(i)}
                    onChange={() => setCorrectPlayers((xs) => toggle(xs, i))}
                  />
                  {party.players[i].name}
                </label>
              ))}
              <button
                className="primary"
                onClick={() => onSend("moderate", { correctPlayers })}
              >
                Auswertung speichern →
              </button>
            </fieldset>
          ) : (
            phase === "reveal" && (
              <div className="hot-reveal">
                <p className="hot-correct-answer">
                  Richtige Antwort:{" "}
                  {
                    q.answers.find((a) => revealed && a.id === q.correctId)
                      ?.text
                  }
                </p>
                <ul className="hot-gains" aria-label="Frageergebnis">
                  {party.current!.answers.map((a, i) => (
                    <li key={i}>
                      {party.players[a.player].name}
                      {a.kind === "steal" ? " · Stehlversuch" : ""}:{" "}
                      {a.correct
                        ? "Richtig"
                        : a.answerId
                          ? "Nicht richtig"
                          : "Ausgelassen oder Zeit abgelaufen"}{" "}
                      ·{" "}
                      <strong>
                        {a.points > 0 ? "+" : ""}
                        {a.points} Punkte
                      </strong>
                    </li>
                  ))}
                </ul>
                <button
                  className="primary"
                  disabled={busy}
                  onClick={() => onSend("next")}
                >
                  Weiter →
                </button>
              </div>
            )
          )}
          {revealed && event && (
            <details
              className="hot-explanation"
              open={party.setup.explanations}
            >
              <summary>Erklärung und Filmdaten</summary>
              <Explanation q={q} event={event} />
            </details>
          )}
        </section>
      ) : (
        <p role="status">Die nächste Frage wird vorbereitet …</p>
      )}
      {phase !== "interval" && (
        <details className="hot-live-score">
          <summary>Punktestand ansehen</summary>
          <HotSeatScores party={party} />
        </details>
      )}
    </div>
  );
}
