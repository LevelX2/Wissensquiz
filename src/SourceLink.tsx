import type { Question } from "./model";

const normalized = (text: string) =>
  text.normalize("NFKC").toLocaleLowerCase("de").trim();

export function sourceLinkLabel(source: string, q: Question, subject?: string) {
  const url = new URL(source);
  const films = q.presentation?.films.map(({ data }) => data) ?? [];
  const filmTitles = [
    q.metadata.film_title_de,
    q.metadata.film_title_original,
    ...films.flatMap((film) => [
      film.originalTitle,
      ...(film.alternativeTitles?.map(({ title }) => title) ?? []),
    ]),
  ].filter(Boolean);
  const directors = films.flatMap((film) =>
    film.directors.split(/, | und | & /),
  );
  const article = url.hostname.endsWith(".wikipedia.org")
    ? url.pathname.startsWith("/wiki/")
      ? decodeURIComponent(url.pathname.slice(6))
      : url.searchParams.get("title")
    : null;

  if (article) {
    const title = article.replaceAll("_", " ");
    const name = title.replace(/ \([^()]+\)$/, "");
    const matches = (names: string[]) =>
      names.some((candidate) => normalized(candidate) === normalized(name));
    const kind =
      matches([q.metadata.person_name].filter(Boolean)) ||
      /\((?:actor|actress|Schauspieler|Schauspielerin)\)$/.test(title)
        ? "Schauspieler"
        : matches(directors)
          ? "Regie"
          : /\((?:\d{4} )?(?:TV series|Fernsehserie)\)$/.test(title)
            ? "Serie"
            : matches(filmTitles) ||
                /\((?:\d{4} )?(?:film|Film|Fernsehfilm)\)$/.test(title)
              ? "Film"
              : "Artikel";
    const displayTitle = title.replace(
      / \((?:(\d{4}) )?(?:film|Film|Fernsehfilm)\)$/,
      (_match, year: string | undefined) => (year ? ` (${year})` : ""),
    );
    return `${kind}: ${displayTitle}`;
  }

  if (url.hostname === "commons.wikimedia.org") {
    const file = url.pathname.match(/^\/wiki\/File:(.+)$/)?.[1];
    if (file) return `Bild: ${decodeURIComponent(file).replaceAll("_", " ")}`;
  }

  const slug = decodeURIComponent(
    url.pathname.split("/").filter(Boolean).at(-1) ?? "",
  )
    .replace(/\.(?:html?|php|aspx?)$/i, "")
    .replace(/[-_]+/g, " ");
  if (
    /[\p{L}]{3}/u.test(slug) &&
    !/^(?:index|title|name|person|movie|film)$/i.test(slug)
  )
    return `Artikel: ${slug}`;

  const topic = subject || q.metadata.person_name || filmTitles[0];
  return topic ? `Quelle zu ${topic}` : "Quelle zur Frage";
}

export function SourceLink({
  source,
  q,
  subject,
  label,
}: {
  source: string;
  q: Question;
  subject?: string;
  label?: string;
}) {
  return (
    <a
      className="source-link"
      href={source}
      target="_blank"
      rel="noreferrer"
      title={source}
    >
      {label ??
        `${sourceProvider(source)} – ${sourceLinkLabel(source, q, subject)}`}
       <span aria-hidden="true">↗</span>
    </a>
  );
}

export function sourceProvider(source: string) {
  const host = new URL(source).hostname.replace(/^www\./, "");
  if (host.endsWith(".wikipedia.org"))
    return `Wikipedia (${host.split(".")[0].toUpperCase()})`;
  return (
    (
      {
        "imdb.com": "IMDb",
        "ofdb.de": "OFDb",
        "commons.wikimedia.org": "Wikimedia Commons",
        "catalog.afi.com": "AFI",
        "themoviedb.org": "TMDB",
      } as Record<string, string>
    )[host] ?? host
  );
}
