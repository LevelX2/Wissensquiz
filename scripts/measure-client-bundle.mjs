import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";
function measure(root) {
  const manifest = JSON.parse(
    readFileSync(join(root, ".vite/manifest.json"), "utf8"),
  );
  const entry = Object.entries(manifest).find(([, item]) => item.isEntry);
  if (!entry) throw new Error("Missing Vite entry");
  const collect = (roots) => {
    const found = new Set();
    const visit = (key) => {
      if (found.has(key)) return;
      const item = manifest[key];
      if (!item) throw new Error(`Missing manifest dependency ${key}`);
      found.add(key);
      for (const dependency of item.imports ?? []) visit(dependency);
    };
    for (const root of roots) visit(root);
    return found;
  };
  const bytes = (file) => {
    const body = readFileSync(join(root, file));
    return { file, rawBytes: body.length, gzipBytes: gzipSync(body).length };
  };
  const initialFiles = [...collect([entry[0]])].map((key) =>
    bytes(manifest[key].file),
  );
  const allJs = readdirSync(join(root, "assets"))
    .filter((file) => file.endsWith(".js"))
    .map((file) => bytes("assets/" + file));
  const total = (items) =>
    items.reduce(
      (sum, item) => ({
        rawBytes: sum.rawBytes + item.rawBytes,
        gzipBytes: sum.gzipBytes + item.gzipBytes,
      }),
      { rawBytes: 0, gzipBytes: 0 },
    );
  const routes = {};
  for (const name of ["AccountGame", "TrialEntry"]) {
    const target = Object.entries(manifest).find(
      ([, item]) => item.name === name,
    );
    if (target)
      routes[name] = total(
        [...collect([entry[0], target[0]])].map((key) =>
          bytes(manifest[key].file),
        ),
      );
  }
  return {
    entry: bytes(entry[1].file),
    initialStatic: { ...total(initialFiles), files: initialFiles },
    routeStaticDependencies: routes,
    allJavaScript: total(allJs),
  };
}
const [before, after, output] = process.argv.slice(2);
if (!before || !after || !output)
  throw new Error(
    "Usage: node scripts/measure-client-bundle.mjs <baseline-build> <current-build> <output.json>",
  );
const report = {
  scope:
    "Vite build files; gzip per file; static import graph excludes lazy imports, CSS, images and API traffic. No measured browser startup time or total route transfer.",
  before: measure(before),
  after: measure(after),
};
report.initialStaticGzipReductionPercent =
  Math.round(
    (1 -
      report.after.initialStatic.gzipBytes /
        report.before.initialStatic.gzipBytes) *
      10000,
  ) / 100;
writeFileSync(output, JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify(report));
