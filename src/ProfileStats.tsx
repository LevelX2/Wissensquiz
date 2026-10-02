import { hasAnswer, type State } from "./model";
import { careerProgress } from "./career";

export function profileStats(state: State) {
  const answered = state.events.filter(hasAnswer);
  const correct = answered.filter((event) => event.correct).length;
  return {
    played: state.rounds.length,
    completed: state.rounds.filter((round) => round.status === "completed")
      .length,
    answered: answered.length,
    correct,
    accuracy: answered.length
      ? Math.round((correct / answered.length) * 100)
      : null,
    recordRounds: state.rounds.filter(
      (round) => round.mode === "rekord" && round.status === "completed",
    ).length,
    mastered: Object.values(state.learning).filter(
      (goal) => goal.status === "gefestigt",
    ).length,
  };
}

export function ProfileStats({ state }: { state: State }) {
  const stats = profileStats(state);
  return (
    <section aria-label="Deine Spielstatistik">
      <h2>Deine Spielstatistik</h2>
      <dl className="profile-stats">
        {[
          ["Runden gespielt", stats.played],
          ["Runden abgeschlossen", stats.completed],
          ["Fragen beantwortet", stats.answered],
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
  );
}
