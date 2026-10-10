import type { Question } from "./model";

export function additionalAnswerFeedback(q: Question, feedback = "") {
  // Remove known empty formulas, not sentences merely containing a negation:
  // "Georgie ist Bills Bruder, nicht sein Onkel" carries useful information.
  let extra = feedback.trim();
  const explanation = q.explanation.trim();
  if (explanation) extra = extra.replace(explanation, "").trim();
  extra = extra.replace(
    /^„[^“]*“ (?:trifft hier nicht zu|ist hier nicht richtig)(?:[.!](?:\s+|$)|$)/u,
    "",
  );
  const correct = q.answers?.find((a) => a.id === q.correctId)?.text;
  const emptySentences = (q.answers ?? []).flatMap(({ text }) => [
    `${text} ist hier nicht gesucht.`,
    `${text} ist hier nicht richtig.`,
    `${text} gehört nicht zum Regiecredit dieser Filmfassung.`,
    `${text} gehören nicht zum Regiecredit dieser Filmfassung.`,
    `${text} führte bei diesem Film nicht Regie.`,
    `${text} führten bei diesem Film nicht Regie.`,
    `${text} führte hier nicht Regie.`,
    `${text} führte hier nicht Hauptregie.`,
    `${text} führte bei dieser Filmfassung nicht die gefragte Regie.`,
    `${text} hat hier keinen Regiecredit.`,
    `${text} trägt hier keinen Hauptregiecredit.`,
    `${text} inszenierte diesen Film nicht.`,
    `${text} ist nicht der Regisseur dieses Films.`,
    `${text} übernimmt diese Rolle nicht.`,
  ]);
  if (correct) {
    emptySentences.push(
      `Richtig ist ${correct}.`,
      `Hier ist ${correct} die gesuchte Regienennung.`,
    );
    if (/^\d{4}$/u.test(correct))
      emptySentences.push(
        `Das gesuchte Jahr ist ${correct}.`,
        `Die erste Veröffentlichung war ${correct}.`,
      );
  }
  // Only whole leading sentences are discarded. A following concrete fact
  // survives, including names with punctuation and negative distinctions.
  let previous;
  do {
    previous = extra;
    const empty = emptySentences.find(
      (sentence) =>
        extra === sentence ||
        extra.startsWith(`${sentence} `) ||
        extra.startsWith(`${sentence}\n`),
    );
    if (empty) extra = extra.slice(empty.length).trim();
  } while (extra !== previous);
  extra = extra.trim();
  return /[\p{L}\p{N}]/u.test(extra) ? extra : "";
}
