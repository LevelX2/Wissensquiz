import { execFileSync } from "node:child_process";
import { mkdirSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";

// Maintained runtime assets. Originals stay untouched; production builds only
// need the committed WebP files, not a local ImageMagick installation.
const output = "src/assets/artwork";
mkdirSync(output, { recursive: true });
const sources = [
  ...readdirSync("public/genres")
    .filter((name) => name.endsWith(".png"))
    .map((name) => ({
      path: join("public/genres", name),
      name: "genre-" + basename(name, ".png"),
      widths: [160, 320, 480],
    })),
  ...["entdecken", "ueben", "rekord"].map((name) => ({
    path: `public/modes/${name}.png`,
    name: "mode-" + name,
    widths: [160, 320, 480],
  })),
  {
    path: "public/cinema/lobby.png",
    name: "cinema-lobby",
    widths: [640, 1280],
  },
  {
    path: "public/cinema/filmfieber-wide.png",
    name: "filmfieber-wide",
    widths: [1280, 1600],
  },
  {
    path: "public/cinema/filmfieber-portrait.png",
    name: "filmfieber-portrait",
    widths: [640, 960],
  },
];
const results = [];
for (const source of sources) {
  const variants = [];
  for (const width of source.widths) {
    const target = `${output}/${source.name}-${width}.webp`;
    execFileSync(
      "magick",
      [
        source.path,
        "-strip",
        "-resize",
        `${width}x>`,
        "-quality",
        "84",
        "-define",
        "webp:method=6",
        target,
      ],
      { timeout: 60000 },
    );
    variants.push({ path: target, width, bytes: statSync(target).size });
  }
  results.push({
    source: source.path.replaceAll("\\", "/"),
    sourceBytes: statSync(source.path).size,
    variants,
  });
}
if (process.argv[2]) {
  writeFileSync(
    process.argv[2],
    JSON.stringify({ format: "webp", quality: 84, results }, null, 2) + "\n",
  );
}
console.log(
  JSON.stringify({
    sources: results.length,
    originalBytes: results.reduce((n, entry) => n + entry.sourceBytes, 0),
    variantBytes: results
      .flatMap((entry) => entry.variants)
      .reduce((n, entry) => n + entry.bytes, 0),
  }),
);
