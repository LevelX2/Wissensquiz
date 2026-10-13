// Materialize reviewed editorial image choices; does not install application assets.
import fs from "node:fs";
import { createHash } from "node:crypto";
const root = "docs/Schauspieler-Bekanntheit-2026-10-13",
  local = "data/schauspieler-ausbau-weiter-2026-10-13";
const read = (path) => JSON.parse(fs.readFileSync(path, "utf8"));
const write = (path, value) => {
  const content = JSON.stringify(value, null, 2) + "\n";
  for (let attempt = 0; ; attempt++) {
    try {
      fs.writeFileSync(path, content);
      return;
    } catch (error) {
      // These shared manifests can briefly fail with UNKNOWN on Windows.
      if (error.code !== "UNKNOWN" || attempt >= 4) throw error;
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 250);
    }
  }
};
const block = Number(process.argv[2] ?? 2),
  num = String(block).padStart(3, "0");
const choices = read(`${root}/Bildauswahl/${num}.json`);
const planned = read(`${root}/Fortschritt.json`).blocks.find(
  (b) => b.block === block,
).persons;
const rawRoot =
  "KI-Wissen-Wissensquiz/01 Rohquellen/Schauspieler-Ausbau-2026-10-13-Bilder";
const revision = process.argv[3] ?? "";
if (revision && !/^r\d+$/.test(revision))
  throw Error("Ungültige Recherchefassung");
const rawFile = `${rawRoot}/B${num}${revision ? "-" + revision : ""}.json`;
if (!fs.existsSync(rawFile)) {
  const titles = choices
    .filter((c) => c.provider === "Wikimedia Commons")
    .map((c) => c.fileTitle)
    .join("|");
  const params = new URLSearchParams({
    action: "query",
    format: "json",
    titles,
    prop: "imageinfo",
    iiprop: "url|size|extmetadata",
    iiurlwidth: "500",
  });
  let response;
  for (let i = 0; i < 4; i++) {
    response = await fetch(
      "https://commons.wikimedia.org/w/api.php?" + params,
      {
        headers: { "User-Agent": "WissensquizEditorial/1.0" },
        signal: AbortSignal.timeout(45000),
      },
    );
    if (response.status !== 429) break;
    console.log("Commons wartet auf erneuten zulässigen Abruf.");
    await new Promise((resolve) => setTimeout(resolve, 30000));
  }
  if (!response.ok) throw Error(`Commons HTTP ${response.status}`);
  fs.writeFileSync(rawFile, await response.text());
}
const pages = Object.values(read(rawFile).query.pages);
const portraits = read(`${root}/Portraets.json`),
  identities = read(`${root}/TMDB-Personen.json`);
