import { createServer } from "vite";
import { readFile, writeFile, mkdir, stat } from "node:fs/promises";

// Operator-only: credentials never enter Vite's browser code or public files.
const env = Object.fromEntries(
  (await readFile(".env.tmdb.local", "utf8"))
    .split(/\r?\n/)
    .filter((line) => /^[A-Z_]+=/.test(line))
    .map((line) => [
      line.slice(0, line.indexOf("=")),
      line.slice(line.indexOf("=") + 1),
    ]),
);
if (!env.TMDB_API_KEY) throw new Error("Lokaler TMDB-Zugang fehlt.");
async function api(path, params = {}) {
  const url = new URL(`https://api.themoviedb.org/3/${path}`);
  url.search = new URLSearchParams({
    api_key: env.TMDB_API_KEY,
    language: "de-DE",
    ...params,
  });
  let response;
  try {
    response = await fetch(url, { signal: AbortSignal.timeout(30000) });
  } catch {
    throw new Error(`TMDB-Netzwerkfehler bei ${path}`);
  }
  if (!response.ok) throw new Error(`TMDB HTTP ${response.status} bei ${path}`);
  return response.json();
}
const config = await api("configuration");
if (
  config.images.secure_base_url !== "https://image.tmdb.org/t/p/" ||
  !config.images.poster_sizes.includes("w342")
)
  throw new Error("TMDB-Bildkonfiguration prüfen.");
console.log("TMDB-Zugang und Bildkonfiguration erfolgreich geprüft.");

const server = await createServer({
  server: { middlewareMode: true, hmr: false, ws: false },
});
let questions, filmData;
try {
  const { verifyRelease } = await server.ssrLoadModule("/src/syncCodec.ts");
  questions = (
    await verifyRelease(
      JSON.parse(await readFile("tmp-sync/catalog/release.json", "utf8")),
    )
  ).questions;
  ({ filmData } = await server.ssrLoadModule("/src/filmFacts.ts"));
} finally {
  await server.close();
}
const films = new Map();
for (const q of questions) {
  if (q.domain !== "Film" || q.metadata.subdomain !== "Science-Fiction")
    continue;
  const key = `${q.metadata.film_title_original}|${q.metadata.film_year}`;
  const film = films.get(key) ?? {
    key,
    title: q.metadata.film_title_de,
    originalTitle: q.metadata.film_title_original,
    year: Number(q.metadata.film_year),
    directors: filmData(q)?.directors,
    questionIds: [],
  };
  film.questionIds.push(q.id);
  films.set(key, film);
}
const normalize = (value) =>
  value
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]/gu, "");
// Reviewed name spellings used by the existing film catalog.
const directorNames = {
  大友克洋: "Katsuhiro Otomo",
  山口淳太: "Junta Yamaguchi",
  "Andrei Tarkowski": "Andrei Tarkovsky",
};
await mkdir("tmp-film-posters", { recursive: true });
const resume = process.argv.includes("--resume");
const entries = [...films.values()].sort((a, b) => a.key.localeCompare(b.key));
const resolved = {},
  unresolved = [];
let index = 0;
async function worker() {
  while (index < entries.length) {
    const film = entries[index++];
    const cache = `tmp-film-posters/${Buffer.from(film.key).toString("base64url")}.json`;
    let research;
    try {
      if (!resume) {
        const error = new Error();
        error.code = "ENOENT";
        throw error;
      }
      if (Date.now() - (await stat(cache)).mtimeMs > 24 * 60 * 60 * 1000)
        throw new Error(
          "Fortsetzung nur mit heutigen Recherchedateien; sonst frisch abrufen.",
        );
      research = JSON.parse(await readFile(cache, "utf8"));
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
      const candidates = (
        await api("search/movie", {
          query: film.originalTitle,
          year: String(film.year),
          include_adult: "false",
        })
      ).results;
      research = { film, fetchedAt: new Date().toISOString(), candidates };
      await writeFile(cache, JSON.stringify(research, null, 2) + "\n");
    }
    const exact = research.candidates.filter(
      (movie) =>
        Number(movie.release_date?.slice(0, 4)) === film.year &&
        [film.originalTitle, film.title].some((title) =>
          [movie.original_title, movie.title].some(
            (candidate) => normalize(candidate) === normalize(title),
          ),
        ),
    );
    let id = exact.length === 1 ? exact[0].id : undefined;
    const directorMatches = (movie) =>
      film.directors &&
      movie.credits.crew.some(
        (person) =>
          person.job === "Director" &&
          normalize(film.directors).includes(
            normalize(directorNames[person.name] ?? person.name),
          ),
      );
    if (!id) {
      const matches = [];
      for (const candidate of research.candidates) {
        if (
          research.candidates.length !== 1 &&
          ![film.originalTitle, film.title].some((title) =>
            [candidate.original_title, candidate.title].some(
              (name) => normalize(name) === normalize(title),
            ),
          )
        )
          continue;
        const detail = await api(`movie/${candidate.id}`, {
          append_to_response: "credits,release_dates",
        });
        const releasedInYear = detail.release_dates.results.some((region) =>
          region.release_dates.some(
            (date) => Number(date.release_date.slice(0, 4)) === film.year,
          ),
        );
        if (directorMatches(detail) && releasedInYear) matches.push(detail);
      }
      if (matches.length !== 1) {
        unresolved.push(research);
        continue;
      }
      research.details = matches[0];
      id = research.details.id;
      await writeFile(cache, JSON.stringify(research, null, 2) + "\n");
    }
    if (research.details?.id !== id) {
      research.details = await api(`movie/${id}`, {
        append_to_response: "credits",
      });
      await writeFile(cache, JSON.stringify(research, null, 2) + "\n");
    }
    const movie = research.details;
    if (
      !directorMatches(movie) ||
      !movie.poster_path ||
      !/^\/[a-zA-Z0-9]+\.(jpg|png)$/.test(movie.poster_path)
    ) {
      unresolved.push({ ...research, expectedDirectors: film.directors });
      continue;
    }
    resolved[film.key] = {
      title: film.title,
      originalTitle: film.originalTitle,
      year: film.year,
      tmdbId: movie.id,
      tmdbTitle: movie.title,
      tmdbOriginalTitle: movie.original_title,
      releaseDate: movie.release_date,
      directors: movie.credits.crew
        .filter((person) => person.job === "Director")
        .map((person) => person.name),
      posterPath: movie.poster_path,
    };
  }
}
await Promise.all([worker(), worker()]);
await writeFile(
  "tmp-film-posters/unresolved.json",
  JSON.stringify(unresolved, null, 2) + "\n",
);
await writeFile(
  "tmp-film-posters/inventory.json",
  JSON.stringify(entries, null, 2) + "\n",
);
console.log(
  JSON.stringify({
    films: entries.length,
    questions: entries.reduce((sum, film) => sum + film.questionIds.length, 0),
    resolved: Object.keys(resolved).length,
    unresolved: unresolved.map(({ film }) => film.key),
  }),
);
if (unresolved.length) process.exitCode = 1;
else {
  const checked = new Date(),
    expires = new Date(checked);
  expires.setUTCMonth(expires.getUTCMonth() + 5);
  const manifest = {
    checkedAt: checked.toISOString().slice(0, 10),
    expiresAt: expires.toISOString().slice(0, 10),
    films: Object.fromEntries(
      Object.entries(resolved).sort(([a], [b]) => a.localeCompare(b)),
    ),
  };
  await writeFile(
    "public/film-posters.json",
    JSON.stringify(manifest, null, 2) + "\n",
  );
}
