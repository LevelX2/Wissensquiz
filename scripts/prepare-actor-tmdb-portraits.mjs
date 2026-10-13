import { readFile, mkdir, writeFile } from "node:fs/promises";

// Operator-only: keep the credential and full provider responses out of builds.
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
async function api(path) {
  const url = new URL(`https://api.themoviedb.org/3/${path}`);
  url.search = new URLSearchParams({ api_key: env.TMDB_API_KEY });
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
  !config.images.profile_sizes.includes("w185")
)
  throw new Error("TMDB-Porträtkonfiguration prüfen.");
const people = Object.values(
  JSON.parse(await readFile("src/actorTmdbLinks.json", "utf8")),
);
const checked = new Date();
const expires = new Date(checked);
expires.setUTCMonth(expires.getUTCMonth() + 5);
const prepared = [];
let next = 0;
await Promise.all(
  Array.from({ length: 4 }, async () => {
    while (next < people.length) {
      const person = people[next++];
      const data = await api(`person/${person.tmdbId}`);
      if (
        data.id !== person.tmdbId ||
        !/^\/[a-zA-Z0-9]+\.(jpg|png)$/.test(data.profile_path ?? "")
      )
        throw new Error(`TMDB-Porträt fehlt: ${person.name}`);
      const src = `https://image.tmdb.org/t/p/w185${data.profile_path}`;
      let image;
      try {
        image = await fetch(src, {
          method: "HEAD",
          signal: AbortSignal.timeout(30000),
        });
      } catch {
        throw new Error(`TMDB-Porträt nicht erreichbar: ${person.name}`);
      }
      if (!image.ok)
        throw new Error(`TMDB-Porträt HTTP ${image.status}: ${person.name}`);
      prepared.push({
        tmdbId: person.tmdbId,
        name: person.name,
        profilePath: data.profile_path,
        checkedAt: checked.toISOString(),
        expiresAt: expires.toISOString(),
      });
    }
  }),
);
// Publish the local asset set only after every identity has a reachable portrait.
await mkdir("public/actor-tmdb-portraits", { recursive: true });
for (const portrait of prepared)
  await writeFile(
    `public/actor-tmdb-portraits/${portrait.tmdbId}.json`,
    JSON.stringify(portrait) + "\n",
  );
console.log(
  JSON.stringify({
    portraits: prepared.length,
    checkedAt: checked.toISOString(),
    expiresAt: expires.toISOString(),
  }),
);
