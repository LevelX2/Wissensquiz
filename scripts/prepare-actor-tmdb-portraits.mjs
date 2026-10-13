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
const localPortraits = JSON.parse(
  await readFile("src/actorPortraits.json", "utf8"),
);
const selectedPortraits = JSON.parse(
  await readFile("src/actorFamiliarityTmdbPortraits.json", "utf8"),
);
const people = Object.entries(
  JSON.parse(await readFile("src/actorTmdbLinks.json", "utf8")),
)
  .filter(([personId]) => !localPortraits[personId])
  .map(([personId, person]) => ({ personId, ...person }));
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
      const selected = selectedPortraits[person.personId];
      if (
        selected &&
        (selected.tmdbId !== person.tmdbId || selected.name !== person.name)
      )
        throw new Error(
          `Ausgewähltes TMDB-Porträt passt nicht: ${person.name}`,
        );
      const profilePath = selected?.profilePath ?? data.profile_path;
      const src = `https://image.tmdb.org/t/p/w185${profilePath}`;
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
        profilePath,
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
