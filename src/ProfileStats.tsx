import { hasAnswer, type State } from "./model";
import { careerProgress } from "./career";
import { isRecordMode } from "./recordModes";
import { learningOverview } from "./learningProgress";

export function profileStats(state: State) {
  const answered = state.events.filter(hasAnswer);
  const correct = answered.filter((event) => event.correct).length;
  const goals = new Set(
    state.questions.map((question) => question.knowledgeId),
  );
  return {
    played: state.rounds.length,
    completed: state.rounds.filter((round) => round.status === "completed")
      .length,
    answered: answered.length,
    encountered: new Set(state.events.map((event) => event.questionId)).size,
    totalGoals: goals.size,
    learning: learningOverview([...goals], state.learning),
    correct,
    accuracy: answered.length
      ? Math.round((correct / answered.length) * 100)
      : null,
    recordRounds: state.rounds.filter(
      (round) => isRecordMode(round.mode) && round.status === "completed",
    ).length,
    mastered: Object.values(state.learning).filter(
      (goal) => goal.status === "gefestigt",
    ).length,
  };
}

export function ProfileStats({ state }: { state: State }) {
  const stats = profileStats(state);
  const learning = stats.learning;
  return (
    <>
      <section aria-label="Dein Lernstand">
        <h2>Dein Lernstand</h2>
        <p>
          <strong>
            {stats.encountered.toLocaleString("de-DE")} unterschiedliche Fragen
          </strong>{" "}
          kennengelernt
        </p>
        <p className="tiny muted">
          Jede Frage zählt einmal, sobald Du geantwortet hast oder die Zeit
          abgelaufen ist.
        </p>
        <h3>Lernstufen Deiner Wissensziele</h3>
        <dl className="profile-learning-stages">
          {[
            ["Noch nicht gelernt", learning.unseen],
            ["Stufe 0 · Noch unsicher", learning.discovered],
            ["Stufe 1 · Einmal sicher gewusst", learning.stages[0]],
            ["Stufe 2 · Nach Abstand bestätigt", learning.stages[1]],
            ["Stufe 3 · Mehrfach bestätigt", learning.stages[2]],
            ["Stufe 4 · Gefestigt", learning.stages[3]],
          ].map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value.toLocaleString("de-DE")}</dd>
            </div>
          ))}
        </dl>
        <p className="tiny muted">
          {(stats.totalGoals - learning.unseen).toLocaleString("de-DE")} von{" "}
          {stats.totalGoals.toLocaleString("de-DE")} Wissenszielen im
          Fragenbestand gelernt. Fragevarianten teilen eine Lernstufe. Sichere
          Antworten nach dem Wiederholungstermin erhöhen die Stufe; die Abstände
          wachsen auf 1, 3, 7 und 21 Tage.
        </p>
      </section>
      <section aria-label="Deine Spielstatistik">
        <h2>Deine Spielstatistik</h2>
        <dl className="profile-stats">
          {[
            ["Runden gespielt", stats.played],
            ["Runden abgeschlossen", stats.completed],
            ["Antworten insgesamt", stats.answered],
            [
              "Trefferquote",
              stats.accuracy === null ? "–" : `${stats.accuracy} %`,
            ],
            ["Rekordrunden abgeschlossen", stats.recordRounds],
            ["Wissensziele gefestigt", stats.mastered],
          ].map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value.toLocaleString("de-DE")}</dd>
            </div>
          ))}
        </dl>
        <p className="tiny muted">
          {stats.correct.toLocaleString("de-DE")} richtig beantwortet · Level{" "}
          {careerProgress(state.experience).level} ·{" "}
          {careerProgress(state.experience).title} ·{" "}
          {state.experience.toLocaleString("de-DE")} XP
        </p>
      </section>
    </>
  );
}
