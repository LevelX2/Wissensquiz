import type { Question } from "./model";
import { recognitionVariants } from "./ActorPortrait";
import works from "./workDatabaseLinks.json";
import people from "./personDatabaseLinks.json";
import directors from "./directorDatabaseLinks.json";
import ofdb from "./ofdbLinks.json";

type WorkLink = { title: string; kind: "film" | "series"; imdb: string };
type PersonLink = { name: string; imdb: string; ofdb?: string };
type OfdbLink = { url: string; imdb: string };
const workLinks = works as Record<string, WorkLink>;
const personLinks = new Map<string, PersonLink>(Object.entries(people));
const directorLinks = directors as Record<string, PersonLink[]>;
const ofdbLinks = ofdb as Record<string, OfdbLink>;

export type DatabaseLink = {
  source: string;
  label: string;
  kind: "Film" | "Serie" | "Schauspieler" | "Regie";
};

// Tracking and a trailing slash do not create another destination. Content
// subpages, fragments and Wikipedia languages remain separate references.
export function sourceKey(source: string) {
  const url = new URL(source);
  for (const key of [...url.searchParams.keys()])
    if (
      key.startsWith("utm_") ||
      (url.hostname.endsWith("imdb.com") && key.startsWith("ref_"))
    )
      url.searchParams.delete(key);
  url.searchParams.sort();
  return `${url.hostname.replace(/^www\./, "")}${decodeURI(url.pathname).replace(/\/$/, "")}${url.search}${url.hash}`;
}

export function databaseLinksFor(q: Question): DatabaseLink[] {
  const keys = new Set(
    q.presentation?.films.map(
      ({ data }) => `${data.originalTitle}|${data.year}`,
    ),
  );
  if (q.metadata.film_title_original && q.metadata.film_year)
    keys.add(`${q.metadata.film_title_original}|${q.metadata.film_year}`);
  const links: DatabaseLink[] = [];
  for (const key of keys) {
    const work = workLinks[key];
    if (work) {
      const subject = `${work.title} (${key.slice(key.lastIndexOf("|") + 1)})`;
      const kind = work.kind === "series" ? "Serie" : "Film";
      links.push({
        source: `https://www.imdb.com/title/${work.imdb}/`,
        label: `IMDb – ${subject}`,
        kind,
      });
      const german = ofdbLinks[key];
      if (german && german.imdb === work.imdb)
        links.push({ source: german.url, label: `OFDb – ${subject}`, kind });
    }
    for (const director of directorLinks[key] ?? [])
      links.push({
        source: director.imdb,
        label: `IMDb – ${director.name}`,
        kind: "Regie",
      });
  }
  const actor = personLinks.get(q.metadata.person_id);
  if (actor && actor.name === q.metadata.person_name) {
    links.push({
      source: actor.imdb,
      label: `IMDb – ${actor.name}`,
      kind: "Schauspieler",
    });
    if (actor.ofdb)
      links.push({
        source: actor.ofdb,
        label: `OFDb – ${actor.name}`,
        kind: "Schauspieler",
      });
  }
  return [
    ...new Map(links.map((link) => [sourceKey(link.source), link])).values(),
  ];
}

export function evidenceLinksFor(q: Question) {
  const evidence: { source: string; subject?: string }[] = [
    ...q.sources.map((source) => ({ source })),
    ...recognitionVariants(q).map(({ sourceUrl: source }) => ({ source })),
    ...(q.presentation?.sources ?? []).map((source) => ({ source })),
    ...(q.presentation?.director?.sources ?? []).map((source) => ({ source })),
    ...(q.presentation?.film?.sources ?? []).map((source) => ({ source })),
  ];
  for (const { data } of q.presentation?.films ?? []) {
    const subject = `${data.originalTitle} (${data.year})`;
    evidence.push(...data.sources.map((source) => ({ source, subject })));
    evidence.push(
      ...data.directorSources.map((source) => ({ source, subject })),
    );
  }
  const unique = new Map<string, { source: string; subjects: Set<string> }>();
  for (const link of evidence) {
    const key = sourceKey(link.source);
    let entry = unique.get(key);
    if (!entry) {
      entry = { source: link.source, subjects: new Set() };
      unique.set(key, entry);
    }
    if (link.subject) entry.subjects.add(link.subject);
  }
  return [...unique.values()].map(({ source, subjects }) => ({
    source,
    subject: subjects.size ? [...subjects].join("; ") : undefined,
  }));
}

export function evidenceLabel(source: string, databases: DatabaseLink[]) {
  const exact = databases.find(
    (link) => sourceKey(link.source) === sourceKey(source),
  );
  if (exact) return exact.label;
  const url = new URL(source);
  if (/(^|\.)imdb\.com$/.test(url.hostname)) {
    const identity = url.pathname.match(
      /\/(?:title|name)\/((?:tt|nm)\d+)\//,
    )?.[1];
    const work = databases.find((link) =>
      link.source.includes(`/${identity}/`),
    );
    const section = url.pathname.split("/").filter(Boolean).at(-1) ?? "";
    const description = (
      {
        plotsummary: "Handlung",
        fullcredits: "Besetzung und Crew",
        releaseinfo: "Veröffentlichungen",
        biography: "Biografie",
        bio: "Biografie",
        awards: "Auszeichnungen",
      } as Record<string, string>
    )[section];
    if (work && description) return `${work.label} – ${description}`;
  }
  if (/(^|\.)ofdb\.de$/.test(url.hostname)) {
    const identity = url.pathname.match(/^\/film\/(\d+)[,/]/)?.[1];
    const work = databases.find(
      (link) =>
        new URL(link.source).hostname.endsWith("ofdb.de") &&
        new URL(link.source).pathname.startsWith(`/film/${identity},`),
    );
    if (work && url.pathname.endsWith("/review/"))
      return `${work.label} – Review`;
  }
  return undefined;
}
