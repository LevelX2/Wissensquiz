import { hasAnswer, type State } from "./model";

export function answeredTopics(state: State): Set<string> {
  const answered = new Set(
    state.events.filter(hasAnswer).map((event) => event.knowledgeId),
  );
  return new Set(
    state.questions
      .filter((question) => answered.has(question.knowledgeId))
      .map((question) => question.topic),
  );
}
