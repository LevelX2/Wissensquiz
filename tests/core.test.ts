import { beforeEach, describe, expect, it } from "vitest";
import { readFileSync, writeFileSync } from "node:fs";
import "fake-indexeddb/auto";
import { importCsv } from "../src/importer";
import {
  answer,
  badgeEligible,
  complete,
  DAY,
  elapsed,
  guess,
  learn,
  recordKey,
  score,
  selectQuestions,
  shuffle,
  startRound,
  rebuild,
} from "../src/engine";
import { emptyState, type AnswerEvent, type Learning } from "../src/model";
import { read, restore, update, validateBackup } from "../src/storage";
const csv = readFileSync("public/fragen.csv", "utf8");
const imported = importCsv(csv, [], "SciFi_Quiz_180_Fragen.csv");
const questions = imported.questions;
const demoText = readFileSync("public/demo-fragen.csv", "utf8");
const now = new Date(2026, 0, 2, 12).getTime();
const event = (at: number, extra: Partial<AnswerEvent> = {}): AnswerEvent => ({
  id: String(at),
  roundId: "r",
  questionId: "q",
  knowledgeId: "k",
  version: "v1",
  answerId: "a",
  correct: true,
  guessed: false,
  at,
  elapsedMs: 5000,
  knowledgePoints: 0,
  timeBonus: 0,
  ...extra,
});
describe("CSV und Inhalte", () => {
  it("wertet alle 180 gelieferten Fragen und 150 Wissensziele aus", () => {
    expect(imported.report.rejected).toBe(0);
    expect(questions).toHaveLength(180);
    expect(new Set(questions.map((q) => q.knowledgeId)).size).toBe(150);
    expect(questions.filter((q) => q.metadata.variant_of)).toHaveLength(30);
    expect(imported.report.warnings).toEqual([]);
    expect(
      questions.every(
        (q) =>
          q.context &&
          q.anchor &&
          q.sources.length &&
          q.answers.every((a) => a.feedback),
      ),
    ).toBe(true);
    writeFileSync(
      "docs/importbericht.json",
      JSON.stringify(
        {
          ...imported.report,
          knowledgeGoals: 150,
          variants: 30,
          topics: new Set(questions.map((q) => q.topic)).size,
          eligibleBadgeGoals: new Set(
            questions.filter(badgeEligible).map((q) => q.knowledgeId),
          ).size,
          contentNote:
            "Nutzerdatei unverändert übernommen. verification_status ist Quellenangabe, keine unabhängige Faktenprüfung.",
        },
        null,
        2,
      ),
    );
  });
  it("BOM, CRLF, Semikolon, Quotes und mehrzeilige Felder", () => {
    const text =
      '\uFEFFquestion_id;question;answer_a;answer_b;answer_c;answer_d;correct_answer;explanation_short\r\nx;"Was sagt sie: ""Hallo""?\nZweite Zeile";Ja;Nein;Vielleicht;Nie;B;"Eine Erklärung; mit Semikolon"';
    const r = importCsv(text);
    expect(r.questions).toHaveLength(1);
    expect(r.questions[0].question).toContain('"Hallo"?\n');
    expect(r.questions[0].correctId).toBe("x:b");
    expect(r.questions[0].knowledgeId).toBe("question:x");
    expect(r.report.warnings.length).toBeGreaterThan(0);
  });
  it("Tabulator und stabile IDs", () => {
    const a = importCsv(demoText);
    const b = importCsv(demoText);
    expect(a.questions.map((q) => q.version)).toEqual(
      b.questions.map((q) => q.version),
    );
    const tab =
      "question_id\tquestion\tanswer_a\tanswer_b\tanswer_c\tanswer_d\tcorrect_answer\texplanation_short\nx\tFrage\tA\tB\tC\tD\tC\tGrund";
    expect(importCsv(tab).questions[0].correctId).toBe("x:c");
  });
  it("überspringt bestehende IDs ohne Überschreiben", () => {
    const r = importCsv(csv, questions);
    expect(r.questions).toHaveLength(0);
    expect(r.report.duplicates).toBe(180);
  });
  it("lehnt ungültige Lösungen und fehlende Spalten ab", () => {
    expect(
      importCsv("question_id,question\nx,Hallo").report.issues[0],
    ).toContain("Pflichtspalten");
    expect(
      importCsv(demoText.replace(',a,"Die Montage', ',Z,"Die Montage')).report
        .rejected,
    ).toBe(1);
  });
  it("schließt kaputtes Quoting und mehrdeutige Header aus", () => {
    expect(
      importCsv('question_id,question\nx,"unfertig').questions,
    ).toHaveLength(0);
    expect(importCsv("question_id,question_id\na,b").questions).toHaveLength(0);
  });
  it("Varianten teilen ein Wissensziel und Feedback bleibt beim Mischen zugeordnet", () => {
    const variant = questions.find((q) => q.metadata.variant_of)!;
    expect(variant.knowledgeId).toBe(
      questions.find((q) => q.id === variant.metadata.variant_of)?.knowledgeId,
    );
    for (const q of questions) {
      const mixed = shuffle(q.answers, () => 0.3);
      expect(mixed.find((a) => a.id === q.correctId)?.text).toBe(
        q.metadata[`answer_${q.metadata.correct_answer.toLowerCase()}`],
      );
      for (const a of mixed)
        expect(a.feedback).toBe(q.metadata[`feedback_${a.id.slice(-1)}`]);
    }
  });
  it("schließt fehlende oder widersprüchliche Varianten aus", () => {
    const minimal =
      "question_id,knowledge_id,variant_of,question,answer_a,answer_b,answer_c,answer_d,correct_answer,explanation_short\na,k,,Q,A,B,C,D,a,E\nb,other,a,Q2,A,B,C,D,a,E\nc,,missing,Q3,A,B,C,D,a,E";
    expect(importCsv(minimal).questions).toHaveLength(1);
  });
});
describe("Punkte und Zeit", () => {
  it.each([
    [0, 160],
    [5000, 150],
    [5001, 148],
    [29999, 100],
    [30000, 0],
    [31000, 0],
  ])("%i ms ergeben %i Punkte", (ms, total) => {
    const s = score(true, ms);
    expect(s.knowledgePoints + s.timeBonus).toBe(total);
  });
  it("falsch gibt null", () =>
    expect(score(false, 1000)).toEqual({ knowledgePoints: 0, timeBonus: 0 }));
  it("nutzt verstrichene Wand- und monotone Zeit auch nach Hintergrundpause", () => {
    expect(elapsed({ wall: 1000, mono: 10 }, 32000, 11)).toBe(31000);
    expect(elapsed({ wall: 1000, mono: 10 }, 0, 5010)).toBe(5000);
  });
});
describe("Lernfortschritt mit kontrollierter Testzeit", () => {
  it("festigt erst nach vier sicheren Tagen und mindestens sieben Tagen Abstand", () => {
    let p = learn(undefined, event(now));
    expect(p.status).toBe("geübt");
    expect(p.due).toBe(now + DAY);
    p = learn(p, event(now + DAY));
    expect(p.stage).toBe(2);
    expect(p.due).toBe(now + 4 * DAY);
    p = learn(p, event(now + 4 * DAY));
    expect(p.status).toBe("geübt");
    expect(p.due).toBe(now + 11 * DAY);
    p = learn(p, event(now + 11 * DAY));
    expect(p.status).toBe("gefestigt");
    expect(p.due).toBe(now + 32 * DAY);
  });
  it("same-day and early answers never advance stage or due", () => {
    const p = learn(undefined, event(now));
    const same = learn(p, event(now + 60000));
    expect(same.stage).toBe(1);
    expect(same.due).toBe(p.due);
    expect(same.secureDays).toHaveLength(1);
  });
  it("eine frühe Zwischenantwort verhindert eine scheinbare Sieben-Tage-Festigung", () => {
    let p = learn(undefined, event(now));
    p = learn(p, event(now + DAY));
    p = learn(p, event(now + 4 * DAY));
    p = learn(p, event(now + 10 * DAY));
    expect(p.stage).toBe(3);
    p = learn(p, event(now + 11 * DAY));
    expect(p.status).toBe("geübt");
    p = learn(p, event(now + 32 * DAY));
    expect(p.status).toBe("gefestigt");
    p = learn(p, event(now + 52 * DAY));
    p = learn(p, event(now + 53 * DAY));
    expect(p.status).toBe("gefestigt"); // sichere Antworten nehmen erworbene Festigung nicht zurück
  });
  it("falsch und geraten verkürzen den Abstand", () => {
    expect(learn(undefined, event(now, { correct: false })).due).toBe(
      now + 600000,
    );
    const g = learn(undefined, event(now, { guessed: true }));
    expect(g.status).toBe("entdeckt");
    expect(g.due).toBe(now + 6 * 3600000);
  });
  it("kurze Wiederholung nach Fehler erhöht nicht mehrfach am gleichen Tag", () => {
    const first = learn(undefined, event(now));
    const wrong = learn(first, event(now + 1000, { correct: false }));
    expect(learn(wrong, event(now + 20 * 60000)).stage).toBe(0);
  });
  it("Auswahl ist eindeutig und kleine Themen werden nicht aufgefüllt", () => {
    const chosen = selectQuestions(
      questions,
      {},
      {
        mode: "entdecken",
        topic: "Alle Themen",
        difficulty: "Alle Stufen",
        size: 10,
        now,
      },
      () => 0.5,
    );
    expect(chosen).toHaveLength(10);
    expect(new Set(chosen.map((q) => q.knowledgeId)).size).toBe(10);
    const small = selectQuestions(
      questions,
      {},
      { mode: "rekord", topic: "Alien", difficulty: "leicht", size: 10, now },
    );
    expect(small.length).toBeGreaterThan(0);
    expect(small.length).toBeLessThan(10);
  });
  it("begrenzt fällige Ziele nach langer Pause", () => {
    const learning: Record<string, Learning> = {};
    for (const q of questions)
      learning[q.knowledgeId] = {
        ...learn(undefined, event(now)),
        knowledgeId: q.knowledgeId,
      };
    expect(
      selectQuestions(questions, learning, {
        mode: "entdecken",
        topic: "Alle Themen",
        difficulty: "Alle Stufen",
        size: 10,
        now: now + 100 * DAY,
      }),
    ).toHaveLength(5);
  });
  it("Entdecken nimmt alle neuen Ziele vor fälligen Wiederholungen", () => {
    const pool = [
      ...new Map(questions.map((q) => [q.knowledgeId, q])).values(),
    ].slice(0, 15);
    const learning: Record<string, Learning> = {};
    pool.slice(5, 10).forEach((q) => {
      learning[q.knowledgeId] = {
        ...learn(undefined, event(now - DAY * 2)),
        knowledgeId: q.knowledgeId,
      };
    });
    pool.slice(10).forEach((q) => {
      learning[q.knowledgeId] = {
        ...learn(undefined, event(now)),
        knowledgeId: q.knowledgeId,
        status: "gefestigt",
        stage: 4,
      };
    });
    const selected = selectQuestions(pool, learning, {
      mode: "entdecken",
      topic: "Alle Themen",
      difficulty: "Alle Stufen",
      size: 10,
      now,
    });
    expect(selected.filter((q) => !learning[q.knowledgeId])).toHaveLength(5);
    expect(
      selected.filter((q) => learning[q.knowledgeId]?.due <= now),
    ).toHaveLength(5);
    expect(
      selected.filter((q) => learning[q.knowledgeId]?.status === "gefestigt"),
    ).toHaveLength(0);
  });
});
describe("Runden und Persistenz", () => {
  it("Abzeichen erst nach bestätigtem Abschluss; geratener letzter Treffer reicht nicht", () => {
    const pool = [
      ...new Map(
        questions.filter(badgeEligible).map((q) => [q.knowledgeId, q]),
      ).values(),
    ].slice(0, 10);
    const s = emptyState(pool);
    for (const q of pool) {
      for (const day of [0, 1, 4, 11])
        s.events.push(
          event(now + day * DAY, {
            id: `${q.id}-${day}`,
            knowledgeId: q.knowledgeId,
          }),
        );
    }
    rebuild(s);
    expect(s.badges).toEqual([]);
    s.events[s.events.length - 1].guessed = true;
    rebuild(s, true);
    expect(s.badges).toEqual([]);
    s.events[s.events.length - 1].guessed = false;
    rebuild(s, true);
    expect(s.badges).toEqual(["sci-fi-10-v1"]);
    s.questions.push(
      ...questions.filter((q) => !pool.some((p) => p.id === q.id)),
    );
    rebuild(s);
    expect(s.badges).toEqual(["sci-fi-10-v1"]);
  });
  beforeEach(async () => {
    await update((s) => Object.assign(s, emptyState(questions)));
  });
  it("antwortet doppelt nur einmal und zählt abgeschlossene Runden einmal", () => {
    const s = emptyState(questions.slice(0, 1));
    const r = startRound(
      s,
      { mode: "rekord", topic: "Alle Themen", difficulty: "Alle Stufen" },
      now,
    );
    const q = r.questions[0];
    answer(s, r.id, q.id, q.correctId, 5000, now + 5000);
    answer(s, r.id, q.id, q.correctId, 1, now + 5001);
    expect(s.events).toHaveLength(1);
    guess(s, s.events[0].id);
    expect(s.events[0].knowledgePoints + s.events[0].timeBonus).toBe(150);
    expect(s.learning[q.knowledgeId].status).toBe("entdeckt");
    complete(s, r.id, now + 6000);
    complete(s, r.id, now + 6001);
    expect(s.experience).toBe(1);
    expect(s.records[recordKey(r)].points).toBe(150);
  });
  it("lehnt verspätete Rekordantwort ab", () => {
    const s = emptyState(questions.slice(0, 1));
    const r = startRound(
      s,
      { mode: "rekord", topic: "Alle Themen", difficulty: "Alle Stufen" },
      now,
    );
    const q = r.questions[0];
    answer(s, r.id, q.id, q.correctId, 31000, now + 31000);
    expect(s.events[0].answerId).toBeNull();
    expect(s.events[0].correct).toBe(false);
  });
  it("serialisiert konkurrierende Transaktionen ohne verlorene oder doppelte Ereignisse", async () => {
    const state = await update((s) => {
      startRound(
        s,
        { mode: "entdecken", topic: "Alle Themen", difficulty: "Alle Stufen" },
        now,
      );
    });
    const r = state.rounds[0],
      q = r.questions[0];
    await Promise.all([
      update((s) => answer(s, r.id, q.id, q.correctId, 0, now)),
      update((s) => answer(s, r.id, q.id, q.correctId, 0, now)),
    ]);
    expect((await read())?.events).toHaveLength(1);
  });
  it("rollt fehlgeschlagene Schreibvorgänge zurück", async () => {
    await expect(
      update((s) => {
        s.experience = 999;
        throw new Error("Testabbruch");
      }),
    ).rejects.toThrow("Testabbruch");
    expect((await read())?.experience).toBe(0);
  });
  it("Export und Import validieren Querverweise und berechnen Ableitungen neu", async () => {
    const s = emptyState(questions.slice(0, 1));
    const r = startRound(
      s,
      { mode: "entdecken", topic: "Alle Themen", difficulty: "Alle Stufen" },
      now,
    );
    answer(s, r.id, r.questions[0].id, r.questions[0].correctId, 0, now);
    complete(s, r.id, now + 1);
    s.experience = 10000;
    const checked = validateBackup(JSON.parse(JSON.stringify(s)));
    expect(checked.experience).toBe(5);
    await restore(checked);
    expect((await read())?.events).toHaveLength(1);
    const invalid = structuredClone(s);
    invalid.events.push({ ...invalid.events[0] });
    expect(() => validateBackup(invalid)).toThrow("Doppelte");
    const invalid2 = structuredClone(s);
    invalid2.rounds[0].order[0] = ["x", "x", "x", "x"];
    expect(() => validateBackup(invalid2)).toThrow("Antwortreihenfolge");
  });
  it("aktiver Rekord kann per Import nicht verlängert werden", async () => {
    const s = emptyState(questions.slice(0, 1));
    startRound(
      s,
      { mode: "rekord", topic: "Alle Themen", difficulty: "Alle Stufen" },
      now,
    );
    const loaded = await restore(s);
    expect(loaded.rounds[0].status).toBe("aborted");
  });
});
