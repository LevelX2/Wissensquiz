// Inspect the real operator catalog, including actor and award references.
import { createServer } from "vite";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const output = resolve(process.argv[2] ?? "tmp-film-series-audit");
const server = await createServer({
  optimizeDeps: { noDiscovery: true },
  server: { middlewareMode: true, hmr: false, ws: false, watch: null },
});
try {
  const { packages, addPackages } =
    await server.ssrLoadModule("/src/packages.ts");
  const { emptyState } = await server.ssrLoadModule("/src/model.ts");
  const { preparePresentation } = await server.ssrLoadModule(
    "/src/questionPresentation.ts",
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
  const films = new Map();
  let appearances = 0;
  for (const q of state.questions) {
    for (const { reference, data } of preparePresentation(q).films) {
      appearances++;
      const key = `${data.originalTitle}|${data.year}`;
      if (!films.has(key))
        films.set(key, { key, variants: [], franchiseHints: [] });
      const row = films.get(key);
      if (
        !reference &&
        q.metadata.franchise &&
        !row.franchiseHints.includes(q.metadata.franchise)
      )
        row.franchiseHints.push(q.metadata.franchise);
      let variant = row.variants.find(
        (v) => JSON.stringify(v.series) === JSON.stringify(data.series ?? null),
      );
      if (!variant) {
        variant = {
          series: data.series ?? null,
          directors: data.directors,
          sources: data.sources,
          questionIds: [],
        };
        row.variants.push(variant);
      }
      variant.questionIds.push(q.id);
    }
  }
  const rows = [...films.values()].sort((a, b) =>
    a.key.localeCompare(b.key, "en"),
  );
  const summary = {
    packages: packages.length,
    questions: state.questions.length,
    films: rows.length,
    appearances,
    withSeries: rows.filter((f) => f.variants.some((v) => v.series)).length,
    missingPosition: rows.filter((f) =>
      f.variants.some((v) => v.series && v.series.position == null),
    ).length,
    withoutSeries: rows.filter((f) => f.variants.every((v) => !v.series))
      .length,
    inconsistent: rows.filter((f) => f.variants.length > 1).length,
  };
  await mkdir(output, { recursive: true });
  await writeFile(
    `${output}/catalog.json`,
    JSON.stringify({ summary, films: rows }, null, 2) + "\n",
  );
  await writeFile(
    `${output}/films.tsv`,
    rows
      .map((f) =>
        [f.key, ...f.variants.map((v) => JSON.stringify(v.series))].join("\t"),
      )
      .join("\n") + "\n",
  );
  console.log(JSON.stringify(summary));
} finally {
  await server.close();
}