const plain = (html) =>
  String(html ?? "")
    .replace(/<span[^>]*display:\s*none[^>]*>.*?<\/span>/gs, "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
function dimensions(bytes) {
  if (
    bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  )
    return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
  if (bytes[0] !== 255 || bytes[1] !== 216) throw Error("Kein JPEG/PNG");
  let offset = 2;
  while (offset < bytes.length) {
    while (bytes[offset] === 255) offset++;
    const marker = bytes[offset++];
    if (marker === 217 || marker === 218) break;
    if (marker === 1 || (marker >= 208 && marker <= 215)) continue;
    const length = bytes.readUInt16BE(offset);
    if (
      [
        192, 193, 194, 195, 197, 198, 199, 201, 202, 203, 205, 206, 207,
      ].includes(marker)
    )
      return {
        height: bytes.readUInt16BE(offset + 3),
        width: bytes.readUInt16BE(offset + 5),
      };
    offset += length;
  }
  throw Error("Bildgröße fehlt");
}
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
for (const choice of choices) {
  const person = planned.find((p) => p.entry === choice.entry);
  if (!person) throw Error("Person nicht geplant");
  const n = String(person.entry).padStart(3, "0");
  const candidate = read(`${local}/tmdb-${n}.json`).matches.find(
    (p) => p.id === choice.tmdbId,
  );
  if (!candidate || !["Acting", "Directing"].includes(candidate.department))
    throw Error(`TMDB-Identität ${person.name}`);
  const identity = {
    personId: person.personId,
    name: person.name,
    tmdbId: choice.tmdbId,
    tmdbUrl: `https://www.themoviedb.org/person/${choice.tmdbId}`,
    identityEvidence: candidate,
  };
  let portrait;
  if (choice.provider === "Wikimedia Commons") {
    const page = pages.find((p) => p.title === choice.fileTitle),
      info = page?.imageinfo?.[0];
    if (!info) throw Error(`Commons-Datei fehlt ${choice.fileTitle}`);
    const meta = info.extmetadata;
    const url = info.thumburl ?? info.url;
    const extension = /\.png(?:\?|$)/i.test(url) ? "png" : "jpg",
      asset = `Portraets/${n}.${extension}`;
    let bytes;
    if (
      fs.existsSync(`${root}/${asset}`) &&
      portraits.find((p) => p.personId === person.personId)?.downloadedUrl ===
        url.split("?")[0]
    )
      bytes = fs.readFileSync(`${root}/${asset}`);
    else {
      let response;
      for (let i = 0; i < 4; i++) {
        response = await fetch(url, {
          headers: { "User-Agent": "WissensquizEditorial/1.0" },
          signal: AbortSignal.timeout(45000),
        });
        if (response.status !== 429) break;
        console.log(`Bildabruf wartet: ${person.name}`);
        await new Promise((resolve) => setTimeout(resolve, 30000));
      }
      if (!response.ok)
        throw Error(`Bild HTTP ${response.status}: ${person.name}`);
      bytes = Buffer.from(await response.arrayBuffer());
      dimensions(bytes);
      fs.writeFileSync(`${root}/${asset}`, bytes);
    }
    const licenseName = meta.LicenseShortName.value;
    if (
      !/^(Public domain|CC0|CC BY(?:-SA)? (?:[234]\.0|2\.5)(?: de| nl| br)?)$/.test(
        licenseName,
      )
    )
      throw Error(`Bildlizenz prüfen ${licenseName}`);
    portrait = {
      personId: person.personId,
      name: person.name,
      provider: choice.provider,
      asset,
      sourceUrl: info.descriptionurl,
      originalUrl: info.url.split("?")[0],
      downloadedUrl: url.split("?")[0],
      imageDate: choice.imageDate,
      periodReason: choice.periodReason,
      creator: choice.creator ?? plain(meta.Artist?.value),
      license: licenseName + " laut Wikimedia Commons",
      licenseName,
      licenseUrl: meta.LicenseUrl?.value ?? info.descriptionurl,
      licenseBasis: choice.licenseBasis ?? plain(meta.Categories?.value),
      changes:
        "Von Commons bereitgestellte Fassung/Vorschau unverändert übernommen; kein eigener Zuschnitt.",
      ...dimensions(bytes),
      alt: `${person.name} (${choice.imageDate})`,
      rawMetadata: "../../" + rawFile,
      rawPageId: page.pageid,
      sha256: createHash("sha256").update(bytes).digest("hex"),
      checkedOn: "2026-10-13",
      visualChecked: choice.visualChecked === true,
      ...identity,
    };
  } else if (choice.provider === "TMDB") {
    const detailPath = `${rawRoot}/TMDB-${n}.json`;
    if (!fs.existsSync(detailPath)) {
      let response;
      try {
        response = await fetch(
          `https://api.themoviedb.org/3/person/${choice.tmdbId}?` +
            new URLSearchParams({ api_key: env.TMDB_API_KEY }),
          { signal: AbortSignal.timeout(30000) },
        );
      } catch {
        throw Error(`TMDB-Netzwerkfehler ${person.name}`);
      }
      if (!response.ok) throw Error(`TMDB HTTP ${response.status}`);
      fs.writeFileSync(detailPath, await response.text());
    }
    const detail = read(detailPath);
    if (
      detail.id !== choice.tmdbId ||
      !/^\/[a-zA-Z0-9]+\.(jpg|png)$/.test(detail.profile_path ?? "")
    )
      throw Error(`TMDB-Porträt ${person.name}`);
    const remoteSrc = `https://image.tmdb.org/t/p/w185${detail.profile_path}`;
    const previewPath = `${local}/tmdb-portrait-${n}.jpg`;
    if (!fs.existsSync(previewPath)) {
      const response = await fetch(remoteSrc, {
        signal: AbortSignal.timeout(30000),
      });
      if (!response.ok) throw Error(`TMDB-Bild HTTP ${response.status}`);
      fs.writeFileSync(previewPath, Buffer.from(await response.arrayBuffer()));
    }
    const bytes = fs.readFileSync(previewPath);
    portrait = {
      personId: person.personId,
      name: person.name,
      provider: "TMDB",
      remoteSrc,
      sourceUrl: identity.tmdbUrl,
      imageDate: choice.imageDate,
      periodReason: choice.periodReason,
      creator: "Auf TMDB nicht ausgewiesen",
      license: "TMDB-Onlineporträt; keine freie Lizenz behauptet",
      licenseBasis:
        "Bestehende TMDB-Porträtanbindung; Bild nur online referenziert, keine Bildkopie in Git",
      changes: "Unveränderte TMDB-Vorschau",
      ...dimensions(bytes),
      alt: `${person.name}; Aufnahmejahr nicht belegt`,
      rawMetadata: "../../" + detailPath,
      checkedOn: "2026-10-13",
      visualChecked: choice.visualChecked === true,
      ...identity,
    };
  } else throw Error("Bildanbieter fehlt");
  const oldPortrait = portraits.findIndex(
    (p) => p.personId === person.personId,
  );
  if (oldPortrait < 0) portraits.push(portrait);
  else portraits[oldPortrait] = portrait;
  const oldIdentity = identities.persons.findIndex(
    (p) => p.personId === person.personId,
  );
  if (oldIdentity < 0) identities.persons.push(identity);
  else identities.persons[oldIdentity] = identity;
  // Preserve completed downloads if a later provider request is rate limited.
  write(
    `${root}/Portraets.json`,
    portraits.sort((a, b) => a.personId.localeCompare(b.personId)),
  );
  write(`${root}/TMDB-Personen.json`, identities);
  console.log(
    `${n} ${person.name}: ${portrait.provider}, ${portrait.imageDate}, ${portrait.width}x${portrait.height}`,
  );
  await new Promise((resolve) => setTimeout(resolve, 1500));
}
write(
  `${root}/Portraets.json`,
  portraits.sort((a, b) => a.personId.localeCompare(b.personId)),
);
write(`${root}/TMDB-Personen.json`, identities);
