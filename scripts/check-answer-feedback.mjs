import { createServer } from "vite";
import { readFile, writeFile } from "node:fs/promises";
import { strict as assert } from "node:assert";

// Public catalog only. This checks display formulas, not the truth of film facts.
const server = await createServer({
  server: { middlewareMode: true, hmr: false, ws: false },
});
try {
  const { packages, addPackages } =
    await server.ssrLoadModule("/src/packages.ts");
  const { emptyState } = await server.ssrLoadModule("/src/model.ts");
  const { additionalAnswerFeedback } = await server.ssrLoadModule(
    "/src/answerFeedback.ts",
  );
  const state = emptyState();
  addPackages(
    state,
    await Promise.all(
      packages.map(async (pkg) => ({
        filename: pkg.filename,
        text: await readFile(`public${pkg.path}`, "utf8"),
      })),
    ),
  );
  const counts = {
    questions: state.questions.length,
    wrongAnswers: 0,
    emptySource: 0,
    hidden: 0,
    shortened: 0,
    unchanged: 0,
  };
  for (const q of state.questions) {
    for (const answer of q.answers.filter((a) => a.id !== q.correctId)) {
      const shown = additionalAnswerFeedback(q, answer.feedback);
      counts.wrongAnswers++;
      if (!answer.feedback.trim()) counts.emptySource++;
      if (!shown) counts.hidden++;
      else if (shown !== answer.feedback.trim()) counts.shortened++;
      else counts.unchanged++;
      assert(
        !/^„[^“]*“ (?:trifft hier nicht zu|ist hier nicht richtig)\.$/u.test(
          shown,
        ),
        q.id,
      );
    }
  }
  const tron = state.questions.find((q) => q.id === "SF-202609-P02-S-064");
  assert(tron);
  for (const answer of tron.answers.filter((a) => a.id !== tron.correctId))
    assert.equal(additionalAnswerFeedback(tron, answer.feedback), "");
  const report = {
    date: "2026-10-10",
    scope:
      "Vollständiger öffentlicher App-Katalog einschließlich generierter Filmfragen; ausschließlich Prüfung bekannter leerer Anzeigeformeln und wortgleicher Lösungswiederholungen.",
    counts,
    tron: { questionId: tron.id, hiddenWrongAnswerHints: 3 },
    limits: [
      "Keine vollständige fachliche Quellenprüfung der verbleibenden Antworttexte.",
      "Inhaltliche Paraphrasen und andere individuell formulierte Verneinungen werden nicht automatisch als leer eingestuft; sie benötigen Redaktion nach docs/Fragenredaktion.md.",
      "Fragepakete, Rohquellen, Antwortoptionen und Lernidentitäten werden nicht verändert.",
    ],
  };
  await writeFile(
    "docs/Antwortfeedback-Pruefung-2026-10-10.json",
    JSON.stringify(report, null, 2) + "\n",
  );
  console.log(JSON.stringify(report, null, 2));
} finally {
  await server.close();
}
