import { z } from "zod";

export const workTypes = ["film", "series"] as const;
export type WorkType = (typeof workTypes)[number];
export const workTypeLabels: Record<WorkType, string> = {
  film: "Filme",
  series: "Serien",
};
export const techniques = ["live-action", "animation"] as const;
export type Technique = (typeof techniques)[number];
export const workCollections = ["Classics", "Arthouse"] as const;
export const techniqueLabels: Record<Technique, string> = {
  "live-action": "Realfilm",
  animation: "Animation",
};

export const workReferenceSchema = z
  .object({
    type: z.enum(workTypes),
    originalTitle: z.string().trim().min(1).max(500),
    year: z.number().int().min(1000).max(9999),
    genres: z
      .array(z.string().trim().min(1).max(200))
      .max(40)
      .transform((values) => unique(values.map(normalize))),
    techniques: z.array(z.enum(techniques)).max(2),
    collections: z.array(z.enum(workCollections)).max(2).optional(),
    season: z.number().int().positive().optional(),
    episode: z.number().int().positive().optional(),
  })
  .refine(
    (work) =>
      work.type === "series" ||
      (work.season === undefined && work.episode === undefined),
    "Staffel und Folge gehören zu einer TV-Serie.",
  );
export type WorkReference = z.infer<typeof workReferenceSchema>;
export type AttributedQuestion = {
  metadata: Record<string, string>;
  domain: string;
  works?: WorkReference[];
  tags?: string[];
};

const normalize = (genre: string) =>
  genre === "Sci-Fi"
    ? "Science-Fiction"
    : genre === "RomCom"
      ? "Rom-Com"
      : genre;
const unique = (values: string[]) => [...new Set(values)].sort();
const nonGenres = new Set(["Film", "Personen", "Schauspieler", "Preisträger"]);

export const workIdentity = (
  work: Pick<WorkReference, "type" | "originalTitle" | "year">,
) => JSON.stringify([work.type, work.originalTitle, work.year]);

// Explicit work relations keep type/genre/technique on the same subject. Current
// film metadata remains a valid editorial representation of a single-film link.
export function workReferencesOf(q: AttributedQuestion): WorkReference[] {
  if (q.works !== undefined) return q.works;
  const { metadata: m } = q;
  const genre = normalize(m.subdomain?.trim() || q.domain);
  const genres = nonGenres.has(genre) ? [] : [genre];
  const references = new Set([
    ...(m.film_title_original && m.film_year
      ? [`${m.film_title_original}|${m.film_year}`]
      : []),
    ...(m.film_refs?.split(";").filter(Boolean) ?? []),
  ]);
  const primary = `${m.film_title_original}|${m.film_year}`;
  return [...references].flatMap((reference) => {
    const separator = reference.lastIndexOf("|");
    const originalTitle = reference.slice(0, separator);
    const year = Number(reference.slice(separator + 1));
    return separator > 0 &&
      Number.isInteger(year) &&
      year >= 1000 &&
      year <= 9999
      ? [
          {
            type: "film" as const,
            originalTitle,
            year,
            genres: reference === primary ? genres : [],
            techniques: [],
            collections:
              reference === primary
                ? workCollections.filter((item) => q.tags?.includes(item))
                : [],
          },
        ]
      : [];
  });
}

export function resolveQuestionWorks<T extends AttributedQuestion>(
  questions: T[],
): T[] {
  const known = new Map<string, WorkReference>();
  for (const q of questions) {
    for (const work of workReferencesOf(q)) {
      const key = workIdentity(work);
      const previous = known.get(key);
      known.set(key, {
        ...work,
        genres: unique(
          [...(previous?.genres ?? []), ...work.genres].map(normalize),
        ),
        techniques: techniques.filter(
          (item) =>
            previous?.techniques.includes(item) ||
            work.techniques.includes(item),
        ),
        collections: workCollections.filter(
          (item) =>
            previous?.collections?.includes(item) ||
            work.collections?.includes(item),
        ),
      });
    }
  }
  return questions.map((q) => ({
    ...q,
    works: workReferencesOf(q).map((work) => ({
      ...work,
      genres: known.get(workIdentity(work))!.genres,
      techniques: known.get(workIdentity(work))!.techniques,
      collections: known.get(workIdentity(work))!.collections,
    })),
  }));
}

export const genresOf = (q: AttributedQuestion) =>
  unique(workReferencesOf(q).flatMap((work) => work.genres.map(normalize)));
export const workTypesOf = (q: AttributedQuestion) =>
  workTypes.filter((type) =>
    workReferencesOf(q).some((work) => work.type === type),
  );
export const techniquesOf = (q: AttributedQuestion) =>
  techniques.filter((technique) =>
    workReferencesOf(q).some((work) => work.techniques.includes(technique)),
  );

export type WorkFilters = {
  genres: string[] | null;
  workTypes?: WorkType[];
  techniques?: Technique[];
  collections?: (typeof workCollections)[number][];
};

export function matchesWorkFilters(
  q: AttributedQuestion,
  filters: WorkFilters,
) {
  const restricted =
    filters.genres !== null ||
    filters.workTypes !== undefined ||
    filters.techniques !== undefined ||
    filters.collections !== undefined;
  if (!restricted) return true;
  return workReferencesOf(q).some(
    (work) =>
      (filters.genres === null ||
        work.genres.some((genre) =>
          filters.genres!.includes(normalize(genre)),
        )) &&
      (filters.workTypes === undefined ||
        filters.workTypes.includes(work.type)) &&
      (filters.techniques === undefined ||
        work.techniques.some((technique) =>
          filters.techniques!.includes(technique),
        )) &&
      (filters.collections === undefined ||
        work.collections?.some((item) => filters.collections!.includes(item))),
  );
}
