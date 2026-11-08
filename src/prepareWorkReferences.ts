// Operator-only: use the already reviewed, concrete film references, never an
// actor's entire filmography. The browser receives prepared individual data.
import type { Question } from "./model";
import { preparePresentation } from "./questionPresentation";
import { workFamiliarityOf } from "./familiarity";
import {
  resolveQuestionWorks,
  workIdentity,
  workReferencesOf,
} from "./workAttributes";

export function prepareQuestionWorks(questions: Question[]): Question[] {
  const names = new Map<string, Set<string>>();
  const presentations = new Map(
    questions.map((q) => [q.id, preparePresentation(q)]),
  );
  const normalize = (value: string) =>
    value
      .normalize("NFC")
      .replace(/[„“”«»]/g, '"')
      .replace(/[‘’]/g, "'")
      .replace(/[‐‑‒–—]/g, "-")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
  for (const q of questions) {
    for (const { data } of presentations.get(q.id)!.films) {
      const key = workIdentity({
        type: "film",
        originalTitle: data.originalTitle,
        year: data.year,
      });
      const titles = names.get(key) ?? new Set<string>();
      titles.add(normalize(data.originalTitle));
      for (const title of data.alternativeTitles ?? [])
        titles.add(normalize(title.title));
      if (
        q.metadata.film_title_original === data.originalTitle &&
        Number(q.metadata.film_year) === data.year &&
        q.metadata.film_title_de
      )
        titles.add(normalize(q.metadata.film_title_de));
      names.set(key, titles);
    }
  }
  const referenced = questions.map((q) => {
    if (q.works !== undefined) return q;
    const works = workReferencesOf(q);
    const known = new Set(works.map(workIdentity));
    // Biography links and portrait filmographies do not establish a subject.
    // Existing actor references are promoted only for a quoted work in the
    // actual question or an exact work title sought as the correct answer.
    if (!q.metadata.person_id || q.metadata.question_type === "Bilderkennung")
      return { ...q, works };
    const text = normalize(presentations.get(q.id)!.questionText ?? q.question);
    const correct = normalize(
      q.answers.find((answer) => answer.id === q.correctId)?.text ?? "",
    );
    for (const { data } of presentations.get(q.id)!.films) {
      const work = {
        type: "film" as const,
        originalTitle: data.originalTitle,
        year: data.year,
        genres: [],
        techniques: [],
      };
      const key = workIdentity(work);
      const titles = [...(names.get(key) ?? [])].flatMap((name) => [
        name,
        `${name} (${work.year})`,
      ]);
      if (
        !titles.some(
          (name) =>
            correct === name ||
            text.includes(`"${name}"`) ||
            text.includes(`'${name}'`),
        )
      )
        continue;
      if (!known.has(key)) {
        works.push(work);
        known.add(key);
      }
    }
    return { ...q, works };
  });
  return resolveQuestionWorks(referenced).map((q) => ({
    ...q,
    works: q.works!.map((work) => {
      const registered = workFamiliarityOf({ ...work, familiarity: undefined });
      if (registered && work.familiarity && registered !== work.familiarity)
        throw new Error(
          `Bekanntheit weicht vom Werkregister ab: ${work.originalTitle}.`,
        );
      const familiarity = workFamiliarityOf(work);
      return { ...work, ...(familiarity ? { familiarity } : {}) };
    }),
  }));
}
