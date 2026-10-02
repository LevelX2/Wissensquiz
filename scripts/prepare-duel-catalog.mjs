import { createServer } from "vite";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

// Public package files only. Never read a personal browser or account snapshot.
const server = await createServer({ server: { middlewareMode: true } });
try {
  const { addPackages, packages } =
    await server.ssrLoadModule("/src/packages.ts");
  const { emptyState, questionSchema } =
    await server.ssrLoadModule("/src/model.ts");
  const { genreOf } = await server.ssrLoadModule("/src/filters.ts");
  const { familiarityOf } = await server.ssrLoadModule("/src/familiarity.ts");
  const state = emptyState();
  const input = await Promise.all(
    packages.map(async (pkg) => ({
      filename: pkg.filename,
      text: await readFile(join("public", pkg.path.slice(1)), "utf8"),
    })),
  );
  addPackages(state, input);
  const questions = state.questions
    .filter(
      (q) => !q.demo && ["leicht", "mittel", "schwer"].includes(q.difficulty),
    )
    .map((q) => questionSchema.parse(q));
  const quote = (value) => `'${String(value).replaceAll("'", "''")}'`;
  const lines = [
    "-- Generated exclusively from public quiz packages. Run as database owner after migration 005.",
    "begin;",
    "set standard_conforming_strings=on;",
    "update public.quiz_duel_catalog set enabled=false;",
  ];
  for (let i = 0; i < questions.length; i += 100) {
    const rows = questions
      .slice(i, i + 100)
      .map(
        (q) =>
          `(${quote(q.id)},${quote(q.knowledgeId)},${quote(q.difficulty)},${quote(genreOf(q))},${familiarityOf(q) ?? 0},${quote(JSON.stringify(q))}::jsonb,true)`,
      );
    lines.push(
      `insert into public.quiz_duel_catalog(id,knowledge_id,difficulty,genre,familiarity,question,enabled) values\n${rows.join(",\n")}\non conflict(id) do update set knowledge_id=excluded.knowledge_id,difficulty=excluded.difficulty,genre=excluded.genre,familiarity=excluded.familiarity,question=excluded.question,enabled=true;`,
    );
  }
  lines.push("commit;");
  await mkdir("tmp-duels", { recursive: true });
  await writeFile("tmp-duels/catalog.sql", lines.join("\n"), "utf8");
  const csvCell = (value) => `"${String(value).replaceAll('"', '""')}"`;
  const csv = ["id,knowledge_id,difficulty,genre,familiarity,question,enabled"];
  for (const q of questions)
    csv.push(
      [
        q.id,
        q.knowledgeId,
        q.difficulty,
        genreOf(q),
        familiarityOf(q) ?? 0,
        JSON.stringify(q),
        true,
      ]
        .map(csvCell)
        .join(","),
    );
  await writeFile("tmp-duels/catalog.csv", csv.join("\n"), "utf8");
  console.log(
    `Duellkatalog vorbereitet: ${questions.length} öffentliche Fragen, ${new Set(questions.map((q) => q.knowledgeId)).size} Wissensziele. tmp-duels/catalog.sql und catalog.csv`,
  );
} finally {
  await server.close();
}
