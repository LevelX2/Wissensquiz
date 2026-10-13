// Local editorial research. Credentials and unselected provider responses stay private.
import fs from "node:fs";
const root = "docs/Schauspieler-Bekanntheit-2026-10-13";
const local = "data/schauspieler-ausbau-weiter-2026-10-13";
fs.mkdirSync(local, { recursive: true });
const read = (path) => JSON.parse(fs.readFileSync(path, "utf8"));
const write = (path, value) =>
  fs.writeFileSync(path, JSON.stringify(value, null, 2) + "\n");
const selection = read(root + "/Ausbauauswahl.json");
let entry = 9;
const people = Object.entries(selection.groups).flatMap(([level, names]) =>
  names.map((name) => ({
    entry: entry++,
    name,
    level: Number(level),
    personId: `ACTOR-BG-20261013-${String(entry - 1).padStart(3, "0")}`,
  })),
);
const first = Number(process.argv[2] ?? 9),
  last = Number(process.argv[3] ?? 32);
const selected = people.filter((p) => p.entry >= first && p.entry <= last);
const env = Object.fromEntries(
  fs
    .readFileSync(".env.tmdb.local", "utf8")
    .split(/\r?\n/)
    .filter((line) => /^[A-Z_]+=/.test(line))
    .map((line) => [
      line.slice(0, line.indexOf("=")),
      line.slice(line.indexOf("=") + 1),
    ]),
);
if (!env.TMDB_API_KEY) throw Error("Lokaler TMDB-Zugang fehlt.");
const queue = [...selected];
await Promise.all(
  Array.from({ length: 1 }, async () => {
    while (queue.length) {
      const person = queue.shift(),
        num = String(person.entry).padStart(3, "0");
      if (!fs.existsSync(`${local}/commons-${num}.json`)) {
        const params = new URLSearchParams({
          action: "query",
          format: "json",
          generator: "search",
          gsrsearch: `intitle:"${person.name}" filetype:bitmap`,
          gsrnamespace: "6",
          gsrlimit: "30",
          prop: "imageinfo",
          iiprop: "url|size|extmetadata",
        });
        let response;
        for (let attempt = 0; attempt < 4; attempt++) {
          response = await fetch(
            "https://commons.wikimedia.org/w/api.php?" + params,
            {
              headers: { "User-Agent": "WissensquizEditorial/1.0" },
              signal: AbortSignal.timeout(30000),
            },
          );
          if (response.status !== 429) break;
          const delay = Math.max(
            15,
            Math.min(45, Number(response.headers.get("retry-after")) || 30),
          );
          console.log(
            `Commons begrenzt Abrufe; ${delay} Sekunden Abstand für ${person.name}.`,
          );
          await new Promise((resolve) => setTimeout(resolve, delay * 1000));
        }
        if (!response.ok)
          throw Error(`Commons HTTP ${response.status} für ${person.name}`);
        fs.writeFileSync(`${local}/commons-${num}.json`, await response.text());
      }
      if (!fs.existsSync(`${local}/tmdb-${num}.json`)) {
        let response;
        try {
          response = await fetch(
            "https://api.themoviedb.org/3/search/person?" +
              new URLSearchParams({
                api_key: env.TMDB_API_KEY,
                query: person.name,
              }),
            { signal: AbortSignal.timeout(30000) },
          );
        } catch {
          throw Error(`TMDB-Netzwerkfehler für ${person.name}`);
        }
        if (!response.ok)
          throw Error(`TMDB HTTP ${response.status} für ${person.name}`);
        const result = await response.json();
        write(`${local}/tmdb-${num}.json`, {
          person,
          matches: result.results.map((p) => ({
            id: p.id,
            name: p.name,
            original_name: p.original_name,
            department: p.known_for_department,
            known_for: p.known_for.map(
              (f) => f.original_title ?? f.original_name,
            ),
          })),
        });
      }
      console.log(`${num} ${person.name}: Recherche vorhanden`);
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }),
);
