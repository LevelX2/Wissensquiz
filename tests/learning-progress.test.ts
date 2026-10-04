import { describe, expect, it } from "vitest";
import type { AnswerEvent } from "../src/model";
import { DAY, learn } from "../src/learning";
import {
  learningAtAnswer,
  learningDueText,
  learningOverview,
  nextLearningAt,
} from "../src/learningProgress";

const now = new Date(2026, 9, 4, 12).getTime();
const event = (at: number, extra: Partial<AnswerEvent> = {}): AnswerEvent => ({
  id: String(at),
  roundId: String(at),
  questionId: "q",
  knowledgeId: "k",
  version: "1",
  answerId: "a",
  correct: true,
  guessed: false,
  at,
  elapsedMs: 1000,
  knowledgePoints: 0,
  timeBonus: 0,
  ...extra,
});

describe("sichtbarer Lernfortschritt", () => {
  it("zählt Varianten gemeinsam und jede Zwischenstufe im Fortschrittsbalken", () => {
    const p1 = learn(undefined, event(now));
    const p2 = learn(p1, event(now + DAY));
    const p3 = learn(p2, event(now + 4 * DAY));
    const p4 = learn(p3, event(now + 11 * DAY));
    expect(learningOverview(["k", "k"], { k: p1 })).toMatchObject({
      steps: 1,
      maximum: 4,
      percent: 25,
      mastered: 0,
    });
    expect(learningOverview(["k"], { k: p2 })).toMatchObject({
      steps: 2,
      percent: 50,
    });
    expect(learningOverview(["k"], { k: p3 })).toMatchObject({
      steps: 3,
      percent: 75,
    });
    expect(learningOverview(["k"], { k: p4 })).toMatchObject({
      steps: 4,
      percent: 100,
      mastered: 1,
    });
    expect(
      learningOverview(["k", "unseen", "wrong"], {
        k: p2,
        wrong: learn(
          undefined,
          event(now, { correct: false, knowledgeId: "wrong" }),
        ),
      }),
    ).toMatchObject({
      unseen: 1,
      discovered: 1,
      stages: [0, 1, 0, 0],
      steps: 2,
      maximum: 12,
    });
    expect(learningOverview([], {})).toMatchObject({ percent: 0 });
    expect(
      learningOverview(
        ["k", ...Array.from({ length: 999 }, (_, i) => `unseen-${i}`)],
        { k: p1 },
      ).percent,
    ).toBe(0.03);
  });
  it("zeigt bei Korrektur nach heutigem Stufenaufstieg frühestens morgen statt einer bereits fälligen Stufe", () => {
    const first = event(now);
    const wrong = event(now + 1000, { correct: false });
    const recovered = event(now + 20 * 60_000);
    const { current, resolvedMistake } = learningAtAnswer(
      [recovered, wrong, first],
      recovered,
    );
    expect(current.stage).toBe(0);
    expect(resolvedMistake).toBe(true);
    expect(nextLearningAt(current, recovered.at)).toBe(
      new Date(2026, 9, 5).getTime(),
    );
    expect(
      learningAtAnswer([wrong, recovered], { ...recovered, guessed: true })
        .resolvedMistake,
    ).toBe(false);
  });
  it("zeigt den Stand der einzelnen Antwort unabhängig von späteren Wiederholungen", () => {
    const first = event(now);
    const second = event(now + DAY);
    const laterWrong = event(now + 2 * DAY, { correct: false });
    const progress = learningAtAnswer([laterWrong, second, first], second);
    expect(progress.previous?.stage).toBe(1);
    expect(progress.current.stage).toBe(2);
    expect(learningDueText(now + 3 * DAY, now)).toContain("in 3 Tagen");
    expect(learningDueText(now - 1, now)).toBe("jetzt fällig");
  });
});
